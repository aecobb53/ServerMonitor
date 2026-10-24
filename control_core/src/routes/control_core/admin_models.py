from pydantic import BaseModel, model_validator

# Requests


class ServerAdminLoginPayload(BaseModel):
    password: str
    server_slug: str


class ServerAdminPATCH(BaseModel):
    description: str | None = None
    news: list[str] | None = None
    rules: list[str] | None = None

    @model_validator(mode='after')
    def require_one_field(self):
        if not self.model_fields_set:
            raise ValueError("At least one of description, news, or rules is required")
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Provided fields cannot be null")
        return self
