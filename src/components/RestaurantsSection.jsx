import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Clock, MapPin, ChevronRight, Loader2, ArrowRight, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/* ── Type helpers ── */
const TYPE_META = {
  cafe: { emoji: '☕', label: 'Cafe', badge: 'bg-rose-50 text-rose-600 border-rose-100' },
  medicine: { emoji: '💊', label: 'Medicine', badge: 'bg-blue-50 text-blue-600 border-blue-100' },
  shop: { emoji: '🛒', label: 'Shop', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  restaurant: { emoji: '🍽️', label: 'Restaurant', badge: 'bg-orange-50 text-orange-600 border-orange-100' },
};
const getTypeMeta = (type) => TYPE_META[type] ?? TYPE_META.restaurant;

const REST_TABS = [
  {
    id: 'cafe',
    label: 'Cafe',
    activeClass: 'bg-rose-500 text-white shadow-lg shadow-rose-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-rose-600 hover:bg-rose-50',
    viewAllClass: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    activeClass: 'bg-orange-500 text-white shadow-lg shadow-orange-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-orange-600 hover:bg-orange-50',
    viewAllClass: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25',
  },
  {
    id: 'medicine',
    label: 'Medicine',
    activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-blue-600 hover:bg-blue-50',
    viewAllClass: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25',
  },
  {
    id: 'shop',
    label: 'Shop',
    activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-emerald-600 hover:bg-emerald-50',
    viewAllClass: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25',
  },
];

/* ─── single restaurant card ─── */
function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const meta = getTypeMeta(restaurant.restaurantType);
  const isClosed = restaurant.isOpen === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-orange-100/30 overflow-hidden cursor-pointer group shrink-0 w-52 sm:w-56"
    >
      {/* Banner */}
      <div className="relative h-28 bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden">
        {restaurant.banner ? (
          <img
            src={restaurant.banner}
            alt={restaurant.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500
              ${isClosed ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${isClosed ? 'grayscale' : ''}`}>
            {restaurant.logo
              ? <img src={restaurant.logo} alt="" className="w-12 h-12 object-contain" />
              : <UtensilsCrossed size={28} className="text-orange-300" />
            }
          </div>
        )}

        {/* open/closed badge */}
        <div className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full ${restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'}`}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </div>
        {/* type badge */}
        <div className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full border ${meta.badge}`}>
          {meta.emoji} {meta.label}
        </div>

        {/* Closed overlay */}
        {isClosed && (
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-800/30 to-transparent flex items-end justify-center pb-3">
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-slate-700 text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg border border-white/60 uppercase tracking-widest">
              <Lock size={9} />
              Currently Closed
            </div>
          </div>
        )}
      </div>

      <div className={`p-3 ${isClosed ? 'opacity-60' : ''}`}>
        <h3 className="font-black text-slate-900 text-sm line-clamp-1">{restaurant.name}</h3>
        {restaurant.address && (
          <p className="flex items-center gap-1 text-slate-400 text-[11px] font-medium mt-0.5 line-clamp-1">
            <MapPin size={9} className="shrink-0" /> {restaurant.address}
          </p>
        )}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-50">
          <span className="flex items-center gap-1 text-slate-400 text-[11px] font-semibold">
            <Clock size={10} className="text-orange-400" />
            {restaurant.deliveryTime ?? 'N/A'}
          </span>
          <span className={`text-[11px] font-bold flex items-center gap-0.5 ${isClosed ? 'text-slate-400' : 'text-orange-500'}`}>
            {isClosed ? 'View menu' : 'Menu'} <ChevronRight size={11} />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   SECTION COMPONENT (for Home page)
 ═══════════════════════════════════════════ */
export function RestaurantsSection() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('cafe');
  const navigate = useNavigate();

  useEffect(() => {
    getDocs(collection(db, 'restaurants'))
      .then((snap) => setRestaurants(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && restaurants.length === 0) return null;

  const currentTab = REST_TABS.find((t) => t.id === activeTab);

  const filtered = restaurants.filter((r) => {
    const rType = r.restaurantType || 'restaurant';
    return rType === activeTab;
  });

  return (
    <section className="py-10 bg-white border-t border-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Stores</h2>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">Order directly from your favourite places</p>
          </div>
        </div>

        {/* Tab strip — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6 -mx-4 px-4 sm:-mx-6 sm:px-6">
          {REST_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all cursor-pointer shrink-0 ${activeTab === tab.id ? tab.activeClass : tab.idleClass
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Horizontal scroll row */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={26} className="text-orange-400 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
              <UtensilsCrossed size={20} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-semibold text-xs">
              No Stores in this category yet.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
              {filtered.slice(0, 10).map((r) => (
                <RestaurantCard key={r.id} restaurant={r} />
              ))}
            </div>

            {/* View All */}
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/restaurants?tab=${activeTab}`)}
                className={`flex items-center gap-2 text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all cursor-pointer ${currentTab?.viewAllClass}`}
              >
                View All {currentTab?.label}
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
