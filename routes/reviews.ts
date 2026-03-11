// Review Routes
import { Express } from "express";
import { Server } from "socket.io";

export function registerReviewRoutes(app: Express, db: any, io: Server) {
  app.get("/api/reviews", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM reviews ORDER BY id DESC").all());
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/reviews/my/:userId", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM reviews WHERE user_id = ?").all(parseInt(req.params.userId)));
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/reviews/summary", (req, res) => {
    try {
      const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      const total = reviews.length;
      const avgRating = total > 0 ? reviews.reduce((s: number, r: any) => s + r.overall_rating, 0) / total : 0;
      const wasteNone = reviews.filter((r: any) => r.waste_level === 'none').length;
      const wasteLot = reviews.filter((r: any) => r.waste_level === 'lot').length;
      res.json({ success: true, data: { total, avgRating: Math.round(avgRating * 10) / 10, wasteNone, wasteLot } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/reviews", (req, res) => {
    try {
      const { user_id, meal_type, overall_rating, comment, waste_level, items, student_name } = req.body;
      const today = new Date().toISOString().split('T')[0];
      const info = db.prepare("INSERT INTO reviews (user_id, date, meal_type, overall_rating, comment, waste_level, student_name) VALUES (?, ?, ?, ?, ?, ?, ?)").run(user_id, today, meal_type, overall_rating, comment, waste_level, student_name || 'Anonymous');
      const reviewId = info.lastInsertRowid;
      if (items && Array.isArray(items)) {
        items.forEach((item: any) => {
          db.prepare("INSERT INTO item_reviews (review_id, food_item_id, taste, quantity, quality) VALUES (?, ?, ?, ?, ?)").run(reviewId, item.id, item.taste, item.quantity, item.quality);
        });
      }
      io.emit("new_review", { user_id, meal_type, overall_rating, student_name });
      if (overall_rating <= 2) {
        io.emit("low_rating_alert", { student_name, meal_type, rating: overall_rating, comment });
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
