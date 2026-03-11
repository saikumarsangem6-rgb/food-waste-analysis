from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from database import db

router = APIRouter(prefix="/api", tags=["complaints"])


class ComplaintCreate(BaseModel):
    user_id: int
    category: str
    subject: str
    description: str


class ComplaintRespond(BaseModel):
    response: str
    status: Optional[str] = "resolved"


class StatusUpdate(BaseModel):
    status: str


@router.get("/complaints")
def list_complaints():
    rows = db.get_all("complaints")
    return {"success": True, "data": sorted(rows, key=lambda c: c.get("id", 0), reverse=True)}


@router.get("/complaints/my/{user_id}")
def my_complaints(user_id: int):
    return {"success": True, "data": db.filter("complaints", user_id=user_id)}


@router.post("/complaints")
def create_complaint(c: ComplaintCreate):
    today = datetime.now().strftime("%Y-%m-%d")
    db.insert("complaints", {
        "user_id": c.user_id, "date": today, "category": c.category,
        "subject": c.subject, "description": c.description,
        "status": "pending", "response": None,
        "responded_by": None, "responded_at": None,
        "created_at": datetime.now().isoformat(),
    })
    return {"success": True}


@router.put("/complaints/{cid}/respond")
def respond_complaint(cid: int, body: ComplaintRespond):
    db.update("complaints", cid, {
        "response": body.response,
        "status": body.status or "resolved",
        "responded_at": datetime.now().isoformat(),
    })
    return {"success": True}


@router.put("/complaints/{cid}/status")
def update_complaint_status(cid: int, body: StatusUpdate):
    db.update("complaints", cid, {"status": body.status})
    return {"success": True}
