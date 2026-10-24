import os
import json

from common.utils import REQUESTS_DIR
from .models import RequestsQueryParams, RequestDataUrgency, RequestDataObject

def find_requests(query: RequestsQueryParams = RequestsQueryParams):
    requests = []
    for request_fl in os.listdir(REQUESTS_DIR):
        with open(REQUESTS_DIR / request_fl) as sf:
            request_info = json.load(sf)
            request_info = RequestDataObject(**request_info)
            if query.id is not None and request_info.id != query.id:
                continue
            if query.server is not None and request_info.server != query.server:
                continue
            if query.archived is not None and request_info.archived is not query.archived:
                continue
            requests.append(request_info)
    return requests
