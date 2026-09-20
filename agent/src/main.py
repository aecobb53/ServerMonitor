import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .agent import Agent
from .config import load_config
from .watcher import start_watcher

config = load_config()

logging.basicConfig(
    level=config.log_level,
)

agent = Agent(config)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await agent.register()

    loop = asyncio.get_running_loop()

    observer = start_watcher(
        storage=config.storage,
        agent=agent,
        loop=loop,
    )

    try:
        yield
    finally:
        observer.stop()
        observer.join()


app = FastAPI(
    title="Server Manager Agent",
    version=config.version,
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "agent_uid": agent.uid,
        "version": config.version,
    }


@app.post("/callback")
async def callback(payload: dict):
    # V1: Nothing meaningful to do yet.
    return {"status": "ok"}
