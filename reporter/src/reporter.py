import asyncio
import logging
import uuid
import json

from datetime import datetime
from pathlib import Path
from copy import deepcopy

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

"""
EITHER THE REPORTER OR A WAY TO TRACK THE SERVERS BETWEEN EXECUTIONS TO SAVE STATE
"""

class ReporterV2:
    def __init__(self, config: Config):
        self.config = config
        self.uid = self._load_uid()
        self.previous_data_object = {}  # TODO: Verify unique objects so there is not conflict for ultiple servers
        # TODO: Ensure there is one Reporter per server type

        """
        The previous_data_object needs to separate for each server. so the key will be
        the file name and the value will be the payload itself.
        """

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
            headers: dict = {},
            retries: int = 3,
        ):

        headers["reporter-key"] = self.uid

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
                if response.status_code < 500:
                    response.raise_for_status()
                    return response
                logger.warning(f"Control Core returned {response.status_code} for {endpoint}; retrying in {delay}s")
            except httpx.HTTPStatusError:
                logger.exception(f"Control Core rejected request: endpoint={endpoint}")
                raise
            except (httpx.RequestError, OSError) as error:
                logger.warning(f"Control Core request failed for {endpoint}: {error}; retrying in {delay}s")
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
        """
        If we arent tracking the file (the previous_data_object does not know about it)
        assume it is not traced in remote so send a POST. This also ensures we try to keep
        things up to date in long running odd situations

        If the file has been sent before try to send a PATCH. If we receive a 400 or a 401
        we assume it needs to re register and attempts to do so. If a 404 is sent, the server
        needs a re-POST.

        A POST is then sent .       
        """

        data = json.loads(path.read_text(encoding="utf-8"))
        persisted_key=path.name

        if not self.previous_data_object.get(persisted_key):
            # It has not been sent before, perform a POST
            resp = await self.request(
                method="POST",
                endpoint="/control-core/files",
                payload=data)
        else:
            # It has been sent before, try to update instead of fully posting
            diff_data = self.construct_payload_diff(payload=data, persisted_key=persisted_key)

            resp = await self.request(
                method="PATCH",
                endpoint="/control-core/files",
                payload=diff_data)
            send_post = False

            if resp.status_code in [400, 401]:
                # The server rejected so we will attempt to re-register
                logger.info(f"Control Core returned {resp.status_code}. Trying to re-register.")
                registration_response = await self.register()
                logger.info(f"Re-registering reporter: {registration_response.status_code}")
                if registration_response.status_code != 201:
                    logger.error(f"Failed to re-register reporter: {registration_response.status_code}")
                    return
                send_post = True
            elif resp.status_code in [404]:
                # The server does not need a re-register but does need a POST instead
                send_post = True

            if send_post:
                # A POST is needed
                resp = await self.request(
                    method="POST",
                    endpoint="/control-core/files",
                    payload=data)

        self.previous_data_object[persisted_key] = data
        logger.info("Uploaded state file: path=%s", relative_path)

    # async def send_delete(self, relative_path: str) -> None:
    #     payload = {
    #         "reporter_uid": self.uid,
    #         "path": relative_path,
    #     }

    #     await self._post("/control-core/files/deleted", payload)
    #     logger.info("Deleted remote state file: path=%s", relative_path)

    def construct_payload_diff(self, payload: dict, persisted_key: str) -> dict:
        diff_payload = deepcopy(payload)
        previous_data_object = self.previous_data_object.get(persisted_key)
        if payload.get('parser') == previous_data_object.get('parser'):
            del diff_payload['parser']
        if payload.get('container') == previous_data_object.get('container'):
            del diff_payload['container']
        if payload.get('health') == previous_data_object.get('health'):
            del diff_payload['health']
        if payload.get('latest_status') == previous_data_object.get('latest_status'):
            del diff_payload['latest_status']
        if payload.get('collector') == previous_data_object.get('collector'):
            del diff_payload['collector']

        # Build diff history
        hist_list = []
        for history in reversed(payload.get('history', [])):
            if previous_data_object.get('history') and len(previous_data_object.get('history', [])) > 0:
                t1 = datetime.strptime(history['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")
                t2 = datetime.strptime(previous_data_object[-1]['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")
                if t1 < t2:
                    break
                hist_list.insert(0, history)

        # Build diff errors
        err_list = []
        for error in reversed(payload.get('errors', [])):
            if previous_data_object.get('errors') and len(previous_data_object.get('errors', [])) > 0:
                t1 = datetime.strptime(error['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")
                t2 = datetime.strptime(previous_data_object[-1]['timestamp'], "%Y-%m-%dT%H:%M:%S.%fZ")
                if t1 < t2:
                    break
                err_list.insert(0, error)

        diff_payload['history'] = hist_list
        diff_payload['errors'] = err_list
        
        self.previous_data_object[persisted_key] = payload

        return diff_payload
