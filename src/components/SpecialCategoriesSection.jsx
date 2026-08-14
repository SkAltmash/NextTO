import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import ProductCard from './ProductCard';
import { useCategories } from '../hooks/useCategories';

export default function SpecialCategoriesSection() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { categories } = useCategories();

  useEffect(() => {
    if (categories && categories.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const settingsSnap = await getDoc(doc(db, 'settings', 'specialCategories'));

        if (!settingsSnap.exists()) {
          if (!cancelled) setLoading(false);
          return;
        }

        const categoryIds = settingsSnap.data()?.categoryIds ?? [];

        if (categoryIds.length === 0) {
          if (!cancelled) setLoading(false);
          return;
        }

        const results = await Promise.all(
          categoryIds.map(async (catId) => {
            try {
              let catName = 'Category';

              if (categories && categories.length > 0) {
                const found = categories.find((c) => c.id === catId);
                if (!found) return null;
                catName = found.name;
              } else {
                const catSnap = await getDoc(doc(db, 'categories', catId));
                if (!catSnap.exists()) return null;
                catName = catSnap.data().name ?? 'Category';
              }

              const prodQuery = query(
                collection(db, 'products'),
                where('categoryId', '==', catId),
                limit(8)
              );

              const prodSnap = await getDocs(prodQuery);

              const products = prodSnap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((p) => p.isAvailable !== false)
                .slice(0, 4);

              if (products.length === 0) return null;

              return { id: catId, name: catName, products };
            } catch (err) {
              console.warn(`SpecialCategoriesSection: skipping category ${catId}`, err);
              return null;
            }
          })
        );

        if (!cancelled) {
          setBlocks(results.filter(Boolean));
        }
      } catch (err) {
        console.warn('SpecialCategoriesSection: failed to load settings', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [categories]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={26} className="text-orange-500 animate-spin" />
      </div>
    );
  }

  if (blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => (
        <section key={block.id} className="py-8 border-t border-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-slate-900">{block.name}</h2>
              </div>
              <button
                onClick={() => navigate(`/categories/${block.id}`)}
                className="flex items-center gap-1 text-orange-500 font-bold text-sm cursor-pointer hover:text-orange-600 transition-colors shrink-0"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>

            {/* Product Cards Grid (up to 4 items) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {block.products.slice(0, 4).map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
