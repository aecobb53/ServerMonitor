#!/usr/bin/env bash
set -u
set -o pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env"

[[ -f "$ENV_FILE" ]] || { echo "Missing env file: $ENV_FILE" >&2; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"

[[ -n "${BACKUP_ROOT:-}" ]] || { echo "Missing BACKUP_ROOT in .env" >&2; exit 1; }
[[ -n "${ARCHIVE_DIR:-}" ]] || { echo "Missing ARCHIVE_DIR in .env" >&2; exit 1; }
[[ -n "${LOG_DIR:-}" ]] || { echo "Missing LOG_DIR in .env" >&2; exit 1; }
[[ -n "${PRUNE_WINDOW_DAYS:-}" ]] || { echo "Missing PRUNE_WINDOW_DAYS in .env" >&2; exit 1; }
[[ -n "${PRUNE_WINDOW_END_DAYS_AGO:-}" ]] || { echo "Missing PRUNE_WINDOW_END_DAYS_AGO in .env" >&2; exit 1; }

NO_DELETE=0

for arg in "$@"; do
    case "$arg" in
        --no-delete) NO_DELETE=1 ;;
        --help)
            cat <<EOF
Usage: ./prune_backups.sh [--no-delete]

Archives backup directories in a historical window based on directory name timestamps.
Window is from PRUNE_WINDOW_END_DAYS_AGO to
PRUNE_WINDOW_END_DAYS_AGO + PRUNE_WINDOW_DAYS days ago (inclusive).
By default, deletes the original directory only after archive integrity is verified.

Options:
  --no-delete   Keep original backup directories after archive (test mode)
EOF
            exit 0
            ;;
        *) echo "Unknown arg: $arg" >&2; exit 1 ;;
    esac
done

timestamp="$(date -u +"%Y_%m_%d_%H")"
run_id="${timestamp}"
log_file="${LOG_DIR}/prune_backups_${run_id}.log"

mkdir -p "$LOG_DIR" "$ARCHIVE_DIR"

log() {
    printf '%s %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$1" | tee -a "$log_file"
}

log "Prune run started (PRUNE_WINDOW_END_DAYS_AGO=${PRUNE_WINDOW_END_DAYS_AGO}, PRUNE_WINDOW_DAYS=${PRUNE_WINDOW_DAYS}, NO_DELETE=${NO_DELETE})"

[[ "$PRUNE_WINDOW_DAYS" =~ ^[0-9]+$ ]] || {
    echo "Invalid PRUNE_WINDOW_DAYS (must be integer): $PRUNE_WINDOW_DAYS" >&2
    exit 1
}

[[ "$PRUNE_WINDOW_END_DAYS_AGO" =~ ^[0-9]+$ ]] || {
    echo "Invalid PRUNE_WINDOW_END_DAYS_AGO (must be integer): $PRUNE_WINDOW_END_DAYS_AGO" >&2
    exit 1
}

window_newer_epoch="$(date -u -d "${PRUNE_WINDOW_END_DAYS_AGO} days ago" +%s)"
window_older_epoch="$(date -u -d "$((PRUNE_WINDOW_END_DAYS_AGO + PRUNE_WINDOW_DAYS)) days ago" +%s)"
window_newer_iso="$(date -u -d "@${window_newer_epoch}" +"%Y-%m-%dT%H:%M:%SZ")"
window_older_iso="$(date -u -d "@${window_older_epoch}" +"%Y-%m-%dT%H:%M:%SZ")"

log "Pruning window UTC: ${window_older_iso} to ${window_newer_iso}"

mapfile -t candidates < <(
    find "$BACKUP_ROOT" -mindepth 1 -maxdepth 1 -type d \
        -name 'game_servers_backup_????_??_??_??' \
        -printf '%f\n' | sort
)

in_window=()
in_window_epochs=()
for backup_name in "${candidates[@]}"; do
    backup_stamp="${backup_name#game_servers_backup_}"
    IFS='_' read -r bs_yr bs_mo bs_da bs_hr <<< "$backup_stamp"
    if ! backup_epoch="$(date -u -d "${bs_yr}-${bs_mo}-${bs_da}T${bs_hr}:00:00Z" +%s 2>/dev/null)"; then
        log "Skipping unparsable backup directory name: $backup_name"
        continue
    fi

    if (( backup_epoch >= window_older_epoch && backup_epoch <= window_newer_epoch )); then
        in_window+=("$backup_name")
        in_window_epochs+=("$backup_epoch")
    fi
done

if [[ "${#in_window[@]}" -eq 0 ]]; then
    log "No backup directories found between ${PRUNE_WINDOW_END_DAYS_AGO} and $((PRUNE_WINDOW_END_DAYS_AGO + PRUNE_WINDOW_DAYS)) day(s) ago."
    exit 0
fi

# Select only the most recent backup in the window.
selected_backup_name=""
selected_backup_epoch=0
for i in "${!in_window[@]}"; do
    candidate_name="${in_window[$i]}"
    candidate_epoch="${in_window_epochs[$i]}"
    if (( candidate_epoch > selected_backup_epoch )); then
        selected_backup_epoch="$candidate_epoch"
        selected_backup_name="$candidate_name"
    fi
done

src_dir="${BACKUP_ROOT}/${selected_backup_name}"
archive_file="${ARCHIVE_DIR}/${selected_backup_name}.tar.gz"

if [[ ! -d "$src_dir" ]]; then
    log "Skipping missing directory: $src_dir"
    exit 0
fi

log "Selected newest backup in window: $selected_backup_name"
log "Archiving: $src_dir -> $archive_file"

rm -f "$archive_file"
if ! tar -czf "$archive_file" -C "$BACKUP_ROOT" "$selected_backup_name"; then
    log "ERROR: Failed to create archive for $selected_backup_name"
    exit 1
fi

if ! tar -tzf "$archive_file" >/dev/null; then
    log "ERROR: Archive integrity check failed for $archive_file"
    exit 1
fi

log "Archive verified: $archive_file"

if [[ "$NO_DELETE" -eq 1 ]]; then
    log "--no-delete enabled; keeping original: $src_dir"
    log "Prune run completed"
    exit 0
fi

log "Deleting all backup directories in pruning window (${#in_window[@]} total)."
for backup_name in "${in_window[@]}"; do
    delete_dir="${BACKUP_ROOT}/${backup_name}"
    if [[ ! -d "$delete_dir" ]]; then
        log "Skipping missing directory during delete: $delete_dir"
        continue
    fi

    rm -rf "$delete_dir"
    log "Deleted backup directory: $delete_dir"
done

log "Prune run completed"
exit 0