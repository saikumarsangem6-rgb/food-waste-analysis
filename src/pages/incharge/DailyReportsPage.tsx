import React, { useEffect, useState } from 'react';
import { Trash2, Download } from 'lucide-react';
import InchargeLayout from '../../layouts/InchargeLayout';

export default function DailyReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/daily')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setLoading(false);
      });
  }, []);

  return (
    <InchargeLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Waste Reports</h2>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:bg-emerald-700 transition-all">
          <Download size={18} /> Export PDF
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Meal</th>
                <th className="px-6 py-4 font-medium">Food Item</th>
                <th className="px-6 py-4 font-medium text-right">Served (kg)</th>
                <th className="px-6 py-4 font-medium text-right">Wasted (kg)</th>
                <th className="px-6 py-4 font-medium text-right">Waste %</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400">Loading reports...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400">No reports found.</td></tr>
              ) : reports.map((report) => {
                const wastePct = (report.wasted_kg / report.served_kg) * 100;
                return (
                  <tr key={report.id} className="hover:bg-slate-50 transition-all">
                    <td className="px-6 py-4 text-sm text-slate-500">{report.date}</td>
                    <td className="px-6 py-4 text-slate-600 capitalize">{report.meal_type}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{report.food_name}</td>
                    <td className="px-6 py-4 text-right">{report.served_kg.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right text-red-500 font-medium">{report.wasted_kg.toFixed(1)}</td>
                    <td className="px-6 py-4 text-right font-bold">{wastePct.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                        wastePct < 10 ? 'bg-emerald-100 text-emerald-600' : 
                        wastePct < 30 ? 'bg-amber-100 text-amber-600' : 
                        'bg-red-100 text-red-600'
                      }`}>
                        {wastePct < 10 ? 'Good' : wastePct < 30 ? 'Average' : 'High Waste'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </InchargeLayout>
  );
}
