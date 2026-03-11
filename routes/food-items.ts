// Food Items CRUD Routes
import { Express } from "express";

export function registerFoodItemRoutes(app: Express, db: any) {
  app.get("/api/food-items", (req, res) => {
    try {
      res.json(db.prepare("SELECT * FROM food_items").all());
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/food-items", (req, res) => {
    try {
      const { name, category, image_url } = req.body;
      const result = db.prepare("INSERT INTO food_items (name, category, image_url) VALUES (?, ?, ?)").run(name, category, image_url || "");
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/food-items/:id", (req, res) => {
    try {
      const { name, category, image_url } = req.body;
      db.prepare("UPDATE food_items SET name=?, category=?, image_url=? WHERE id=?").run(name, category, image_url, parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/food-items/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM food_items WHERE id = ?").run(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
