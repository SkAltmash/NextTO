import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import {
  Heart, UtensilsCrossed, Clock, Plus, Minus,
  CheckCircle2, ShoppingBasket, Pill, Bike, ArrowLeft, ArrowRight, Trash2
} from 'lucide-react';
import { useState } from 'react';

export default function Favorites() {
  const { favorites, toggleFavorite, addToCart, cart, updateQty, pickupOrderData } = useCart();
  const navigate = useNavigate();
  const [addedId, setAddedId] = useState(null);

  const handleAdd = (e, product) => {
    e.stopPropagation();
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

  const getServiceStyles = (service) => {
    const s = (service ?? '').toLowerCase();
    if (s === 'food') return 'bg-orange-50 text-orange-600 border-orange-100';
    if (s === 'grocery') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (s === 'medicine') return 'bg-blue-50 text-blue-600 border-blue-100';
    return 'bg-purple-50 text-purple-600 border-purple-100';
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 pt-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
              My Favorites <Heart size={20} className="fill-red-500 text-red-500" />
            </h1>
            <p className="text-xs text-slate-400 font-semibold">Your handpicked express choices</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {favorites.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
            >
              <div className="w-18 h-18 bg-red-50 rounded-3xl flex items-center justify-center mb-4">
                <Heart size={32} className="text-red-400 stroke-[1.5]" />
              </div>
              <h2 className="text-lg font-black text-slate-900">Your favorites list is empty</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xs font-semibold leading-relaxed">
                Save your favorite dishes, daily groceries, or essential medicines here for one-click access.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/product')}
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2 cursor-pointer transition-colors"
              >
                Browse Products <ArrowRight size={13} />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-4"
            >
              {favorites.map((product) => {
                const cartItem = cart.find((i) => i.id === product.id);
                const discount = product.price && product.discountPrice
                  ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
                  : null;

                return (
                  <motion.div
                    key={product.id}
                    layout
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md overflow-hidden cursor-pointer group flex flex-col justify-between"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div>
                      {/* Image container */}
                      <div className="relative w-full aspect-[4/3] bg-slate-50 overflow-hidden">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <UtensilsCrossed size={32} />
                          </div>
                        )}

                        {/* Badges */}
                        {discount && (
                          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow">
                            {discount}% OFF
                          </div>
                        )}

                        {/* Favorite Trash button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(product);
                          }}
                          className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-white/90 hover:bg-red-50 border border-slate-100/60 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 hover:text-red-500 text-slate-400 z-10"
                          title="Remove favorite"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Content block */}
                      <div className="p-3">
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          {product.serviceType && (
                            <span className={`inline-block border text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${getServiceStyles(product.serviceType)}`}>
                              {product.serviceType}
                            </span>
                          )}
                        </div>
                        <h3 className="font-black text-slate-900 text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-orange-500 transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-slate-400 text-[10px] sm:text-xs mt-0.5 line-clamp-1 font-medium">
                          {product.description}
                        </p>
                        {product.preparationTime && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-400 font-semibold">
                            <Clock size={10} /> {product.preparationTime}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price and Cart controls */}
                    <div className="p-3 pt-0 flex items-center justify-between">
                      <div>
                        <span className="text-orange-500 font-black text-sm sm:text-base">
                          ₹{product.discountPrice ?? product.price}
                        </span>
                        {product.discountPrice && product.price && (
                          <span className="text-slate-400 text-[10px] sm:text-xs font-semibold line-through ml-1">
                            ₹{product.price}
                          </span>
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
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleAdd(e, product)}
                            className={`p-1.5 rounded-xl shadow transition-colors cursor-pointer text-white text-xs ${
                              addedId === product.id ? 'bg-emerald-500' : 'bg-orange-500 hover:bg-orange-600'
                            }`}
                          >
                            {addedId === product.id ? <CheckCircle2 size={13} /> : <Plus size={13} />}
                          </motion.button>
                        )
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
