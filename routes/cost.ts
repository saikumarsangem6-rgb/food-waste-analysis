// Cost Analysis Routes
import { Express } from "express";

export function registerCostRoutes(app: Express, db: any) {
  app.get("/api/cost/daily", (req, res) => {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const waste = db.prepare("SELECT * FROM waste_summary WHERE date = ?").all(date);
      const foods = db.prepare("SELECT * FROM food_items").all();
      const items = waste.map((w: any) => {
        const food = foods.find((f: any) => f.id === (w.item_id || w.food_item_id));
        const wasted = w.total_wasted_kg || w.wasted_kg || 0;
        return { item: food?.name || 'Unknown', wasted_kg: wasted, cost: Math.round(wasted * 120) };
      });
      const total = items.reduce((s: number, i: any) => s + i.cost, 0);
      res.json({ success: true, data: { date, items, total_waste_cost: total, estimated_savings: Math.round(total * 0.3) } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/cost/monthly", (req, res) => {
    try {
      const allWaste = db.prepare("SELECT * FROM waste_summary").all();
      const totalWasted = allWaste.reduce((s: number, w: any) => s + (w.total_wasted_kg || w.wasted_kg || 0), 0);
      const totalServed = allWaste.reduce((s: number, w: any) => s + (w.total_served_kg || w.served_kg || 0), 0);
      res.json({
        success: true,
        data: {
          total_served_kg: Math.round(totalServed * 10) / 10,
          total_wasted_kg: Math.round(totalWasted * 10) / 10,
          total_waste_cost: Math.round(totalWasted * 120),
          budget_utilized: Math.round(totalServed * 80),
          savings_achieved: Math.round(totalWasted * 120 * 0.3),
          waste_percent: totalServed > 0 ? Math.round((totalWasted / totalServed) * 1000) / 10 : 0
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/cost/savings", (req, res) => {
    try {
      const allWaste = db.prepare("SELECT * FROM waste_summary").all();
      const byDate: Record<string, number> = {};
      allWaste.forEach((w: any) => {
        byDate[w.date] = (byDate[w.date] || 0) + (w.total_wasted_kg || w.wasted_kg || 0);
      });
      const dates = Object.keys(byDate).sort();
      const savings = dates.map((date, i) => {
        const prev = i > 0 ? byDate[dates[i - 1]] : byDate[date];
        const saved = Math.max(0, prev - byDate[date]) * 120;
        return { date, waste_kg: Math.round(byDate[date] * 10) / 10, savings: Math.round(saved) };
      });
      res.json({ success: true, data: savings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
