import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .reporter import Reporter
from .config import load_config
from .watcher import start_watcher

config = load_config()
logger = logging.getLogger(__name__)

logging.basicConfig(
    level=config.log_level,
    format="%(asctime)s %(levelname)s %(name)s - %(message)s",
)

reporter = Reporter(config)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Assuming this is the correct place for it, every time an update is sent, check to see if the new ADMIN_PASSWORD has changed.
    if it has, auto register. By default, set it to None to start and then read it in the first time.
    This would then also trigger registering all servers upon startup which is ideal anyway.
    """
    loop = asyncio.get_running_loop()
    observer = start_watcher(
        storage=config.storage,
        reporter=reporter,
        loop=loop,
    )
    # registration = asyncio.create_task(reporter.register_forever())
    logger.info(f"Reporter started: version={config.version} uid={reporter.uid} storage={config.storage}")
    logger.debug(
        f"Reporter config: control_core_url={config.control_core_url} callback_url={config.callback_url} "
        f"retry_initial={config.retry_initial_seconds} retry_max={config.retry_max_seconds}"
    )

    try:
        yield
    finally:
        # registration.cancel()
        observer.stop()
        observer.join()


app = FastAPI(
    title="Server Manager Reporter",
    version=config.version,
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "reporter_uid": reporter.uid,
        "version": config.version,
    }


@app.post("/callback")
async def callback(payload: dict):
    logger.debug(f"Callback received: keys={list(payload)}")
    # V1: Nothing meaningful to do yet.
    return {"status": "ok"}
