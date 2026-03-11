// Notification Routes
import { Express } from "express";
import { Server } from "socket.io";

export function registerNotificationRoutes(app: Express, db: any, io: Server) {
  // Get notifications (simulated from data)
  app.get("/api/notifications", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const waste = db.prepare("SELECT * FROM waste_summary WHERE date = ?").all(today);
      const foods = db.prepare("SELECT * FROM food_items").all();
      const notifications: any[] = [];

      // High waste alerts
      waste.forEach((w: any) => {
        const pct = (w.total_served_kg || w.served_kg) > 0
          ? ((w.total_wasted_kg || w.wasted_kg) / (w.total_served_kg || w.served_kg)) * 100 : 0;
        if (pct > 60) {
          const food = foods.find((f: any) => f.id === (w.item_id || w.food_item_id));
          notifications.push({
            id: `waste_${w.id}`, type: 'high_waste', severity: 'critical',
            title: `⚠️ High waste: ${food?.name || 'Unknown'}`,
            message: `${food?.name} waste is ${pct.toFixed(0)}% during ${w.meal_type}`,
            timestamp: w.calculated_at || new Date().toISOString(), read: false
          });
        }
      });

      // Low review alerts
      const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      reviews.filter((r: any) => r.date === today && r.overall_rating <= 2).forEach((r: any) => {
        notifications.push({
          id: `review_${r.id}`, type: 'low_rating', severity: 'warning',
          title: `⭐ Low rating for ${r.meal_type}`,
          message: `${r.student_name} rated ${r.meal_type} ${r.overall_rating}★: "${r.comment}"`,
          timestamp: r.created_at || new Date().toISOString(), read: false
        });
      });

      // Camera status (always online for demo)
      notifications.push({
        id: 'camera_status', type: 'system', severity: 'info',
        title: '📷 All cameras online',
        message: '3/3 cameras are active and processing',
        timestamp: new Date().toISOString(), read: true
      });

      res.json({ success: true, data: notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
