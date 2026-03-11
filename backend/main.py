"""
FastAPI Application — Food Waste Analysis Backend
Replaces the Express.js server with FastAPI + YOLO detection.
"""
import sys
import os

# Ensure backend directory is on the import path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

# Import route modules
from routes.auth import router as auth_router
from routes.dashboard import router as dashboard_router
from routes.waste import router as waste_router
from routes.analytics import router as analytics_router
from routes.food_items import router as food_items_router
from routes.menu import router as menu_router
from routes.reviews import router as reviews_router
from routes.complaints import router as complaints_router
from routes.ai import router as ai_router
from routes.camera import router as camera_router
from routes.cost import router as cost_router
from routes.awareness import router as awareness_router
from routes.settings import router as settings_router
from routes.notifications import router as notifications_router

# Seed the database
from seed import seed_database

# ── Socket.IO ────────────────────────────────────────────────────
sio = socketio.AsyncServer(async_mode="asgi", cors_allowed_origins="*")

# ── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(title="Food Waste Analysis API", version="2.0.0")

# CORS — allow Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all route modules
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(waste_router)
app.include_router(analytics_router)
app.include_router(food_items_router)
app.include_router(menu_router)
app.include_router(reviews_router)
app.include_router(complaints_router)
app.include_router(ai_router)
app.include_router(camera_router)
app.include_router(cost_router)
app.include_router(awareness_router)
app.include_router(settings_router)
app.include_router(notifications_router)

# Attach Socket.IO to reviews module
from routes import reviews as reviews_module
reviews_module.sio = sio

# Pre-load YOLO model for faster AI detection
from routes.ai import init_yolo_model
init_yolo_model()


@app.get("/")
def root():
    return {"status": "ok", "message": "Food Waste Analysis API (FastAPI + YOLO)", "version": "2.0.0"}


# ── Socket.IO events ────────────────────────────────────────────
@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")


# Wrap FastAPI with Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, app)

# ── Entry point ──────────────────────────────────────────────────
if __name__ == "__main__":
    seed_database()
    print("🚀 Starting FastAPI server on http://localhost:8001")
    print("📦 Modules: Auth, Dashboard, Waste, Analytics, FoodItems, Menu, Reviews, Complaints, AI (YOLO), Camera, Cost, Awareness, Settings, Notifications")
    uvicorn.run(socket_app, host="0.0.0.0", port=8001, log_level="info")
