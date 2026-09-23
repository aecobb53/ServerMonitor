import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .reporter import ReporterV2
from .config import load_config
from .watcher import start_watcher

config = load_config()
logger = logging.getLogger(__name__)

logging.basicConfig(
    level=config.log_level,
)

reporter = ReporterV2(config)


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    observer = start_watcher(
        storage=config.storage,
        reporter=reporter,
        loop=loop,
    )
    # registration = asyncio.create_task(reporter.register_forever())
    logger.info("ReporterV2 started: storage=%s", config.storage)

    try:
        yield
    finally:
        # registration.cancel()
        observer.stop()
        observer.join()


app = FastAPI(
    title="Server Manager ReporterV2",
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
    # V1: Nothing meaningful to do yet.
    return {"status": "ok"}
