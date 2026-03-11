from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from database import db
import json

router = APIRouter(prefix="/api", tags=["settings"])


class SettingUpdate(BaseModel):
    value: Any


@router.get("/settings")
def get_settings():
    configs = db.get_all("system_config")
    settings = {}
    for c in configs:
        try:
            settings[c["key"]] = json.loads(c["value"])
        except (json.JSONDecodeError, TypeError):
            settings[c["key"]] = c["value"]
    return {"success": True, "data": settings}


@router.put("/settings/{key}")
def update_setting(key: str, body: SettingUpdate):
    db.upsert_config(key, json.dumps(body.value))
    return {"success": True}
