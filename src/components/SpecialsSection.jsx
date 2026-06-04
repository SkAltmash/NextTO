import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, or } from 'firebase/firestore';
import { db } from '../firebase';
import { ProductCard } from '../pages/Product';

export default function SpecialsSection() {
  const [specials, setSpecials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(
      collection(db, 'products'),
      or(
        where('isSpecial', '==', true),
        where('isSpecial', '==', 'true'),
        where('categoryId', '==', 'curd01')
      )
    );
    getDocs(q)
      .then((snap) => {
        setSpecials(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch((err) => {
        console.error('Error fetching special products:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={26} className="text-amber-500 animate-spin" />
      </div>
    );
  }

  // If there are no special products, do not display the section
  if (specials.length === 0) return null;

  return (
    <section className="py-10 bg-gradient-to-b from-white to-amber-50/20 border-t border-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500 animate-pulse" />
              <h2 className="text-xl font-black text-slate-900">Today's Specials</h2>
            </div>
            <p className="text-slate-400 text-xs font-semibold mt-0.5">
              Handpicked premium items just for you
            </p>
          </div>
          <button
            onClick={() => navigate('/product?tab=special')}
            className="flex items-center gap-1 text-amber-500 font-bold text-sm cursor-pointer hover:text-amber-600 transition-colors shrink-0"
          >
            View More <ArrowRight size={14} />
          </button>
        </div>

        {/* Product Cards Grid (4-5 items) */}
        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 scrollbar-hide sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:mx-0 sm:px-0 sm:pb-0">
          {specials.slice(0, 5).map((product) => (
            <div key={product.id} className="w-[190px] shrink-0 sm:w-auto">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
