"""
Database seeder — Python port of seed.ts
Populates initial data if the DB is empty.
"""
import random
from datetime import datetime, timedelta
from database import db


def seed_database():
    if len(db.get_all("users")) > 0:
        return

    print("🌱 Seeding database with initial data...")

    # ── Users ────────────────────────────────────────────────────
    users = [
        ("admin", "password", "incharge"),
        ("student", "pass", "student"),
        ("rahul", "pass123", "student"),
        ("priya", "pass123", "student"),
        ("amit", "pass123", "student"),
    ]
    for u, p, r in users:
        db.insert("users", {"username": u, "password": p, "role": r})

    # ── Food Items ───────────────────────────────────────────────
    foods = [
        ("Rice", "Main"), ("Jeera Rice", "Main"), ("Biryani", "Main"),
        ("Roti", "Bread"), ("Paratha", "Bread"), ("Naan", "Bread"), ("Puri", "Bread"),
        ("Dal Tadka", "Dal"), ("Dal Makhani", "Dal"), ("Rajma", "Dal"),
        ("Chole", "Dal"), ("Kadhi", "Dal"), ("Sambar", "Dal"),
        ("Paneer Masala", "Curry"), ("Bhindi Fry", "Veg"),
        ("Aloo Gobi", "Veg"), ("Aloo Matar", "Veg"), ("Mix Veg", "Veg"),
        ("Palak Paneer", "Curry"),
        ("Salad", "Side"), ("Raita", "Side"), ("Curd", "Side"),
        ("Pickle", "Side"), ("Papad", "Side"),
        ("Poha", "Breakfast"), ("Upma", "Breakfast"), ("Idli", "Breakfast"), ("Dosa", "Breakfast"),
        ("Jalebi", "Sweet"), ("Gulab Jamun", "Sweet"),
        ("Tea", "Beverage"), ("Coffee", "Beverage"),
    ]
    for name, cat in foods:
        db.insert("food_items", {
            "name": name, "category": cat,
            "image_url": f"https://picsum.photos/seed/{name.lower().replace(' ', '')}/200"
        })

    # ── 7 days of waste data ─────────────────────────────────────
    now = datetime.now()
    for i in range(6, -1, -1):
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        waste_rows = [
            (date, "lunch", 1, 50 + random.random() * 10, 2 + random.random() * 3),
            (date, "lunch", 8, 30 + random.random() * 5, 4 + random.random() * 4),
            (date, "lunch", 15, 20 + random.random() * 5, 12 + random.random() * 6),
            (date, "lunch", 4, 25 + random.random() * 5, 1 + random.random() * 2),
            (date, "lunch", 14, 15 + random.random() * 5, 1 + random.random() * 1.5),
            (date, "dinner", 1, 45 + random.random() * 10, 3 + random.random() * 3),
            (date, "dinner", 11, 25 + random.random() * 5, 5 + random.random() * 4),
        ]
        for d, meal, item_id, served, wasted in waste_rows:
            pct = (wasted / served * 100) if served > 0 else 0
            status = "good" if pct < 10 else ("average" if pct < 30 else "bad")
            db.insert("waste_summary", {
                "date": d, "meal_type": meal, "item_id": item_id,
                "food_item_id": item_id,
                "total_served_kg": round(served, 2), "served_kg": round(served, 2),
                "total_wasted_kg": round(wasted, 2), "wasted_kg": round(wasted, 2),
                "waste_percent": round(pct, 1),
                "waste_cost": round(wasted * 120),
                "status": status,
                "calculated_at": datetime.now().isoformat(),
            })

    # ── Reviews ──────────────────────────────────────────────────
    today = now.strftime("%Y-%m-%d")
    yesterday = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    reviews = [
        (2, today, "lunch", 4, "Paneer was excellent today!", "none", "Rahul S."),
        (2, today, "lunch", 2, "Dal was too watery today.", "some", "Priya K."),
        (5, today, "lunch", 5, "Best biryani this week!", "none", "Amit P."),
        (6, today, "lunch", 1, "Bhindi was terrible, way too oily.", "lot", "Sneha R."),
        (7, yesterday, "dinner", 3, "Food was average, chole were okay.", "little", "Vikram M."),
        (5, yesterday, "lunch", 4, "Rice and dal combo was nice.", "none", "Rahul S."),
        (6, yesterday, "dinner", 2, "Roti was cold and stale.", "some", "Priya K."),
    ]
    for uid, date, meal, rating, comment, waste, name in reviews:
        db.insert("reviews", {
            "user_id": uid, "date": date, "meal_type": meal,
            "overall_rating": rating, "comment": comment,
            "waste_level": waste, "student_name": name,
            "created_at": datetime.now().isoformat(),
        })

    # ── Complaints ───────────────────────────────────────────────
    complaints = [
        (2, today, "hygiene", "Dirty plates", "Found food residue on plates during lunch."),
        (5, yesterday, "quality", "Cold food", "Dinner roti was served cold for the third time this week."),
        (6, today, "quantity", "Small portions", "The dal portion was very less today at lunch."),
    ]
    for uid, date, cat, subj, desc in complaints:
        db.insert("complaints", {
            "user_id": uid, "date": date, "category": cat,
            "subject": subj, "description": desc,
            "status": "pending", "response": None,
            "responded_by": None, "responded_at": None,
            "created_at": datetime.now().isoformat(),
        })

    # ── AI Suggestions ───────────────────────────────────────────
    suggestions = [
        (today, 15, "Bhindi Fry", "REMOVE", "Waste 76.7%, Rating 1.2★", "Replace with Paneer/Mushroom", 0.95, 1380),
        (today, 8, "Dal Tadka", "CHANGE_RECIPE", "Waste 45%, Rating 2.5★", "Improve thickness", 0.82, 480),
        (today, 14, "Paneer Masala", "INCREASE", "Waste 5%, Rating 4.6★", "Increase serving by 20%", 0.91, -200),
        (today, 1, "Rice", "KEEP", "Waste 5%, Rating 3.8★", "Continue current portions", 0.88, 0),
    ]
    for date, iid, name, action, reason, alt, conf, cost in suggestions:
        db.insert("ai_suggestions", {
            "date": date, "item_id": iid, "item_name": name,
            "action": action, "reason": reason, "alternative": alt,
            "confidence": conf, "cost_impact": cost,
            "status": "pending", "created_at": datetime.now().isoformat(),
        })

    # ── System Config ────────────────────────────────────────────
    import json as _json
    configs = {
        "hostel_name": "SRU Boys Hostel",
        "meal_times": {"breakfast": "7:00-9:00", "lunch": "12:00-14:00", "dinner": "19:00-21:00"},
        "cost_per_kg": {"rice": 40, "dal": 80, "roti": 60, "paneer": 200, "bhindi": 60, "general": 120},
        "waste_thresholds": {"good": 10, "average": 30, "bad": 60},
    }
    for k, v in configs.items():
        db.upsert_config(k, _json.dumps(v))

    print(f"✅ Database seeded with {len(foods)} food items, 7 days waste data, reviews, complaints, suggestions.")


if __name__ == "__main__":
    seed_database()
