#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./release.sh 0.1.0
#   ./release.sh 0.1.0 --dry-run

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/.env" ]]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

: "${GHCR_USERNAME:?Set GHCR_USERNAME in .env}"

VERSION=""
DRY_RUN=false

for ARG in "$@"; do
    case "$ARG" in
        --dry-run)
            DRY_RUN=true
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$ARG"
            else
                echo "Error: Unexpected argument: $ARG"
                exit 1
            fi
            ;;
    esac
done

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Usage: $0 <version> [--dry-run]"
    exit 1
fi

if [[ "$DRY_RUN" == true ]]; then
    echo "==> DRY RUN: images will not be uploaded."
fi

echo "==> Building Docker Compose images..."
docker compose --env-file "$SCRIPT_DIR/.env" build

echo "==> Finding images to release..."

mapfile -t IMAGES < <(
    docker compose --env-file "$SCRIPT_DIR/.env" config --format json |
        jq -r '
            .services[]
            | select(has("build") and has("image"))
            | .image
        ' |
        sort -u
)

if [[ ${#IMAGES[@]} -eq 0 ]]; then
    echo "Error: No services with both build: and image: found."
    exit 1
fi

for IMAGE in "${IMAGES[@]}"; do
    REPOSITORY="${IMAGE%:*}"
    TAGGED_IMAGE="${REPOSITORY}:${VERSION}"

    echo "==> Tagging ${IMAGE} as ${TAGGED_IMAGE}..."
    docker tag "$IMAGE" "$TAGGED_IMAGE"

    if [[ "$DRY_RUN" == true ]]; then
        echo "    DRY RUN: skipping push of ${TAGGED_IMAGE}"
    else
        echo "==> Pushing ${TAGGED_IMAGE}..."
        docker push "$TAGGED_IMAGE"
    fi
done

if [[ "$DRY_RUN" == true ]]; then
    echo "==> Dry run complete. No images uploaded."
else
    echo "==> Release ${VERSION} complete."
fi
