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

        delay = self.config.retry_initial_seconds
        for _ in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.request(
                        method,
                        f"{self.config.control_core_url}{endpoint}",
                        json=payload,
                        headers=request_headers,
                        timeout=30,
                    )
                if response.status_code < 500:
                    return response
                logger.warning("Control Core returned %s for %s; retrying in %ss", response.status_code, endpoint, delay)
            except (httpx.RequestError, OSError) as error:
                logger.warning("Control Core request failed for %s: %s; retrying in %ss", endpoint, error, delay)
            await asyncio.sleep(delay)
            delay = min(delay * 2, self.config.retry_max_seconds)
        logger.error("Control Core request exhausted retries: endpoint=%s", endpoint)
        return None

    async def register(self) -> None:
        payload = {
            "reporter_uid": self.uid,
            "version": self.config.version,
            "callback_url": self.config.callback_url,
        }

        headers = {
            # "server-password": f"{self.config.control_core_key}",
            "server-password": f"Example",
            "reporter-key": self.uid,
        }

        resp = await self.request(
            method="POST",
            endpoint="/control-core/register",
            payload=payload,
            headers=headers)
        if resp and resp.status_code == 201:
            logger.info("Reporter registered: uid=%s", self.uid)
        else:
            status_code = resp.status_code if resp else "unavailable"
            logger.warning("Reporter registration failed: status=%s", status_code)
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

        if not self.previous_data_object.get(persisted_key):
            resp = await self.request(
                method="POST",
                endpoint="/control-core/files",
                payload=data)
            if resp and resp.status_code == 404:
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
            logger.warning("State upload failed: path=%s status=%s", relative_path, status_code)
            return

        self.previous_data_object[persisted_key] = data
        logger.info("Uploaded state file: path=%s", relative_path)

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
