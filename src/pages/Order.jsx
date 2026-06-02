import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Clock, MapPin, Package, ChevronRight,
  Loader2, AlertCircle, UtensilsCrossed, Bike, CheckCircle2,
  XCircle, ClipboardList, ChefHat
} from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUSES = ['pending', 'confirmed', 'preparing', 'out', 'delivered'];

const STATUS_CONFIG = {
  pending: { label: 'Order Placed', icon: ClipboardList, color: 'blue', dot: 'bg-blue-500' },
  confirmed: { label: 'Confirmed', icon: CheckCircle2, color: 'amber', dot: 'bg-amber-500' },
  preparing: { label: 'Preparing', icon: ChefHat, color: 'orange', dot: 'bg-orange-500' },
  out: { label: 'Out for Delivery', icon: Bike, color: 'purple', dot: 'bg-purple-500' },
  delivered: { label: 'Delivered', icon: CheckCircle2, color: 'emerald', dot: 'bg-emerald-500' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'red', dot: 'bg-red-400' },
};

const COLOR_MAP = {
  blue: { badge: 'bg-blue-50 text-blue-600 border-blue-100', bar: 'bg-blue-500' },
  amber: { badge: 'bg-amber-50 text-amber-600 border-amber-100', bar: 'bg-amber-500' },
  orange: { badge: 'bg-orange-50 text-orange-600 border-orange-100', bar: 'bg-orange-500' },
  purple: { badge: 'bg-purple-50 text-purple-600 border-purple-100', bar: 'bg-purple-500' },
  emerald: { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', bar: 'bg-emerald-500' },
  red: { badge: 'bg-red-50 text-red-500 border-red-100', bar: 'bg-red-400' },
};

// ─── Mini Progress Bar ─────────────────────────────────────────────────────────
function StatusBar({ status }) {
  if (status === 'cancelled') return null;
  const idx = STATUSES.indexOf(status);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / STATUSES.length) * 100);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const barColor = COLOR_MAP[cfg.color]?.bar ?? 'bg-orange-500';

  return (
    <div className="px-5 pb-4">
      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1.5">
        <span>Order Placed</span>
        <span>Delivered</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order }) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const colors = COLOR_MAP[cfg.color] ?? COLOR_MAP.blue;
  const Icon = cfg.icon;
  const isCancelled = order.status === 'cancelled';

  const date = order.createdAt?.toDate
    ? order.createdAt.toDate().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    : 'Just now';

  // Show first 2 items, rest as "+N more"
  const preview = order.items?.slice(0, 2) ?? [];
  const extra = (order.items?.length ?? 0) - preview.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
      onClick={() => navigate(`/order/${order.id}`)}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden cursor-pointer transition-shadow"
    >
      {/* Top strip — status color accent */}
      <div className={`h-1 ${isCancelled ? 'bg-red-400' : colors.bar}`} />

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
            ${isCancelled ? 'bg-red-50' : 'bg-orange-50'}`}>
            <Icon size={18} className={isCancelled ? 'text-red-400' : 'text-orange-500'} />
          </div>
          <div>
            <p className="font-black text-slate-900 text-sm">
              {order.isPickupDropOrder
                ? 'Pickup & Drop'
                : `${order.items?.length ?? 0} item${order.items?.length !== 1 ? 's' : ''}`}
              {' · '}₹{order.totalAmount}
            </p>
            <p className="text-slate-400 text-xs font-semibold flex items-center gap-1 mt-0.5">
              <Clock size={10} />{date}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${colors.badge}`}>
            {cfg.label}
          </span>
          <ChevronRight size={15} className="text-slate-300" />
        </div>
      </div>

      {/* Progress bar */}
      <StatusBar status={order.status} />

      {/* Item thumbnails */}
      {preview.length > 0 && (
        <div className="px-5 pb-4 flex items-center gap-2">
          {preview.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-2xl px-3 py-2 flex-1 min-w-0">
              {item.image ? (
                <img src={item.image} alt={item.productName}
                  className="w-8 h-8 rounded-xl object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                  <Package size={14} className="text-orange-400" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-slate-700 text-xs truncate">{item.productName}</p>
                <p className="text-slate-400 text-[10px] font-semibold">×{item.quantity}</p>
              </div>
            </div>
          ))}
          {extra > 0 && (
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 font-black text-xs">
              +{extra}
            </div>
          )}
        </div>
      )}

      {/* Address */}
      {order.address && (
        <div className="px-5 pb-4 flex items-center gap-1.5 text-slate-400 text-xs font-semibold border-t border-slate-50 pt-3">
          <MapPin size={11} className="text-orange-400 shrink-0" />
          <span className="truncate">{order.address}</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Order() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    // Real-time listener
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => {
      console.error(err);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 text-center gap-5">
        <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl flex items-center justify-center">
          <ShoppingBag size={40} className="text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">My Orders</h1>
          <p className="text-slate-400 mt-1.5 text-sm font-semibold">Login to see your order history</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/auth')}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/25 cursor-pointer"
        >
          Login to Continue
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/20 pb-28 md:pb-16">

      {/* ── Header ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-5 sticky top-0 md:top-[64px] z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">My Orders</h1>
            <p className="text-slate-400 text-xs font-semibold mt-0.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Live updates enabled
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-slate-900">{orders.length}</p>
            <p className="text-xs font-semibold text-slate-400">total</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-3">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center">
              <Loader2 size={30} className="text-orange-500 animate-spin" />
            </div>
            <p className="text-slate-400 font-semibold text-sm">Loading your orders…</p>
          </div>
        )}

        {/* Empty */}
        {!loading && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 gap-5 text-center"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-orange-50 rounded-3xl flex items-center justify-center">
              <UtensilsCrossed size={40} className="text-orange-300" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-xl">No orders yet</p>
              <p className="text-slate-400 text-sm mt-1.5 font-semibold">
                Your order history will appear here
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/product')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg shadow-orange-500/25 cursor-pointer"
            >
              Browse product
            </motion.button>
          </motion.div>
        )}

        {/* Order cards */}
        <AnimatePresence>
          {!loading && orders.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <OrderCard order={o} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
