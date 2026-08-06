import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import {
  Home,
  ShoppingBag,
  Search as SearchIcon,
  ShoppingCart,
  LogIn,
  Store,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/* ─── route definitions ─── */
const desktopLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/product', label: 'Product', icon: Store },
  { to: '/order', label: 'Orders', icon: ShoppingBag },
];

const mobileTabLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/product', label: 'Product', icon: Store },
  { to: '/order', label: 'Orders', icon: ShoppingBag },
];

/* ──────────────────────────────────────────────── */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalItems, favorites, cartDrawerOpen, openCartDrawer, closeCartDrawer } = useCart();

  /* ── Firestore profile (for phone-OTP users who lack displayName/email on Auth) ── */
  const [navProfile, setNavProfile] = useState(null);
  useEffect(() => {
    if (!user) { setNavProfile(null); return; }
    getDoc(doc(db, 'users', user.uid))
      .then((snap) => { if (snap.exists()) setNavProfile(snap.data()); })
      .catch(() => {});
  }, [user?.uid]);

  const navDisplayName = navProfile?.name || user?.displayName || '';
  const navSub         = navProfile?.phone || user?.email || '';
  const navInitial     = (navDisplayName?.[0] || navSub?.[0] || '?').toUpperCase();
  const navTitle       = navDisplayName || navSub || 'Profile';

  /* scroll detection — must be before any early return */
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 20));

  /* Ctrl+K shortcut — navigate to /search */
  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [navigate]);

  /* hide on auth page — after ALL hooks */
  if (location.pathname === '/auth') return null;

  return (
    <>
      <CartDrawer open={cartDrawerOpen} onClose={closeCartDrawer} />

      {/* ═══════════════════════════════════════════
          MOBILE TOP NAVBAR  (< md)
      ═══════════════════════════════════════════ */}
      <motion.header
        aria-label="Mobile Top Navigation"
        initial={false}
        animate={scrolled
          ? { backgroundColor: 'rgba(255,255,255,0.95)', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }
          : { backgroundColor: 'rgba(255,255,255,0.85)', boxShadow: 'none' }
        }
        transition={{ duration: 0.2 }}
        className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2.5 backdrop-blur-xl border-b border-slate-100/70"
      >
        {/* Logo */}
        <NavLink to="/" aria-label="NextTo Home" className="flex items-center gap-2.5 focus-visible:outline-none">
          <img
            src="/logo.jpeg"
            alt="NextTo"
            className="h-9 w-auto rounded-xl object-contain drop-shadow-sm"
          />
        </NavLink>

        {/* Right: search + cart */}
        <div className="flex items-center gap-2">
          {/* Search button — mobile */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => navigate('/search')}
            aria-label="Search"
            className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 cursor-pointer shadow-sm"
          >
            <SearchIcon size={14} className="text-orange-400 shrink-0" />
            <span className="text-xs text-slate-400 font-semibold">Search…</span>
          </motion.button>

          {/* Cart icon */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={openCartDrawer}
            aria-label="Open cart"
            className="relative w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 cursor-pointer"
          >
            <ShoppingCart size={17} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key="mob-top-badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 bg-orange-500 text-white text-[8px] font-black min-w-[14px] h-3.5 rounded-full flex items-center justify-center px-0.5 leading-none"
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.header>

      {/* ═══════════════════════════════════════════
          DESKTOP TOP NAVBAR  (md and above)
      ═══════════════════════════════════════════ */}
      <motion.nav
        aria-label="Main Navigation"
        initial={false}
        animate={scrolled
          ? { backgroundColor: 'rgba(255,255,255,0.92)', boxShadow: '0 4px 24px rgba(251,146,60,0.10)' }
          : { backgroundColor: 'rgba(255,255,255,0.70)', boxShadow: 'none' }
        }
        transition={{ duration: 0.25 }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 items-center justify-between px-6 lg:px-10 py-3 backdrop-blur-xl border-b border-slate-100/60"
      >
        {/* Logo */}
        <NavLink
          to="/"
          aria-label="NextTo Home"
          className="flex items-center gap-3 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-xl"
        >
          <img
            src="/logo.jpeg"
            alt="NextTo"
            className="h-10 w-auto rounded-2xl object-contain drop-shadow-sm transition-transform hover:scale-105"
          />
        </NavLink>

        {/* Centre links */}
        <div className="flex items-center gap-1" role="productbar">
          {desktopLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              role="productitem"
              className={({ isActive }) =>
                `relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[13px] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500
                ${isActive ? 'text-orange-500' : 'text-slate-600 hover:text-orange-500 hover:bg-orange-50/60'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center gap-2">
                    <Icon size={16} className={isActive ? 'text-orange-500' : 'text-slate-400'} />
                    <span>{label}</span>
                    {to === '/favorites' && favorites?.length > 0 && (
                      <span className="absolute -top-1.5 -right-3.5 bg-red-550 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                        {favorites.length}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <motion.span
                      layoutId="desktop-pill"
                      className="absolute inset-0 bg-orange-50 rounded-xl border border-orange-100/60 -z-10"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2.5 shrink-0">

          {/* Search bar — desktop */}
          <button
            onClick={() => navigate('/search')}
            aria-label="Open search (Ctrl+K)"
            className="hidden lg:flex items-center gap-2.5 bg-white border border-slate-200 hover:border-orange-300 rounded-2xl px-4 py-2.5 w-[220px] cursor-pointer transition-all duration-200 group shadow-sm hover:shadow-md hover:shadow-orange-100/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <div className="w-6 h-6 rounded-lg bg-orange-50 flex items-center justify-center shrink-0 group-hover:bg-orange-100 transition-colors">
              <SearchIcon size={13} className="text-orange-400" />
            </div>
            <span className="text-xs text-slate-400 font-semibold select-none flex-1 text-left">Search anything…</span>
            <kbd className="text-[10px] font-bold text-slate-300 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 shrink-0">⌘K</kbd>
          </button>

          {/* Cart */}
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            onClick={openCartDrawer}
            aria-label="Open cart"
            className="relative w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-colors cursor-pointer"
          >
            <ShoppingCart size={18} />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key="badge"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-black min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-0.5 leading-none"
                >
                  {totalItems > 99 ? '99+' : totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Order Now CTA */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/product')}
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-orange-500/25 transition-colors shrink-0 cursor-pointer"
          >
            Order Now 🚀
          </motion.button>

          {/* Auth avatar / login */}
          {user ? (
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate('/me')}
              title={navTitle}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-300/30 shrink-0 cursor-pointer"
            >
              {navInitial}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
              className="border border-orange-400 text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-xl font-bold text-xs transition-colors shrink-0 cursor-pointer"
            >
              Login
            </motion.button>
          )}
        </div>
      </motion.nav>



      {/* ═══════════════════════════════════════════
          MOBILE / TABLET BOTTOM TAB BAR  (< md)
      ═══════════════════════════════════════════ */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-slate-100 shadow-[0_-6px_30px_rgba(0,0,0,0.07)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-stretch justify-around px-1 pt-1 pb-1.5">

          {/* standard route tabs */}
          {mobileTabLinks.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="flex-1 focus-visible:outline-none"
            >
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl mx-0.5 transition-colors ${isActive ? 'text-orange-500' : 'text-slate-400'
                    }`}
                >
                  {/* active background pill */}
                  {isActive && (
                    <motion.span
                      layoutId="mob-tab-pill"
                      className="absolute inset-0 bg-orange-50 rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}

                  {/* icon */}
                  <span className="relative z-10">
                    <Icon
                      size={22}
                      strokeWidth={isActive ? 2.2 : 1.8}
                      className={isActive ? 'text-orange-500' : 'text-slate-400'}
                    />
                    {to === '/favorites' && favorites?.length > 0 && (
                      <span className="absolute -top-1 -right-2.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-sm">
                        {favorites.length}
                      </span>
                    )}
                  </span>

                  {/* label */}
                  <span className={`relative z-10 text-[10px] font-bold leading-none tracking-wide ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </motion.div>
              )}
            </NavLink>
          ))}

          {/* Login / Me tab */}
          {user ? (
            <NavLink to="/me" className="flex-1 focus-visible:outline-none">
              {({ isActive }) => (
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  className={`relative flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl mx-0.5 transition-colors ${isActive ? 'text-orange-500' : 'text-slate-400'
                    }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mob-tab-pill"
                      className="absolute inset-0 bg-orange-50 rounded-xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  {/* avatar circle */}
                  <span className="relative z-10 w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-black text-[11px] shadow-sm shadow-orange-300/30">
                    {navInitial}
                  </span>
                  <span className={`relative z-10 text-[10px] font-bold leading-none tracking-wide ${isActive ? 'text-orange-500' : 'text-slate-400'}`}>
                    Me
                  </span>
                </motion.div>
              )}
            </NavLink>
          ) : (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => navigate('/auth')}
              aria-label="Login"
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 mx-0.5 rounded-xl cursor-pointer text-slate-400 hover:text-orange-500 transition-colors"
            >
              <LogIn size={22} strokeWidth={1.8} />
              <span className="text-[10px] font-bold leading-none tracking-wide">Login</span>
            </motion.button>
          )}
        </div>
      </nav>

      {/* spacer so content isn't hidden behind mobile bottom bar */}
      <div className="md:hidden h-[72px]" />
    </>
  );
}