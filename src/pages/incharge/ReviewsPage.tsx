import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import InchargeLayout from '../../layouts/InchargeLayout';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        setReviews(data);
        setLoading(false);
      });
  }, []);

  return (
    <InchargeLayout>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold">All Student Reviews</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Student</th>
                <th className="px-6 py-4 font-medium">Meal</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Comment</th>
                <th className="px-6 py-4 font-medium">Waste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading reviews...</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">No reviews found.</td></tr>
              ) : reviews.map((review) => (
                <tr key={review.id} className="hover:bg-slate-50 transition-all">
                  <td className="px-6 py-4 text-sm text-slate-500">{review.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-800">{review.student_name}</td>
                  <td className="px-6 py-4 text-slate-600 capitalize">{review.meal_type}</td>
                  <td className="px-6 py-4">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < review.overall_rating ? "currentColor" : "none"} />
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-sm italic">"{review.comment}"</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                      review.waste_level === 'none' ? 'bg-emerald-100 text-emerald-600' : 
                      review.waste_level === 'little' ? 'bg-blue-100 text-blue-600' : 
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {review.waste_level}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </InchargeLayout>
  );
}
