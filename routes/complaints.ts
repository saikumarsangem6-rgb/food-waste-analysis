// Complaints Routes
import { Express } from "express";

export function registerComplaintRoutes(app: Express, db: any) {
  app.get("/api/complaints", (req, res) => {
    try {
      res.json({ success: true, data: db.prepare("SELECT * FROM complaints ORDER BY id DESC").all() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get("/api/complaints/my/:userId", (req, res) => {
    try {
      res.json({ success: true, data: db.prepare("SELECT * FROM complaints WHERE user_id = ?").all(parseInt(req.params.userId)) });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/complaints", (req, res) => {
    try {
      const { user_id, category, subject, description } = req.body;
      const today = new Date().toISOString().split('T')[0];
      db.prepare("INSERT INTO complaints (user_id, date, category, subject, description) VALUES (?, ?, ?, ?, ?)").run(user_id, today, category, subject, description);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/complaints/:id/respond", (req, res) => {
    try {
      const { response, status } = req.body;
      db.prepare("UPDATE complaints SET response=?, status=? WHERE id=?").run(response, status || 'resolved', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/complaints/:id/status", (req, res) => {
    try {
      db.prepare("UPDATE complaints SET status=? WHERE id=?").run(req.body.status, parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
