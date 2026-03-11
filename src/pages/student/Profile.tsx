import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, User, Bell, Shield, 
  LogOut, Settings, Award, History 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-emerald-600 text-white p-8 rounded-b-[3rem] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="flex justify-between items-center mb-8 relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">My Profile</h1>
          <button className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <Settings size={20} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center relative z-10">
          <div className="w-24 h-24 bg-white p-1 rounded-full shadow-xl mb-4">
            <div className="w-full h-full bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
          <h2 className="text-2xl font-bold">{user?.username}</h2>
          <p className="text-emerald-100 opacity-80 text-sm">Student ID: #SRU2024001</p>
          
          <div className="flex gap-4 mt-6">
            <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold opacity-70">Reviews</p>
              <p className="text-lg font-bold">24</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md">
              <p className="text-[10px] uppercase font-bold opacity-70">Points</p>
              <p className="text-lg font-bold">1,250</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 -mt-8 relative z-20 space-y-6 max-w-2xl mx-auto">
        {/* Achievements */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Award size={18} className="text-amber-500" />
            Recent Achievements
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            <Badge icon="🌱" label="Waste Saver" />
            <Badge icon="⭐" label="Top Reviewer" />
            <Badge icon="🔥" label="7 Day Streak" />
          </div>
        </div>

        {/* Menu Options */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <ProfileMenuLink icon={<History size={20} />} label="My Review History" />
          <ProfileMenuLink icon={<Bell size={20} />} label="Notifications" />
          <ProfileMenuLink icon={<Shield size={20} />} label="Privacy & Security" />
          <button 
            onClick={logout}
            className="w-full p-5 flex items-center gap-4 text-red-500 hover:bg-red-50 transition-all border-t border-slate-100"
          >
            <LogOut size={20} />
            <span className="font-bold">Logout</span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-400">App Version 2.4.0 (Stable)</p>
        </div>
      </main>
    </div>
  );
}

function Badge({ icon, label }: any) {
  return (
    <div className="flex-shrink-0 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 flex flex-col items-center gap-1 min-w-[100px]">
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] font-bold text-slate-600 uppercase text-center">{label}</span>
    </div>
  );
}

function ProfileMenuLink({ icon, label }: any) {
  return (
    <button className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-all">
      <div className="flex items-center gap-4 text-slate-700">
        <div className="p-2 bg-slate-50 rounded-xl text-slate-400">
          {icon}
        </div>
        <span className="font-bold">{label}</span>
      </div>
      <ChevronLeft size={18} className="rotate-180 text-slate-300" />
    </button>
  );
}
