import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
	  ArrowLeft, Clock, MapPin, Package, Loader2, AlertCircle,
	  ClipboardList, CheckCircle2, ChefHat, Bike, XCircle,
	  Phone, CreditCard, Banknote, Store, Copy, Check, FileImage, Navigation
	} from 'lucide-react';

// ─── Status Config ─────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',   label: 'Order Placed',    icon: ClipboardList, desc: 'We received your order'         },
  { key: 'confirmed', label: 'Confirmed',        icon: CheckCircle2,  desc: 'Restaurant accepted your order' },
  { key: 'preparing', label: 'Preparing',        icon: ChefHat,       desc: 'Your food is being prepared'   },
  { key: 'out',       label: 'Out for Delivery', icon: Bike,          desc: 'On the way to you!'            },
  { key: 'delivered', label: 'Delivered',        icon: CheckCircle2,  desc: 'Enjoy your meal!'              },
];

const STATUS_COLOR = {
  pending:   { badge: 'bg-blue-50 text-blue-600 border-blue-100',         bar: 'bg-blue-500',    glow: 'shadow-blue-200'    },
  confirmed: { badge: 'bg-amber-50 text-amber-600 border-amber-100',       bar: 'bg-amber-500',   glow: 'shadow-amber-200'   },
  preparing: { badge: 'bg-orange-50 text-orange-600 border-orange-100',    bar: 'bg-orange-500',  glow: 'shadow-orange-200'  },
  out:       { badge: 'bg-purple-50 text-purple-600 border-purple-100',    bar: 'bg-purple-500',  glow: 'shadow-purple-200'  },
  delivered: { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', bar: 'bg-emerald-500', glow: 'shadow-emerald-200' },
  cancelled: { badge: 'bg-red-50 text-red-500 border-red-100',             bar: 'bg-red-400',     glow: 'shadow-red-200'     },
};

// ─── Step Tracker ──────────────────────────────────────────────────────────────
function StepTracker({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <div className="w-16 h-16 rounded-3xl bg-red-50 flex items-center justify-center">
          <XCircle size={32} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="font-black text-red-500 text-base">Order Cancelled</p>
          <p className="text-slate-400 text-xs font-semibold mt-0.5">This order has been cancelled</p>
        </div>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done    = i < currentIdx;
        const active  = i === currentIdx;
        const pending = i > currentIdx;
        const Icon    = step.icon;
        const isLast  = i === STEPS.length - 1;

        return (
          <div key={step.key} className="flex gap-4">
            {/* Icon + Line */}
            <div className="flex flex-col items-center">
              <motion.div
                initial={active ? { scale: 0.8 } : {}}
                animate={active ? { scale: [1, 1.1, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-all
                  ${done    ? 'bg-emerald-500 shadow-lg shadow-emerald-200'  : ''}
                  ${active  ? 'bg-orange-500 shadow-lg shadow-orange-200'    : ''}
                  ${pending ? 'bg-slate-100'                                  : ''}`}
              >
                <Icon size={16}
                  className={done || active ? 'text-white' : 'text-slate-400'}
                />
              </motion.div>
              {!isLast && (
                <div className="w-0.5 flex-1 my-1 min-h-[20px] relative overflow-hidden bg-slate-100 rounded-full">
                  {done && <div className="absolute inset-0 bg-emerald-400 rounded-full" />}
                  {active && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-b from-orange-400 to-orange-200 rounded-full"
                      initial={{ scaleY: 0, originY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Text */}
            <div className={`pb-5 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <p className={`font-black text-sm leading-tight
                ${done    ? 'text-emerald-600' : ''}
                ${active  ? 'text-orange-600'  : ''}
                ${pending ? 'text-slate-300'    : ''}`}>
                {step.label}
              </p>
              {(done || active) && (
                <p className={`text-xs font-semibold mt-0.5
                  ${done   ? 'text-slate-400' : ''}
                  ${active ? 'text-orange-400' : ''}`}>
                  {step.desc}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
        <Icon size={14} className="text-orange-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</p>
        <p className={`text-sm font-bold text-slate-800 mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function OrderDetail() {
  const { id }    = useParams();
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = onSnapshot(
      doc(db, 'orders', id),
      (snap) => {
        if (!snap.exists()) { setError('Order not found.'); setLoading(false); return; }
        setOrder({ id: snap.id, ...snap.data() });
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError('Could not load order. Check your connection.');
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  const copyId = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cfg    = STATUS_COLOR[order?.status] ?? STATUS_COLOR.pending;
  const date   = order?.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : 'Just now';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center">
        <Loader2 size={30} className="text-orange-500 animate-spin" />
      </div>
      <p className="text-slate-400 font-semibold text-sm">Loading order…</p>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-white">
      <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center">
        <AlertCircle size={30} className="text-red-400" />
      </div>
      <p className="text-slate-600 font-semibold">{error}</p>
      <button onClick={() => navigate('/order')} className="text-orange-500 font-bold text-sm cursor-pointer">
        ← Back to orders
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/20 pb-28 md:pb-16">

      {/* ── Top bar ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-0 md:top-[64px] z-10">
        <button
          onClick={() => navigate('/order')}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-slate-900">Order Details</h1>
          <button
            onClick={copyId}
            className="flex items-center gap-1 text-xs text-slate-400 font-semibold hover:text-orange-500 transition-colors cursor-pointer mt-0.5"
          >
            <span className="font-mono truncate max-w-[160px]">#{id?.slice(0, 12)}…</span>
            {copied
              ? <Check size={11} className="text-emerald-500" />
              : <Copy size={11} />}
          </button>
        </div>
        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full border ${cfg.badge}`}>
          {STEPS.find(s => s.key === order?.status)?.label ?? order?.status}
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-4">

        {/* ── Live status card ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="font-black text-slate-900 text-sm">Live Order Status</h2>
          </div>
          <StepTracker status={order?.status} />
        </motion.div>

        {/* ── Items ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
            <Package size={15} className="text-orange-500" />
            <h2 className="font-black text-slate-900 text-sm">
              Items · {order?.items?.length ?? 0}
            </h2>
          </div>
          <div className="px-5 py-3 space-y-3">
            {order?.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                {item.image ? (
                  <img src={item.image} alt={item.productName}
                    className="w-14 h-14 rounded-2xl object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                    <Package size={20} className="text-orange-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{item.productName}</p>
                  <p className="text-slate-400 text-xs font-semibold mt-0.5">×{item.quantity}</p>
                </div>
                <p className="font-black text-slate-900 text-sm shrink-0">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>

          {/* Bill */}
          <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
            {order?.subtotal > 0 && (
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
            )}
            {order?.deliveryCharge > 0 && (
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>Delivery charge</span>
                <span className="text-orange-500">₹{order.deliveryCharge}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-slate-900 text-base pt-1 border-t border-slate-200">
              <span>Total Paid</span>
              <span>₹{order?.totalAmount}</span>
            </div>
          </div>
	        </motion.div>
	
	        {/* ── Pickup & Drop Route ── */}
	        {order?.pickupDrop && (
	          <motion.div
	            initial={{ opacity: 0, y: 16 }}
	            animate={{ opacity: 1, y: 0 }}
	            transition={{ delay: 0.08 }}
	            className="bg-white rounded-3xl border border-slate-100 shadow-sm px-5 py-4"
	          >
	            <h2 className="font-black text-slate-900 text-sm mb-1">Pickup &amp; Drop Route</h2>
	            <InfoRow
	              icon={Navigation}
	              label="Pickup Area"
	              value={`${order.pickupDrop.pickupLocationName ?? ''} · ₹${order.pickupDrop.pickupCharge ?? 0}`}
	            />
	            <InfoRow
	              icon={MapPin}
	              label="Drop Area"
	              value={`${order.pickupDrop.dropLocationName ?? ''} · ₹${order.pickupDrop.dropCharge ?? 0}`}
	            />
	            {order.pickupDrop.note && (
	              <InfoRow icon={Package} label="Note" value={order.pickupDrop.note} />
	            )}
	          </motion.div>
	        )}

	        {/* ── Delivery Info ── */}
	        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm px-5 py-4"
        >
          <h2 className="font-black text-slate-900 text-sm mb-1">Delivery Info</h2>
          {order?.address && (
            <InfoRow icon={MapPin} label="Delivery Address" value={order.address} />
          )}
          {order?.userMobile && (
            <InfoRow icon={Phone} label="Mobile" value={order.userMobile} />
          )}
          {order?.paymentMethod && (
            <InfoRow
              icon={order.paymentMethod === 'cod' ? Banknote : CreditCard}
              label="Payment"
              value={order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()}
            />
          )}
          {order?.restaurantName && (
            <InfoRow icon={Store} label="Restaurant" value={order.restaurantName} />
          )}
          {order?.restaurantPhone && (
            <InfoRow icon={Phone} label="Restaurant Phone" value={order.restaurantPhone} />
          )}
          <InfoRow icon={Clock} label="Ordered On" value={date} />
          <InfoRow icon={ClipboardList} label="Order ID" value={id} mono />
        </motion.div>


      </div>
    </div>
  );
}
