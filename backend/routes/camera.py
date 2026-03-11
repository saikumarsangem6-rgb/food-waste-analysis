from fastapi import APIRouter
from datetime import datetime
from database import db
import random

router = APIRouter(prefix="/api/camera", tags=["camera"])


@router.get("/status")
def camera_status():
    now = datetime.now().isoformat()
    return {
        "success": True,
        "data": [
            {"id": 1, "name": "Serving Counter", "position": "serving", "status": "online", "resolution": "1280x720", "fps": 15, "lastFrame": now},
            {"id": 2, "name": "Plate Return", "position": "return", "status": "online", "resolution": "1280x720", "fps": 15, "lastFrame": now},
            {"id": 3, "name": "Waste Bin", "position": "waste_bin", "status": "online", "resolution": "1280x720", "fps": 15, "lastFrame": now},
        ]
    }


@router.get("/detections/live")
def live_detections():
    foods = db.get_all("food_items")[:5]
    now = datetime.now().isoformat()
    return {
        "success": True,
        "data": {
            "camera_1": {
                "timestamp": now, "plate_detected": True,
                "detections": [{"class_name": f["name"], "confidence": 85 + random.random() * 14, "area_percentage": 15 + random.random() * 30} for f in foods[:3]],
                "food_coverage": 65 + random.random() * 20,
            },
            "camera_2": {
                "timestamp": now, "plate_detected": True,
                "detections": [{"class_name": f["name"], "confidence": 70 + random.random() * 20, "area_percentage": 5 + random.random() * 15} for f in foods[1:3]],
                "leftover_percent": 10 + random.random() * 25,
            },
            "camera_3": {
                "timestamp": now, "waste_detected": True,
                "waste_level": "medium", "estimated_kg": 1.5 + random.random() * 3,
            },
        }
    }


@router.get("/serving-events")
def serving_events():
    return {"success": True, "data": db.get_all("serving_events")}


@router.get("/return-events")
def return_events():
    return {"success": True, "data": db.get_all("return_events")}
