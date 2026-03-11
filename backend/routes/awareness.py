from fastapi import APIRouter
from database import db
import random

router = APIRouter(prefix="/api/awareness", tags=["awareness"])


@router.get("/stats")
def awareness_stats():
    all_waste = db.get_all("waste_summary")
    total = sum(w.get("total_wasted_kg") or w.get("wasted_kg") or 0 for w in all_waste)
    return {
        "success": True,
        "data": {
            "total_waste_kg": round(total, 1),
            "meals_equivalent": round(total / 0.4),
            "co2_saved_kg": round(total * 2.5, 1),
            "water_saved_liters": round(total * 1000),
            "trees_equivalent": round(total * 0.05, 1),
        }
    }


@router.get("/facts")
def facts():
    all_facts = [
        "🌍 1/3 of all food produced globally is wasted — that's 1.3 billion tonnes per year.",
        "💧 It takes 1,000 liters of water to produce just 1kg of wheat.",
        "🍚 If food waste were a country, it would be the 3rd largest emitter of greenhouse gases.",
        "🍽️ An average Indian wastes 50kg of food per year.",
        "♻️ Reducing food waste by just 25% could feed 870 million hungry people worldwide.",
        "💰 Indian households waste food worth ₹92,000 crore every year.",
        "🌱 Composting food waste can reduce methane emissions by up to 50%.",
        "📊 Hostel mess waste can be reduced by 40% with proper portion control.",
    ]
    random.shuffle(all_facts)
    return {"success": True, "data": all_facts[:4]}


@router.get("/leaderboard")
def leaderboard():
    reviews = sorted(db.get_all("reviews"), key=lambda r: r.get("id", 0), reverse=True)
    by_user: dict = {}
    for r in reviews:
        name = r.get("student_name") or "Anonymous"
        if name not in by_user:
            by_user[name] = {"name": name, "count": 0, "noWaste": 0}
        by_user[name]["count"] += 1
        if r.get("waste_level") == "none":
            by_user[name]["noWaste"] += 1
    board = [
        {**u, "score": u["noWaste"] * 10 + u["count"] * 2}
        for u in by_user.values()
    ]
    board.sort(key=lambda x: x["score"], reverse=True)
    return {"success": True, "data": board[:10]}
