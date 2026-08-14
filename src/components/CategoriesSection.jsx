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

  const preview = categories.slice(0, 20);

  return (
    <section className="py-10 bg-gradient-to-b from-slate-50/60 to-white border-t border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Categories</h2>
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
          <>
            {/* ── MOBILE: two independent swipe rows ── */}
            <div className="flex flex-col gap-3 sm:hidden overflow-hidden">
              {[preview.slice(0, 10), preview.slice(10, 20)].map((row, rowIdx) =>
                row.length === 0 ? null : (
                  <div
                    key={rowIdx}
                    className="overflow-x-auto scrollbar-hide -mx-4 px-4"
                  >
                    <div className="flex gap-3 pb-1">
                      {row.map((cat, i) => (
                        <motion.button
                          key={cat.id}
                          initial={{ opacity: 0, y: 14 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: (rowIdx * 10 + i) * 0.03 }}
                          whileHover={{ y: -4, scale: 1.03 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => navigate(`/categories/${cat.id}`)}
                          className="shrink-0 w-20 flex flex-col items-center gap-1.5 group cursor-pointer"
                        >
                          <div className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br ${getBg(cat.serviceType)} shadow-md group-hover:shadow-xl transition-shadow`}>
                            {cat.image ? (
                              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <LayoutGrid size={22} className="text-white/80" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                          <span className="text-[11px] font-black text-slate-700 text-center line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors w-full">
                            {cat.name}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            {/* ── DESKTOP: clean 10-col grid, 2 rows, no scroll ── */}
            <div className="hidden sm:grid sm:grid-cols-10 gap-x-2 gap-y-5">
              {preview.map((cat, i) => (
                <motion.button
                  key={cat.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.03 }}
                  whileHover={{ y: -4, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/categories/${cat.id}`)}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br ${getBg(cat.serviceType)} shadow-md group-hover:shadow-xl transition-shadow`}>
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <LayoutGrid size={22} className="text-white/80" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <span className="text-[11px] font-black text-slate-700 text-center line-clamp-2 leading-tight group-hover:text-orange-500 transition-colors w-full">
                    {cat.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
