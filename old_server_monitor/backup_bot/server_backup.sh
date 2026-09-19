#!/usr/bin/env bash
set -u
set -o pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"
FILES_FILE="${SCRIPT_DIR}/server_backup.files"

# shellcheck disable=SC1090
[[ -f "$ENV_FILE" ]] || { echo "Missing env file: $ENV_FILE" >&2; exit 1; }
source "$ENV_FILE"
[[ -f "$FILES_FILE" ]] || { echo "Missing files list: $FILES_FILE" >&2; exit 1; }
mkdir -p "$BACKUP_ROOT" "$LOG_DIR" "$ERROR_DIR"

SKIP_BACKUP=0
SKIP_PRUNING=0

for arg in "$@"; do
  case "$arg" in
    --skip-backup) SKIP_BACKUP=1 ;;
    --skip-pruning) SKIP_PRUNING=1 ;;
    *) echo "Unknown arg: $arg" >&2; exit 1 ;;
  esac
done

timestamp="$(date -u +"%Y_%m_%d_%H")"
run_id="${timestamp}"
backup_tmp="${BACKUP_ROOT}/.tmp-${run_id}"
backup_final="${BACKUP_ROOT}/game_servers_backup_${run_id}"
log_file="${LOG_DIR}/server_backup_${run_id}.log"
manifest_file="${backup_tmp}/manifest.yaml"
manifest_started=0

log() {
    printf '%s %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$1" | tee -a "$log_file"
}

yaml_escape() {
    printf '%s' "$1" | sed "s/'/''/g"
}

write_manifest_start() {
    cat > "$manifest_file" <<EOF
timestamp: $timestamp
run_id: $run_id
files:
EOF
    manifest_started=1
}

append_manifest_entry() {
    local src="$1"
    local status="$2"
    local message="$3"
    local saved_as
    saved_as="$(basename "$src")"
    [[ "$manifest_started" -eq 1 ]] || return 1
    cat >> "$manifest_file" <<EOF
  - source: $src
    saved_as: $saved_as
    status: $status
    message: $message
EOF
}

write_error() {
    local src="$1"
    local message="$2"
    local safe_name
    safe_name="$(basename "$src")"
    cat > "${ERROR_DIR}/${run_id}_${safe_name}.json" <<EOF
{"timestamp":"$(date -u +"%Y-%m-%dT%H:%M:%SZ")","source":"$src","message":"$message","cleared":false}
EOF
}

if [[ "$SKIP_BACKUP" -eq 0 ]]; then
    rm -rf "$backup_tmp"
    mkdir -p "$backup_tmp"
    write_manifest_start
    manifest_first=""

    while IFS= read -r src || [[ -n "$src" ]]; do
        [[ -z "$src" || "$src" == \#* ]] && continue

        log "Attempting: $src"
        if [[ -f "$src" ]]; then
            cp -p "$src" "$backup_tmp/"
            log "Copied: $src"
            append_manifest_entry "$src" "copied" "ok"
        else
            log "Missing: $src"
            write_error "$src" "Source file not found"
            append_manifest_entry "$src" "missing" "Source file not found"
        fi
    done < "$FILES_FILE"

    cat >> "$manifest_file" <<'EOF'
status: completed
EOF

    rm -rf "$backup_final"
    mv "$backup_tmp" "$backup_final"
    log "Backup finalized: $backup_final"
else
    log "Backup skipped"
fi

if [[ "$SKIP_PRUNING" -eq 0 ]]; then
    log "Pruning skipped for now"
fi

exit 0
