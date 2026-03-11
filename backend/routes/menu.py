from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from datetime import datetime
from database import db
import json

router = APIRouter(prefix="/api/menu", tags=["menu"])


class MenuCreate(BaseModel):
    date: str
    meal_type: str
    items: List[str]


@router.get("/today")
def today_menu():
    today = datetime.now().strftime("%Y-%m-%d")
    menu = db.filter("daily_menu", date=today)
    if not menu:
        return [
            {"meal_type": "breakfast", "items": ["Poha", "Jalebi", "Tea"], "status": "completed"},
            {"meal_type": "lunch", "items": ["Rice", "Dal Tadka", "Paneer Masala", "Roti", "Salad"], "status": "ongoing"},
            {"meal_type": "dinner", "items": ["Jeera Rice", "Chole", "Roti", "Gulab Jamun"], "status": "upcoming"},
        ]
    result = []
    for m in menu:
        items = m.get("food_item_ids", "[]")
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except Exception:
                items = []
        result.append({**m, "items": items})
    return result


@router.get("/week")
def week_menu():
    return {"success": True, "data": db.get_all("daily_menu")}


@router.post("")
def create_menu(menu: MenuCreate):
    existing = [m for m in db.get_all("daily_menu") if m.get("date") == menu.date and m.get("meal_type") == menu.meal_type]
    if existing:
        db.update("daily_menu", existing[0]["id"], {"food_item_ids": json.dumps(menu.items)})
    else:
        db.insert("daily_menu", {"date": menu.date, "meal_type": menu.meal_type, "food_item_ids": json.dumps(menu.items)})
    return {"success": True}
