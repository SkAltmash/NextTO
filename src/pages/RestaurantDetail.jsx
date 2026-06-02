import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, Phone, MapPin, UtensilsCrossed,
  Loader2, AlertCircle, ShoppingCart, Plus, Minus, Star, CheckCircle2
} from 'lucide-react';
import { useCart } from '../context/CartContext';

function ProductCard({ product }) {
  const { addToCart, cart, updateQty } = useCart();
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/40 overflow-hidden cursor-pointer group transition-shadow"
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
            <UtensilsCrossed size={40} />
          </div>
        )}
        {discount && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
            {discount}% OFF
          </div>
        )}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">Unavailable</span>
          </div>
        )}
      </div>

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

          {/* Cart controls */}
          {product.isAvailable !== false && (
            cartItem ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty - 1); }}
                  className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
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
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className={`p-2 rounded-xl shadow-md transition-colors cursor-pointer ${added ? 'bg-emerald-500 shadow-emerald-400/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                  } text-white`}
              >
                {added ? <CheckCircle2 size={14} /> : <Plus size={14} />}
              </motion.button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const categories = ['all', ...new Set(products.map((p) => p.categoryId).filter(Boolean))];
  const filtered = filterCat === 'all' ? products : products.filter((p) => p.categoryId === filterCat);

  return (
    <div className="min-h-screen bg-white pb-28 md:pb-12">
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
          {restaurant?.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600 cursor-pointer"
            >
              <Phone size={14} /> {restaurant.phone}
            </a>
          )}
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
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer
                  ${filterCat === cat
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300'
                  }`}
              >
                {cat === 'all' ? 'All Items' : cat}
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
              product — {filtered.length} item{filtered.length !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
