from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import db

router = APIRouter(prefix="/api", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str
    role: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    name: Optional[str] = None


@router.post("/login")
def login(req: LoginRequest):
    # Accept any credentials - create a mock user
    return {"id": 1, "username": req.username or "user", "role": req.role or "student"}


@router.post("/auth/register")
def register(req: RegisterRequest):
    if db.find("users", username=req.username):
        raise HTTPException(400, "Username already exists")
    uid = db.insert("users", {"username": req.username, "password": req.password, "role": "student"})
    return {"success": True, "id": uid, "username": req.username, "role": "student"}


@router.get("/auth/profile/{user_id}")
def profile(user_id: int):
    user = db.find("users", id=user_id)
    if not user:
        raise HTTPException(404, "User not found")
    safe = {k: v for k, v in user.items() if k != "password"}
    return {"success": True, "data": safe}
