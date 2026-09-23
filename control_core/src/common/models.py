from pydantic import BaseModel, model_validator
from typing import Any
import re


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


class VersionModel(BaseModel):
    """
    This has some interesting handling. I have never seen this before. neat!
    """
    major: int
    minor: int
    patch: int | None = None
    tag: str | None = None

    def __init__(self, version: str | None = None, **data):
        if version is not None:
            data = self.parse_string_version(version)
        super().__init__(**data)

    @staticmethod
    def parse_string_version(version: str) -> dict:
        re_v = re.search("^(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)?\.?(?P<patch>0|[1-9]\d*)?(?P<prerelease>.*)?$", version)
        major = re_v.group("major")
        minor = re_v.group("minor")
        patch = re_v.group("patch")
        prerelease = re_v.group("prerelease")
        return {
            "major": int(major),
            "minor": int(minor),
            "patch": int(patch) if patch is not None else None,
            "tag": prerelease if prerelease else None,
        }

    def __repr__(self):
        version = [self.major, self.minor]
        if self.patch is not None:
            version.append(self.patch)
        if self.tag is not None:
            version.append(self.tag)
        version = ".".join(map(str, version))
        return f"VersionModel({version})"

    def __str__(self):
        version = [self.major, self.minor]
        if self.patch is not None:
            version.append(self.patch)
        if self.tag is not None:
            version.append(self.tag)
        return ".".join(map(str, version))

    def __eq__(self, other):
        if not isinstance(other, VersionModel):
            return NotImplemented
        if self.major != other.major:
            return False
        if self.minor != other.minor:
            return False
        if self.patch != other.patch:
            return False
        if self.tag != other.tag:
            return False
        return True

    def __ne__(self, other):
        return not self.__eq__(other)

    def __lt__(self, other):
        if not isinstance(other, VersionModel):
            return NotImplemented
        if self == other:
            return False
        if self.major > other.major:
            return False
        if self.minor > other.minor:
            return False
        if (self.patch or 0) > (other.patch or 0):
            return False
        return True

    def __gt__(self, other):
        if not isinstance(other, VersionModel):
            return NotImplemented
        if self == other:
            return False
        if self.major < other.major:
            return False
        if self.minor < other.minor:
            return False
        if (self.patch or 0) < (other.patch or 0):
            return False
        return True

    def __ge__(self, other):
        if not isinstance(other, VersionModel):
            return NotImplemented
        if (self == other) or (self > other):
            return True
        return False

    def __le__(self, other):
        if not isinstance(other, VersionModel):
            return NotImplemented
        if (self == other) or (self < other):
            return True
        return False
