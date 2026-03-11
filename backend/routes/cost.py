from fastapi import APIRouter
from typing import Optional
from datetime import datetime
from database import db

router = APIRouter(prefix="/api/cost", tags=["cost"])


@router.get("/daily")
def daily_cost(date: Optional[str] = None):
    date = date or datetime.now().strftime("%Y-%m-%d")
    waste = db.filter("waste_summary", date=date)
    foods = db.get_all("food_items")
    items = []
    for w in waste:
        food = next((f for f in foods if f["id"] == (w.get("item_id") or w.get("food_item_id"))), None)
        wasted = w.get("total_wasted_kg") or w.get("wasted_kg") or 0
        items.append({"item": food["name"] if food else "Unknown", "wasted_kg": wasted, "cost": round(wasted * 120)})
    total = sum(i["cost"] for i in items)
    return {"success": True, "data": {"date": date, "items": items, "total_waste_cost": total, "estimated_savings": round(total * 0.3)}}


@router.get("/monthly")
def monthly_cost():
    all_waste = db.get_all("waste_summary")
    total_wasted = sum(w.get("total_wasted_kg") or w.get("wasted_kg") or 0 for w in all_waste)
    total_served = sum(w.get("total_served_kg") or w.get("served_kg") or 0 for w in all_waste)
    pct = round((total_wasted / total_served) * 100, 1) if total_served > 0 else 0
    return {
        "success": True,
        "data": {
            "total_served_kg": round(total_served, 1),
            "total_wasted_kg": round(total_wasted, 1),
            "total_waste_cost": round(total_wasted * 120),
            "budget_utilized": round(total_served * 80),
            "savings_achieved": round(total_wasted * 120 * 0.3),
            "waste_percent": pct,
        }
    }


@router.get("/savings")
def savings():
    all_waste = db.get_all("waste_summary")
    by_date: dict = {}
    for w in all_waste:
        d = w.get("date", "")
        by_date[d] = by_date.get(d, 0) + (w.get("total_wasted_kg") or w.get("wasted_kg") or 0)
    dates = sorted(by_date.keys())
    result = []
    for i, date in enumerate(dates):
        prev = by_date[dates[i - 1]] if i > 0 else by_date[date]
        saved = max(0, prev - by_date[date]) * 120
        result.append({"date": date, "waste_kg": round(by_date[date], 1), "savings": round(saved)})
    return {"success": True, "data": result}
