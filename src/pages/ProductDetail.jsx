import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Star, Clock, ShoppingCart, Plus, Minus,
  Loader2, AlertCircle, CheckCircle2, UtensilsCrossed, MapPin, Bike, Heart, Tag
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useCategories, getCategoryName } from '../hooks/useCategories';
import SEO from '../components/SEO';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQty, pickupOrderData, toggleFavorite, isFavorite } = useCart();
  const { categories } = useCategories();

  const [product, setProduct] = useState(null);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'products', id));
        if (!snap.exists()) { setError('Product not found.'); return; }
        const data = { id: snap.id, ...snap.data() };
        setProduct(data);

        if (data.restaurantId) {
          const rSnap = await getDoc(doc(db, 'restaurants', data.restaurantId));
          if (rSnap.exists()) setRestaurant({ id: rSnap.id, ...rSnap.data() });
        }

        if (data.categoryId) {
          const relQuery = query(
            collection(db, 'products'),
            where('categoryId', '==', data.categoryId),
            limit(5)
          );
          const relSnap = await getDocs(relQuery);
          const rel = relSnap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((p) => p.id !== data.id)
            .slice(0, 4);
          setRelatedProducts(rel);
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load product.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const cartItem = cart.find((i) => i.id === id);
  const discount = product?.price && product?.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : null;

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

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

  const images = product?.images?.length ? product.images : [];

  return (
    <div className="min-h-screen bg-white pb-32 md:pb-16">
      <SEO
        title={product?.name}
        description={product?.description
          ? `${product.description} — Order ${product.name} in Hinganghat on NextTo.`
          : `Order ${product?.name ?? 'this item'} online in Hinganghat on NextTo. Fast delivery guaranteed.`}
        canonical={`/product/${id}`}
        image={product?.images?.[0] || undefined}
        type="product"
        keywords={[product?.name ?? '', 'order online Hinganghat', restaurant?.name ?? '']}
      />
      {/* Back button */}
      <div className="sticky top-16 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 hover:text-orange-500 font-bold text-sm transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          {/* Image Gallery */}
          <div>
            <motion.div
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative w-full aspect-square rounded-3xl overflow-hidden bg-slate-100"
            >
              {images[activeImg] ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <UtensilsCrossed size={64} className="text-slate-300" />
                </div>
              )}

              {discount && (
                <div className="absolute top-4 left-4 bg-orange-500 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                  {discount}% OFF
                </div>
              )}

              {/* Floating Favorite button */}
              <button
                type="button"
                onClick={() => toggleFavorite(product)}
                className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white/90 hover:bg-white border border-slate-100/60 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 z-10"
              >
                <Heart
                  size={18}
                  className={`transition-all ${
                    isFavorite(product.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 hover:text-red-500'
                  }`}
                />
              </button>

              {!product?.isAvailable && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
                  <span className="bg-white text-slate-700 font-black px-5 py-2.5 rounded-full text-sm">
                    Currently Unavailable
                  </span>
                </div>
              )}
            </motion.div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      activeImg === i ? 'border-orange-500' : 'border-transparent opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-4">
            {/* Badges row: service type + category */}
            <div className="flex flex-wrap gap-2">
              {product?.serviceType && (
                <span className="inline-block bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {product.serviceType}
                </span>
              )}
              {product?.categoryId && (
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 text-[10px] font-black px-3 py-1 rounded-full">
                  <Tag size={9} />
                  {getCategoryName(categories, product.categoryId)}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-black text-slate-900 leading-tight">{product?.name}</h1>

            {product?.description && (
              <p className="text-slate-500 text-base font-medium leading-relaxed">{product.description}</p>
            )}

            {/* Stats row */}
            <div className="flex flex-wrap gap-3">
              {product?.rating !== undefined && (
                <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="font-black text-amber-700 text-sm">
                    {product.rating > 0 ? product.rating : 'New'}{' '}
                    {product.totalReviews > 0 && <span className="font-semibold text-amber-500">({product.totalReviews})</span>}
                  </span>
                </div>
              )}
              {product?.preparationTime && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
                  <Clock size={14} className="text-slate-500" />
                  <span className="font-bold text-slate-700 text-sm">{product.preparationTime}</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 py-2">
              <span className="text-4xl font-black text-orange-500">
                ₹{product?.discountPrice ?? product?.price}
              </span>
              {product?.discountPrice && product?.price && (
                <span className="text-slate-400 font-semibold text-xl line-through mb-1">
                  ₹{product.price}
                </span>
              )}
            </div>

            {/* Restaurant card */}
            {restaurant && (
              <button
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                className="w-full flex items-center gap-3 bg-slate-50 hover:bg-orange-50 border border-slate-200 hover:border-orange-200 p-4 rounded-2xl transition-all cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <UtensilsCrossed size={18} className="text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-sm truncate">{restaurant.name}</p>
                  {restaurant.address && (
                    <p className="text-slate-400 text-xs font-medium flex items-center gap-1 mt-0.5">
                      <MapPin size={10} /> {restaurant.address}
                    </p>
                  )}
                </div>
                <span className="text-orange-500 text-xs font-bold shrink-0">View →</span>
              </button>
            )}

            {/* Add to cart */}
            {product?.isAvailable !== false && (
              <div className="pt-2">
                {pickupOrderData ? (
                  <div className="flex items-center gap-3 bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <Bike size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="font-black text-amber-800 text-sm">Pickup & Drop in cart</p>
                      <p className="text-amber-600 text-xs font-semibold mt-0.5">Remove it first to add delivery items</p>
                    </div>
                  </div>
                ) : cartItem ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-1.5">
                      <button
                        onClick={() => updateQty(id, cartItem.qty - 1)}
                        className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="font-black text-slate-900 text-xl w-8 text-center">{cartItem.qty}</span>
                      <button
                        onClick={() => updateQty(id, cartItem.qty + 1)}
                        className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all cursor-pointer"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <span className="text-orange-500 font-black text-lg">
                      ₹{(product?.discountPrice ?? product?.price) * cartItem.qty}
                    </span>
                  </div>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddToCart}
                    className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer
                      ${added
                        ? 'bg-emerald-500 shadow-emerald-400/25'
                        : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
                      } text-white`}
                  >
                    <AnimatePresence mode="wait">
                      {added ? (
                        <motion.span
                          key="added"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="flex items-center gap-2"
                        >
                          <CheckCircle2 size={18} /> Added to Cart!
                        </motion.span>
                      ) : (
                        <motion.span
                          key="add"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="flex items-center gap-2"
                        >
                          <ShoppingCart size={18} /> Add to Cart
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-slate-100">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
              Related Products
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {relatedProducts.map((p) => {
                const disc = p.price && p.discountPrice
                  ? Math.round(((p.price - p.discountPrice) / p.price) * 100)
                  : null;
                return (
                  <motion.div
                    key={p.id}
                    whileHover={{ y: -4 }}
                    onClick={() => { navigate(`/product/${p.id}`); window.scrollTo(0, 0); }}
                    className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image */}
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 mb-3">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <UtensilsCrossed size={20} className="text-slate-300" />
                          </div>
                        )}
                        {disc && (
                          <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                            {disc}% OFF
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 group-hover:text-orange-500 transition-colors">{p.name}</h3>
                      {p.serviceType && (
                        <p className="text-[10px] font-black text-orange-500 capitalize mt-0.5">{p.serviceType}</p>
                      )}
                    </div>
                    {/* Price */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-sm font-black text-slate-900">₹{p.discountPrice ?? p.price}</span>
                      {p.discountPrice && p.price && (
                        <span className="text-[10px] text-slate-400 font-semibold line-through">₹{p.price}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
