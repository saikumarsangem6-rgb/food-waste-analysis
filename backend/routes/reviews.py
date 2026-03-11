from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from database import db

router = APIRouter(prefix="/api", tags=["reviews"])

# Socket.IO instance will be set by main.py
sio = None


class ItemReview(BaseModel):
    id: int
    taste: Optional[int] = 3
    quantity: Optional[int] = 3
    quality: Optional[int] = 3


class ReviewCreate(BaseModel):
    user_id: int
    meal_type: str
    overall_rating: int
    comment: Optional[str] = ""
    waste_level: Optional[str] = "none"
    items: Optional[List[ItemReview]] = None
    student_name: Optional[str] = "Anonymous"


@router.get("/reviews")
def list_reviews():
    reviews = db.get_all("reviews")
    return sorted(reviews, key=lambda r: r.get("id", 0), reverse=True)


@router.get("/reviews/my/{user_id}")
def my_reviews(user_id: int):
    return db.filter("reviews", user_id=user_id)


@router.get("/reviews/summary")
def review_summary():
    reviews = db.get_all("reviews")
    total = len(reviews)
    avg = round(sum(r.get("overall_rating", 0) for r in reviews) / total, 1) if total > 0 else 0
    waste_none = sum(1 for r in reviews if r.get("waste_level") == "none")
    waste_lot = sum(1 for r in reviews if r.get("waste_level") == "lot")
    return {"success": True, "data": {"total": total, "avgRating": avg, "wasteNone": waste_none, "wasteLot": waste_lot}}


@router.post("/reviews")
async def create_review(review: ReviewCreate):
    today = datetime.now().strftime("%Y-%m-%d")
    rid = db.insert("reviews", {
        "user_id": review.user_id, "date": today, "meal_type": review.meal_type,
        "overall_rating": review.overall_rating, "comment": review.comment,
        "waste_level": review.waste_level, "student_name": review.student_name or "Anonymous",
        "created_at": datetime.now().isoformat(),
    })
    if review.items:
        for item in review.items:
            db.insert("item_reviews", {
                "review_id": rid, "food_item_id": item.id,
                "taste": item.taste, "quantity": item.quantity, "quality": item.quality,
            })
    # emit socket events if sio is available
    if sio:
        await sio.emit("new_review", {
            "user_id": review.user_id, "meal_type": review.meal_type,
            "overall_rating": review.overall_rating, "student_name": review.student_name,
        })
        if review.overall_rating <= 2:
            await sio.emit("low_rating_alert", {
                "student_name": review.student_name, "meal_type": review.meal_type,
                "rating": review.overall_rating, "comment": review.comment,
            })
    return {"success": True}
