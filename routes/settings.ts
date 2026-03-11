// Settings Routes
import { Express } from "express";

export function registerSettingsRoutes(app: Express, db: any) {
  app.get("/api/settings", (req, res) => {
    try {
      const configs = db.prepare("SELECT * FROM system_config").all();
      const settings: Record<string, any> = {};
      configs.forEach((c: any) => {
        try { settings[c.key] = JSON.parse(c.value); } catch { settings[c.key] = c.value; }
      });
      res.json({ success: true, data: settings });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put("/api/settings/:key", (req, res) => {
    try {
      const value = JSON.stringify(req.body.value);
      db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)").run(req.params.key, value);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
