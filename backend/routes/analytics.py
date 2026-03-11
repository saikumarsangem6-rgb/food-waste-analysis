from fastapi import APIRouter
from database import db

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/trends")
def trends():
    all_waste = db.get_all("waste_summary")
    grouped: dict = {}
    for r in all_waste:
        d = r.get("date", "")
        grouped[d] = grouped.get(d, 0) + (r.get("total_wasted_kg") or r.get("wasted_kg") or 0)
    result = [{"date": d, "waste": round(w, 2)} for d, w in grouped.items()]
    result.sort(key=lambda x: x["date"], reverse=True)
    return list(reversed(result[:7]))


@router.get("/waste-by-item")
def waste_by_item():
    all_waste = db.get_all("waste_summary")
    foods = db.get_all("food_items")
    by_item: dict = {}
    for w in all_waste:
        iid = w.get("item_id") or w.get("food_item_id")
        if iid not in by_item:
            food = next((f for f in foods if f["id"] == iid), None)
            by_item[iid] = {"name": food["name"] if food else "Unknown", "served": 0, "wasted": 0, "count": 0}
        by_item[iid]["served"] += w.get("total_served_kg") or w.get("served_kg") or 0
        by_item[iid]["wasted"] += w.get("total_wasted_kg") or w.get("wasted_kg") or 0
        by_item[iid]["count"] += 1
    result = []
    for iid, d in by_item.items():
        pct = round((d["wasted"] / d["served"]) * 100, 1) if d["served"] > 0 else 0
        result.append({"item_id": iid, **d, "waste_percent": pct, "waste_cost": round(d["wasted"] * 120)})
    result.sort(key=lambda x: x["waste_percent"], reverse=True)
    return {"success": True, "data": result}


@router.get("/waste-by-meal")
def waste_by_meal():
    all_waste = db.get_all("waste_summary")
    by_meal: dict = {}
    for w in all_waste:
        m = w.get("meal_type", "")
        if m not in by_meal:
            by_meal[m] = {"served": 0, "wasted": 0, "count": 0}
        by_meal[m]["served"] += w.get("total_served_kg") or w.get("served_kg") or 0
        by_meal[m]["wasted"] += w.get("total_wasted_kg") or w.get("wasted_kg") or 0
        by_meal[m]["count"] += 1
    result = []
    for meal, d in by_meal.items():
        pct = round((d["wasted"] / d["served"]) * 100, 1) if d["served"] > 0 else 0
        result.append({"meal_type": meal, **d, "waste_percent": pct})
    return {"success": True, "data": result}


@router.get("/sentiment")
def sentiment():
    reviews = db.get_all("reviews")
    total = len(reviews)
    positive = sum(1 for r in reviews if r.get("overall_rating", 0) >= 4)
    neutral = sum(1 for r in reviews if r.get("overall_rating", 0) == 3)
    negative = sum(1 for r in reviews if r.get("overall_rating", 0) <= 2)
    avg = round(sum(r.get("overall_rating", 0) for r in reviews) / total, 1) if total > 0 else 0
    return {"success": True, "data": {"total": total, "positive": positive, "neutral": neutral, "negative": negative, "avgRating": avg}}
