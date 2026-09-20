import asyncio
import logging
from pathlib import Path

from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

from .agent import Agent

logger = logging.getLogger(__name__)


class WatchHandler(FileSystemEventHandler):
    def __init__(
        self,
        storage: Path,
        agent: Agent,
        loop: asyncio.AbstractEventLoop,
    ):
        self.storage = storage
        self.agent = agent
        self.loop = loop

    def _relative(self, path: str) -> str:
        return str(Path(path).relative_to(self.storage))

    def on_created(self, event):
        if not event.is_directory:
            self._schedule_update(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._schedule_update(event.src_path)

    def on_deleted(self, event):
        if not event.is_directory:
            relative = self._relative(event.src_path)

            asyncio.run_coroutine_threadsafe(
                self.agent.send_delete(relative),
                self.loop,
            )

    def _schedule_update(self, path: str):
        file_path = Path(path)

        if file_path.name == ".agent_uid":
            return

        if not file_path.exists():
            return

        modified_time = file_path.stat().st_mtime
        relative = self._relative(path)

        asyncio.run_coroutine_threadsafe(
            self.agent.send_file(
                file_path,
                relative,
                modified_time,
            ),
            self.loop,
        )


def start_watcher(
    storage: Path,
    agent: Agent,
    loop: asyncio.AbstractEventLoop,
) -> Observer:
    handler = WatchHandler(storage, agent, loop)

    observer = Observer()
    observer.schedule(handler, str(storage), recursive=True)
    observer.start()

    return observer
