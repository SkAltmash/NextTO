import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where, limit, startAfter, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, Phone, MapPin, UtensilsCrossed,
  Loader2, AlertCircle, ShoppingCart, Plus, Minus, Star,
  CheckCircle2, PauseCircle, Lock, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCategories, getCategoryName } from '../hooks/useCategories';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';

/* ── Restaurant type helpers ── */
const TYPE_META = {
  medicine: { emoji: '💊', label: 'Medicine', cls: 'bg-blue-50 text-blue-600 border-blue-100' },
  shop: { emoji: '🛒', label: 'Shop', cls: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [bannerSlide, setBannerSlide] = useState(0);
  const [slideDir, setSlideDir] = useState(1);
  const [lastDoc, setLastDoc] = useState(null);   // Firestore cursor
  const [hasMore, setHasMore] = useState(false);  // whether more products exist

  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setProducts([]);
      setLastDoc(null);
      setHasMore(false);
      try {
        const rSnap = await getDoc(doc(db, 'restaurants', id));
        if (!rSnap.exists()) { setError('Restaurant not found.'); return; }
        setRestaurant({ id: rSnap.id, ...rSnap.data() });

        // First page — limit to PAGE_SIZE
        const pQuery = query(
          collection(db, 'products'),
          where('restaurantId', '==', id),
          limit(PAGE_SIZE),
        );
        const pSnap = await getDocs(pQuery);
        setProducts(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLastDoc(pSnap.docs[pSnap.docs.length - 1] ?? null);
        setHasMore(pSnap.docs.length === PAGE_SIZE);
      } catch (e) {
        console.error(e);
        setError('Failed to load restaurant.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  /* ── Load next page ── */
  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const pQuery = query(
        collection(db, 'products'),
        where('restaurantId', '==', id),
        startAfter(lastDoc),
        limit(PAGE_SIZE),
      );
      const pSnap = await getDocs(pQuery);
      setProducts((prev) => [...prev, ...pSnap.docs.map((d) => ({ id: d.id, ...d.data() }))]);
      setLastDoc(pSnap.docs[pSnap.docs.length - 1] ?? lastDoc);
      setHasMore(pSnap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  /* ── Banners: prefer array field, fallback to single banner string ──
     Must be derived BEFORE early returns so the useEffect below is always called */
  const banners = (
    Array.isArray(restaurant?.banners) && restaurant.banners.length > 0
      ? restaurant.banners
      : restaurant?.banner
        ? [restaurant.banner]
        : []
  );
  const hasBanners = banners.length > 0;

  const goSlide = (dir) => {
    setSlideDir(dir);
    setBannerSlide((prev) => (prev + dir + Math.max(banners.length, 1)) % Math.max(banners.length, 1));
  };

  /* Auto-advance every 4s — hook must be before any early returns */
  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => {
      setBannerSlide((prev) => (prev + 1) % banners.length);
      setSlideDir(1);
    }, 4000);
    return () => clearInterval(t);
  }, [banners.length]);

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
      {/* ── Banner Carousel (1600×600 ≅ 8:3 aspect ratio) ── */}
      <div className="relative w-full bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden"
        style={{ aspectRatio: '8/3' }}
      >
        {/* Slides */}
        <AnimatePresence initial={false} custom={slideDir}>
          {hasBanners ? (
            <motion.img
              key={bannerSlide}
              custom={slideDir}
              variants={{
                enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              src={banners[bannerSlide]}
              alt={`${restaurant?.name} banner ${bannerSlide + 1}`}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed size={72} className="text-orange-200" />
            </div>
          )}
        </AnimatePresence>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent pointer-events-none" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-700 hover:bg-white shadow-md cursor-pointer transition-all"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Open/closed badge */}
        <div className={`absolute top-4 right-4 z-10 text-xs font-black px-3 py-1.5 rounded-full backdrop-blur-sm ${restaurant?.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
          {restaurant?.isOpen ? '● Open Now' : '● Closed'}
        </div>

        {/* Prev / Next arrows — only when multiple banners */}
        {banners.length > 1 && (
          <>
            <button
              onClick={() => goSlide(-1)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white cursor-pointer transition-all"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => goSlide(1)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white cursor-pointer transition-all"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setSlideDir(i > bannerSlide ? 1 : -1); setBannerSlide(i); }}
                className={`rounded-full transition-all duration-300 cursor-pointer ${i === bannerSlide
                    ? 'w-5 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                  }`}
              />
            ))}
          </div>
        )}

        {/* Restaurant name */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
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

          {restaurant?.deliveryTime && (
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-orange-400" /> {restaurant.deliveryTime}
            </span>
          )}
          {/* Restaurant type badge */}
          {(() => {
            const m = getTypeMeta(restaurant?.restaurantType); return (
              <span className={`flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full border ${m.cls}`}>
                {m.emoji} {m.label}
              </span>
            );
          })()}
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
              Menu — {filtered.length}{hasMore ? '+' : ''} item{filtered.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} isRestaurantClosed={restaurant?.isOpen === false} />
              ))}
            </div>

            {/* Load More button — only shown when more products exist and no active category filter */}
            {hasMore && filterCat === 'all' && (
              <div className="mt-8 flex justify-center">
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="flex items-center gap-2.5 bg-white border-2 border-orange-400 text-orange-500 hover:bg-orange-50 disabled:opacity-60 px-8 py-3 rounded-2xl font-black text-sm shadow-md shadow-orange-200/40 transition-all cursor-pointer"
                >
                  {loadingMore
                    ? <><Loader2 size={16} className="animate-spin" /><span>Loading…</span></>
                    : <><span>Load More Products</span><span className="text-xs font-semibold text-orange-400">(+{PAGE_SIZE})</span></>
                  }
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
