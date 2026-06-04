import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed, ShoppingBasket, Pill, Bike,
  Plus, Minus, CheckCircle2, ArrowRight, Loader2, Package, Clock, Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, limit, or } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';

/* ─── service tab config ─── */
const TABS = [
  {
    id: 'food',
    label: 'Food',
    icon: UtensilsCrossed,
    activeClass: 'bg-orange-500 text-white shadow-lg shadow-orange-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-orange-600 hover:bg-orange-50',
    viewAllClass: 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25',
    emptyBg: 'bg-orange-50',
    emptyIcon: 'text-orange-300',
  },
  {
    id: 'grocery',
    label: 'Grocery',
    icon: ShoppingBasket,
    activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-emerald-600 hover:bg-emerald-50',
    viewAllClass: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25',
    emptyBg: 'bg-emerald-50',
    emptyIcon: 'text-emerald-300',
  },
  {
    id: 'medicine',
    label: 'Medicine',
    icon: Pill,
    activeClass: 'bg-blue-500 text-white shadow-lg shadow-blue-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-blue-600 hover:bg-blue-50',
    viewAllClass: 'bg-blue-500 hover:bg-blue-600 shadow-blue-500/25',
    emptyBg: 'bg-blue-50',
    emptyIcon: 'text-blue-300',
  },
  {
    id: 'pickup',
    label: 'Pickup & Drop',
    icon: Bike,
    activeClass: 'bg-purple-500 text-white shadow-lg shadow-purple-200',
    idleClass: 'bg-slate-50 border border-slate-100 text-purple-600 hover:bg-purple-50',
    viewAllClass: 'bg-purple-500 hover:bg-purple-600 shadow-purple-500/25',
    emptyBg: 'bg-purple-50',
    emptyIcon: 'text-purple-300',
  },
];

/* ─── mini product card ─── */
function MiniProductCard({ product }) {
  const { addToCart, cart, updateQty, pickupOrderData, toggleFavorite, isFavorite } = useCart();
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
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-orange-100/40 overflow-hidden cursor-pointer group relative"
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
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed size={28} className="text-slate-300" />
          </div>
        )}
        {discount && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
            {discount}% OFF
          </div>
        )}
        
        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product);
          }}
          className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-white/90 hover:bg-white border border-slate-100/60 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 z-10"
        >
          <Heart
            size={11}
            className={`transition-all ${
              isFavorite(product.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 hover:text-red-500'
            }`}
          />
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

        {product.preparationTime && (
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400 font-semibold">
            <Clock size={10} /> {product.preparationTime}
          </div>
        )}

        <div className="flex items-center justify-between mt-2.5">
          <div>
            <span className="text-orange-500 font-black text-sm">₹{product.discountPrice ?? product.price}</span>
            {product.discountPrice && product.price && (
              <span className="text-slate-400 text-[11px] font-semibold line-through ml-1">₹{product.price}</span>
            )}
          </div>

          {product.isAvailable !== false && (
            pickupOrderData ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
                title="Remove Pickup & Drop first"
              >
                <Bike size={13} />
              </div>
            ) : cartItem ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty - 1); }}
                  className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                >
                  <Minus size={9} />
                </button>
                <span className="font-black text-slate-800 text-xs w-4 text-center">{cartItem.qty}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty + 1); }}
                  className="w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all cursor-pointer"
                >
                  <Plus size={9} />
                </button>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className={`p-1.5 rounded-xl shadow transition-colors cursor-pointer text-white text-xs ${added ? 'bg-emerald-500' : 'bg-orange-500 hover:bg-orange-600'
                  }`}
              >
                {added ? <CheckCircle2 size={13} /> : <Plus size={13} />}
              </motion.button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── pickup & drop promo card ─── */
function PickupPromo() {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-12 gap-5 text-center"
    >
      <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center">
        <Bike size={36} className="text-purple-500" />
      </div>
      <div>
        <h3 className="font-black text-slate-900 text-xl">Pickup & Drop</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-xs">
          Send packages, documents, or anything between any two locations — fast and reliable.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate('/product?tab=pickup')}
        className="bg-purple-500 hover:bg-purple-600 text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer"
      >
        Schedule Pickup <ArrowRight size={15} />
      </motion.button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════ */
export default function ServicesSection() {
  const [activeTab, setActiveTab] = useState('food');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'pickup') {
      setLoading(false);
      return;
    }

    const fetchTabProducts = async () => {
      setLoading(true);
      try {
        const constraints = [];
        if (activeTab === 'food') {
          constraints.push(
            or(
              where('serviceType', '==', 'food'),
              where('serviceType', '==', ''),
              where('serviceType', '==', null)
            )
          );
        } else {
          constraints.push(where('serviceType', '==', activeTab));
        }
        constraints.push(limit(6));

        const q = query(collection(db, 'products'), ...constraints);
        const snap = await getDocs(q);
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTabProducts();
  }, [activeTab]);

  const currentTab = TABS.find((t) => t.id === activeTab);

  const filtered = activeTab === 'pickup' ? [] : products;

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">



        {/* Tab strip — horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-8 -mx-4 px-4 sm:-mx-6 sm:px-6">
          {TABS.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-2xl font-bold text-sm transition-all cursor-pointer shrink-0 ${activeTab === tab.id ? tab.activeClass : tab.idleClass
                  }`}
              >
                <TabIcon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 size={28} className="text-orange-400 animate-spin" />
              </div>
            )}

            {/* Pickup & Drop */}
            {!loading && activeTab === 'pickup' && (
              <div className="grid grid-cols-1">
                <PickupPromo />
              </div>
            )}

            {/* Product grid */}
            {!loading && activeTab !== 'pickup' && (
              <>
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                    <div className={`w-16 h-16 ${currentTab.emptyBg} rounded-3xl flex items-center justify-center`}>
                      <currentTab.icon size={28} className={currentTab.emptyIcon} />
                    </div>
                    <p className="text-slate-400 font-semibold text-sm">
                      No {currentTab.label} items yet.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6">
                      {filtered.map((p) => (
                        <div key={p.id} className="shrink-0 w-44 sm:w-48">
                          <MiniProductCard product={p} />
                        </div>
                      ))}
                    </div>

                    {/* View All */}
                    <div className="flex justify-center mt-8">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => navigate(`/product?tab=${activeTab}`)}
                        className={`flex items-center gap-2 text-white px-7 py-3 rounded-2xl font-bold text-sm shadow-lg transition-all cursor-pointer ${currentTab.viewAllClass}`}
                      >
                        View All {currentTab.label}
                        <ArrowRight size={16} />
                      </motion.button>
                    </div>
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

      </div>
    </section>
  );
}
