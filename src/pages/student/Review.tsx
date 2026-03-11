import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, ChevronLeft, Send, CheckCircle2, 
  ThumbsUp, ThumbsDown, AlertCircle, Info,
  Utensils, Trash2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ReviewPage() {
  const [searchParams] = useSearchParams();
  const mealType = searchParams.get('meal') || 'lunch';
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [wasteLevel, setWasteLevel] = useState('');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [itemRatings, setItemRatings] = useState<Record<number, any>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch today's menu to get items for this meal
    fetch('/api/menu/today')
      .then(res => res.json())
      .then(data => {
        const meal = data.find((m: any) => m.meal_type === mealType);
        if (meal && meal.items) {
          // Fetch food items to get their details (id, name)
          fetch('/api/food-items')
            .then(res => res.json())
            .then(items => {
              const filtered = items.filter((i: any) => meal.items.includes(i.name));
              setMenuItems(filtered);
            });
        }
      });
  }, [mealType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !wasteLevel) return;

    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          meal_type: mealType,
          overall_rating: rating,
          comment,
          waste_level: wasteLevel,
          student_name: user?.username,
          items: Object.entries(itemRatings).map(([id, ratings]) => ({
            id: parseInt(id),
            ...(ratings as any)
          }))
        })
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => navigate('/student/home'), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateItemRating = (itemId: number, field: string, value: number) => {
    setItemRatings(prev => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || { taste: 3, quantity: 3, quality: 3 }),
        [field]: value
      }
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Thank You! 🙏</h1>
        <p className="text-slate-500 mb-8">Your feedback helps us reduce waste and improve food quality.</p>
        <div className="bg-emerald-50 p-6 rounded-3xl w-full max-w-sm">
          <p className="text-emerald-700 font-medium italic">"Your review helped save 0.2kg of food today!"</p>
        </div>
        <button 
          onClick={() => navigate('/student/home')}
          className="mt-8 text-emerald-600 font-bold hover:underline"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-lg font-bold capitalize">Rate {mealType}</h1>
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Step {step} of 3</p>
          </div>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${step >= i ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
          ))}
        </div>
      </header>

      <main className="p-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm text-center">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Star size={32} fill="currentColor" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-slate-800">Overall Experience</h2>
                <p className="text-slate-500 mb-8">How would you rate the meal overall?</p>
                
                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`p-2 transition-all ${rating >= star ? 'text-amber-400 scale-110' : 'text-slate-200'}`}
                    >
                      <Star size={44} fill={rating >= star ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
                <div className="h-8">
                  {rating > 0 && (
                    <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-emerald-600 font-bold">
                      {rating === 1 && "Poor 😞"}
                      {rating === 2 && "Fair 😐"}
                      {rating === 3 && "Average 🙂"}
                      {rating === 4 && "Good 😊"}
                      {rating === 5 && "Excellent! 😍"}
                    </motion.p>
                  )}
                </div>
              </section>

              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-red-50 text-red-500 rounded-xl">
                    <Trash2 size={20} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">Leftover Check</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <WasteCard id="none" label="Empty Plate" icon="🍽️" selected={wasteLevel === 'none'} onClick={() => setWasteLevel('none')} />
                  <WasteCard id="little" label="Very Little" icon="🤏" selected={wasteLevel === 'little'} onClick={() => setWasteLevel('little')} />
                  <WasteCard id="some" label="Some" icon="🥣" selected={wasteLevel === 'some'} onClick={() => setWasteLevel('some')} />
                  <WasteCard id="lot" label="A Lot" icon="⚠️" selected={wasteLevel === 'lot'} onClick={() => setWasteLevel('lot')} />
                </div>
              </section>

              <button
                onClick={() => setStep(2)}
                disabled={rating === 0 || !wasteLevel}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:bg-slate-200 transition-all"
              >
                Next Step <ChevronLeft size={20} className="rotate-180" />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <Info size={18} className="text-emerald-600 mt-0.5" />
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Rate specific items to help the kitchen staff understand exactly what needs improvement.
                </p>
              </div>

              {menuItems.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                  </div>
                  <div className="space-y-4 pt-2">
                    <ItemRatingRow label="Taste" value={itemRatings[item.id]?.taste || 3} onChange={(v) => updateItemRating(item.id, 'taste', v)} />
                    <ItemRatingRow label="Quality" value={itemRatings[item.id]?.quality || 3} onChange={(v) => updateItemRating(item.id, 'quality', v)} />
                  </div>
                </div>
              ))}

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl">Back</button>
                <button onClick={() => setStep(3)} className="flex-[2] bg-slate-900 text-white font-bold py-4 rounded-2xl">Final Review</button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Additional Comments</h2>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-40 p-5 rounded-3xl border border-slate-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 outline-none transition-all resize-none text-slate-700"
                  placeholder="Tell us more about your experience... (optional)"
                />
              </section>

              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl">Back</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? "Submitting..." : <><Send size={20} /> Submit Review</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function WasteCard({ label, icon, selected, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${
        selected ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 bg-white text-slate-500'
      }`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
  );
}

function ItemRatingRow({ label, value, onChange }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-500">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              value >= i ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-300'
            }`}
          >
            <Star size={14} fill={value >= i ? "currentColor" : "none"} />
          </button>
        ))}
      </div>
    </div>
  );
}
