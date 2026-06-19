/**
 * ProductCard.jsx
 *
 * Single shared product card used across ALL pages.
 *
 * Validation handled internally:
 *   - product.isAvailable === false       → grayscale + "Out of Stock" overlay
 *   - restaurant.isOpen === false         → grayscale + "Closed" overlay  ← auto-resolved
 *   - isRestaurantClosed prop             → override (used by RestaurantDetail which already has the data)
 *   - isOnline === false                  → cart controls replaced with PauseCircle
 *   - pickupOrderData present             → cart controls replaced with Bike icon
 *
 * Restaurant status is resolved by fetching doc(restaurants/{restaurantId}) once
 * per unique restaurantId using a module-level cache — no duplicate reads.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus, Minus, CheckCircle2, UtensilsCrossed,
  Clock, Heart, Sparkles, PauseCircle, Bike,
  AlertCircle, Lock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/* ── Module-level restaurant status cache ──────────────────────────────
   Key:   restaurantId (string)
   Value: boolean — true = open, false = closed
   Shared across ALL mounted ProductCard instances.
   One Firestore read per restaurant per page load, regardless of how
   many products from that restaurant are rendered.
─────────────────────────────────────────────────────────────────────── */
const restaurantCache = new Map(); // restaurantId → boolean (isOpen)
const inFlight = new Map();        // restaurantId → Promise (deduplicate concurrent fetches)

async function getRestaurantIsOpen(restaurantId) {
  if (restaurantCache.has(restaurantId)) return restaurantCache.get(restaurantId);
  if (inFlight.has(restaurantId)) return inFlight.get(restaurantId);

  const promise = getDoc(doc(db, 'restaurants', restaurantId))
    .then((snap) => {
      const isOpen = snap.exists() ? snap.data().isOpen !== false : true;
      restaurantCache.set(restaurantId, isOpen);
      inFlight.delete(restaurantId);
      return isOpen;
    })
    .catch(() => {
      inFlight.delete(restaurantId);
      return true; // fail-open: don't block UI on network error
    });

  inFlight.set(restaurantId, promise);
  return promise;
}

export default function ProductCard({
  product,
  isRestaurantClosed = false, // explicit override (e.g. from RestaurantDetail which already has the data)
  showSpecialBadge = true,
}) {
  const {
    addToCart, cart, updateQty,
    pickupOrderData, toggleFavorite, isFavorite, isOnline,
  } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  /* ── Restaurant isOpen auto-resolution ─────────────────────────────── */
  const [restaurantOpen, setRestaurantOpen] = useState(true); // optimistic default

  useEffect(() => {
    const rid = product.restaurantId;
    if (!rid) return;           // no restaurantId on product — skip
    if (isRestaurantClosed) return; // parent already told us, no need to fetch

    // Already cached synchronously?
    if (restaurantCache.has(rid)) {
      setRestaurantOpen(restaurantCache.get(rid));
      return;
    }

    // Fetch (deduped via inFlight map)
    let cancelled = false;
    getRestaurantIsOpen(rid).then((isOpen) => {
      if (!cancelled) setRestaurantOpen(isOpen);
    });

    return () => { cancelled = true; };
  }, [product.restaurantId, isRestaurantClosed]);

  /* ── Derived flags ─────────────────────────────────────────────────── */
  const isProductUnavailable  = product.isAvailable === false;
  const isClosedByRestaurant  = isRestaurantClosed || !restaurantOpen;
  const isUnavailable         = isProductUnavailable || isClosedByRestaurant;

  const isSpecial =
    showSpecialBadge &&
    (product.isSpecial === true ||
      String(product.isSpecial) === 'true' ||
      product.categoryId === 'curd01');

  const cartItem = cart.find((i) => i.id === product.id);

  const discount =
    product.price && product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : null;

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleAdd = (e) => {
    e.stopPropagation();
    if (isUnavailable) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.28 }}
      className={`bg-white rounded-3xl border overflow-hidden cursor-pointer group transition-shadow relative
        ${isSpecial
          ? 'border-amber-300 shadow-sm hover:shadow-xl hover:shadow-amber-100/50'
          : 'border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/40'
        }`}
      onClick={() => navigate(`/product/${product.id}`)}
    >

      {/* ── Image ──────────────────────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500
              ${isUnavailable ? 'grayscale' : ''}`}
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-slate-300
            ${isUnavailable ? 'grayscale' : ''}`}>
            <UtensilsCrossed size={36} />
          </div>
        )}

        {/* discount badge — hidden when unavailable */}
        {discount && !isUnavailable && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow">
            {discount}% OFF
          </div>
        )}

        {/* special badge — hidden when unavailable */}
        {isSpecial && !isUnavailable && (
          <div className="absolute bottom-2 left-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-yellow-300/40">
            <Sparkles size={8} className="animate-pulse" />
            SPECIAL
          </div>
        )}

        {/* heart button — always visible */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFavorite(product); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-white/90 hover:bg-white border border-slate-100/60 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 z-10"
        >
          <Heart
            size={13}
            className={`transition-all ${isFavorite(product.id)
              ? 'fill-red-500 text-red-500 scale-110'
              : 'text-slate-400 hover:text-red-500'}`}
          />
        </button>

        {/* unavailable overlay */}
        {isUnavailable && (
          <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2
            ${isClosedByRestaurant
              ? 'bg-gradient-to-t from-red-950/75 via-red-900/40 to-transparent'
              : 'bg-gradient-to-t from-slate-900/80 via-slate-800/40 to-transparent'}`}>
            <div className={`w-9 h-9 rounded-2xl backdrop-blur-sm border border-white/20 flex items-center justify-center
              ${isClosedByRestaurant ? 'bg-red-500/25' : 'bg-white/15'}`}>
              {isClosedByRestaurant
                ? <Lock size={15} className="text-white" />
                : <AlertCircle size={15} className="text-white" />}
            </div>
            <span className="bg-white/95 backdrop-blur-sm text-slate-800 text-[9px] font-black px-3 py-1.5 rounded-full shadow-xl uppercase tracking-widest border border-white/60">
              {isClosedByRestaurant ? 'Closed' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>

      {/* ── Info ───────────────────────────────────────────────────────── */}
      <div className="p-3">
        <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-1">
          {product.name}
        </h3>
        <p className="text-slate-400 text-xs mt-0.5 line-clamp-1 font-medium">
          {product.description}
        </p>

        {product.preparationTime && (
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400 font-semibold">
            <Clock size={11} /> {product.preparationTime}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* price — muted when unavailable */}
          <div>
            <span className={`font-black text-base ${isUnavailable ? 'text-slate-400' : 'text-orange-500'}`}>
              ₹{product.discountPrice ?? product.price}
            </span>
            {product.discountPrice && product.price && !isUnavailable && (
              <span className="text-slate-400 text-xs font-semibold line-through ml-1">
                ₹{product.price}
              </span>
            )}
          </div>

          {/* ── Cart controls ─────────────────────────────────────────── */}
          {isUnavailable ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 text-slate-400 text-[10px] font-black px-3 py-2 rounded-xl cursor-not-allowed"
            >
              {isClosedByRestaurant
                ? <Lock size={10} className="shrink-0" />
                : <AlertCircle size={10} className="shrink-0" />}
              <span>{isClosedByRestaurant ? 'Closed' : 'Unavailable'}</span>
            </div>
          ) : !isOnline ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl bg-slate-100 text-slate-300 cursor-not-allowed"
              title="Store is currently paused"
            >
              <PauseCircle size={14} />
            </div>
          ) : pickupOrderData ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
              title="Remove Pickup & Drop first"
            >
              <Bike size={14} />
            </div>
          ) : cartItem ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty - 1); }}
                className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
              >
                <Minus size={10} />
              </button>
              <span className="font-black text-slate-800 text-xs w-4 text-center">{cartItem.qty}</span>
              <button
                onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty + 1); }}
                className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all cursor-pointer"
              >
                <Plus size={10} />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAdd}
              className={`p-2 rounded-xl shadow-md transition-colors cursor-pointer text-white
                ${added
                  ? 'bg-emerald-500 shadow-emerald-400/20'
                  : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}
            >
              {added ? <CheckCircle2 size={14} /> : <Plus size={14} />}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
