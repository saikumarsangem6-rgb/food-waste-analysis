import fs from 'fs';

// ============================================================
// MODULE 7: DATABASE LAYER
// Complete JSON-based database with all 12 tables
// Mimics better-sqlite3 API for compatibility
// ============================================================

interface DBData {
  users: any[];
  food_items: any[];
  daily_menu: any[];
  serving_events: any[];
  return_events: any[];
  bin_waste_events: any[];
  waste_summary: any[];
  reviews: any[];
  item_reviews: any[];
  complaints: any[];
  ai_suggestions: any[];
  system_config: any[];
  _counters: Record<string, number>;
}

export default class Database {
  data: DBData;
  path: string;

  constructor(path: string) {
    this.path = path.replace('.db', '.json');
    this.data = {
      users: [],
      food_items: [],
      daily_menu: [],
      serving_events: [],
      return_events: [],
      bin_waste_events: [],
      waste_summary: [],
      reviews: [],
      item_reviews: [],
      complaints: [],
      ai_suggestions: [],
      system_config: [],
      _counters: {}
    };

    if (fs.existsSync(this.path)) {
      try {
        const loaded = JSON.parse(fs.readFileSync(this.path, 'utf8'));
        this.data = { ...this.data, ...loaded };
      } catch (e) {
        console.error("Failed to load DB:", e);
      }
    }
  }

  private nextId(table: string): number {
    if (!this.data._counters[table]) {
      const existing = (this.data as any)[table] || [];
      this.data._counters[table] = existing.length > 0 
        ? Math.max(...existing.map((r: any) => r.id || 0)) + 1 
        : 1;
    }
    const id = this.data._counters[table];
    this.data._counters[table] = id + 1;
    return id;
  }

  save() {
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2));
    } catch (e) {
      console.error("Failed to save DB:", e);
    }
  }

  exec(sql: string) {
    // CREATE TABLE statements are handled by our data structure
  }

  prepare(sql: string) {
    const self = this;
    const sqlLower = sql.toLowerCase().trim();

    return {
      get(...params: any[]) {
        // ---- USERS ----
        if (sqlLower.includes('select count(*) as count from users')) {
          return { count: self.data.users.length };
        }
        if (sqlLower.includes('select * from users where username = ? and password = ? and role = ?')) {
          return self.data.users.find(u => u.username === params[0] && u.password === params[1] && u.role === params[2]);
        }
        if (sqlLower.includes('select * from users where username = ? and password = ?') && !sqlLower.includes('role')) {
          return self.data.users.find(u => u.username === params[0] && u.password === params[1]);
        }
        if (sqlLower.includes('select * from users where id = ?')) {
          return self.data.users.find(u => u.id === params[0]);
        }
        if (sqlLower.includes('select * from users where username = ?') && !sqlLower.includes('password')) {
          return self.data.users.find(u => u.username === params[0]);
        }

        // ---- STATS ----
        if (sqlLower.includes('select sum(wasted_kg) as total from waste_reports') || 
            sqlLower.includes('select sum(wasted_kg) as total from waste_summary')) {
          const table = self.data.waste_summary.length > 0 ? self.data.waste_summary : [];
          const sum = table
            .filter((r: any) => r.date === params[0])
            .reduce((acc: number, r: any) => acc + (r.total_wasted_kg || r.wasted_kg || 0), 0);
          return { total: sum };
        }
        if (sqlLower.includes('select sum(served_kg) as total from waste_reports') ||
            sqlLower.includes('select sum(served_kg) as total from waste_summary')) {
          const table = self.data.waste_summary.length > 0 ? self.data.waste_summary : [];
          const sum = table
            .filter((r: any) => r.date === params[0])
            .reduce((acc: number, r: any) => acc + (r.total_served_kg || r.served_kg || 0), 0);
          return { total: sum };
        }
        if (sqlLower.includes('select f.name') && sqlLower.includes('wasted_kg') && sqlLower.includes('served_kg') && sqlLower.includes('pct')) {
          const date = params[0];
          const records = self.data.waste_summary
            .filter((r: any) => r.date === date)
            .map((r: any) => {
              const food = self.data.food_items.find((f: any) => f.id === r.item_id);
              const served = r.total_served_kg || r.served_kg || 1;
              const wasted = r.total_wasted_kg || r.wasted_kg || 0;
              return { name: food?.name || 'Unknown', pct: (wasted / served) * 100 };
            })
            .sort((a: any, b: any) => b.pct - a.pct);
          return records[0];
        }

        // ---- COMPLAINTS ----
        if (sqlLower.includes('select * from complaints where id = ?')) {
          return self.data.complaints.find(c => c.id === params[0]);
        }

        // ---- AI SUGGESTIONS ----
        if (sqlLower.includes('select * from ai_suggestions where id = ?')) {
          return self.data.ai_suggestions.find(s => s.id === params[0]);
        }

        // ---- SYSTEM CONFIG ----
        if (sqlLower.includes('select * from system_config where key = ?')) {
          return self.data.system_config.find(c => c.key === params[0]);
        }

        return undefined;
      },

      run(...params: any[]) {
        // ---- USERS ----
        if (sqlLower.includes('insert into users')) {
          const id = self.nextId('users');
          self.data.users.push({ id, username: params[0], password: params[1], role: params[2] });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }

        // ---- FOOD ITEMS ----
        if (sqlLower.includes('insert into food_items')) {
          const id = self.nextId('food_items');
          self.data.food_items.push({ id, name: params[0], category: params[1], image_url: params[2] });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }
        if (sqlLower.includes('update food_items')) {
          const item = self.data.food_items.find(f => f.id === params[3]);
          if (item) { item.name = params[0]; item.category = params[1]; item.image_url = params[2]; }
          self.save();
          return { changes: item ? 1 : 0 };
        }
        if (sqlLower.includes('delete from food_items where id = ?')) {
          const idx = self.data.food_items.findIndex(f => f.id === params[0]);
          if (idx >= 0) self.data.food_items.splice(idx, 1);
          self.save();
          return { changes: idx >= 0 ? 1 : 0 };
        }

        // ---- WASTE REPORTS / WASTE SUMMARY ----
        if (sqlLower.includes('insert into waste_reports') || sqlLower.includes('insert into waste_summary')) {
          const id = self.nextId('waste_summary');
          self.data.waste_summary.push({
            id, date: params[0], meal_type: params[1], item_id: params[2],
            food_item_id: params[2],
            total_served_kg: params[3], served_kg: params[3],
            total_wasted_kg: params[4], wasted_kg: params[4],
            waste_percent: params[3] > 0 ? (params[4] / params[3]) * 100 : 0,
            waste_cost: (params[4] || 0) * 120,
            status: params[3] > 0 ? ((params[4] / params[3]) * 100 < 10 ? 'good' : (params[4] / params[3]) * 100 < 30 ? 'average' : 'bad') : 'good',
            calculated_at: new Date().toISOString()
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }

        // ---- REVIEWS ----
        if (sqlLower.includes('insert into reviews')) {
          const id = self.nextId('reviews');
          self.data.reviews.push({
            id, user_id: params[0], date: params[1], meal_type: params[2],
            overall_rating: params[3], comment: params[4], waste_level: params[5],
            student_name: params[6] || 'Anonymous',
            created_at: new Date().toISOString()
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }

        // ---- ITEM REVIEWS ----
        if (sqlLower.includes('insert into item_reviews')) {
          const id = self.nextId('item_reviews');
          self.data.item_reviews.push({
            id, review_id: params[0], food_item_id: params[1],
            taste: params[2], quantity: params[3], quality: params[4]
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }

        // ---- MENU ----
        if (sqlLower.includes('insert or replace into menu') || sqlLower.includes('insert into daily_menu')) {
          const existing = self.data.daily_menu.find(m => m.date === params[0] && m.meal_type === params[1]);
          if (existing) {
            existing.food_item_ids = params[2];
          } else {
            const id = self.nextId('daily_menu');
            self.data.daily_menu.push({ id, date: params[0], meal_type: params[1], food_item_ids: params[2] });
          }
          self.save();
          return { changes: 1 };
        }

        // ---- SERVING EVENTS ----
        if (sqlLower.includes('insert into serving_events')) {
          const id = self.nextId('serving_events');
          self.data.serving_events.push({
            id, timestamp: params[0], date: params[1], meal_type: params[2],
            frame_id: params[3], person_detected: params[4],
            items_detected: params[5], total_food_area: params[6],
            plate_area: params[7], food_coverage: params[8],
            confidence: params[9], image_path: params[10]
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }

        // ---- RETURN EVENTS ----
        if (sqlLower.includes('insert into return_events')) {
          const id = self.nextId('return_events');
          self.data.return_events.push({
            id, timestamp: params[0], date: params[1], meal_type: params[2],
            frame_id: params[3], items_detected: params[4],
            leftover_area: params[5], plate_area: params[6],
            leftover_percent: params[7], confidence: params[8], image_path: params[9]
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }

        // ---- BIN WASTE EVENTS ----
        if (sqlLower.includes('insert into bin_waste_events')) {
          const id = self.nextId('bin_waste_events');
          self.data.bin_waste_events.push({
            id, timestamp: params[0], date: params[1], meal_type: params[2],
            frame_id: params[3], waste_detected: params[4],
            waste_area: params[5], waste_level: params[6],
            estimated_kg: params[7], confidence: params[8], image_path: params[9]
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }

        // ---- COMPLAINTS ----
        if (sqlLower.includes('insert into complaints')) {
          const id = self.nextId('complaints');
          self.data.complaints.push({
            id, user_id: params[0], date: params[1], category: params[2],
            subject: params[3], description: params[4],
            status: 'pending', response: null,
            responded_by: null, responded_at: null,
            created_at: new Date().toISOString()
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }
        if (sqlLower.includes('update complaints') && sqlLower.includes('response')) {
          const complaint = self.data.complaints.find(c => c.id === params[2]);
          if (complaint) {
            complaint.response = params[0];
            complaint.status = params[1];
            complaint.responded_at = new Date().toISOString();
          }
          self.save();
          return { changes: complaint ? 1 : 0 };
        }
        if (sqlLower.includes('update complaints') && sqlLower.includes('status')) {
          const complaint = self.data.complaints.find(c => c.id === params[1]);
          if (complaint) { complaint.status = params[0]; }
          self.save();
          return { changes: complaint ? 1 : 0 };
        }

        // ---- AI SUGGESTIONS ----
        if (sqlLower.includes('insert into ai_suggestions')) {
          const id = self.nextId('ai_suggestions');
          self.data.ai_suggestions.push({
            id, date: params[0], item_id: params[1], item_name: params[2],
            action: params[3], reason: params[4], alternative: params[5],
            confidence: params[6], cost_impact: params[7],
            status: 'pending',
            created_at: new Date().toISOString()
          });
          self.save();
          return { lastInsertRowid: id, changes: 1 };
        }
        if (sqlLower.includes('update ai_suggestions') && sqlLower.includes('status')) {
          const suggestion = self.data.ai_suggestions.find(s => s.id === params[1]);
          if (suggestion) { suggestion.status = params[0]; }
          self.save();
          return { changes: suggestion ? 1 : 0 };
        }

        // ---- SYSTEM CONFIG ----
        if (sqlLower.includes('insert or replace into system_config') || sqlLower.includes('insert into system_config')) {
          const existing = self.data.system_config.find(c => c.key === params[0]);
          if (existing) {
            existing.value = params[1];
          } else {
            self.data.system_config.push({ key: params[0], value: params[1] });
          }
          self.save();
          return { changes: 1 };
        }

        return { changes: 0, lastInsertRowid: 0 };
      },

      all(...params: any[]) {
        // ---- WASTE TRENDS ----
        if (sqlLower.includes('select date, sum(wasted_kg) as waste from waste_report') ||
            sqlLower.includes('select date, sum(') && sqlLower.includes('waste')) {
          const grouped: Record<string, number> = {};
          self.data.waste_summary.forEach(r => {
            const w = r.total_wasted_kg || r.wasted_kg || 0;
            grouped[r.date] = (grouped[r.date] || 0) + w;
          });
          return Object.keys(grouped)
            .map(date => ({ date, waste: grouped[date] }))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 7);
        }

        // ---- REVIEWS ----
        if (sqlLower.includes('select * from reviews order by id desc')) {
          return [...self.data.reviews].sort((a, b) => b.id - a.id);
        }
        if (sqlLower.includes('select * from reviews where user_id = ?')) {
          return self.data.reviews.filter(r => r.user_id === params[0]).sort((a, b) => b.id - a.id);
        }

        // ---- DAILY REPORTS ----
        if (sqlLower.includes('select w.*, f.name as food_name') || 
            (sqlLower.includes('waste_report') && sqlLower.includes('food_name'))) {
          return self.data.waste_summary.map(r => {
            const food = self.data.food_items.find(f => f.id === (r.item_id || r.food_item_id));
            return {
              ...r,
              food_name: food?.name || 'Unknown',
              served_kg: r.total_served_kg || r.served_kg || 0,
              wasted_kg: r.total_wasted_kg || r.wasted_kg || 0
            };
          }).sort((a, b) => b.date?.localeCompare(a.date));
        }

        // ---- FOOD ITEMS ----
        if (sqlLower.includes('select * from food_items')) {
          return self.data.food_items;
        }

        // ---- MENU ----
        if (sqlLower.includes('select * from menu where date = ?') || 
            sqlLower.includes('select * from daily_menu where date = ?')) {
          return self.data.daily_menu.filter(m => m.date === params[0]);
        }
        if (sqlLower.includes('from menu') || sqlLower.includes('from daily_menu')) {
          return self.data.daily_menu;
        }

        // ---- SERVING EVENTS ----
        if (sqlLower.includes('from serving_events')) {
          if (params.length >= 2) {
            return self.data.serving_events.filter(e => e.date === params[0] && e.meal_type === params[1]);
          }
          return self.data.serving_events;
        }

        // ---- RETURN EVENTS ----
        if (sqlLower.includes('from return_events')) {
          if (params.length >= 2) {
            return self.data.return_events.filter(e => e.date === params[0] && e.meal_type === params[1]);
          }
          return self.data.return_events;
        }

        // ---- BIN WASTE EVENTS ----
        if (sqlLower.includes('from bin_waste_events')) {
          if (params.length >= 2) {
            return self.data.bin_waste_events.filter(e => e.date === params[0] && e.meal_type === params[1]);
          }
          return self.data.bin_waste_events;
        }

        // ---- WASTE SUMMARY ----
        if (sqlLower.includes('from waste_summary')) {
          if (params.length >= 1 && sqlLower.includes('date = ?')) {
            return self.data.waste_summary.filter(w => w.date === params[0]);
          }
          return self.data.waste_summary;
        }

        // ---- COMPLAINTS ----
        if (sqlLower.includes('from complaints') && sqlLower.includes('user_id = ?')) {
          return self.data.complaints.filter(c => c.user_id === params[0]).sort((a, b) => b.id - a.id);
        }
        if (sqlLower.includes('from complaints')) {
          return [...self.data.complaints].sort((a, b) => b.id - a.id);
        }

        // ---- AI SUGGESTIONS ----
        if (sqlLower.includes('from ai_suggestions')) {
          return [...self.data.ai_suggestions].sort((a, b) => b.id - a.id);
        }

        // ---- SYSTEM CONFIG ----
        if (sqlLower.includes('from system_config')) {
          return self.data.system_config;
        }

        return [];
      }
    };
  }
}
