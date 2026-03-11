import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("hostel_waste.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT CHECK(role IN ('incharge', 'student'))
  );

  CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    category TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS menu (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    meal_type TEXT CHECK(meal_type IN ('breakfast', 'lunch', 'dinner')),
    food_item_ids TEXT,
    UNIQUE(date, meal_type)
  );

  CREATE TABLE IF NOT EXISTS waste_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    meal_type TEXT,
    food_item_id INTEGER,
    served_kg REAL,
    wasted_kg REAL,
    FOREIGN KEY(food_item_id) REFERENCES food_items(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    date TEXT,
    meal_type TEXT,
    overall_rating INTEGER,
    comment TEXT,
    waste_level TEXT,
    student_name TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS item_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id INTEGER,
    food_item_id INTEGER,
    taste INTEGER,
    quantity INTEGER,
    quality INTEGER,
    comment TEXT,
    FOREIGN KEY(review_id) REFERENCES reviews(id),
    FOREIGN KEY(food_item_id) REFERENCES food_items(id)
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "incharge");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("student", "student123", "student");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("guest_incharge", "guest123", "incharge");
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("guest_student", "guest123", "student");
  
  const items = [
    ["Rice", "Main", "https://picsum.photos/seed/rice/200"],
    ["Dal Tadka", "Main", "https://picsum.photos/seed/dal/200"],
    ["Paneer Masala", "Curry", "https://picsum.photos/seed/paneer/200"],
    ["Roti", "Bread", "https://picsum.photos/seed/roti/200"],
    ["Bhindi Fry", "Veg", "https://picsum.photos/seed/bhindi/200"]
  ];
  const insertItem = db.prepare("INSERT INTO food_items (name, category, image_url) VALUES (?, ?, ?)");
  items.forEach(item => insertItem.run(...item));

  // Seed some waste reports
  const today = new Date().toISOString().split('T')[0];
  db.prepare("INSERT INTO waste_reports (date, meal_type, food_item_id, served_kg, wasted_kg) VALUES (?, ?, ?, ?, ?)").run(today, 'lunch', 1, 50, 2.5);
  db.prepare("INSERT INTO waste_reports (date, meal_type, food_item_id, served_kg, wasted_kg) VALUES (?, ?, ?, ?, ?)").run(today, 'lunch', 5, 20, 15.2);

  // Seed some reviews
  db.prepare("INSERT INTO reviews (user_id, date, meal_type, overall_rating, comment, waste_level, student_name) VALUES (?, ?, ?, ?, ?, ?, ?)").run(2, today, 'lunch', 4, "Paneer was excellent!", "none", "Rahul S.");
  db.prepare("INSERT INTO reviews (user_id, date, meal_type, overall_rating, comment, waste_level, student_name) VALUES (?, ?, ?, ?, ?, ?, ?)").run(2, today, 'lunch', 2, "Dal was too watery today.", "some", "Priya K.");
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // Auth API
  app.post("/api/login", (req, res) => {
    try {
      const { username, password, role } = req.body;
      const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ? AND role = ?").get(username, password, role) as any;
      if (user) {
        res.json({ id: user.id, username: user.username, role: user.role });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const waste = db.prepare("SELECT SUM(wasted_kg) as total FROM waste_reports WHERE date = ?").get(today) as any;
      const served = db.prepare("SELECT SUM(served_kg) as total FROM waste_reports WHERE date = ?").get(today) as any;
      const mostWasted = db.prepare(`
        SELECT f.name, (w.wasted_kg / w.served_kg * 100) as pct 
        FROM waste_reports w 
        JOIN food_items f ON w.food_item_id = f.id 
        WHERE w.date = ? 
        ORDER BY pct DESC LIMIT 1
      `).get(today) as any;

      res.json({
        todayWaste: waste?.total || 0,
        studentsServed: 347, // Mocked for demo
        mostWasted: mostWasted?.name || "N/A",
        mostWastedPct: mostWasted?.pct || 0,
        moneySaved: 2400 // Mocked
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Waste Trends
  app.get("/api/analytics/trends", (req, res) => {
    try {
      const trends = db.prepare(`
        SELECT date, SUM(wasted_kg) as waste 
        FROM waste_reports 
        GROUP BY date 
        ORDER BY date DESC LIMIT 7
      `).all();
      res.json(trends.reverse());
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Menu API
  app.get("/api/menu/today", (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const menu = db.prepare("SELECT * FROM menu WHERE date = ?").all(today);
      // If no menu, return default mock for demo
      if (menu.length === 0) {
        res.json([
          { meal_type: 'breakfast', items: ['Poha', 'Jalebi', 'Tea'], status: 'completed' },
          { meal_type: 'lunch', items: ['Rice', 'Dal Tadka', 'Paneer Masala', 'Roti'], status: 'ongoing' },
          { meal_type: 'dinner', items: ['Rice', 'Chole', 'Roti', 'Sweet'], status: 'upcoming' }
        ]);
      } else {
        // Parse food_item_ids if they are stored as JSON string
        const formattedMenu = menu.map((m: any) => ({
          ...m,
          items: m.food_item_ids ? JSON.parse(m.food_item_ids) : []
        }));
        res.json(formattedMenu);
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Reviews API
  app.get("/api/reviews", (req, res) => {
    try {
      const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      res.json(reviews);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Daily Reports API
  app.get("/api/reports/daily", (req, res) => {
    try {
      const reports = db.prepare(`
        SELECT w.*, f.name as food_name 
        FROM waste_reports w 
        JOIN food_items f ON w.food_item_id = f.id 
        ORDER BY w.date DESC
      `).all();
      res.json(reports);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Food Items API
  app.get("/api/food-items", (req, res) => {
    try {
      const items = db.prepare("SELECT * FROM food_items").all();
      res.json(items);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Update Menu API
  app.post("/api/menu", (req, res) => {
    try {
      const { date, meal_type, items } = req.body;
      db.prepare("INSERT OR REPLACE INTO menu (date, meal_type, food_item_ids) VALUES (?, ?, ?)").run(date, meal_type, JSON.stringify(items));
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Review Submission
  app.post("/api/reviews", (req, res) => {
    try {
      const { user_id, meal_type, overall_rating, comment, waste_level, items, student_name } = req.body;
      const today = new Date().toISOString().split('T')[0];
      
      const info = db.prepare("INSERT INTO reviews (user_id, date, meal_type, overall_rating, comment, waste_level, student_name) VALUES (?, ?, ?, ?, ?, ?, ?)").run(user_id, today, meal_type, overall_rating, comment, waste_level, student_name || 'Anonymous');
      const reviewId = info.lastInsertRowid;

      if (items && Array.isArray(items)) {
        const insertItemReview = db.prepare("INSERT INTO item_reviews (review_id, food_item_id, taste, quantity, quality) VALUES (?, ?, ?, ?, ?)");
        items.forEach((item: any) => {
          insertItemReview.run(reviewId, item.id, item.taste, item.quantity, item.quality);
        });
      }

      io.emit("new_review", { user_id, meal_type, overall_rating });
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Socket.io
  io.on("connection", (socket) => {
    console.log("Client connected");
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
