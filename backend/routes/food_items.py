from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import db

router = APIRouter(prefix="/api", tags=["food-items"])


class FoodItem(BaseModel):
    name: str
    category: str
    image_url: Optional[str] = ""


@router.get("/food-items")
def list_items():
    return db.get_all("food_items")


@router.post("/food-items")
def create_item(item: FoodItem):
    nid = db.insert("food_items", {"name": item.name, "category": item.category, "image_url": item.image_url or ""})
    return {"success": True, "id": nid}


@router.put("/food-items/{item_id}")
def update_item(item_id: int, item: FoodItem):
    db.update("food_items", item_id, {"name": item.name, "category": item.category, "image_url": item.image_url})
    return {"success": True}


@router.delete("/food-items/{item_id}")
def delete_item(item_id: int):
    db.delete("food_items", item_id)
    return {"success": True}
