import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Loader2, LayoutGrid, AlertCircle, Search } from 'lucide-react';

const SERVICE_COLORS = {
  food:     'from-orange-400 to-amber-500',
  medicine: 'from-blue-400 to-cyan-500',
  grocery:  'from-emerald-400 to-teal-500',
};
const getBg = (st) => SERVICE_COLORS[st] ?? 'from-slate-400 to-slate-500';

const SERVICE_BADGE = {
  food:     'bg-orange-50 text-orange-600 border-orange-100',
  medicine: 'bg-blue-50 text-blue-600 border-blue-100',
  grocery:  'bg-emerald-50 text-emerald-600 border-emerald-100',
};
const getBadge = (st) => SERVICE_BADGE[st] ?? 'bg-slate-50 text-slate-600 border-slate-100';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    getDocs(q)
      .then((snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((e) => { console.error(e); setError('Failed to load categories.'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = categories.filter((c) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.serviceType?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-5">
        <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <LayoutGrid size={20} className="text-orange-500" /> All Categories
        </h1>
        <p className="text-slate-400 text-xs font-semibold mt-0.5">
          {loading ? 'Loading…' : `${filtered.length} categor${filtered.length !== 1 ? 'ies' : 'y'}`}
        </p>

        {/* Search */}
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
          />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 bg-orange-50 rounded-3xl flex items-center justify-center">
              <Loader2 size={28} className="text-orange-500 animate-spin" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">Loading categories…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 bg-red-50 rounded-3xl flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-slate-600 font-semibold text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center">
              <LayoutGrid size={28} className="text-orange-300" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">
              {search ? `No categories matching "${search}"` : 'No categories yet.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {filtered.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.22, delay: i * 0.04 }}
                onClick={() => navigate(`/categories/${cat.id}`)}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/30 overflow-hidden cursor-pointer group"
              >
                {/* Image */}
                <div className={`relative h-32 bg-gradient-to-br ${getBg(cat.serviceType)} overflow-hidden`}>
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LayoutGrid size={36} className="text-white/70" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {/* Service type badge */}
                  {cat.serviceType && (
                    <span className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full border ${getBadge(cat.serviceType)} bg-white/90`}>
                      {cat.serviceType}
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <h3 className="font-black text-slate-900 text-sm line-clamp-1 group-hover:text-orange-500 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-orange-500 text-[11px] font-bold mt-1 flex items-center gap-0.5">
                    Browse items →
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
