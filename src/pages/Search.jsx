import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, X, Flame, UtensilsCrossed,
  Clock, MapPin, ChevronRight, Loader2, Plus, Minus, CheckCircle2, Package, MessageSquare, Heart, LayoutGrid, PauseCircle, Info
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query as fsQuery, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

const POPULAR = ['Biryani', 'Pizza', 'Burger', 'Momos', 'Grocery', 'Medicine'];
const MIN_CHARS = 4;
const DEBOUNCE_MS = 600;

/* ─── debounce hook ─── */
function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

/* ─── highlight matching words ─── */
function HighlightText({ text, searchWords, className }) {
  if (!searchWords.length || !text) return <span className={className}>{text}</span>;
  const escaped = searchWords.filter(w => w.length >= 2).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!escaped.length) return <span className={className}>{text}</span>;
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        const isMatch = escaped.some(e => part.toLowerCase() === e.toLowerCase());
        return isMatch
          ? <mark key={i} className="bg-orange-100 text-orange-600 font-black rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </span>
  );
}

/* ─── product result card ─── */
function ProductResult({ product, searchWords }) {
  const { addToCart, cart, updateQty, toggleFavorite, isFavorite, isOnline } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const cartItem = cart.find((i) => i.id === product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    const cartRestaurantId = cart.length > 0 ? cart[0]?.restaurantId ?? null : null;
    const isCrossRestaurant =
      product.restaurantId &&
      cartRestaurantId &&
      product.restaurantId !== cartRestaurantId;
    addToCart(product);
    if (!isCrossRestaurant) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1400);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="relative shrink-0">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center">
            <Package size={20} className="text-orange-300" />
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product);
          }}
          className="absolute -bottom-1 -right-1 w-5.5 h-5.5 rounded-lg bg-white shadow-sm border border-slate-100 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
        >
          <Heart
            size={10}
            className={`transition-colors ${isFavorite(product.id) ? 'fill-red-500 text-red-500' : 'text-slate-400 hover:text-red-500'
              }`}
          />
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-900 text-sm truncate flex items-center gap-1.5 flex-wrap">
          <HighlightText text={product.name} searchWords={searchWords} />
          {product.serviceType && (
            <span className={`inline-block border text-[10px] font-black px-2 py-0.5 rounded-full capitalize ${product.serviceType.toLowerCase() === 'food' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                product.serviceType.toLowerCase() === 'grocery' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  product.serviceType.toLowerCase() === 'medicine' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    'bg-purple-50 text-purple-600 border-purple-100'
              }`}>
              in {product.serviceType}
            </span>
          )}
        </p>
        <p className="text-slate-400 text-xs line-clamp-1 font-medium mt-0.5">
          <HighlightText text={product.description} searchWords={searchWords} />
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-orange-500 font-black text-sm">₹{product.discountPrice ?? product.price}</span>
          {product.discountPrice && product.price && (
            <span className="text-slate-400 text-xs line-through">₹{product.price}</span>
          )}
          {product.preparationTime && (
            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
              <Clock size={10} /> {product.preparationTime}
            </span>
          )}
        </div>
      </div>
      {product.isAvailable !== false && (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          {!isOnline ? (
            <div className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed" title="Store paused">
              <PauseCircle size={14} />
            </div>
          ) : cartItem ? (
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty - 1); }}
                className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
                <Minus size={11} />
              </button>
              <span className="font-black text-slate-800 text-xs w-5 text-center">{cartItem.qty}</span>
              <button onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty + 1); }}
                className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all cursor-pointer">
                <Plus size={11} />
              </button>
            </div>
          ) : (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleAdd}
              className={`p-2 rounded-xl text-white cursor-pointer transition-colors ${added ? 'bg-emerald-500' : 'bg-orange-500 hover:bg-orange-600'}`}>
              {added ? <CheckCircle2 size={14} /> : <Plus size={14} />}
            </motion.button>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ─── category result card ─── */
const CAT_GRADIENT = {
  food: 'from-orange-400 to-amber-500',
  medicine: 'from-blue-400 to-cyan-500',
  grocery: 'from-emerald-400 to-teal-500',
};
function CategoryResult({ category, searchWords }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/categories/${category.id}`)}
    >
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${CAT_GRADIENT[category.serviceType] ?? 'from-slate-400 to-slate-500'} overflow-hidden shrink-0 flex items-center justify-center`}>
        {category.image
          ? <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
          : <LayoutGrid size={22} className="text-white/80" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-900 text-sm truncate">
          <HighlightText text={category.name} searchWords={searchWords} />
        </p>
        {category.serviceType && (
          <span className="text-[10px] font-black text-slate-400 capitalize">{category.serviceType}</span>
        )}
      </div>
      <ChevronRight size={16} className="text-slate-300 shrink-0" />
    </motion.div>
  );
}

function RestaurantResult({ restaurant, searchWords }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/restaurant/${restaurant.id}`)}
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden shrink-0">
        {restaurant.banner
          ? <img src={restaurant.banner} alt={restaurant.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={20} className="text-orange-300" /></div>
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-slate-900 text-sm truncate">
          <HighlightText text={restaurant.name} searchWords={searchWords} />
        </p>

        <div className="flex items-center gap-1.5 mt-1">
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${restaurant.isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
            {restaurant.isOpen ? 'Open' : 'Closed'}
          </span>
          {restaurant.deliveryTime && (
            <span className="flex items-center gap-1 text-slate-400 text-[11px]">
              <Clock size={10} /> {restaurant.deliveryTime}
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-slate-300 shrink-0" />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN SEARCH PAGE
═══════════════════════════════════════════ */
export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [queryText, setQueryText] = useState(searchParams.get('q') ?? '');
  const debounced = useDebounce(queryText, DEBOUNCE_MS);
  const [products, setProducts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  // Only restaurants & categories are bulk-fetched (small collections)
  const [restData, setRestData] = useState([]);
  const [catData, setCatData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  /* load restaurants & categories once (small collections) */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [rSnap, cSnap] = await Promise.all([
          getDocs(collection(db, 'restaurants')),
          getDocs(collection(db, 'categories')),
        ]);
        setRestData(rSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setCatData(cSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setFetched(true);
      }
    };
    load();
    inputRef.current?.focus();
  }, []);

  /* search when debounced query changes */
  useEffect(() => {
    const q = debounced.trim().toLowerCase();

    if (!q || q.length < MIN_CHARS) {
      setProducts([]);
      setRestaurants([]);
      setCategories([]);
      setSearched(false);
      if (q) setSearchParams({}, { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);

    const searchWords = q.split(/\s+/).filter(w => w.length >= 1);

    // Products: use array-contains on searchKeywords (cheap — only matching docs fetched)
    const productPromises = searchWords.map(w =>
      getDocs(fsQuery(collection(db, 'products'), where('searchKeywords', 'array-contains', w), limit(30)))
        .then(s => s.docs.map(d => ({ id: d.id, ...d.data() })))
        .catch(() => [])
    );

    Promise.all(productPromises).then(results => {
      if (cancelled) return;

      // Deduplicate products
      const seen = new Set();
      const dedupedProducts = [];
      results.flat().forEach(p => {
        if (!seen.has(p.id) && p.isAvailable !== false) {
          seen.add(p.id);
          dedupedProducts.push(p);
        }
      });

      // Filter restaurants & categories client-side (already in memory)
      const filteredRest = restData.filter((r) =>
        searchWords.some(w =>
          r.name?.toLowerCase().includes(w) ||
          r.address?.toLowerCase().includes(w) ||
          r.categories?.some((c) => c.toLowerCase().includes(w))
        )
      );
      const filteredCat = catData.filter((c) =>
        searchWords.some(w =>
          c.name?.toLowerCase().includes(w) ||
          c.serviceType?.toLowerCase().includes(w)
        )
      );

      setProducts(dedupedProducts);
      setRestaurants(filteredRest);
      setCategories(filteredCat);
      setSearched(true);
      setLoading(false);
      setSearchParams(q ? { q } : {}, { replace: true });
    });

    return () => { cancelled = true; };
  }, [debounced, restData, catData]);

  const activeSearchWords = useMemo(
    () => queryText.trim().toLowerCase().split(/\s+/).filter(w => w.length >= 2),
    [queryText]
  );

  const hasResults = products.length > 0 || restaurants.length > 0 || categories.length > 0;
  const isSearching = queryText.trim().length > 0;
  const tooShort = queryText.trim().length > 0 && queryText.trim().length < MIN_CHARS && !loading && !hasResults;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      {/* Search header */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 pt-5 pb-4 sticky top-14 md:top-16 z-40">
        <div className="max-w-2xl mx-auto">
          <div className="relative flex items-center bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-400/20 transition-all">
            <SearchIcon size={17} className="absolute left-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search food, restaurants, grocery…"
              className="w-full pl-11 pr-10 py-3.5 bg-transparent text-slate-800 font-semibold text-sm placeholder-slate-400 outline-none"
            />
            <AnimatePresence>
              {queryText && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setQueryText('')}
                  className="absolute right-3 p-1.5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-colors cursor-pointer"
                >
                  <X size={12} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Loading data */}
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 size={28} className="text-orange-400 animate-spin" />
          </div>
        )}

        {/* Initial state — no query */}
        {!loading && !isSearching && fetched && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 pt-2">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame size={16} className="text-orange-500" />
                <h2 className="font-bold text-slate-700 text-xs uppercase tracking-wider">Popular searches</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((item) => (
                  <button
                    key={item}
                    onClick={() => setQueryText(item)}
                    className="bg-white border border-slate-200 hover:border-orange-300 hover:bg-orange-50 text-slate-600 hover:text-orange-600 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Type more hint */}
        {tooShort && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mt-2"
          >
            <Info size={18} className="text-orange-500 shrink-0" />
            <p className="text-sm font-semibold text-orange-800 flex-1">
              Type at least <span className="font-black">4 characters</span> to search
            </p>
            <span className="text-xs font-black text-orange-500">{queryText.trim().length}/{MIN_CHARS}</span>
          </motion.div>
        )}

        {/* No results */}
        {!loading && searched && isSearching && queryText.trim().length >= MIN_CHARS && !hasResults && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-12 px-6 gap-6 text-center bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/30 max-w-md mx-auto mt-6"
          >
            <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center text-orange-500">
              <SearchIcon size={28} />
            </div>
            <div className="space-y-2">
              <p className="font-black text-slate-800 text-lg">No results for "{queryText}"</p>
              <p className="text-slate-400 text-xs sm:text-sm font-semibold max-w-xs mx-auto">
                We couldn't find matches on our website, but we can still deliver it to you!
              </p>
            </div>

            <a
              href={`https://wa.me/917972081926?text=${encodeURIComponent(`Hello Food Express! I searched for "${queryText}" on your website but couldn't find it. Can I order this here?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all text-xs sm:text-sm cursor-pointer"
            >
              <MessageSquare size={16} /> Order "{queryText}" on WhatsApp
            </a>
          </motion.div>
        )}

        {/* Results */}
        {!loading && isSearching && hasResults && (
          <div className="space-y-6">
            {/* Categories */}
            {categories.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <LayoutGrid size={13} className="text-slate-400" />
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Categories ({categories.length})</p>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {categories.map((c) => <CategoryResult key={c.id} category={c} searchWords={activeSearchWords} />)}
                </div>
              </div>
            )}

            {/* Products */}
            {products.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Items ({products.length})
                </p>
                <div className="space-y-2.5">
                  {products.map((p) => <ProductResult key={p.id} product={p} searchWords={activeSearchWords} />)}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {restaurants.length > 0 && (
              <div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                  Restaurants ({restaurants.length})
                </p>
                <div className="space-y-2.5">
                  {restaurants.map((r) => <RestaurantResult key={r.id} restaurant={r} searchWords={activeSearchWords} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
