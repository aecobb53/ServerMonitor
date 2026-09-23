import asyncio
import logging
import uuid
import json

from pathlib import Path

import httpx

from .config import Config

logger = logging.getLogger(__name__)


# class Reporter:
#     def __init__(self, config: Config):
#         self.config = config
#         self.uid = self._load_uid()

#     def _load_uid(self) -> str:
#         path = Path(self.config.storage) / ".reporter_uid"

#         if path.exists():
#             return path.read_text().strip()

#         uid = str(uuid.uuid4())
#         path.parent.mkdir(parents=True, exist_ok=True)
#         path.write_text(uid)

#         return uid

#     async def register(self) -> None:
#         payload = {
#             "reporter_uid": self.uid,
#             "version": self.config.version,
#             "callback_url": self.config.callback_url,
#         }

#         headers = {
#             "reporter_key": f"{self.config.control_core_key}",
#         }

#         await self._request("POST", "/control-core/register", payload, timeout=10)
#         logger.info("Reporter registered: uid=%s", self.uid)

#     async def register_forever(self) -> None:
#         while True:
#             try:
#                 await self.register()
#                 return
#             except asyncio.CancelledError:
#                 raise
#             except Exception as error:
#                 logger.error("Reporter registration failed: %s; retrying in %.1fs", error, self.config.retry_max_seconds)
#                 await asyncio.sleep(self.config.retry_max_seconds)

#     async def send_file(
#         self,
#         path: Path,
#         relative_path: str,
#         modified_time: float,
#     ) -> None:
#         content = path.read_bytes()

#         payload = {
#             "reporter_uid": self.uid,
#             "path": relative_path,
#             "modified_time": modified_time,
#             "content": content.decode("utf-8", errors="replace"),
#         }

#         await self._post("/control-core/files", payload)
#         logger.info("Uploaded state file: path=%s bytes=%d", relative_path, len(content))

#     async def send_delete(self, relative_path: str) -> None:
#         payload = {
#             "reporter_uid": self.uid,
#             "path": relative_path,
#         }

#         await self._post("/control-core/files/deleted", payload)
#         logger.info("Deleted remote state file: path=%s", relative_path)

#     async def _post(self, endpoint: str, payload: dict) -> None:
#         await self._request("POST", endpoint, payload)

#     async def _request(self, method: str, endpoint: str, payload: dict, timeout: float = 30) -> None:
#         headers = {
#             "reporter_key": f"{self.config.control_core_key}",
#         }

#         delay = self.config.retry_initial_seconds
#         while True:
#             try:
#                 async with httpx.AsyncClient() as client:
#                     response = await client.request(
#                         method,
#                         f"{self.config.control_core_url}{endpoint}",
#                         json=payload,
#                         headers=headers,
#                         timeout=timeout,
#                     )
#                 if response.status_code < 500:
#                     response.raise_for_status()
#                     return
#                 logger.warning("Control Core returned %s for %s; retrying in %.1fs", response.status_code, endpoint, delay)
#             except httpx.HTTPStatusError:
#                 logger.exception("Control Core rejected request: endpoint=%s", endpoint)
#                 raise
#             except (httpx.RequestError, OSError) as error:
#                 logger.warning("Control Core request failed for %s: %s; retrying in %.1fs", endpoint, error, delay)
#             await asyncio.sleep(delay)
#             delay = min(delay * 2, self.config.retry_max_seconds)


class ReporterV2:
    def __init__(self, config: Config):
        self.config = config
        self.uid = self._load_uid()

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
        ):
        if headers is None:
            headers = {
                "reporter-key": self.uid
            }

        print('')
        print('')
        print('')
        print(f'METHOD: {method}')
        print(f'ENDPOINT: {endpoint}')
        print(f'PAYLOAD: {payload}')
        print(f'HEADERS: {headers}')
        print('')
        print('')
        print('')
        print('')


        delay = self.config.retry_initial_seconds
        for _ in range(retries):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.request(
                        method,
                        f"{self.config.control_core_url}{endpoint}",
                        json=payload,
                        headers=headers,
                        timeout=30,
                    )
                if response.status_code in [400, 401, 404]:
                    logger.info(f"Control Core returned {response.status_code} when registering")
                    registration_response = await self.register()
                    logger.info(f"Re-registering reporter: {registration_response.status_code}")
                    if registration_response.status_code != 201:
                        logger.error(f"Failed to re-register reporter: {registration_response.status_code}")
                        return
                    continue
                if response.status_code < 500:
                    response.raise_for_status()
                    return response
                logger.warning("Control Core returned %s for %s; retrying in %.1fs", response.status_code, endpoint, delay)
            except httpx.HTTPStatusError:
                logger.exception("Control Core rejected request: endpoint=%s", endpoint)
                raise
            except (httpx.RequestError, OSError) as error:
                logger.warning("Control Core request failed for %s: %s; retrying in %.1fs", endpoint, error, delay)
            await asyncio.sleep(delay)
            delay = min(delay * 2, self.config.retry_max_seconds)

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
        logger.info("Reporter registered: uid=%s", self.uid)
        return resp

    async def send_file(
        self,
        path: Path,
        relative_path: str,
        modified_time: float,
    ) -> None:
        data = json.loads(path.read_text(encoding="utf-8"))

        # await self._post("/control-core/files", data)
        resp = await self.request(
            method="POST",
            endpoint="/control-core/files",
            payload=data)
        logger.info("Uploaded state file: path=%s", relative_path)

    # async def send_delete(self, relative_path: str) -> None:
    #     payload = {
    #         "reporter_uid": self.uid,
    #         "path": relative_path,
    #     }

    #     await self._post("/control-core/files/deleted", payload)
    #     logger.info("Deleted remote state file: path=%s", relative_path)
