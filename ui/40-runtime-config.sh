#!/bin/sh
set -e

# Render runtime settings for the browser from the container environment.
export TRUSTED_DOMAINS="${TRUSTED_DOMAINS:-}"
envsubst '${TRUSTED_DOMAINS}' < /opt/config.js.template > /usr/share/nginx/html/config.js
