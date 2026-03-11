from fastapi import APIRouter
from datetime import datetime
from database import db

router = APIRouter(prefix="/api", tags=["notifications"])


@router.get("/notifications")
def get_notifications():
    today = datetime.now().strftime("%Y-%m-%d")
    waste = db.filter("waste_summary", date=today)
    foods = db.get_all("food_items")
    notifications = []

    # High waste alerts
    for w in waste:
        served = w.get("total_served_kg") or w.get("served_kg") or 0
        wasted = w.get("total_wasted_kg") or w.get("wasted_kg") or 0
        pct = (wasted / served * 100) if served > 0 else 0
        if pct > 60:
            food = next((f for f in foods if f["id"] == (w.get("item_id") or w.get("food_item_id"))), None)
            notifications.append({
                "id": f"waste_{w.get('id')}", "type": "high_waste", "severity": "critical",
                "title": f"⚠️ High waste: {food['name'] if food else 'Unknown'}",
                "message": f"{food['name'] if food else 'Unknown'} waste is {pct:.0f}% during {w.get('meal_type')}",
                "timestamp": w.get("calculated_at") or datetime.now().isoformat(),
                "read": False,
            })

    # Low review alerts
    reviews = db.get_all("reviews")
    for r in reviews:
        if r.get("date") == today and r.get("overall_rating", 5) <= 2:
            notifications.append({
                "id": f"review_{r.get('id')}", "type": "low_rating", "severity": "warning",
                "title": f"⭐ Low rating for {r.get('meal_type')}",
                "message": f"{r.get('student_name')} rated {r.get('meal_type')} {r.get('overall_rating')}★: \"{r.get('comment')}\"",
                "timestamp": r.get("created_at") or datetime.now().isoformat(),
                "read": False,
            })

    # Camera status
    notifications.append({
        "id": "camera_status", "type": "system", "severity": "info",
        "title": "📷 All cameras online",
        "message": "3/3 cameras are active and processing",
        "timestamp": datetime.now().isoformat(),
        "read": True,
    })

    notifications.sort(key=lambda n: n.get("timestamp", ""), reverse=True)
    return {"success": True, "data": notifications}
