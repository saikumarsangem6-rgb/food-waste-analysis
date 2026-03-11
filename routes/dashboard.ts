// Dashboard Stats Routes
import { Express } from "express";

export function registerDashboardRoutes(app: Express, db: any) {
  app.get("/api/stats", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const waste = db.prepare("SELECT SUM(wasted_kg) as total FROM waste_summary WHERE date = ?").get(today);
      const served = db.prepare("SELECT SUM(served_kg) as total FROM waste_summary WHERE date = ?").get(today);
      const mostWasted = db.prepare("SELECT f.name, (w.wasted_kg / w.served_kg * 100) as pct FROM waste_summary w JOIN food_items f ON w.item_id = f.id WHERE w.date = ? ORDER BY pct DESC LIMIT 1").get(today);
      const allReviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      const todayReviews = allReviews.filter((r: any) => r.date === today);
      const avgRating = todayReviews.length > 0 ? todayReviews.reduce((s: number, r: any) => s + r.overall_rating, 0) / todayReviews.length : 0;
      const totalWaste = waste?.total || 0;
      const totalServed = served?.total || 0;
      const wastePercent = totalServed > 0 ? (totalWaste / totalServed) * 100 : 0;

      res.json({
        todayWaste: totalWaste,
        todayServed: totalServed,
        wastePercent: Math.round(wastePercent * 10) / 10,
        studentsServed: 347,
        mostWasted: mostWasted?.name || "N/A",
        mostWastedPct: mostWasted?.pct || 0,
        moneySaved: Math.round(totalWaste * 120),
        avgRating: Math.round(avgRating * 10) / 10,
        totalReviewsToday: todayReviews.length,
        pendingComplaints: db.prepare("SELECT * FROM complaints ORDER BY id DESC").all().filter((c: any) => c.status === 'pending').length
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/dashboard/summary", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const todayWaste = db.prepare("SELECT SUM(wasted_kg) as total FROM waste_summary WHERE date = ?").get(today);
      const yesterdayWaste = db.prepare("SELECT SUM(wasted_kg) as total FROM waste_summary WHERE date = ?").get(yesterday);
      const tw = todayWaste?.total || 0;
      const yw = yesterdayWaste?.total || 0;
      const trend = yw > 0 ? ((tw - yw) / yw * 100) : 0;
      res.json({ success: true, data: { todayWaste: tw, yesterdayWaste: yw, trendPercent: Math.round(trend * 10) / 10 } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
