import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed, Clock, MapPin, ChevronRight,
  Loader2, AlertCircle, Search, Pill, ShoppingBag,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/* ── Type helpers ── */
const TYPE_META = {
  medicine: { emoji: '💊', label: 'Medicine', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
  shop:     { emoji: '🛒', label: 'Shop',     badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  restaurant: { emoji: '🍽️', label: 'Restaurant', badge: 'bg-orange-50 text-orange-600 border-orange-100' },
};

const getTypeMeta = (type) => TYPE_META[type] ?? TYPE_META.restaurant;

/* ── Filter tabs ── */
const FILTERS = [
  { label: 'All',        value: 'all',        icon: null },
  { label: 'Restaurant', value: 'restaurant', icon: null },
  { label: 'Medicine',   value: 'medicine',   icon: null },
  { label: 'Shop',       value: 'shop',       icon: null },
];

/* ── Restaurant Card ── */
function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const meta = getTypeMeta(restaurant.restaurantType);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/30 overflow-hidden cursor-pointer group"
    >
      {/* Banner */}
      <div className="relative h-24 sm:h-32 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
        {restaurant.banner ? (
          <img src={restaurant.banner} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {restaurant.logo
              ? <img src={restaurant.logo} alt="" className="w-14 h-14 object-contain" />
              : <UtensilsCrossed size={32} className="text-orange-300" />
            }
          </div>
        )}
        {/* Open/Closed */}
        <div className={`absolute top-3 right-3 text-[9px] sm:text-[10px] font-black px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full ${
          restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
        }`}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </div>
        {/* Type badge */}
        <div className={`absolute top-3 left-3 text-[9px] sm:text-[10px] font-black px-2 py-0.5 rounded-full border ${meta.badge}`}>
          {meta.emoji} {meta.label}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className="font-black text-slate-900 text-sm sm:text-base line-clamp-1">{restaurant.name}</h3>
        {restaurant.address && (
          <p className="flex items-center gap-1 text-slate-400 text-[10px] sm:text-xs font-medium mt-1 line-clamp-1">
            <MapPin size={10} className="shrink-0 text-orange-400" /> {restaurant.address}
          </p>
        )}
        {restaurant.categories?.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {restaurant.categories.slice(0, 2).map((cat, i) => (
              <span key={i} className="bg-orange-50 text-orange-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-orange-100 truncate max-w-[80px]">
                {cat}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
          <span className="flex items-center gap-1 text-slate-400 text-[10px] sm:text-xs font-semibold">
            <Clock size={11} className="text-orange-400" />
            {restaurant.deliveryTime ?? 'N/A'}
          </span>
          <span className="text-orange-500 text-[10px] sm:text-xs font-bold flex items-center gap-0.5">
            <span className="hidden sm:inline">View Menu</span>
            <span className="sm:hidden">Menu</span>
            <ChevronRight size={12} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main page ── */
export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'all';
  const typeFilter = FILTERS.some((f) => f.value === tabParam) ? tabParam : 'all';

  const setTypeFilter = (val) => {
    setSearchParams(val === 'all' ? {} : { tab: val }, { replace: true });
  };

  useEffect(() => {
    getDocs(collection(db, 'restaurants'))
      .then((snap) => setRestaurants(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((e) => { console.error(e); setError('Failed to load restaurants.'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter((r) => {
    const matchSearch =
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.address?.toLowerCase().includes(search.toLowerCase());
    const effectiveType = r.restaurantType ?? 'restaurant';
    const matchType = typeFilter === 'all' || effectiveType === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-5">
        <h1 className="text-xl font-black text-slate-900">All Stores</h1>
        <p className="text-slate-400 text-xs font-semibold mt-0.5">
          {loading ? 'Loading…' : `${filtered.length} store${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Search */}
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stores…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
          />
        </div>

        {/* Type filter tabs */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap shrink-0 transition-all cursor-pointer border ${
                typeFilter === f.value
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-orange-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 bg-orange-50 rounded-3xl flex items-center justify-center">
              <Loader2 size={28} className="text-orange-500 animate-spin" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">Loading stores…</p>
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
              <UtensilsCrossed size={28} className="text-orange-300" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">
              {search || typeFilter !== 'all'
                ? 'No stores match your filters.'
                : 'No stores added yet.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={typeFilter + search}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
            >
              {filtered.map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
