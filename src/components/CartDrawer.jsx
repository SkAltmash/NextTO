import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package,
  FileImage, Pill, Bike, Navigation, MapPin
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer({ open, onClose }) {
  const {
    cart, updateQty, clearCart, totalItems, totalPrice,
    prescriptionImageUrl, setPrescriptionImageUrl,
    pickupOrderData, setPickupOrderData
  } = useCart();
  const navigate = useNavigate();

  const hasPrescription = !!prescriptionImageUrl;
  const hasPickup = !!pickupOrderData;
  const hasAnything = cart.length > 0 || hasPrescription || hasPickup;
  const pickupTotal = Number(pickupOrderData?.totalCharge ?? 0);
  const payableTotal = totalPrice + pickupTotal;

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 bottom-0 z-[70] w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={20} className="text-orange-500" />
                <h2 className="font-black text-slate-900 text-lg">Your Cart</h2>
                {hasAnything && (
                  <span className="bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems + (hasPrescription ? 1 : 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasAnything && (
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-all cursor-pointer"
                    title="Clear cart"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {!hasAnything ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center">
                    <ShoppingCart size={36} className="text-orange-300" />
                  </div>
                  <div>
                    <p className="font-black text-slate-700 text-lg">Cart is empty</p>
                    <p className="text-slate-400 text-sm mt-1">Add items from the shop!</p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { onClose(); navigate('/product'); }}
                    className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-bold text-sm cursor-pointer"
                  >
                    Browse Shop
                  </motion.button>
                </div>
              ) : (
                <AnimatePresence>
                  {/* ── Prescription card ── */}
                  {hasPickup && (
                    <motion.div
                      key="pickup-drop"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative rounded-2xl overflow-hidden border-2 border-purple-200 bg-purple-50"
                    >
                      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                        <div className="w-8 h-8 rounded-xl bg-purple-500 flex items-center justify-center shrink-0">
                          <Bike size={15} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-purple-800 text-sm">Pickup &amp; Drop</p>
                          <p className="text-purple-500 text-[11px] font-semibold">Charge &#x20b9;{pickupTotal}</p>
                        </div>
                        <button
                          onClick={() => setPickupOrderData(null)}
                          className="w-7 h-7 rounded-lg bg-purple-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-purple-600 transition-all cursor-pointer shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="px-3 pb-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                          <Navigation size={12} className="text-purple-400 shrink-0" />
                          <span className="truncate">From: {pickupOrderData.pickupLoc?.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-purple-700">
                          <MapPin size={12} className="text-purple-400 shrink-0" />
                          <span className="truncate">To: {pickupOrderData.dropLoc?.name}</span>
                        </div>
                        {pickupOrderData.note && (
                          <p className="text-[11px] font-semibold text-purple-500 bg-white/70 border border-purple-100 rounded-xl px-3 py-2">
                            {pickupOrderData.note}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* ── Prescription card ── */}
                  {hasPrescription && (
                    <motion.div
                      key="prescription"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="relative rounded-2xl overflow-hidden border-2 border-blue-200 bg-blue-50"
                    >
                      {/* Header row */}
                      <div className="flex items-center gap-2.5 px-3 pt-3 pb-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
                          <Pill size={15} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-blue-800 text-sm">Prescription Order</p>
                          <p className="text-blue-500 text-[11px] font-semibold">Price will be confirmed by pharmacist</p>
                        </div>
                        <button
                          onClick={() => setPrescriptionImageUrl('')}
                          className="w-7 h-7 rounded-lg bg-blue-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-blue-600 transition-all cursor-pointer shrink-0"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      {/* Prescription thumbnail */}
                      <img
                        src={prescriptionImageUrl}
                        alt="Prescription"
                        className="w-full max-h-32 object-contain bg-white border-t border-blue-100"
                      />
                      <div className="px-3 py-2 flex items-center gap-1.5">
                        <FileImage size={12} className="text-blue-400" />
                        <p className="text-[11px] font-semibold text-blue-600">Prescription image attached</p>
                      </div>
                    </motion.div>
                  )}

                  {/* ── Regular cart items ── */}
                  {cart.map((item) => {
                    const price = item.discountPrice ?? item.price;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3"
                      >
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-14 h-14 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Package size={20} className="text-orange-400" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                          <p className="text-orange-500 font-black text-sm">₹{price * item.qty}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateQty(item.id, item.qty - 1)}
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all cursor-pointer"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-black text-slate-800 text-sm w-5 text-center">{item.qty}</span>
                          <button
                            onClick={() => updateQty(item.id, item.qty + 1)}
                            className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white hover:bg-orange-600 transition-all cursor-pointer"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer — shown when cart has items OR prescription */}
            {hasAnything && (
              <div className="px-5 py-4 border-t border-slate-100 space-y-3">
                {cart.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-semibold text-sm">Subtotal</span>
                      <span className="font-black text-slate-900 text-xl">₹{totalPrice}</span>
                    </div>
                    <p className="text-slate-400 text-xs font-semibold -mt-1">
                      Delivery charge calculated at checkout
                    </p>
                  </>
                )}
                {hasPickup && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold text-sm">Pickup &amp; Drop</span>
                    <span className="font-black text-purple-600 text-xl">₹{pickupTotal}</span>
                  </div>
                )}
                {hasPickup && payableTotal > 0 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-slate-500 font-semibold text-sm">To Pay</span>
                    <span className="font-black text-slate-900 text-xl">₹{payableTotal}</span>
                  </div>
                )}
                {hasPrescription && cart.length === 0 && !hasPickup && (
                  <p className="text-blue-500 text-xs font-semibold text-center">
                    💊 Prescription order · price confirmed on delivery
                  </p>
                )}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer transition-colors"
                >
                  Proceed to Checkout <ArrowRight size={18} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
