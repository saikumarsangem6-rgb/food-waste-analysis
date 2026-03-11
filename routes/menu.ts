// Menu Routes
import { Express } from "express";

export function registerMenuRoutes(app: Express, db: any) {
  app.get("/api/menu/today", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const menu = db.prepare("SELECT * FROM daily_menu WHERE date = ?").all(today);
      if (menu.length === 0) {
        res.json([
          { meal_type: 'breakfast', items: ['Poha', 'Jalebi', 'Tea'], status: 'completed' },
          { meal_type: 'lunch', items: ['Rice', 'Dal Tadka', 'Paneer Masala', 'Roti', 'Salad'], status: 'ongoing' },
          { meal_type: 'dinner', items: ['Jeera Rice', 'Chole', 'Roti', 'Gulab Jamun'], status: 'upcoming' }
        ]);
      } else {
        res.json(menu.map((m: any) => ({
          ...m, items: m.food_item_ids ? JSON.parse(m.food_item_ids) : []
        })));
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/menu/week", (req, res) => {
    try {
      const menus = db.prepare("SELECT * FROM daily_menu").all();
      res.json({ success: true, data: menus });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/menu", (req, res) => {
    try {
      const { date, meal_type, items } = req.body;
      db.prepare("INSERT OR REPLACE INTO menu (date, meal_type, food_item_ids) VALUES (?, ?, ?)").run(date, meal_type, JSON.stringify(items));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
