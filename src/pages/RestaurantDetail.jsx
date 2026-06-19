import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, Phone, MapPin, UtensilsCrossed,
  Loader2, AlertCircle, ShoppingCart, Plus, Minus, Star,
  CheckCircle2, PauseCircle, Lock
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCategories, getCategoryName } from '../hooks/useCategories';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';

/* ── Restaurant type helpers ── */
const TYPE_META = {
  medicine:   { emoji: '💊', label: 'Medicine',   cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  shop:       { emoji: '🛒', label: 'Shop',       cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  restaurant: { emoji: '🍽️', label: 'Restaurant', cls: 'bg-orange-50 text-orange-600 border-orange-100' },
};
const getTypeMeta = (type) => TYPE_META[type] ?? TYPE_META.restaurant;

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const [restaurant, setRestaurant] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const rSnap = await getDoc(doc(db, 'restaurants', id));
        if (!rSnap.exists()) { setError('Restaurant not found.'); return; }
        setRestaurant({ id: rSnap.id, ...rSnap.data() });

        // Fetch products belonging to this restaurant
        const pQuery = query(collection(db, 'products'), where('restaurantId', '==', id));
        const pSnap = await getDocs(pQuery);
        setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setError('Failed to load restaurant.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 size={36} className="text-orange-500 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 bg-white">
      <AlertCircle size={48} className="text-red-400" />
      <p className="text-slate-600 font-semibold text-center">{error}</p>
      <button onClick={() => navigate(-1)} className="text-orange-500 font-bold cursor-pointer">← Go back</button>
    </div>
  );

  const categoryIds = ['all', ...new Set(products.map((p) => p.categoryId).filter(Boolean))];
  const filtered = filterCat === 'all' ? products : products.filter((p) => p.categoryId === filterCat);

  return (
    <div className="min-h-screen bg-white pb-28 md:pb-12">
      <SEO
        title={`${restaurant?.name} — Menu & Delivery`}
        description={`Order from ${restaurant?.name} in Hinganghat on NextTo. ${restaurant?.address ? `Located at ${restaurant.address}.` : ''} Fast & premium delivery.`}
        canonical={`/restaurant/${id}`}
        image={restaurant?.banner || restaurant?.logo || undefined}
        type="restaurant"
        keywords={[restaurant?.name ?? '', 'Hinganghat restaurant', 'order food online']}
      />
      {/* Hero banner */}
      <div className="relative h-52 sm:h-64 bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden">
        {restaurant?.banner ? (
          <img src={restaurant.banner} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed size={72} className="text-orange-200" />
          </div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-700 hover:bg-white shadow-md cursor-pointer transition-all"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Open/closed badge */}
        <div className={`absolute top-4 right-4 text-xs font-black px-3 py-1.5 rounded-full backdrop-blur-sm ${restaurant?.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
          {restaurant?.isOpen ? '● Open Now' : '● Closed'}
        </div>

        {/* Restaurant name on banner */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg">{restaurant?.name}</h1>
        </div>
      </div>

      {/* Closed banner */}
      {restaurant?.isOpen === false && (
        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-rose-600">
          {/* subtle pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '8px 8px' }} />
          <div className="relative max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shrink-0">
              <Lock size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-white text-sm tracking-wide">Restaurant is Currently Closed</p>
              <p className="text-red-100 text-xs font-semibold mt-0.5 leading-relaxed">
                Ordering is disabled right now. We'll be back — check again soon!
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-1.5 bg-white/15 border border-white/25 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-200 animate-pulse" />
              <span className="text-white text-[10px] font-black uppercase tracking-wider">Closed</span>
            </div>
          </div>
        </div>
      )}

      {/* Info bar */}
      <div className="bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap gap-4 text-sm text-slate-500 font-semibold">
          {restaurant?.address && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-orange-400" /> {restaurant.address}
            </span>
          )}
          {restaurant?.deliveryTime && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-orange-400" /> {restaurant.deliveryTime}
            </span>
          )}
          {/* Restaurant type badge */}
          {(() => { const m = getTypeMeta(restaurant?.restaurantType); return (
            <span className={`flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full border ${m.cls}`}>
              {m.emoji} {m.label}
            </span>
          ); })()}
        </div>

        {/* Category chips */}
        {restaurant?.categories?.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
            {restaurant.categories.map((cat, i) => (
              <span key={i} className="bg-orange-50 text-orange-600 border border-orange-100 text-[11px] font-bold px-3 py-1 rounded-full">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Product category filter */}
        {categoryIds.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {categoryIds.map((catId) => (
              <button
                key={catId}
                onClick={() => setFilterCat(catId)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer
                  ${filterCat === catId
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
                  }`}
              >
                {catId === 'all' ? 'All Items' : getCategoryName(categories, catId)}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <UtensilsCrossed size={48} className="text-slate-300" />
            <p className="text-slate-400 font-semibold">No product items found.</p>
          </div>
        ) : (
          <>
            <h2 className="font-black text-slate-900 text-lg mb-4">
              Menu — {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} isRestaurantClosed={restaurant?.isOpen === false} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
