from pathlib import Path
import json
from datetime import datetime, timezone
import random
from typing import Annotated

import yaml
from pydantic import BaseModel

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


import logging
from core.set_logger import set_logger
set_logger()
logger = logging.getLogger(__name__)

app = FastAPI()

DATA_DIR = Path("/app/storage")
SERVERS_DIR = Path("/app/servers")

from common.exceptions import ServerNotFoundError

from routes.servers.route import router as service_router
from routes.requests.route import router as requests_router
from routes.events.route import router as event_router
from routes.polls.route import router as polls_router
from routes.gallery.route import gallery_router, map_router
from routes.admin.route import admin_router, login_router
from core.exception_handler import server_not_found
from common.utils import CONTENT_DIR

app.include_router(service_router)
app.include_router(requests_router)
app.include_router(event_router)
app.include_router(polls_router)
app.include_router(gallery_router)
app.include_router(map_router)
app.include_router(login_router)
app.include_router(admin_router)
app.add_exception_handler(ServerNotFoundError, server_not_found)


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get('/api/feed', status_code=200)
@app.get('/api/feed/{page}', status_code=200)
def feed(page: str | None = None):
    response = []
    with open(CONTENT_DIR / 'feed.yaml', 'r') as file:
        data = yaml.safe_load(file)
        for _, section in data.items():
            for _, feed_item in section.items():
                response.extend(feed_item)
    random.shuffle(response)
    return {
        "success": True,
        "data": response
    }

@app.get('/api/whats-new', status_code=200)
def whats_new():
    # response = [
    # "New Website",
    # "Valheim is coming back",
    # "New Valheim server: Hellheim - More to come!"
    # ]
    with open(CONTENT_DIR / 'whats-new.json', 'r') as file:
        response = json.load(file)
    return {
        "success": True,
        "data": response
    }

@app.get('/api/carousel', status_code=200)
@app.get('/api/carousel/{page}', status_code=200)
def carousel(page: str | None = None):
    print(f"PAGE: {page}")
    # response = [
    #     {
    #         "id": "home-1",
    #         "image": "/static/images/carousel/Valheim.png",
    #         "alt": "Community build at sunset",
    #         "title": "RockandStone server is back and 1.0 is here!",
    #         "subtitle": "Restart our journey in Valheim in the Deep North.",
    #         "href": "/servers/RockandStone"
    #     },
    #     {
    #         "id": "home-2",
    #         "image": "/static/images/carousel/Valheim.png",
    #         "alt": "Another page",
    #         "title": "Hellheim",
    #         "subtitle": "There is a new server we're considering supporting! Hardcore mode coming to you!",
    #         "href": "/servers/Hellheim"
    #     },
    #     {
    #         "id": "home-3",
    #         "image": "/api/gallery/gal-007/media/Fader",
    #         "alt": "Another page",
    #         "title": "When do we take on Fader?",
    #         "subtitle": "The fight for the Ashlands is upon us!.",
    #         "href": "/events?id=evt-002"
    #     },
    #     {
    #         "id": "home-4",
    #         "image": "/static/images/carousel/Minecraft.png",
    #         "alt": "Another page",
    #         "title": "Do we want to start a Minecraft server?",
    #         "subtitle": "There were some talks about this if anybody is interested.",
    #         "href": "/"
    #     },
    #     {
    #         "id": "home-5",
    #         "image": "/static/images/carousel/Windrose.png",
    #         "alt": "Another page",
    #         "title": "Windrose",
    #         "subtitle": "Windrose is similar to Valheim, we could look into hosting that as another game.",
    #         "href": "/"
    #     },

    # ]
    with open(CONTENT_DIR / 'carousel.json', 'r') as file:
        response = json.load(file)
    return {
        "success": True,
        "data": response
    }
