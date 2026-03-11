"""
JSON-backed database layer — Python port of sqlite-shim.ts
Stores all data in hostel_waste.json, same format as the Node version.
"""
import json
import os
from typing import Any, Dict, List, Optional
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "hostel_waste.json"

_TABLES = [
    "users", "food_items", "daily_menu", "serving_events",
    "return_events", "bin_waste_events", "waste_summary",
    "reviews", "item_reviews", "complaints", "ai_suggestions",
    "system_config",
]


class Database:
    def __init__(self, path: str = str(DB_PATH)):
        self.path = path
        self.data: Dict[str, Any] = {t: [] for t in _TABLES}
        self.data["_counters"] = {}
        self._load()

    # ── persistence ──────────────────────────────────────────────
    def _load(self):
        if os.path.exists(self.path):
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                for k, v in loaded.items():
                    self.data[k] = v
            except Exception as e:
                print(f"Failed to load DB: {e}")

    def save(self):
        try:
            with open(self.path, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Failed to save DB: {e}")

    # ── id generation ────────────────────────────────────────────
    def next_id(self, table: str) -> int:
        counters = self.data.setdefault("_counters", {})
        if table not in counters:
            rows = self.data.get(table, [])
            counters[table] = max((r.get("id", 0) for r in rows), default=0) + 1
        nid = counters[table]
        counters[table] = nid + 1
        return nid

    # ── generic helpers ──────────────────────────────────────────
    def get_all(self, table: str) -> List[dict]:
        return self.data.get(table, [])

    def find(self, table: str, **kwargs) -> Optional[dict]:
        for row in self.data.get(table, []):
            if all(row.get(k) == v for k, v in kwargs.items()):
                return row
        return None

    def filter(self, table: str, **kwargs) -> List[dict]:
        return [
            row for row in self.data.get(table, [])
            if all(row.get(k) == v for k, v in kwargs.items())
        ]

    def insert(self, table: str, row: dict) -> int:
        nid = self.next_id(table)
        row["id"] = nid
        self.data.setdefault(table, []).append(row)
        self.save()
        return nid

    def update(self, table: str, row_id: int, updates: dict):
        for row in self.data.get(table, []):
            if row.get("id") == row_id:
                row.update(updates)
                self.save()
                return True
        return False

    def delete(self, table: str, row_id: int) -> bool:
        rows = self.data.get(table, [])
        for i, row in enumerate(rows):
            if row.get("id") == row_id:
                rows.pop(i)
                self.save()
                return True
        return False

    def upsert_config(self, key: str, value: str):
        for row in self.data.get("system_config", []):
            if row.get("key") == key:
                row["value"] = value
                self.save()
                return
        self.data["system_config"].append({"key": key, "value": value})
        self.save()


# singleton
db = Database()
