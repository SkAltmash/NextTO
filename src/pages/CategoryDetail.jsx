import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import {
  doc, getDoc, collection, query, where, getDocs, limit, startAfter, orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  ArrowLeft, LayoutGrid, Loader2, AlertCircle,
  Plus, Minus, CheckCircle2, UtensilsCrossed, Heart, Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PauseCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import SEO from '../components/SEO';

const PAGE_SIZE = 15;

/* ── Mini product card (same style as Product.jsx ProductCard) ── */
function ProductCard({ product }) {
  const { addToCart, cart, updateQty, pickupOrderData, toggleFavorite, isFavorite, isOnline } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const cartItem = cart.find((i) => i.id === product.id);
  const discount = product.price && product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null;

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const isSpecial = product.isSpecial === true || String(product.isSpecial) === 'true';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.28 }}
      className={`bg-white rounded-3xl border overflow-hidden cursor-pointer group transition-shadow relative ${isSpecial
          ? 'border-amber-300 shadow-sm hover:shadow-xl hover:shadow-amber-100/50'
          : 'border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/40'
        }`}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <UtensilsCrossed size={36} />
          </div>
        )}
        {discount && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow">
            {discount}% OFF
          </div>
        )}
        {isSpecial && (
          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-yellow-300/40">
            <Sparkles size={8} className="animate-pulse" /> SPECIAL
          </div>
        )}
        {/* Heart */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-white/90 hover:bg-white border border-slate-100/60 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 z-10"
        >
          <Heart size={13} className={`transition-all ${isFavorite(product.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 hover:text-red-500'}`} />
        </button>
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">Unavailable</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-1">{product.name}</h3>
        <p className="text-slate-400 text-xs mt-0.5 line-clamp-1 font-medium">{product.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-orange-500 font-black text-base">₹{product.discountPrice ?? product.price}</span>
            {product.discountPrice && product.price && (
              <span className="text-slate-400 text-xs font-semibold line-through ml-1">₹{product.price}</span>
            )}
          </div>
          {product.isAvailable !== false && (
            !isOnline ? (
              <div onClick={(e) => e.stopPropagation()} className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed" title="Store paused">
                <PauseCircle size={14} />
              </div>
            ) : pickupOrderData ? (
              <div onClick={(e) => e.stopPropagation()} className="p-2 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed">
                <UtensilsCrossed size={14} />
              </div>
            ) : cartItem ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty - 1); }} className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
                  <Minus size={10} />
                </button>
                <span className="font-black text-slate-800 text-xs w-4 text-center">{cartItem.qty}</span>
                <button onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty + 1); }} className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all cursor-pointer">
                  <Plus size={10} />
                </button>
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }} onClick={handleAdd}
                className={`p-2 rounded-xl shadow-md transition-colors cursor-pointer text-white ${added ? 'bg-emerald-500 shadow-emerald-400/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}>
                {added ? <CheckCircle2 size={14} /> : <Plus size={14} />}
              </motion.button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════
   CATEGORY DETAIL PAGE
══════════════════════════════════════════════════════ */
export default function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  /* fetch category metadata */
  useEffect(() => {
    getDoc(doc(db, 'categories', id))
      .then((snap) => {
        if (snap.exists()) setCategory({ id: snap.id, ...snap.data() });
        else setError('Category not found.');
      })
      .catch(() => setError('Failed to load category.'));
  }, [id]);

  /* fetch products */
  const fetchProducts = async (isLoadMore = false) => {
    if (isLoadMore) setLoadingMore(true);
    else { setLoading(true); setError(''); }

    try {
      const constraints = [
        where('categoryId', '==', id),
        orderBy('__name__'),
      ];
      if (isLoadMore && lastDoc) constraints.push(startAfter(lastDoc));
      constraints.push(limit(PAGE_SIZE));

      const snap = await getDocs(query(collection(db, 'products'), ...constraints));
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      if (isLoadMore) setProducts((prev) => [...prev, ...fetched]);
      else setProducts(fetched);

      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setError('Failed to load products.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setProducts([]);
    setLastDoc(null);
    setHasMore(true);
    fetchProducts(false);
  }, [id]);

  const SERVICE_GRADIENT = {
    food: 'from-orange-400 to-amber-500',
    medicine: 'from-blue-400 to-cyan-500',
    grocery: 'from-emerald-400 to-teal-500',
  };
  const headerGradient = SERVICE_GRADIENT[category?.serviceType] ?? 'from-slate-400 to-slate-600';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      <SEO
        title={category ? `${category.name} — Products in Hinganghat` : 'Category'}
        description={`Shop ${category?.name ?? 'products'} online in Hinganghat on NextTo. Fast delivery at your doorstep.`}
        canonical={`/categories/${id}`}
        image={category?.image || undefined}
        keywords={[category?.name ?? '', 'shop Hinganghat', category?.serviceType ?? '']}
      />
      {/* Hero header */}
      <div className={`relative h-44 sm:h-52 bg-gradient-to-br ${headerGradient} overflow-hidden`}>
        {category?.image && (
          <img src={category.image} alt={category.name} className="absolute inset-0 w-full h-full object-cover " />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Back btn */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center text-slate-700 hover:bg-white shadow-md cursor-pointer transition-all"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Title */}
        <div className="absolute bottom-5 left-5 right-5">
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid size={16} className="text-white/80" />
            <span className="text-white/70 text-xs font-bold uppercase tracking-widest">Category</span>
          </div>
          <h1 className="text-white font-black text-2xl sm:text-3xl drop-shadow-lg">
            {category?.name ?? '…'}
          </h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 bg-orange-50 rounded-3xl flex items-center justify-center">
              <Loader2 size={28} className="text-orange-500 animate-spin" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">Loading products…</p>
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

        {!loading && !error && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center">
              <UtensilsCrossed size={28} className="text-orange-300" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">No products in this category yet.</p>
          </div>
        )}

        {!loading && !error && products.length > 0 && (
          <>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">
              {products.length}+ item{products.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => fetchProducts(true)}
                  disabled={loadingMore}
                  className="bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-500 font-bold px-6 py-2.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loadingMore ? (
                    <><Loader2 size={16} className="animate-spin text-orange-500" /> Loading...</>
                  ) : 'Load More Items'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
