// Waste Report Routes
import { Express } from "express";

export function registerWasteRoutes(app: Express, db: any) {
  // Daily reports
  app.get("/api/reports/daily", (req, res) => {
    try {
      const reports = db.prepare("SELECT w.*, f.name as food_name FROM waste_summary w JOIN food_items f ON w.item_id = f.id ORDER BY w.date DESC").all();
      res.json(reports);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Waste by date
  app.get("/api/waste-report/daily", (req, res) => {
    try {
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
      const meal = req.query.meal as string;
      let reports = db.prepare("SELECT * FROM waste_summary WHERE date = ?").all(date);
      if (meal) reports = reports.filter((r: any) => r.meal_type === meal);
      const enriched = reports.map((r: any) => {
        const food = db.prepare("SELECT * FROM food_items").all().find((f: any) => f.id === r.item_id);
        return { ...r, food_name: food?.name || 'Unknown', food_category: food?.category || '' };
      });
      res.json({ success: true, data: enriched });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Weekly report
  app.get("/api/waste-report/weekly", (req, res) => {
    try {
      const allWaste = db.prepare("SELECT * FROM waste_summary").all();
      const grouped: Record<string, { served: number; wasted: number; count: number }> = {};
      allWaste.forEach((w: any) => {
        if (!grouped[w.date]) grouped[w.date] = { served: 0, wasted: 0, count: 0 };
        grouped[w.date].served += w.total_served_kg || w.served_kg || 0;
        grouped[w.date].wasted += w.total_wasted_kg || w.wasted_kg || 0;
        grouped[w.date].count++;
      });
      const days = Object.entries(grouped)
        .map(([date, d]) => ({ date, ...d, waste_percent: d.served > 0 ? (d.wasted / d.served) * 100 : 0 }))
        .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).reverse();
      res.json({ success: true, data: days });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Submit waste report (for incharge)
  app.post("/api/waste-report", (req, res) => {
    try {
      const { date, meal_type, item_id, served_kg, wasted_kg } = req.body;
      db.prepare("INSERT INTO waste_reports (date, meal_type, food_item_id, served_kg, wasted_kg) VALUES (?, ?, ?, ?, ?)").run(date, meal_type, item_id, served_kg, wasted_kg);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
