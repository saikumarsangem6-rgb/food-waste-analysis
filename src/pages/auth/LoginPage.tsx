import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'motion/react';
import { LogIn, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'incharge' | 'student'>('student');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      if (res.ok) {
        const data = await res.json();
        login(data);
        navigate(data.role === 'incharge' ? '/incharge/dashboard' : '/student/home');
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-600 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl flex max-w-4xl w-full overflow-hidden"
      >
        {/* Left Panel */}
        <div className="hidden md:flex md:w-1/2 bg-emerald-700 p-12 flex-col justify-between text-white">
          <div>
            <h1 className="text-4xl font-display font-bold mb-4">🍽️ Food Waste Analytics</h1>
            <p className="text-emerald-100 text-lg">Reducing waste, one plate at a time. Join us in making our hostel more sustainable.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-emerald-600/50 p-4 rounded-xl backdrop-blur-sm">
              <p className="font-medium">"Saved ₹2.4L this month by optimizing portions."</p>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-1/2 p-8 md:p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
            <p className="text-slate-500">Please enter your details to sign in</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${role === 'student' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
              >
                <UserIcon size={18} /> Student
              </button>
              <button
                type="button"
                onClick={() => setRole('incharge')}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${role === 'incharge' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
              >
                <ShieldCheck size={18} /> Incharge
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Enter username"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none"
                placeholder="Enter password"
                required
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> Sign In
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                const guestUser = role === 'incharge' ? 'guest_incharge' : 'guest_student';
                try {
                  const res = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: guestUser, password: 'guest123', role })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    login(data);
                    navigate(data.role === 'incharge' ? '/incharge/dashboard' : '/student/home');
                  }
                } catch (err) {
                  setError('Guest login failed');
                }
              }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <UserIcon size={20} /> Guest Login
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            <p>New student? <span className="text-emerald-600 font-bold cursor-pointer hover:underline">Register here</span></p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
