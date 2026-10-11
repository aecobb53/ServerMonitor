import asyncio
import logging
import uuid
import json
from pathlib import Path
from copy import deepcopy

import httpx

from .config import Config

logger = logging.getLogger(__name__)


class Reporter:
    def __init__(self, config: Config):
        self.config = config
        self.uid = self._load_uid()
        self.previous_data_object = {}

    def _load_uid(self) -> str:
        path = Path(self.config.storage) / ".reporter_uid"

        if path.exists():
            return path.read_text().strip()

        uid = str(uuid.uuid4())
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(uid)

        return uid

    async def request(
            self,
            method: str,
            endpoint: str,
            payload: dict,
            headers: dict | None = None,
            retries: int = 3,
        ) -> httpx.Response | None:
        request_headers = dict(headers or {})
        request_headers["reporter-key"] = self.uid
        request_headers["server-password"] = self.config.control_core_key

        delay = self.config.retry_initial_seconds
        for attempt in range(1, retries + 1):
            try:
                logger.debug(f"Control Core request: {method} {endpoint} attempt={attempt}/{retries}")
                async with httpx.AsyncClient() as client:
                    response = await client.request(
                        method,
                        f"{self.config.control_core_url}{endpoint}",
                        json=payload,
                        headers=request_headers,
                        timeout=30,
                    )
                logger.debug(f"Control Core response: {method} {endpoint} status={response.status_code}")
                if response.status_code < 500:
                    return response
                logger.info(f"Control Core returned {response.status_code} for {endpoint}; retrying in {delay}s")
            except (httpx.RequestError, OSError) as error:
                logger.info(f"Control Core request failed for {endpoint}: {error!r}; retrying in {delay}s")
            await asyncio.sleep(delay)
            delay = min(delay * 2, self.config.retry_max_seconds)
        logger.error(f"Control Core request exhausted retries: {method} {endpoint}")
        return None

    async def register(self) -> None:
        payload = {
            "reporter_uid": self.uid,
            "version": self.config.version,
            "callback_url": self.config.callback_url,
        }

        resp = await self.request(
            method="POST",
            endpoint="/control-core/register",
            payload=payload,
        )
        if resp and resp.status_code == 201:
            logger.info(f"Reporter registered: uid={self.uid}")
        else:
            status_code = resp.status_code if resp else "unavailable"
            logger.warning(f"Reporter registration failed: status={status_code}")
        return resp

    async def send_file(
        self,
        path: Path,
        relative_path: str,
    ) -> None:
        """
        New files are POSTed. A rejected request triggers registration and one retry.
        A PATCH that remains missing after registration is retried as a full POST.
        """

        data = json.loads(path.read_text(encoding="utf-8"))
        persisted_key=path.name
        logger.debug(f"Sending state file: path={relative_path} known={persisted_key in self.previous_data_object}")

        if not self.previous_data_object.get(persisted_key):
            resp = await self.request(
                method="POST",
                endpoint="/control-core/files",
                payload=data)
            if resp and resp.status_code == 404:
                logger.info(f"Control Core does not know this reporter; registering: path={relative_path}")
                registration_response = await self.register()
                if registration_response and registration_response.status_code == 201:
                    resp = await self.request(
                        method="POST",
                        endpoint="/control-core/files",
                        payload=data)
        else:
            diff_data = self.construct_payload_diff(payload=data, persisted_key=persisted_key)
            resp = await self.request(
                method="PATCH",
                endpoint="/control-core/files",
                payload=diff_data)
            if resp and resp.status_code == 404:
                registration_response = await self.register()
                if registration_response and registration_response.status_code == 201:
                    resp = await self.request(
                        method="PATCH",
                        endpoint="/control-core/files",
                        payload=diff_data)
            if resp and resp.status_code == 404:
                resp = await self.request(
                    method="POST",
                    endpoint="/control-core/files",
                    payload=data)

        if resp is None or not 200 <= resp.status_code < 300:
            status_code = resp.status_code if resp else "unavailable"
            logger.warning(f"State upload failed: path={relative_path} status={status_code}")
            return

        first_upload = not self.previous_data_object.get(persisted_key)
        self.previous_data_object[persisted_key] = data
        level = logging.INFO if first_upload else logging.DEBUG
        logger.log(level, f"Uploaded state file: path={relative_path} first_upload={first_upload}")

    def construct_payload_diff(self, payload: dict, persisted_key: str) -> dict:
        previous_data = self.previous_data_object[persisted_key]
        diff_payload = {
            key: payload[key]
            for key in ("schema_version", "server_name", "game_name", "record_datetime")
        }
        for key in ("parser", "container", "health", "latest_status", "collector"):
            if payload.get(key) != previous_data.get(key):
                diff_payload[key] = deepcopy(payload.get(key))

        for key in ("history", "errors"):
            previous_entries = previous_data.get(key, [])
            last_sent_timestamp = previous_entries[-1].get("timestamp") if previous_entries else None
            unsent_entries = []
            for entry in reversed(payload.get(key, [])):
                if last_sent_timestamp and entry.get("timestamp") <= last_sent_timestamp:
                    break
                unsent_entries.append(entry)
            if unsent_entries:
                diff_payload[key] = deepcopy(list(reversed(unsent_entries)))
        return diff_payload
