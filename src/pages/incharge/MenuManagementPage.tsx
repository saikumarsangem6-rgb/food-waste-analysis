import React, { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import InchargeLayout from '../../layouts/InchargeLayout';

export default function MenuManagementPage() {
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('lunch');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/food-items')
      .then(res => res.json())
      .then(data => {
        setFoodItems(data);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          meal_type: mealType,
          items: selectedItems
        })
      });
      if (res.ok) {
        alert('Menu saved successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (id: number) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <InchargeLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold">Menu Configuration</h3>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Select Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-100 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Meal Type</label>
              <select 
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-100 outline-none"
              >
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
              </select>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving || selectedItems.length === 0}
              className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <Save size={20} /> {saving ? 'Saving...' : 'Save Menu'}
            </button>
          </div>

          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
            <h4 className="font-bold text-emerald-800 mb-2">Selected Items</h4>
            <div className="flex flex-wrap gap-2">
              {selectedItems.length === 0 ? (
                <p className="text-sm text-emerald-600 italic">No items selected yet.</p>
              ) : selectedItems.map(id => {
                const item = foodItems.find(f => f.id === id);
                return (
                  <span key={id} className="px-3 py-1 bg-white text-emerald-700 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                    {item?.name}
                    <button onClick={() => toggleItem(id)} className="hover:text-red-500">×</button>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Food Items Grid */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Available Food Items</h3>
              <button className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:underline">
                <Plus size={16} /> Add New Item
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {loading ? (
                <p className="col-span-full text-center py-10 text-slate-400">Loading items...</p>
              ) : foodItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left space-y-2 ${
                    selectedItems.includes(item.id) 
                      ? 'border-emerald-500 bg-emerald-50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <img 
                    src={item.image_url} 
                    alt={item.name} 
                    className="w-full aspect-square object-cover rounded-xl mb-2"
                  />
                  <p className="font-bold text-sm text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{item.category}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </InchargeLayout>
  );
}
