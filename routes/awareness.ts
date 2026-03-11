// Awareness Routes (Student-facing waste info)
import { Express } from "express";

export function registerAwarenessRoutes(app: Express, db: any) {
  app.get("/api/awareness/stats", (req, res) => {
    try {
      const allWaste = db.prepare("SELECT * FROM waste_summary").all();
      const totalWasted = allWaste.reduce((s: number, w: any) => s + (w.total_wasted_kg || w.wasted_kg || 0), 0);
      res.json({
        success: true,
        data: {
          total_waste_kg: Math.round(totalWasted * 10) / 10,
          meals_equivalent: Math.round(totalWasted / 0.4),
          co2_saved_kg: Math.round(totalWasted * 2.5 * 10) / 10,
          water_saved_liters: Math.round(totalWasted * 1000),
          trees_equivalent: Math.round(totalWasted * 0.05 * 10) / 10
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/awareness/facts", (req, res) => {
    const facts = [
      "🌍 1/3 of all food produced globally is wasted — that's 1.3 billion tonnes per year.",
      "💧 It takes 1,000 liters of water to produce just 1kg of wheat.",
      "🍚 If food waste were a country, it would be the 3rd largest emitter of greenhouse gases.",
      "🍽️ An average Indian wastes 50kg of food per year.",
      "♻️ Reducing food waste by just 25% could feed 870 million hungry people worldwide.",
      "💰 Indian households waste food worth ₹92,000 crore every year.",
      "🌱 Composting food waste can reduce methane emissions by up to 50%.",
      "📊 Hostel mess waste can be reduced by 40% with proper portion control."
    ];
    res.json({ success: true, data: facts.sort(() => Math.random() - 0.5).slice(0, 4) });
  });

  app.get("/api/awareness/leaderboard", (req, res) => {
    try {
      const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      const byUser: Record<string, { name: string; count: number; noWaste: number }> = {};
      reviews.forEach((r: any) => {
        const name = r.student_name || 'Anonymous';
        if (!byUser[name]) byUser[name] = { name, count: 0, noWaste: 0 };
        byUser[name].count++;
        if (r.waste_level === 'none') byUser[name].noWaste++;
      });
      const leaderboard = Object.values(byUser)
        .map(u => ({ ...u, score: u.noWaste * 10 + u.count * 2 }))
        .sort((a, b) => b.score - a.score).slice(0, 10);
      res.json({ success: true, data: leaderboard });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
