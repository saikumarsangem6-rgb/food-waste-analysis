from fastapi import APIRouter
from datetime import datetime
from database import db

router = APIRouter(prefix="/api", tags=["dashboard"])


@router.get("/stats")
def stats():
    today = datetime.now().strftime("%Y-%m-%d")
    waste_rows = db.filter("waste_summary", date=today)
    total_waste = sum(r.get("total_wasted_kg") or r.get("wasted_kg") or 0 for r in waste_rows)
    total_served = sum(r.get("total_served_kg") or r.get("served_kg") or 0 for r in waste_rows)
    waste_pct = round((total_waste / total_served) * 100, 1) if total_served > 0 else 0

    # most wasted
    foods = db.get_all("food_items")
    worst = None
    worst_pct = 0
    for w in waste_rows:
        s = w.get("total_served_kg") or w.get("served_kg") or 1
        wa = w.get("total_wasted_kg") or w.get("wasted_kg") or 0
        p = (wa / s) * 100
        if p > worst_pct:
            worst_pct = p
            food = next((f for f in foods if f["id"] == w.get("item_id")), None)
            worst = food["name"] if food else "Unknown"

    reviews = sorted(db.get_all("reviews"), key=lambda r: r.get("id", 0), reverse=True)
    today_reviews = [r for r in reviews if r.get("date") == today]
    avg_rating = round(sum(r["overall_rating"] for r in today_reviews) / len(today_reviews), 1) if today_reviews else 0

    complaints = db.get_all("complaints")
    pending = sum(1 for c in complaints if c.get("status") == "pending")

    return {
        "todayWaste": total_waste,
        "todayServed": total_served,
        "wastePercent": waste_pct,
        "studentsServed": 347,
        "mostWasted": worst or "N/A",
        "mostWastedPct": round(worst_pct, 1),
        "moneySaved": round(total_waste * 120),
        "avgRating": avg_rating,
        "totalReviewsToday": len(today_reviews),
        "pendingComplaints": pending,
    }


@router.get("/dashboard/summary")
def summary():
    today = datetime.now().strftime("%Y-%m-%d")
    from datetime import timedelta
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")

    tw = sum(r.get("total_wasted_kg") or r.get("wasted_kg") or 0 for r in db.filter("waste_summary", date=today))
    yw = sum(r.get("total_wasted_kg") or r.get("wasted_kg") or 0 for r in db.filter("waste_summary", date=yesterday))
    trend = round(((tw - yw) / yw) * 100, 1) if yw > 0 else 0

    return {"success": True, "data": {"todayWaste": tw, "yesterdayWaste": yw, "trendPercent": trend}}
