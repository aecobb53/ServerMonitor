from pydantic import BaseModel
from typing import Any


class ResponseObject(BaseModel):
    success: bool
    data: Any | None = None
    error: str | None = None

    def response(self):
        response = {
            "success": self.success
        }
        if self.data:
            response['data'] = self.data
        if self.error:
            response['error'] = self.error
        return response
