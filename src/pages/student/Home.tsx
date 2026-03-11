import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Star, Clock, CheckCircle2, Calendar, 
  ArrowRight, Info, LogOut, User as UserIcon, MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MenuItem } from '../../types';

export default function StudentHome() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch('/api/menu/today');
        setMenu(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-emerald-600 text-white p-6 rounded-b-[2rem] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2 font-display font-bold text-xl">
            🍽️ Food Waste
          </div>
          <div className="flex items-center gap-3">
            <button onClick={logout} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
              <LogOut size={20} />
            </button>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
              {user?.username[0].toUpperCase()}
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Good Day, {user?.username}! 👋</h1>
          <p className="text-emerald-100 opacity-90">Ready to rate today's meals?</p>
        </div>
      </header>

      <main className="p-6 space-y-8">
        {/* Date Display */}
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Calendar size={18} />
          {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        {/* Menu Sections */}
        <div className="space-y-6">
          {menu.map((meal, idx) => (
            <MealCard key={idx} meal={meal} onRate={() => navigate(`/student/review?meal=${meal.meal_type}`)} />
          ))}
        </div>

        {/* Impact Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500 text-white rounded-xl">
              <Info size={20} />
            </div>
            <h3 className="font-bold text-emerald-800">Your Impact Today</h3>
          </div>
          <p className="text-emerald-700 text-sm mb-4">"Take only what you eat. Every gram saved helps feed someone in need."</p>
          <div className="bg-white p-4 rounded-2xl flex items-center justify-between">
            <div className="text-center flex-1 border-r border-slate-100">
              <p className="text-xs text-slate-500 uppercase font-bold">Waste Saved</p>
              <p className="text-xl font-bold text-emerald-600">0.5 kg</p>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs text-slate-500 uppercase font-bold">Global Rank</p>
              <p className="text-xl font-bold text-emerald-600">#12</p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <NavIcon icon={<Clock size={24} />} label="Home" active onClick={() => navigate('/student/home')} />
        <NavIcon icon={<Star size={24} />} label="Review" onClick={() => navigate('/student/review')} />
        <NavIcon icon={<MessageSquare size={24} />} label="Help" onClick={() => navigate('/student/help')} />
        <NavIcon icon={<UserIcon size={24} />} label="Profile" onClick={() => navigate('/student/profile')} />
      </nav>
    </div>
  );
}

function MealCard({ meal, onRate }: any) {
  const isCompleted = meal.status === 'completed';
  const isOngoing = meal.status === 'ongoing';

  return (
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className={`p-4 flex justify-between items-center ${isOngoing ? 'bg-amber-50' : isCompleted ? 'bg-slate-50' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{meal.meal_type === 'breakfast' ? '🌅' : meal.meal_type === 'lunch' ? '☀️' : '🌙'}</span>
          <div>
            <h3 className="font-bold uppercase text-sm tracking-wider text-slate-800">{meal.meal_type}</h3>
            <p className="text-[10px] text-slate-500 font-medium">7:00 AM - 9:00 AM</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 ${
          isCompleted ? 'bg-emerald-100 text-emerald-600' : 
          isOngoing ? 'bg-amber-100 text-amber-600' : 
          'bg-slate-200 text-slate-500'
        }`}>
          {isCompleted && <CheckCircle2 size={12} />}
          {meal.status}
        </div>
      </div>
      <div className="p-5">
        <div className="flex flex-wrap gap-2 mb-6">
          {meal.items.map((item, i) => (
            <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{item}</span>
          ))}
        </div>
        
        {isCompleted || isOngoing ? (
          <button 
            onClick={onRate}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:shadow-none"
          >
            <Star size={18} /> Rate This Meal <ArrowRight size={18} />
          </button>
        ) : (
          <div className="text-center py-2 text-slate-400 text-sm font-medium italic">
            Review available after meal starts
          </div>
        )}
      </div>
    </motion.div>
  );
}

function NavIcon({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-emerald-600' : 'text-slate-400'}`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase">{label}</span>
      {active && <div className="w-1 h-1 bg-emerald-600 rounded-full"></div>}
    </button>
  );
}
