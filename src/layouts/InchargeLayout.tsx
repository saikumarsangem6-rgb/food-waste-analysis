import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  TrendingUp, Trash2, Star, Menu as MenuIcon, Bell, LogOut, Camera 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function InchargeLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const navItems = [
    { path: '/incharge/dashboard', label: 'Dashboard', icon: <TrendingUp size={20} /> },
    { path: '/incharge/reports', label: 'Daily Reports', icon: <Trash2 size={20} /> },
    { path: '/incharge/reviews', label: 'Reviews', icon: <Star size={20} /> },
    { path: '/incharge/menu', label: 'Menu Management', icon: <MenuIcon size={20} /> },
    { path: '/incharge/analysis', label: 'Waste Analysis', icon: <Camera size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col sticky top-0 h-screen">
        <div className="p-6 text-white font-display font-bold text-xl flex items-center gap-2">
          <span className="text-emerald-500">🍽️</span> Hostel Waste
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                location.pathname === item.path 
                  ? 'bg-emerald-600/10 text-emerald-500 font-medium' 
                  : 'hover:bg-slate-800'
              }`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800">
            {navItems.find(i => i.path === location.pathname)?.label || 'Incharge Panel'}
          </h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.username}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
                {user?.username?.[0]?.toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
