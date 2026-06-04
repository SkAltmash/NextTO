import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, Clock, MapPin, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/* ── Type helpers ── */
const TYPE_META = {
  medicine:   { emoji: '💊', label: 'Medicine',   badge: 'bg-blue-50 text-blue-600 border-blue-100' },
  shop:       { emoji: '🛒', label: 'Shop',       badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  restaurant: { emoji: '🍽️', label: 'Restaurant', badge: 'bg-orange-50 text-orange-600 border-orange-100' },
};
const getTypeMeta = (type) => TYPE_META[type] ?? TYPE_META.restaurant;

/* ─── single restaurant card ─── */
function RestaurantCard({ restaurant }) {
  const navigate = useNavigate();
  const meta = getTypeMeta(restaurant.restaurantType);

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
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {restaurant.logo
              ? <img src={restaurant.logo} alt="" className="w-12 h-12 object-contain" />
              : <UtensilsCrossed size={28} className="text-orange-300" />
            }
          </div>
        )}
        {/* open/closed badge */}
        <div className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full ${
          restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white'
        }`}>
          {restaurant.isOpen ? 'Open' : 'Closed'}
        </div>
        {/* type badge */}
        <div className={`absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded-full border ${meta.badge}`}>
          {meta.emoji} {meta.label}
        </div>
      </div>

      <div className="p-3">
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
          <span className="text-orange-500 text-[11px] font-bold flex items-center gap-0.5">
            Menu <ChevronRight size={11} />
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
  const navigate = useNavigate();

  useEffect(() => {
    getDocs(collection(db, 'restaurants'))
      .then((snap) => setRestaurants(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!loading && restaurants.length === 0) return null;

  return (
    <section className="py-10 bg-white border-t border-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-black text-slate-900">Stores</h2>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">Order directly from your favourite places</p>
          </div>
          <button
            onClick={() => navigate('/restaurants')}
            className="flex items-center gap-1 text-orange-500 font-bold text-sm cursor-pointer hover:text-orange-600 transition-colors shrink-0"
          >
            View All <ArrowRight size={14} />
          </button>
        </div>

        {/* Horizontal scroll row */}
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={26} className="text-orange-400 animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6">
            {restaurants.slice(0, 10).map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
