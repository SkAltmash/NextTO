import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Clock, MapPin, ChevronRight, Loader2, AlertCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
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
      <div className="relative h-32 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
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
        <div className={`absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full ${restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
          }`}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-black text-slate-900 text-base line-clamp-1">{restaurant.name}</h3>
        {restaurant.address && (
          <p className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mt-1 line-clamp-1">
            <MapPin size={11} className="shrink-0 text-orange-400" /> {restaurant.address}
          </p>
        )}
        {restaurant.categories?.length > 0 && (
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {restaurant.categories.slice(0, 3).map((cat, i) => (
              <span key={i} className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-100">
                {cat}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
          <span className="flex items-center gap-1.5 text-slate-400 text-xs font-semibold">
            <Clock size={12} className="text-orange-400" />
            {restaurant.deliveryTime ?? 'N/A'}
          </span>
          <span className="text-orange-500 text-xs font-bold flex items-center gap-1">
            View product <ChevronRight size={13} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    getDocs(collection(db, 'restaurants'))
      .then((snap) => setRestaurants(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch((e) => { console.error(e); setError('Failed to load restaurants.'); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = restaurants.filter((r) =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.address?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-5">
        <h1 className="text-xl font-black text-slate-900">All Restaurants</h1>
        <p className="text-slate-400 text-xs font-semibold mt-0.5">
          {loading ? 'Loading…' : `${filtered.length} restaurant${filtered.length !== 1 ? 's' : ''}`}
        </p>

        {/* Search */}
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search restaurants…"
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
            <p className="text-slate-400 font-semibold text-sm">Loading restaurants…</p>
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
              {search ? `No restaurants matching "${search}"` : 'No restaurants added yet.'}
            </p>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
