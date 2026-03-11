// AI Suggestion Engine Routes
import { Express } from "express";

const FOOD_CLASSES = [
  "Rice", "Jeera Rice", "Biryani", "Pulao",
  "Roti", "Chapati", "Paratha", "Naan", "Puri",
  "Dal Tadka", "Dal Makhani", "Rajma", "Chole", "Kadhi", "Sambar",
  "Paneer Masala", "Palak Paneer", "Shahi Paneer",
  "Bhindi Fry", "Aloo Gobi", "Aloo Matar", "Mix Veg", "Lauki", "Baingan",
  "Salad", "Raita", "Curd", "Pickle", "Papad",
  "Poha", "Upma", "Idli", "Dosa", "Bread", "Omelette",
  "Jalebi", "Gulab Jamun", "Kheer",
  "Chicken Curry", "Egg Curry", "Fish Curry",
  "Tea", "Coffee", "Soup"
];

const FOOD_DETECTION_PROMPT = `You are an expert Indian food identification system.
PRECISELY identify the food items visible in this image.

CRITICAL VISUAL RULES:
- Roti/Chapati = FLAT, ROUND, BROWN disc. NOT rice.
- Paratha = thicker flatbread with visible layers. NOT rice.
- Naan = thicker teardrop shape with charred spots.
- Puri = small, deep-fried, puffed round bread.
- Rice = WHITE, small individual GRAINS, loose/fluffy.
- Biryani = colored rice (yellow/orange) with spices.
- Dal = LIQUID/SEMI-LIQUID lentil in bowl.
- Paneer = WHITE CUBES in gravy.

KNOWN CLASSES: ${FOOD_CLASSES.join(", ")}

Return JSON: {"item":"most prominent food","confidence":0-100,"estimatedWeight":"e.g. 2.5kg","reason":"visual cues used","items":[{"name":"food","confidence":0-100}]}`;

export function registerAIRoutes(app: Express, db: any) {
  // ── Server-side food detection (fallback for frontend) ──
  app.post("/api/ai/detect-food", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ success: false, error: "No image provided" });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ success: false, error: "Gemini API key not configured. Set GEMINI_API_KEY environment variable." });
      }

      // Dynamic import to avoid issues if package not installed
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const base64Data = image.includes(',') ? image.split(',')[1] : image;

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{
          parts: [
            { text: FOOD_DETECTION_PROMPT },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text!);
      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error("Server-side food detection error:", err.message);
      res.status(500).json({ success: false, error: "AI detection failed: " + err.message });
    }
  });

  // Get all suggestions
  app.get("/api/ai/suggestions", (req, res) => {
    try {
      res.json({ success: true, data: db.prepare("SELECT * FROM ai_suggestions ORDER BY id DESC").all() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Accept suggestion
  app.post("/api/ai/accept/:id", (req, res) => {
    try {
      db.prepare("UPDATE ai_suggestions SET status=? WHERE id=?").run('accepted', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Reject suggestion
  app.post("/api/ai/reject/:id", (req, res) => {
    try {
      db.prepare("UPDATE ai_suggestions SET status=? WHERE id=?").run('rejected', parseInt(req.params.id));
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Generate new suggestions (AI engine simulation)
  app.post("/api/ai/generate", (req, res) => {
    try {
      const allWaste = db.prepare("SELECT * FROM waste_summary").all();
      const reviews = db.prepare("SELECT * FROM reviews ORDER BY id DESC").all();
      const foods = db.prepare("SELECT * FROM food_items").all();
      const today = new Date().toISOString().split('T')[0];

      const byItem: Record<number, { wasteSum: number; servedSum: number; ratings: number[]; count: number }> = {};
      allWaste.forEach((w: any) => {
        const id = w.item_id || w.food_item_id;
        if (!byItem[id]) byItem[id] = { wasteSum: 0, servedSum: 0, ratings: [], count: 0 };
        byItem[id].wasteSum += w.total_wasted_kg || w.wasted_kg || 0;
        byItem[id].servedSum += w.total_served_kg || w.served_kg || 0;
        byItem[id].count++;
      });

      const suggestions: any[] = [];
      Object.entries(byItem).forEach(([id, data]) => {
        const food = foods.find((f: any) => f.id === parseInt(id));
        if (!food) return;
        const wastePct = data.servedSum > 0 ? (data.wasteSum / data.servedSum) * 100 : 0;
        const itemReviews = reviews.filter((r: any) => r.comment?.toLowerCase().includes(food.name.toLowerCase()));
        const avgRating = itemReviews.length > 0 ? itemReviews.reduce((s: number, r: any) => s + r.overall_rating, 0) / itemReviews.length : 3;

        let action = 'KEEP', reason = '', alternative = '', confidence = 0.7;
        if (wastePct > 70 && avgRating < 2) {
          action = 'REMOVE'; reason = `Waste ${wastePct.toFixed(0)}%, Rating ${avgRating.toFixed(1)}★`; alternative = 'Replace with popular item'; confidence = 0.95;
        } else if (wastePct > 50) {
          action = 'REDUCE_QTY'; reason = `Waste ${wastePct.toFixed(0)}%, reduce serving by 30%`; alternative = 'Reduce portions'; confidence = 0.85;
        } else if (wastePct < 10 && avgRating > 4) {
          action = 'INCREASE'; reason = `Waste only ${wastePct.toFixed(0)}%, Rating ${avgRating.toFixed(1)}★, very popular`; alternative = 'Increase serving by 20%'; confidence = 0.9;
        }

        if (action !== 'KEEP') {
          suggestions.push({ item_id: parseInt(id), item_name: food.name, action, reason, alternative, confidence, cost_impact: Math.round(data.wasteSum * 120) });
        }
      });

      // Save generated suggestions
      suggestions.forEach(s => {
        db.prepare("INSERT INTO ai_suggestions (date, item_id, item_name, action, reason, alternative, confidence, cost_impact) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
          .run(today, s.item_id, s.item_name, s.action, s.reason, s.alternative, s.confidence, s.cost_impact);
      });

      res.json({ success: true, data: suggestions, message: `Generated ${suggestions.length} suggestions` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Menu recommendation
  app.get("/api/ai/menu-recommendation", (req, res) => {
    try {
      const foods = db.prepare("SELECT * FROM food_items").all();
      const suggestions = db.prepare("SELECT * FROM ai_suggestions ORDER BY id DESC").all();
      const removedItems = suggestions.filter((s: any) => s.action === 'REMOVE' && s.status !== 'rejected').map((s: any) => s.item_id);
      const starItems = suggestions.filter((s: any) => s.action === 'INCREASE').map((s: any) => s.item_id);
      const available = foods.filter((f: any) => !removedItems.includes(f.id));
      const mains = available.filter((f: any) => ['Main', 'Bread'].includes(f.category));
      const curries = available.filter((f: any) => ['Dal', 'Curry', 'Veg'].includes(f.category));
      const sides = available.filter((f: any) => ['Side', 'Sweet', 'Beverage'].includes(f.category));

      const pick = (arr: any[], n: number) => arr.sort(() => Math.random() - 0.5).slice(0, n);
      const recommendation = {
        breakfast: pick(available.filter((f: any) => f.category === 'Breakfast'), 3).map((f: any) => f.name),
        lunch: [...pick(mains, 2), ...pick(curries, 2), ...pick(sides, 1)].map((f: any) => f.name),
        dinner: [...pick(mains, 2), ...pick(curries, 2), ...pick(sides, 1)].map((f: any) => f.name),
        notes: removedItems.length > 0 ? `Excluded ${removedItems.length} low-performing items` : 'All items available'
      };
      res.json({ success: true, data: recommendation });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}
