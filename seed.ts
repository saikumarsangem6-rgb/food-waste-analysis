// ============================================================
// DATABASE SEED MODULE — Initial data population
// ============================================================

export function seedDatabase(db: any) {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (userCount && userCount.count > 0) return;

  console.log("🌱 Seeding database with initial data...");

  // Users
  const insertUser = db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)");
  insertUser.run("admin", "admin123", "incharge");
  insertUser.run("student", "student123", "student");
  insertUser.run("guest_incharge", "guest123", "incharge");
  insertUser.run("guest_student", "guest123", "student");
  insertUser.run("rahul", "pass123", "student");
  insertUser.run("priya", "pass123", "student");
  insertUser.run("amit", "pass123", "student");

  // Food Items (40 items covering all categories)
  const insertFood = db.prepare("INSERT INTO food_items (name, category, image_url) VALUES (?, ?, ?)");
  const foods = [
    ["Rice", "Main", "https://picsum.photos/seed/rice/200"],
    ["Jeera Rice", "Main", "https://picsum.photos/seed/jeerarice/200"],
    ["Biryani", "Main", "https://picsum.photos/seed/biryani/200"],
    ["Roti", "Bread", "https://picsum.photos/seed/roti/200"],
    ["Paratha", "Bread", "https://picsum.photos/seed/paratha/200"],
    ["Naan", "Bread", "https://picsum.photos/seed/naan/200"],
    ["Puri", "Bread", "https://picsum.photos/seed/puri/200"],
    ["Dal Tadka", "Dal", "https://picsum.photos/seed/dal/200"],
    ["Dal Makhani", "Dal", "https://picsum.photos/seed/dalmakhani/200"],
    ["Rajma", "Dal", "https://picsum.photos/seed/rajma/200"],
    ["Chole", "Dal", "https://picsum.photos/seed/chole/200"],
    ["Kadhi", "Dal", "https://picsum.photos/seed/kadhi/200"],
    ["Sambar", "Dal", "https://picsum.photos/seed/sambar/200"],
    ["Paneer Masala", "Curry", "https://picsum.photos/seed/paneer/200"],
    ["Bhindi Fry", "Veg", "https://picsum.photos/seed/bhindi/200"],
    ["Aloo Gobi", "Veg", "https://picsum.photos/seed/aloogobi/200"],
    ["Aloo Matar", "Veg", "https://picsum.photos/seed/aloomatar/200"],
    ["Mix Veg", "Veg", "https://picsum.photos/seed/mixveg/200"],
    ["Palak Paneer", "Curry", "https://picsum.photos/seed/palak/200"],
    ["Salad", "Side", "https://picsum.photos/seed/salad/200"],
    ["Raita", "Side", "https://picsum.photos/seed/raita/200"],
    ["Curd", "Side", "https://picsum.photos/seed/curd/200"],
    ["Pickle", "Side", "https://picsum.photos/seed/pickle/200"],
    ["Papad", "Side", "https://picsum.photos/seed/papad/200"],
    ["Poha", "Breakfast", "https://picsum.photos/seed/poha/200"],
    ["Upma", "Breakfast", "https://picsum.photos/seed/upma/200"],
    ["Idli", "Breakfast", "https://picsum.photos/seed/idli/200"],
    ["Dosa", "Breakfast", "https://picsum.photos/seed/dosa/200"],
    ["Jalebi", "Sweet", "https://picsum.photos/seed/jalebi/200"],
    ["Gulab Jamun", "Sweet", "https://picsum.photos/seed/gulabjamun/200"],
    ["Tea", "Beverage", "https://picsum.photos/seed/tea/200"],
    ["Coffee", "Beverage", "https://picsum.photos/seed/coffee/200"],
  ];
  foods.forEach(f => insertFood.run(...f));

  // Seed 7 days of waste data for trends
  const insertWaste = db.prepare("INSERT INTO waste_reports (date, meal_type, food_item_id, served_kg, wasted_kg) VALUES (?, ?, ?, ?, ?)");
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const date = d.toISOString().split('T')[0];
    // Rice — low waste
    insertWaste.run(date, 'lunch', 1, 50 + Math.random() * 10, 2 + Math.random() * 3);
    // Dal — medium waste
    insertWaste.run(date, 'lunch', 8, 30 + Math.random() * 5, 4 + Math.random() * 4);
    // Bhindi — high waste
    insertWaste.run(date, 'lunch', 15, 20 + Math.random() * 5, 12 + Math.random() * 6);
    // Roti — low waste
    insertWaste.run(date, 'lunch', 4, 25 + Math.random() * 5, 1 + Math.random() * 2);
    // Paneer — low waste
    insertWaste.run(date, 'lunch', 14, 15 + Math.random() * 5, 1 + Math.random() * 1.5);
    // Dinner items
    insertWaste.run(date, 'dinner', 1, 45 + Math.random() * 10, 3 + Math.random() * 3);
    insertWaste.run(date, 'dinner', 11, 25 + Math.random() * 5, 5 + Math.random() * 4);
  }

  // Seed reviews
  const insertReview = db.prepare("INSERT INTO reviews (user_id, date, meal_type, overall_rating, comment, waste_level, student_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  insertReview.run(2, today, 'lunch', 4, "Paneer was excellent today!", "none", "Rahul S.");
  insertReview.run(2, today, 'lunch', 2, "Dal was too watery today.", "some", "Priya K.");
  insertReview.run(5, today, 'lunch', 5, "Best biryani this week!", "none", "Amit P.");
  insertReview.run(6, today, 'lunch', 1, "Bhindi was terrible, way too oily.", "lot", "Sneha R.");
  insertReview.run(7, yesterday, 'dinner', 3, "Food was average, chole were okay.", "little", "Vikram M.");
  insertReview.run(5, yesterday, 'lunch', 4, "Rice and dal combo was nice.", "none", "Rahul S.");
  insertReview.run(6, yesterday, 'dinner', 2, "Roti was cold and stale.", "some", "Priya K.");

  // Seed complaints
  const insertComplaint = db.prepare("INSERT INTO complaints (user_id, date, category, subject, description) VALUES (?, ?, ?, ?, ?)");
  insertComplaint.run(2, today, "hygiene", "Dirty plates", "Found food residue on plates during lunch.");
  insertComplaint.run(5, yesterday, "quality", "Cold food", "Dinner roti was served cold for the third time this week.");
  insertComplaint.run(6, today, "quantity", "Small portions", "The dal portion was very less today at lunch.");

  // Seed AI suggestions
  const insertSuggestion = db.prepare("INSERT INTO ai_suggestions (date, item_id, item_name, action, reason, alternative, confidence, cost_impact) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertSuggestion.run(today, 15, "Bhindi Fry", "REMOVE", "Waste 76.7%, Rating 1.2★, 92% students said don't serve again", "Replace with Paneer/Mushroom", 0.95, 1380);
  insertSuggestion.run(today, 8, "Dal Tadka", "CHANGE_RECIPE", "Waste 45%, Rating 2.5★, Multiple complaints about consistency", "Improve thickness and seasoning", 0.82, 480);
  insertSuggestion.run(today, 14, "Paneer Masala", "INCREASE", "Waste 5%, Rating 4.6★, Most requested item", "Increase serving quantity by 20%", 0.91, -200);
  insertSuggestion.run(today, 1, "Rice", "KEEP", "Waste 5%, Rating 3.8★, Staple item with low waste", "Continue current portions", 0.88, 0);

  // System config
  db.prepare("INSERT INTO system_config (key, value) VALUES (?, ?)").run("hostel_name", JSON.stringify("SRU Boys Hostel"));
  db.prepare("INSERT INTO system_config (key, value) VALUES (?, ?)").run("meal_times", JSON.stringify({ breakfast: "7:00-9:00", lunch: "12:00-14:00", dinner: "19:00-21:00" }));
  db.prepare("INSERT INTO system_config (key, value) VALUES (?, ?)").run("cost_per_kg", JSON.stringify({ rice: 40, dal: 80, roti: 60, paneer: 200, bhindi: 60, general: 120 }));
  db.prepare("INSERT INTO system_config (key, value) VALUES (?, ?)").run("waste_thresholds", JSON.stringify({ good: 10, average: 30, bad: 60 }));

  console.log("✅ Database seeded with", foods.length, "food items, 7 days of waste data, reviews, complaints, and AI suggestions.");
}
