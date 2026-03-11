// Camera & Detection Routes (simulated for demo)
import { Express } from "express";

export function registerCameraRoutes(app: Express, db: any) {
  // Camera status
  app.get("/api/camera/status", (req, res) => {
    res.json({
      success: true,
      data: [
        { id: 1, name: "Serving Counter", position: "serving", status: "online", resolution: "1280x720", fps: 15, lastFrame: new Date().toISOString() },
        { id: 2, name: "Plate Return", position: "return", status: "online", resolution: "1280x720", fps: 15, lastFrame: new Date().toISOString() },
        { id: 3, name: "Waste Bin", position: "waste_bin", status: "online", resolution: "1280x720", fps: 15, lastFrame: new Date().toISOString() }
      ]
    });
  });

  // Live detections (simulated)
  app.get("/api/camera/detections/live", (req, res) => {
    const foods = db.prepare("SELECT * FROM food_items").all().slice(0, 5);
    res.json({
      success: true,
      data: {
        camera_1: {
          timestamp: new Date().toISOString(),
          plate_detected: true,
          detections: foods.slice(0, 3).map((f: any, i: number) => ({
            class_name: f.name, confidence: 85 + Math.random() * 14,
            area_percentage: 15 + Math.random() * 30
          })),
          food_coverage: 65 + Math.random() * 20
        },
        camera_2: {
          timestamp: new Date().toISOString(),
          plate_detected: true,
          detections: foods.slice(1, 3).map((f: any) => ({
            class_name: f.name, confidence: 70 + Math.random() * 20,
            area_percentage: 5 + Math.random() * 15
          })),
          leftover_percent: 10 + Math.random() * 25
        },
        camera_3: {
          timestamp: new Date().toISOString(),
          waste_detected: true,
          waste_level: "medium",
          estimated_kg: 1.5 + Math.random() * 3
        }
      }
    });
  });

  // Serving events
  app.get("/api/camera/serving-events", (req, res) => {
    try {
      res.json({ success: true, data: db.prepare("SELECT * FROM serving_events").all() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Return events
  app.get("/api/camera/return-events", (req, res) => {
    try {
      res.json({ success: true, data: db.prepare("SELECT * FROM return_events").all() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
