import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { 
  Trash2, Users, AlertTriangle, IndianRupee, 
  TrendingDown, TrendingUp, Star, Bell, LogOut, Menu as MenuIcon,
  Camera
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardStats, WasteReport } from '../../types';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export default function InchargeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trends, setTrends] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, trendsRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/analytics/trends')
        ]);
        setStats(await statsRes.json());
        setTrends(await trendsRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8">Loading Dashboard...</div>;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden lg:flex flex-col">
        <div className="p-6 text-white font-display font-bold text-xl flex items-center gap-2">
          <span className="text-emerald-500">🍽️</span> Hostel Waste
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link to="/incharge/dashboard" className="bg-emerald-600/10 text-emerald-500 p-3 rounded-xl flex items-center gap-3 font-medium">
            <TrendingUp size={20} /> Dashboard
          </Link>
          <Link to="/incharge/reports" className="hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer">
            <Trash2 size={20} /> Daily Reports
          </Link>
          <Link to="/incharge/reviews" className="hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer">
            <Star size={20} /> Reviews
          </Link>
          <Link to="/incharge/menu" className="hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer">
            <MenuIcon size={20} /> Menu Management
          </Link>
          <Link to="/incharge/analysis" className="hover:bg-slate-800 p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer">
            <Camera size={20} /> Waste Analysis
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-xl font-bold text-slate-800">Dashboard Overview</h1>
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
                {user?.username[0].toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <StatCard 
              icon={<Trash2 className="text-red-500" />} 
              label="Today's Waste" 
              value={`${stats?.todayWaste.toFixed(1)} kg`} 
              trend="-8%" 
              trendUp={false} 
            />
            <StatCard 
              icon={<Users className="text-blue-500" />} 
              label="Students Served" 
              value={stats?.studentsServed.toString() || "0"} 
              trend="+3%" 
              trendUp={true} 
            />
            <StatCard 
              icon={<AlertTriangle className="text-amber-500" />} 
              label="Most Wasted" 
              value={stats?.mostWasted || "N/A"} 
              trend={`${stats?.mostWastedPct.toFixed(0)}%`} 
              trendUp={false} 
            />
            <StatCard 
              icon={<IndianRupee className="text-emerald-500" />} 
              label="Money Saved" 
              value={`₹${stats?.moneySaved}`} 
              trend="+12%" 
              trendUp={true} 
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6 flex items-center justify-between">
                Waste Trend (Last 7 Days)
                <span className="text-xs font-normal text-slate-400">Values in KG</span>
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line type="monotone" dataKey="waste" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Item-wise Waste Distribution</h3>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Rice', value: 400 },
                        { name: 'Dal', value: 300 },
                        { name: 'Veg', value: 300 },
                        { name: 'Roti', value: 200 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Reviews Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold">Recent Student Reviews</h3>
              <button className="text-emerald-600 text-sm font-bold hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Meal</th>
                    <th className="px-6 py-4 font-medium">Rating</th>
                    <th className="px-6 py-4 font-medium">Comment</th>
                    <th className="px-6 py-4 font-medium">Waste</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <ReviewRow name="Rahul S." meal="Lunch" rating={4} comment="Paneer was excellent!" waste="None" />
                  <ReviewRow name="Priya K." meal="Lunch" rating={2} comment="Dal was too watery today." waste="Some" />
                  <ReviewRow name="Amit P." meal="Breakfast" rating={5} comment="Great poha!" waste="None" />
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, trend, trendUp }: any) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between"
    >
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-slate-800 mb-2">{value}</h4>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {trend} vs yesterday
        </div>
      </div>
      <div className="p-3 bg-slate-50 rounded-xl">
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </motion.div>
  );
}

function ReviewRow({ name, meal, rating, comment, waste }: any) {
  return (
    <tr className="hover:bg-slate-50 transition-all">
      <td className="px-6 py-4 font-medium text-slate-800">{name}</td>
      <td className="px-6 py-4 text-slate-600">{meal}</td>
      <td className="px-6 py-4">
        <div className="flex text-amber-400">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} />
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-slate-500 text-sm italic">"{comment}"</td>
      <td className="px-6 py-4">
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${waste === 'None' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
          {waste}
        </span>
      </td>
    </tr>
  );
}
