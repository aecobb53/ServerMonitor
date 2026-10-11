#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./release.sh 0.1.0
#   ./release.sh 0.1.0 --dry-run
#   ./release.sh 0.1.0 reporter
#   ./release.sh 0.1.0 reporter collector
#   ./release.sh 0.1.0 --dry-run reporter

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment
if [[ -f "$SCRIPT_DIR/.env" ]]; then
    set -a
    source "$SCRIPT_DIR/.env"
    set +a
fi

: "${GHCR_USERNAME:?Set GHCR_USERNAME in .env}"

if [[ $# -lt 1 ]]; then
    echo "Usage: $0 <version> [--dry-run] [service ...]"
    exit 1
fi

VERSION="$1"
shift

if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: Version must be MAJOR.MINOR.PATCH (e.g. 0.1.0)"
    exit 1
fi

DRY_RUN=false
REQUESTED_SERVICES=()

for ARG in "$@"; do
    if [[ "$ARG" == "--dry-run" ]]; then
        DRY_RUN=true
    else
        REQUESTED_SERVICES+=("$ARG")
    fi
done

COMPOSE=(docker compose --env-file "$SCRIPT_DIR/.env")

# Resolve services and image names from Compose
CONFIG="$("${COMPOSE[@]}" config --format json)"

if [[ ${#REQUESTED_SERVICES[@]} -eq 0 ]]; then
    mapfile -t SERVICES < <(
        jq -r '
            .services | to_entries[]
            | select((.value | has("build")) and
                     (.value | has("image")))
            | .key
        ' <<< "$CONFIG"
    )
else
    SERVICES=("${REQUESTED_SERVICES[@]}")
fi

if [[ ${#SERVICES[@]} -eq 0 ]]; then
    echo "Error: No services with both build: and image: found."
    exit 1
fi

IMAGES=()

for SERVICE in "${SERVICES[@]}"; do
    IMAGE=$(jq -er --arg service "$SERVICE" '
        .services[$service]
        | select(has("build") and has("image"))
        | .image
    ' <<< "$CONFIG") || {
        echo "Error: '$SERVICE' must exist and have both build: and image:."
        exit 1
    }

    # Require images to belong to this GHCR account
    if [[ "$IMAGE" != "ghcr.io/$GHCR_USERNAME/"* ]]; then
        echo "Error: $SERVICE image must start with ghcr.io/$GHCR_USERNAME/"
        exit 1
    fi

    IMAGES+=("$IMAGE")
done

if [[ "$DRY_RUN" == true ]]; then
    echo "==> DRY RUN: images will not be uploaded."
fi

echo "==> Releasing services: ${SERVICES[*]}"
echo "==> Building images..."

"${COMPOSE[@]}" build "${SERVICES[@]}"

for i in "${!SERVICES[@]}"; do
    SERVICE="${SERVICES[$i]}"
    IMAGE="${IMAGES[$i]}"
    REPOSITORY="${IMAGE%:*}"

    VERSION_IMAGE="${REPOSITORY}:${VERSION}"
    LATEST_IMAGE="${REPOSITORY}:latest"

    echo "==> $SERVICE: tagging $VERSION_IMAGE"
    docker tag "$IMAGE" "$VERSION_IMAGE"

    if [[ "$DRY_RUN" == true ]]; then
        echo "    DRY RUN: would push $VERSION_IMAGE"
        echo "    DRY RUN: would push $LATEST_IMAGE"
        continue
    fi

    echo "==> Pushing $VERSION_IMAGE"
    docker push "$VERSION_IMAGE"

    echo "==> Updating latest: $LATEST_IMAGE"
    docker tag "$VERSION_IMAGE" "$LATEST_IMAGE"
    docker push "$LATEST_IMAGE"
done

if [[ "$DRY_RUN" == true ]]; then
    echo "==> Dry run complete. Nothing uploaded."
else
    echo "==> Release $VERSION complete."
fi
