// Analytics Routes
import { Express } from "express";

export function registerAnalyticsRoutes(app: Express, db: any) {
  // Waste trends (last 7 days)
  app.get("/api/analytics/trends", (req, res) => {
    try {
      const trends = db.prepare("SELECT date, SUM(wasted_kg) as waste FROM waste_summary GROUP BY date ORDER BY date DESC LIMIT 7").all();
      res.json(trends.reverse());
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Item-wise waste
  app.get("/api/analytics/waste-by-item", (req, res) => {
    try {
      const allWaste = db.prepare("SELECT * FROM waste_summary").all();
      const foods = db.prepare("SELECT * FROM food_items").all();
      const byItem: Record<number, { name: string; served: number; wasted: number; count: number }> = {};
      allWaste.forEach((w: any) => {
        const id = w.item_id || w.food_item_id;
        if (!byItem[id]) {
          const food = foods.find((f: any) => f.id === id);
          byItem[id] = { name: food?.name || 'Unknown', served: 0, wasted: 0, count: 0 };
        }
        byItem[id].served += w.total_served_kg || w.served_kg || 0;
        byItem[id].wasted += w.total_wasted_kg || w.wasted_kg || 0;
        byItem[id].count++;
      });
      const result = Object.entries(byItem).map(([id, data]) => ({
        item_id: parseInt(id), ...data,
        waste_percent: data.served > 0 ? Math.round((data.wasted / data.served) * 1000) / 10 : 0,
        waste_cost: Math.round(data.wasted * 120)
      })).sort((a, b) => b.waste_percent - a.waste_percent);
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Meal-wise comparison
  app.get("/api/analytics/waste-by-meal", (req, res) => {
    try {
      const allWaste = db.prepare("SELECT * FROM waste_summary").all();
      const byMeal: Record<string, { served: number; wasted: number; count: number }> = {};
      allWaste.forEach((w: any) => {
        const m = w.meal_type;
        if (!byMeal[m]) byMeal[m] = { served: 0, wasted: 0, count: 0 };
        byMeal[m].served += w.total_served_kg || w.served_kg || 0;
        byMeal[m].wasted += w.total_wasted_kg || w.wasted_kg || 0;
        byMeal[m].count++;
      });
      const result = Object.entries(byMeal).map(([meal, data]) => ({
        meal_type: meal, ...data, waste_percent: data.served > 0 ? Math.round((data.wasted / data.served) * 1000) / 10 : 0
      }));
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Review sentiment summary
  app.get("/api/analytics/sentiment", (req, res) => {
    try {
      const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      const positive = reviews.filter((r: any) => r.overall_rating >= 4).length;
      const neutral = reviews.filter((r: any) => r.overall_rating === 3).length;
      const negative = reviews.filter((r: any) => r.overall_rating <= 2).length;
      res.json({ success: true, data: { total: reviews.length, positive, neutral, negative, avgRating: reviews.length > 0 ? (reviews.reduce((s: number, r: any) => s + r.overall_rating, 0) / reviews.length).toFixed(1) : 0 } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
