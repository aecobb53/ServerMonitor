import asyncio
import logging
import re
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from .reporter import Reporter

logger = logging.getLogger(__name__)
STATE_FILE = re.compile(r"^servers/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.json$")


class WatchHandler(FileSystemEventHandler):
    def __init__(
        self,
        storage: Path,
        reporter: Reporter,
        loop: asyncio.AbstractEventLoop,
    ):
        self.storage = Path(storage)
        self.reporter = reporter
        self.loop = loop
        self._locks = {}

    def _is_state_file(self, path: str) -> bool:
        try:
            relative = self._relative(path)
        except ValueError:
            return False
        return bool(STATE_FILE.fullmatch(relative))

    def _relative(self, path: str) -> str:
        return str(Path(path).relative_to(self.storage))

    def on_created(self, event):
        if not event.is_directory and self._is_state_file(event.src_path):
            self._schedule_update(event.src_path)

    def on_modified(self, event):
        if not event.is_directory and self._is_state_file(event.src_path):
            self._schedule_update(event.src_path)

    def on_moved(self, event):
        if not event.is_directory and self._is_state_file(event.dest_path):
            self._schedule_update(event.dest_path)

    def on_deleted(self, event):
        if not event.is_directory and self._is_state_file(event.src_path):
            relative = self._relative(event.src_path)

            asyncio.run_coroutine_threadsafe(
                self.reporter.send_delete(relative),
                self.loop,
            )

    def _schedule_update(self, path: str):
        file_path = Path(path)

        if not file_path.exists():
            return

        modified_time = file_path.stat().st_mtime
        relative = self._relative(path)

        lock = self._locks.setdefault(relative, asyncio.Lock())
        asyncio.run_coroutine_threadsafe(
            self._send_update(lock, file_path, relative, modified_time),
            self.loop,
        )
        logger.debug("Scheduled state upload: path=%s", relative)

    async def _send_update(self, lock, path: Path, relative: str, modified_time: float):
        async with lock:
            if path.exists():
                try:
                    await self.reporter.send_file(path, relative, modified_time)
                except Exception:
                    logger.exception("State upload failed: path=%s", relative)

    def sync_existing_files(self):
        for path in self.storage.rglob("*.json"):
            self._schedule_update(str(path))


def start_watcher(
    storage: Path,
    reporter: Reporter,
    loop: asyncio.AbstractEventLoop,
) -> Observer:
    storage = Path(storage)
    handler = WatchHandler(storage, reporter, loop)

    observer = Observer()
    observer.schedule(handler, str(storage), recursive=True)
    observer.start()
    handler.sync_existing_files()
    logger.info("Watching collector state files: storage=%s", storage)

    return observer
