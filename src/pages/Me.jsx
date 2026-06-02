import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LogOut, Mail, ShoppingBag, ChevronRight,
  Package, Clock, MapPin, Star, Shield, Bell, HelpCircle, Heart
} from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Status Config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: 'Placed', color: 'bg-blue-100 text-blue-600' },
  confirmed: { label: 'Confirmed', color: 'bg-amber-100 text-amber-600' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-600' },
  out: { label: 'On the way', color: 'bg-purple-100 text-purple-600' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-600' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-500' },
};

// ─── Quick product Items ──────────────────────────────────────────────────────────
const product_ITEMS = [
  { icon: ShoppingBag, label: 'My Orders', sub: 'Track & view order history', path: '/order', color: 'bg-orange-50 text-orange-500' },
  { icon: Heart, label: 'Favorites', sub: 'Your handpicked express items', path: '/favorites', color: 'bg-red-50 text-red-500' },
  { icon: Bell, label: 'Notifications', sub: 'Order & promo alerts', path: null, color: 'bg-blue-50 text-blue-500', soon: true },
  { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs and contact us', path: null, color: 'bg-purple-50 text-purple-500', soon: true },
];

export default function Me() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setOrdersLoading(false);
    }, () => setOrdersLoading(false));
    return () => unsub();
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const initial = user?.displayName?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || '?';

  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center px-6 text-center gap-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/30">
            <ShoppingBag size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white">My Profile</h1>
          <p className="text-slate-400 mt-2 text-sm font-semibold max-w-xs mx-auto">
            Sign in to view your profile, orders, and preferences.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            className="mt-8 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/30 cursor-pointer"
          >
            Sign In / Sign Up
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/20 pb-28 md:pb-16">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 sm:px-6 pt-10 pb-24">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 rounded-full translate-y-16 -translate-x-16 blur-3xl" />

        <div className="relative z-10 max-w-lg mx-auto flex items-center gap-4">
          {/* Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-white/20 shadow-2xl shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-orange-500/30 shrink-0 border-2 border-white/10">
              {initial}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={12} className="text-emerald-400 shrink-0" />
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">Verified</span>
            </div>
            <h1 className="text-xl font-black text-white truncate">
              {user.displayName || 'Welcome!'}
            </h1>
            <p className="text-slate-400 text-xs font-semibold flex items-center gap-1 mt-0.5 truncate">
              <Mail size={11} className="shrink-0" />
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Strip (overlapping header) ── */}
      <div className="max-w-lg mx-auto px-4 sm:px-6 -mt-12 relative z-10 mb-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Orders', value: ordersLoading ? '—' : orders.length, color: 'text-orange-500' },
            { label: 'Active', value: ordersLoading ? '—' : activeOrders.length, color: 'text-blue-500' },
            { label: 'Delivered', value: ordersLoading ? '—' : deliveredOrders.length, color: 'text-emerald-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/60 p-4 text-center"
            >
              <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 space-y-4">

        {/* ── Recent Orders ── */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-orange-500" />
                <h2 className="font-black text-slate-900 text-sm">Recent Orders</h2>
              </div>
              <button
                onClick={() => navigate('/order')}
                className="text-orange-500 text-xs font-bold flex items-center gap-1 hover:text-orange-600 cursor-pointer"
              >
                See all <ChevronRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-slate-50">
              {orders.slice(0, 3).map((order, i) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
                const date = order.createdAt?.toDate
                  ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  : '—';
                return (
                  <motion.button
                    key={order.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    onClick={() => navigate(`/order/${order.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                      <Package size={16} className="text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {order.isPickupDropOrder
                          ? 'Pickup & Drop'
                          : order.isPrescriptionOrder
                            ? 'Prescription Order'
                            : `${order.items?.length ?? 0} item${order.items?.length !== 1 ? 's' : ''}`}
                      </p>
                      <p className="text-slate-400 text-xs font-semibold flex items-center gap-1 mt-0.5">
                        <Clock size={9} />{date}
                        {!order.isPrescriptionOrder && order.totalAmount > 0 && (
                          <span className="ml-1">· ₹{order.totalAmount}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <ChevronRight size={14} className="text-slate-300" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Quick product ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-50">
            <h2 className="font-black text-slate-900 text-sm">Account</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {product_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.06 }}
                  onClick={() => item.path && navigate(item.path)}
                  className={`w-full flex items-center gap-4 px-5 py-4 transition-colors text-left
                    ${item.path ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default opacity-60'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm">{item.label}</p>
                    <p className="text-slate-400 text-xs font-semibold mt-0.5">{item.sub}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    {item.soon && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200">
                        Soon
                      </span>
                    )}
                    <ChevronRight size={15} className="text-slate-300" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Delivery Address snippet ── */}
        {orders[0]?.address && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
          >
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-orange-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Last Delivery Address</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5 truncate">{orders[0].address}</p>
            </div>
          </motion.div>
        )}

        {/* ── Sign Out ── */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <LogOut size={16} />
          Sign Out
        </motion.button>

        {/* App version */}
        <p className="text-center text-[11px] text-slate-300 font-semibold pb-2">
          NextTo · v1.0.0
        </p>
      </div>
    </div>
  );
}
