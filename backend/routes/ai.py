"""
AI Routes — YOLO-based food detection + suggestion engine
"""
import base64
import io
import json
import os
import traceback
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from database import db

# Gemini API settings
GEMINI_API_KEY = "AIzaSyBbffv5FQRyO7KD-aqf9v-kKUF3so9eGfQ"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

router = APIRouter(prefix="/api/ai", tags=["ai"])

# ── YOLO model (pre-loaded at startup) ────────────────────────────────────
_yolo_model = None

FOOD_CLASSES = [
    "Rice", "Jeera Rice", "Biryani", "Pulao",
    "Roti", "Chapati", "Paratha", "Naan", "Puri",
    "Dal Tadka", "Dal Makhani", "Rajma", "Chole", "Kadhi", "Sambar",
    "Paneer Masala", "Palak Paneer", "Shahi Paneer",
    "Bhindi Fry", "Aloo Gobi", "Aloo Matar", "Mix Veg", "Lauki", "Baingan",
    "Salad", "Raita", "Curd", "Pickle", "Papad",
    "Poha", "Upma", "Idli", "Dosa", "Bread", "Omelette",
    "Jalebi", "Gulab Jamun", "Kheer",
    "Chicken Curry", "Egg Curry", "Fish Curry",
    "Tea", "Coffee", "Soup",
]

# Map COCO classes → Indian food categories
COCO_TO_FOOD = {
    "bowl": ["Rice", "Dal Tadka", "Curd", "Raita", "Kadhi", "Sambar", "Kheer", "Soup"],
    "cake": ["Jalebi", "Gulab Jamun"],
    "pizza": ["Paratha", "Naan", "Dosa"],
    "sandwich": ["Bread"],
    "donut": ["Puri", "Jalebi"],
    "banana": ["Banana"],
    "apple": ["Apple"],
    "orange": ["Orange"],
    "broccoli": ["Mix Veg", "Salad"],
    "carrot": ["Mix Veg", "Salad"],
    "hot dog": ["Roti", "Paratha"],
    "cup": ["Tea", "Coffee"],
    "wine glass": ["Beverage"],
    "bottle": ["Beverage"],
    "spoon": [],
    "knife": [],
    "fork": [],
}


def init_yolo_model():
    """Initialize YOLO model at server startup"""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            _yolo_model = YOLO("yolov8n.pt")
            print("✅ YOLOv8 nano model loaded successfully")
        except Exception as e:
            print(f"⚠️ YOLO model failed to load: {e}")
    return _yolo_model


def get_yolo_model():
    global _yolo_model
    if _yolo_model is None:
        init_yolo_model()
    return _yolo_model


def map_coco_to_food(coco_class: str) -> str:
    """Map a COCO detection class to an Indian food name."""
    coco_lower = coco_class.lower()
    if coco_lower in COCO_TO_FOOD and COCO_TO_FOOD[coco_lower]:
        return COCO_TO_FOOD[coco_lower][0]
    # If it's a food-related COCO class not in our map, return as-is
    food_related = {"banana", "apple", "orange", "broccoli", "carrot", "cake",
                    "pizza", "sandwich", "donut", "hot dog", "bowl", "cup"}
    if coco_lower in food_related:
        return coco_class.capitalize()
    return coco_class.capitalize()


def classify_food_with_gemini(image_bytes: bytes) -> tuple[str, float]:
    """Use Gemini AI to classify food image for more accurate detection via HTTP API"""
    if not GEMINI_API_KEY:
        return None, 0
    
    try:
        import requests
        from PIL import Image
        
        # Convert image to base64
        img = Image.open(io.BytesIO(image_bytes))
        # Resize to reduce payload size
        img.thumbnail((512, 512))
        buffered = io.BytesIO()
        img.save(buffered, format="JPEG", quality=85)
        img_b64 = base64.b64encode(buffered.getvalue()).decode()
        
        prompt = """Identify the Indian food in this image. Return ONLY the food name from this list:
Rice, Jeera Rice, Biryani, Pulao, Roti, Chapati, Paratha, Naan, Puri, 
Dal Tadka, Dal Makhani, Rajma, Chole, Kadhi, Sambar,
Paneer Masala, Palak Paneer, Bhindi Fry, Aloo Gobi, Aloo Matar, Mix Veg,
Salad, Raita, Curd, Pickle, Papad, Poha, Upma, Idli, Dosa,
Jalebi, Gulab Jamun, Kheer, Chicken Curry, Egg Curry, Fish Curry,
Tea, Coffee, Soup, Bread, Omelette.

Return format: FOOD_NAME|CONFIDENCE (e.g., "Rice|95"). Be specific and accurate."""
        
        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
                ]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=15)
        if response.status_code == 200:
            result = response.json()
            text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            text = text.strip()
            if "|" in text:
                food, conf = text.split("|")
                return food.strip(), float(conf.strip())
            return text, 85.0
    except Exception as e:
        print(f"Gemini classification error: {e}")
    return None, 0


class DetectRequest(BaseModel):
    image: str  # base64 encoded image


@router.post("/detect-food")
def detect_food(req: DetectRequest):
    """
    Gemini AI-based food detection for accurate identification.
    Uses Gemini Vision API to identify Indian food items.
    """
    try:
        from PIL import Image

        # Decode base64 image
        image_data = req.image
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]
        img_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Primary: Use Gemini for accurate food classification
        import requests
        
        # Resize image for faster API call
        img_resized = img.copy()
        img_resized.thumbnail((640, 640))
        # Convert to RGB if necessary (JPEG doesn't support RGBA)
        if img_resized.mode in ("RGBA", "P"):
            img_resized = img_resized.convert("RGB")
        buffered = io.BytesIO()
        img_resized.save(buffered, format="JPEG", quality=90)
        img_b64 = base64.b64encode(buffered.getvalue()).decode()
        
        prompt = """You are an expert at identifying Indian food. Look at this image carefully and identify the food item.

IMPORTANT: Return ONLY the exact food name from this list that best matches what you see:
- Rice (white steamed rice)
- Jeera Rice (rice with cumin seeds)
- Biryani (spiced rice with meat/veg)
- Roti / Chapati (flatbread)
- Paratha (layered flatbread)
- Naan (tandoor-baked bread)
- Puri (fried bread)
- Dal Tadka (yellow dal with tempering)
- Dal Makhani (creamy black dal)
- Rajma (red kidney beans curry)
- Chole (chickpea curry)
- Kadhi (yogurt-based curry)
- Sambar (south indian lentil soup)
- Paneer Masala (paneer in gravy)
- Palak Paneer (paneer in spinach gravy)
- Bhindi Fry (fried okra)
- Aloo Gobi (potato cauliflower)
- Mix Veg (mixed vegetables)
- Salad (fresh vegetables)
- Raita (yogurt with veggies)
- Curd / Dahi (plain yogurt)
- Poha (flattened rice)
- Upma (semolina dish)
- Idli (steamed rice cakes)
- Dosa (crispy crepe)
- Jalebi (sweet spiral)
- Gulab Jamun (sweet balls)
- Tea / Chai
- Coffee
- Soup
- Bread
- Omelette
- Chicken Curry
- Egg Curry
- Fish Curry

Return format: FOOD_NAME|CONFIDENCE_PERCENT
Example: Rice|95
Example: Dal Tadka|88
Example: Paneer Masala|92

Be precise. If unsure, give your best guess with lower confidence."""

        url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/jpeg", "data": img_b64}}
                ]
            }]
        }
        
        response = requests.post(url, json=payload, timeout=20)
        
        print(f"Gemini API status: {response.status_code}")
        
        if response.status_code == 429:
            return {"success": False, "error": "Rate limit exceeded. Please wait a moment and try again."}
        
        if response.status_code == 200:
            result = response.json()
            print(f"Gemini response: {result}")
            text = result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            print(f"Detected text: {text}")
            text = text.strip()
            
            food_name = "Unknown Food"
            confidence = 50
            
            if "|" in text:
                parts = text.split("|")
                food_name = parts[0].strip()
                try:
                    confidence = float(parts[1].strip().replace("%", ""))
                except:
                    confidence = 85
            elif text:
                food_name = text.strip()
                confidence = 80
            
            # Estimate weight based on image size
            total_pixels = img.width * img.height
            estimated_weight = round(max(0.1, min(2.0, total_pixels / 500000)), 2)
            
            return {
                "success": True,
                "data": {
                    "item": food_name,
                    "confidence": confidence,
                    "estimatedWeight": f"{estimated_weight}kg",
                    "reason": f"Gemini AI identified '{food_name}' with {confidence}% confidence.",
                    "items": [{"name": food_name, "confidence": confidence}],
                    "detections": [{"name": food_name, "confidence": confidence, "bbox": [0, 0, img.width, img.height], "area_percent": 100}],
                    "model": "Gemini 2.0 Flash",
                }
            }
        else:
            return {"success": False, "error": f"Gemini API error: {response.status_code}"}

    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": f"Food detection failed: {str(e)}"}


# ── Suggestions ──────────────────────────────────────────────────
@router.get("/suggestions")
def list_suggestions():
    rows = db.get_all("ai_suggestions")
    return {"success": True, "data": sorted(rows, key=lambda s: s.get("id", 0), reverse=True)}


@router.post("/accept/{sid}")
def accept_suggestion(sid: int):
    db.update("ai_suggestions", sid, {"status": "accepted"})
    return {"success": True}


@router.post("/reject/{sid}")
def reject_suggestion(sid: int):
    db.update("ai_suggestions", sid, {"status": "rejected"})
    return {"success": True}


@router.post("/generate")
def generate_suggestions():
    all_waste = db.get_all("waste_summary")
    reviews = sorted(db.get_all("reviews"), key=lambda r: r.get("id", 0), reverse=True)
    foods = db.get_all("food_items")
    today = datetime.now().strftime("%Y-%m-%d")

    by_item: dict = {}
    for w in all_waste:
        iid = w.get("item_id") or w.get("food_item_id")
        if iid not in by_item:
            by_item[iid] = {"waste_sum": 0, "served_sum": 0, "count": 0}
        by_item[iid]["waste_sum"] += w.get("total_wasted_kg") or w.get("wasted_kg") or 0
        by_item[iid]["served_sum"] += w.get("total_served_kg") or w.get("served_kg") or 0
        by_item[iid]["count"] += 1

    suggestions = []
    for iid, data in by_item.items():
        food = next((f for f in foods if f["id"] == iid), None)
        if not food:
            continue
        waste_pct = (data["waste_sum"] / data["served_sum"] * 100) if data["served_sum"] > 0 else 0
        item_reviews = [r for r in reviews if food["name"].lower() in (r.get("comment") or "").lower()]
        avg_rating = (sum(r["overall_rating"] for r in item_reviews) / len(item_reviews)) if item_reviews else 3

        action, reason, alternative, confidence = "KEEP", "", "", 0.7
        if waste_pct > 70 and avg_rating < 2:
            action, reason = "REMOVE", f"Waste {waste_pct:.0f}%, Rating {avg_rating:.1f}★"
            alternative, confidence = "Replace with popular item", 0.95
        elif waste_pct > 50:
            action, reason = "REDUCE_QTY", f"Waste {waste_pct:.0f}%, reduce serving by 30%"
            alternative, confidence = "Reduce portions", 0.85
        elif waste_pct < 10 and avg_rating > 4:
            action, reason = "INCREASE", f"Waste only {waste_pct:.0f}%, Rating {avg_rating:.1f}★, very popular"
            alternative, confidence = "Increase serving by 20%", 0.9

        if action != "KEEP":
            s = {
                "item_id": iid, "item_name": food["name"],
                "action": action, "reason": reason, "alternative": alternative,
                "confidence": confidence, "cost_impact": round(data["waste_sum"] * 120),
            }
            suggestions.append(s)
            db.insert("ai_suggestions", {
                "date": today, **s,
                "status": "pending", "created_at": datetime.now().isoformat(),
            })

    return {"success": True, "data": suggestions, "message": f"Generated {len(suggestions)} suggestions"}


# ── Menu Recommendation ─────────────────────────────────────────
@router.get("/menu-recommendation")
def menu_recommendation():
    foods = db.get_all("food_items")
    suggestions = sorted(db.get_all("ai_suggestions"), key=lambda s: s.get("id", 0), reverse=True)
    removed = {s["item_id"] for s in suggestions if s.get("action") == "REMOVE" and s.get("status") != "rejected"}
    available = [f for f in foods if f["id"] not in removed]

    import random
    def pick(arr, n):
        random.shuffle(arr)
        return arr[:n]

    mains = [f for f in available if f.get("category") in ("Main", "Bread")]
    curries = [f for f in available if f.get("category") in ("Dal", "Curry", "Veg")]
    sides = [f for f in available if f.get("category") in ("Side", "Sweet", "Beverage")]
    breakfast = [f for f in available if f.get("category") == "Breakfast"]

    rec = {
        "breakfast": [f["name"] for f in pick(breakfast[:], 3)],
        "lunch": [f["name"] for f in pick(mains[:], 2) + pick(curries[:], 2) + pick(sides[:], 1)],
        "dinner": [f["name"] for f in pick(mains[:], 2) + pick(curries[:], 2) + pick(sides[:], 1)],
        "notes": f"Excluded {len(removed)} low-performing items" if removed else "All items available",
    }
    return {"success": True, "data": rec}
