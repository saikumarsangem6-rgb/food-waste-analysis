import React from 'react';
import { motion } from 'motion/react';
import { 
  ChevronLeft, MessageCircle, Phone, Mail, 
  FileText, HelpCircle, ExternalLink 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HelpPage() {
  const navigate = useNavigate();

  const faqs = [
    { q: "How do I report excessive waste?", a: "You can use the 'Rate This Meal' button on the home screen and select 'A Lot' in the waste section." },
    { q: "Can I change my review?", a: "Currently, reviews are final once submitted to ensure data integrity for waste analytics." },
    { q: "Who can see my feedback?", a: "Your feedback is visible to the Hostel Incharge and mess staff to help them improve food quality." },
    { q: "How is waste calculated?", a: "We compare the total food prepared with the weight of the leftovers collected at the end of each meal." }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold">Help & Support</h1>
      </header>

      <main className="p-6 space-y-8 max-w-2xl mx-auto">
        {/* Contact Options */}
        <div className="grid grid-cols-2 gap-4">
          <ContactCard 
            icon={<MessageCircle className="text-emerald-600" />} 
            label="Live Chat" 
            sub="Avg. response 5m"
          />
          <ContactCard 
            icon={<Phone className="text-blue-600" />} 
            label="Call Mess" 
            sub="Available 7am-9pm"
          />
        </div>

        {/* FAQs */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle size={20} className="text-emerald-600" />
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm"
              >
                <h3 className="font-bold text-slate-800 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Resources */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800">Resources</h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
            <ResourceLink icon={<FileText size={18} />} label="Mess Rules & Regulations" />
            <ResourceLink icon={<Mail size={18} />} label="Email Incharge" />
            <ResourceLink icon={<ExternalLink size={18} />} label="Waste Reduction Tips" />
          </div>
        </section>
      </main>
    </div>
  );
}

function ContactCard({ icon, label, sub }: any) {
  return (
    <button className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-left hover:border-emerald-500 transition-all group">
      <div className="p-3 bg-slate-50 rounded-2xl w-fit mb-4 group-hover:bg-emerald-50 transition-all">
        {icon}
      </div>
      <p className="font-bold text-slate-800">{label}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </button>
  );
}

function ResourceLink({ icon, label }: any) {
  return (
    <button className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
      <div className="flex items-center gap-3 text-slate-700 font-medium">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>
      <ChevronLeft size={18} className="rotate-180 text-slate-300" />
    </button>
  );
}
