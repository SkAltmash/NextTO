import React, { useEffect, useState } from 'react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, UtensilsCrossed, Flame } from 'lucide-react';

export default function CompleteYourMeal({ restaurantId, title = "Complete Your Meal", compact = false }) {
  const { cart, addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    if (!restaurantId) {
      setItems([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'products'),
          where('restaurantId', '==', restaurantId),
          limit(12)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        if (isMounted) {
          setItems(fetched);
        }
      } catch (err) {
        console.error('Error fetching Complete Your Meal items:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecommendations();
    return () => { isMounted = false; };
  }, [restaurantId]);

  // Filter out items already in cart and unavailable items
  const cartIds = new Set(cart.map((i) => i.id));
  const availableItems = items.filter((item) => !cartIds.has(item.id) && item.isAvailable !== false);

  if (loading || availableItems.length === 0) {
    return null;
  }

  const handleAdd = (item, e) => {
    e?.stopPropagation();
    addToCart(item);
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className={`my-3 ${compact ? 'py-1' : 'py-3'}`}>
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Flame size={14} className="fill-orange-500 text-orange-500 animate-pulse" />
          </div>
          <h3 className="font-black text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
            {title}
          </h3>
        </div>
        <span className="text-[9px] font-black text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
          Same Restaurant
        </span>
      </div>

      {/* Horizontal scrolling strip */}
      <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none px-1">
        <AnimatePresence>
          {availableItems.map((item) => {
            const price = item.discountPrice ?? item.price;
            const isJustAdded = addedId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="shrink-0 w-36 sm:w-40 bg-gradient-to-b from-slate-50 via-white to-white rounded-2xl border border-slate-100 p-2.5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-2">
                    {item.images?.[0] ? (
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <UtensilsCrossed size={18} />
                      </div>
                    )}
                  </div>
                  <h4 className="font-black text-slate-800 text-xs line-clamp-1 leading-snug">
                    {item.name}
                  </h4>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100">
                  <span className="font-black text-slate-900 text-xs sm:text-sm">
                    ₹{price}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleAdd(item, e)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                      isJustAdded
                        ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                        : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
                    }`}
                  >
                    {isJustAdded ? (
                      <>
                        <Check size={12} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus size={12} />
                        <span>Add</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
