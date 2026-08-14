/**
 * GrocerySection.jsx
 *
 * Home-page section that fetches 10 grocery products and displays them
 * in a horizontal scroll row using ProductCard.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBasket, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from './ProductCard';

export default function GrocerySection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const q = query(
          collection(db, 'products'),
          where('serviceType', '==', 'grocery'),
          where('isAvailable', '!=', false),
          limit(10),
        );
        const snap = await getDocs(q);
        if (!cancelled) {
          setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      } catch (err) {
        console.warn('[GrocerySection] fetch failed:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Don't render the section if there are no grocery items
  if (!loading && items.length === 0) return null;

  return (
    <section className="py-10 bg-gradient-to-b from-white to-emerald-50/30 border-t border-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
              <h2 className="text-xl font-black text-slate-900">Grocery Essentials</h2>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Daily needs delivered fast</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/product?tab=grocery')}
            className="flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-bold text-sm transition-colors cursor-pointer"
          >
            View all
            <ArrowRight size={14} />
          </motion.button>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={26} className="text-emerald-400 animate-spin" />
          </div>
        ) : (
          <>
            {/* Mobile: 2×2 grid (4 items) | Desktop: horizontal scroll row */}
            <div className="grid grid-cols-2 gap-3 sm:hidden">
              {items.slice(0, 4).map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {/* Desktop: horizontal scroll row (hidden on mobile) */}
            <div className="hidden sm:flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-6 px-6">
              {items.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="shrink-0 w-48"
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>

            {/* View All CTA button */}
            <div className="flex justify-center mt-8">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/product?tab=grocery')}
                className="flex items-center gap-2 text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-lg bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25 transition-all cursor-pointer"
              >
                View All Groceries
                <ArrowRight size={16} />
              </motion.button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
