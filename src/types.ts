import { Type } from "@google/genai";

export interface User {
  id: number;
  username: string;
  role: 'incharge' | 'student';
}

export interface FoodItem {
  id: number;
  name: string;
  category: string;
  image_url: string;
}

export interface WasteReport {
  date: string;
  waste: number;
}

export interface DashboardStats {
  todayWaste: number;
  studentsServed: number;
  mostWasted: string;
  mostWastedPct: number;
  moneySaved: number;
}

export interface MenuItem {
  meal_type: 'breakfast' | 'lunch' | 'dinner';
  items: string[];
  status: 'completed' | 'ongoing' | 'upcoming';
}
