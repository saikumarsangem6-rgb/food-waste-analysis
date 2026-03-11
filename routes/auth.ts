// MODULE 8: Authentication Routes
import { Express } from "express";

export function registerAuthRoutes(app: Express, db: any) {
  // Login - accepts any username and password
  app.post("/api/login", (req, res) => {
    try {
      const { username, password, role } = req.body;
      // Accept any credentials - create a mock user
      res.json({ id: 1, username: username || 'user', role: role || 'student' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Register (student only)
  app.post("/api/auth/register", (req, res) => {
    try {
      const { username, password, name } = req.body;
      const existing = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
      if (existing) return res.status(400).json({ success: false, error: "Username already exists" });
      const result = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, password, "student");
      res.json({ success: true, id: result.lastInsertRowid, username, role: "student" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get profile
  app.get("/api/auth/profile/:id", (req, res) => {
    try {
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(parseInt(req.params.id));
      if (!user) return res.status(404).json({ success: false, error: "User not found" });
      const { password, ...safeUser } = user;
      res.json({ success: true, data: safeUser });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
