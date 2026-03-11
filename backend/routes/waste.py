from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import db

router = APIRouter(prefix="/api", tags=["waste"])


class WasteReport(BaseModel):
    date: str
    meal_type: str
    item_id: int
    served_kg: float
    wasted_kg: float


@router.get("/reports/daily")
def daily_reports():
    foods = db.get_all("food_items")
    rows = db.get_all("waste_summary")
    result = []
    for r in rows:
        food = next((f for f in foods if f["id"] == (r.get("item_id") or r.get("food_item_id"))), None)
        result.append({
            **r,
            "food_name": food["name"] if food else "Unknown",
            "served_kg": r.get("total_served_kg") or r.get("served_kg") or 0,
            "wasted_kg": r.get("total_wasted_kg") or r.get("wasted_kg") or 0,
        })
    result.sort(key=lambda x: x.get("date", ""), reverse=True)
    return result


@router.get("/waste-report/daily")
def waste_daily(date: Optional[str] = None, meal: Optional[str] = None):
    date = date or datetime.now().strftime("%Y-%m-%d")
    rows = db.filter("waste_summary", date=date)
    if meal:
        rows = [r for r in rows if r.get("meal_type") == meal]
    foods = db.get_all("food_items")
    enriched = []
    for r in rows:
        food = next((f for f in foods if f["id"] == r.get("item_id")), None)
        enriched.append({**r, "food_name": food["name"] if food else "Unknown", "food_category": food.get("category", "") if food else ""})
    return {"success": True, "data": enriched}


@router.get("/waste-report/weekly")
def waste_weekly():
    all_waste = db.get_all("waste_summary")
    grouped: dict = {}
    for w in all_waste:
        d = w.get("date", "")
        if d not in grouped:
            grouped[d] = {"served": 0, "wasted": 0, "count": 0}
        grouped[d]["served"] += w.get("total_served_kg") or w.get("served_kg") or 0
        grouped[d]["wasted"] += w.get("total_wasted_kg") or w.get("wasted_kg") or 0
        grouped[d]["count"] += 1
    days = []
    for date, d in grouped.items():
        pct = (d["wasted"] / d["served"]) * 100 if d["served"] > 0 else 0
        days.append({"date": date, **d, "waste_percent": round(pct, 1)})
    days.sort(key=lambda x: x["date"], reverse=True)
    return {"success": True, "data": days[:7][::-1]}


@router.post("/waste-report")
def submit_waste(report: WasteReport):
    pct = (report.wasted_kg / report.served_kg * 100) if report.served_kg > 0 else 0
    status = "good" if pct < 10 else ("average" if pct < 30 else "bad")
    db.insert("waste_summary", {
        "date": report.date, "meal_type": report.meal_type,
        "item_id": report.item_id, "food_item_id": report.item_id,
        "total_served_kg": report.served_kg, "served_kg": report.served_kg,
        "total_wasted_kg": report.wasted_kg, "wasted_kg": report.wasted_kg,
        "waste_percent": round(pct, 1), "waste_cost": round(report.wasted_kg * 120),
        "status": status, "calculated_at": datetime.now().isoformat(),
    })
    return {"success": True}
