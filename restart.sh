#!/usr/bin/env bash

if [ "$#" -eq 0 ]; then
	docker compose build
	docker compose up -d
	docker compose logs --follow
else
	services=$(docker compose config --services)
	valid=()
	for s in "$@"; do
		echo "$services" | grep -qx "$s" && valid+=("$s")
	done
	[ "${#valid[@]}" -eq 0 ] && exit 0
	docker compose build "${valid[@]}"
	docker compose up -d "${valid[@]}"
	docker compose logs --follow "${valid[@]}"
fi
