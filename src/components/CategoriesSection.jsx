import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutGrid, ArrowRight } from 'lucide-react';

const SERVICE_COLORS = {
  food:     'from-orange-400 to-amber-500',
  medicine: 'from-blue-400 to-cyan-500',
  grocery:  'from-emerald-400 to-teal-500',
};
const getBg = (st) => SERVICE_COLORS[st] ?? 'from-slate-400 to-slate-500';

export default function CategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    getDocs(q)
      .then((snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && categories.length === 0) return null;

  const preview = categories.slice(0, 5);

  return (
    <section className="py-10 bg-gradient-to-b from-slate-50/60 to-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <LayoutGrid size={18} className="text-orange-500" />
              <h2 className="text-xl font-black text-slate-900">Categories</h2>
            </div>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">Browse by what you're craving</p>
          </div>
          <button
            onClick={() => navigate('/categories')}
            className="flex items-center gap-1 text-orange-500 font-bold text-sm cursor-pointer hover:text-orange-600 transition-colors shrink-0"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-orange-400 animate-spin" />
          </div>
        ) : (
          /* Horizontal scroll on mobile, 5-col grid on desktop */
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 sm:grid sm:grid-cols-5 sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
            {preview.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.06 }}
                whileHover={{ y: -4, scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/categories/${cat.id}`)}
                className="shrink-0 w-28 sm:w-auto flex flex-col items-center gap-2 group cursor-pointer"
              >
                {/* Image circle */}
                <div className={`relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br ${getBg(cat.serviceType)} shadow-lg group-hover:shadow-xl transition-shadow`}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LayoutGrid size={28} className="text-white/80" />
                    </div>
                  )}
                  {/* shimmer overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <span className="text-xs font-black text-slate-700 text-center line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors">
                  {cat.name}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
