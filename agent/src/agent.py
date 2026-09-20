import json
import logging
import uuid
from pathlib import Path

import httpx

from .config import Config

logger = logging.getLogger(__name__)


class Agent:
    def __init__(self, config: Config):
        self.config = config
        self.uid = self._load_uid()

    def _load_uid(self) -> str:
        path = Path(self.config.storage) / ".agent_uid"

        if path.exists():
            return path.read_text().strip()

        uid = str(uuid.uuid4())
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(uid)

        return uid

    async def register(self) -> None:
        payload = {
            "agent_uid": self.uid,
            "version": self.config.version,
            "callback_url": self.config.callback_url,
        }

        headers = {
            "Authorization": f"Bearer {self.config.control_core_key}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.config.control_core_url}/api/v1/agents/register",
                json=payload,
                headers=headers,
                timeout=10,
            )

        response.raise_for_status()

        logger.info("Registered agent %s", self.uid)

    async def send_file(
        self,
        path: Path,
        relative_path: str,
        modified_time: float,
    ) -> None:
        content = path.read_bytes()

        payload = {
            "agent_uid": self.uid,
            "path": relative_path,
            "modified_time": modified_time,
            "content": content.decode("utf-8", errors="replace"),
        }

        await self._post("/api/v1/agents/files", payload)

    async def send_delete(self, relative_path: str) -> None:
        payload = {
            "agent_uid": self.uid,
            "path": relative_path,
        }

        await self._post("/api/v1/agents/files/deleted", payload)

    async def _post(self, endpoint: str, payload: dict) -> None:
        headers = {
            "Authorization": f"Bearer {self.config.control_core_key}",
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.config.control_core_url}{endpoint}",
                json=payload,
                headers=headers,
                timeout=30,
            )

        response.raise_for_status()
