import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import {
  Home,
  UtensilsCrossed,
  ShoppingBag,
  Search as SearchIcon,
  ShoppingCart,
  LogIn,
  X,
  Package,
  MapPin,
  MessageSquare,
  Store,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';
import { collection, getDocs } from 'firebase/firestore';
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
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allData, setAllData] = useState({ products: [], restaurants: [] });
  const [dataLoaded, setDataLoaded] = useState(false);
  const searchRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { totalItems, favorites } = useCart();

  /* scroll detection — must be before any early return */
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 20));

  /* Ctrl+K shortcut */
  useEffect(() => {
    const down = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, []);

  /* load search data once on first open */
  useEffect(() => {
    if (searchOpen && !dataLoaded) {
      Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'restaurants')),
      ]).then(([pSnap, rSnap]) => {
        setAllData({
          products: pSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
          restaurants: rSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
        });
        setDataLoaded(true);
      }).catch(console.error);
    }
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 80);
  }, [searchOpen]);

  /* filtered results */
  const q = searchQuery.trim().toLowerCase();
  const resultProducts = q
    ? allData.products.filter((p) =>
      p.name?.toLowerCase().includes(q) ||
      p.serviceType?.toLowerCase().includes(q)
    ).slice(0, 5)
    : [];
  const resultRestaurants = q
    ? allData.restaurants.filter((r) =>
      r.name?.toLowerCase().includes(q) ||
      r.address?.toLowerCase().includes(q)
    ).slice(0, 3)
    : [];
  const hasResults = resultProducts.length > 0 || resultRestaurants.length > 0;

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery('');
  }, []);

  const goTo = (path) => { closeSearch(); navigate(path); };

  /* hide on auth page — after ALL hooks */
  if (location.pathname === '/auth') return null;

  return (
    <>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

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
          {/* Search button */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex items-center gap-1.5 bg-slate-100 border border-slate-200/50 rounded-xl px-3 py-1.5 cursor-pointer"
          >
            <SearchIcon size={15} className="text-slate-500" />
            <span className="text-xs text-slate-400 font-semibold">Search…</span>
          </motion.button>

          {/* Cart icon */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => setCartOpen(true)}
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

          {/* Search bar */}
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Open search (Ctrl+K)"
            className="hidden lg:flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/50 rounded-xl px-4 py-2 w-[190px] cursor-pointer transition-all duration-200 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <SearchIcon size={14} className="text-slate-400 group-hover:text-orange-500 transition-colors shrink-0" />
            <span className="text-xs text-slate-400 font-semibold select-none flex-1 text-left">Search…</span>
            <kbd className="text-[10px] font-bold text-slate-300 bg-white border border-slate-200 rounded px-1.5 py-0.5 shrink-0">⌘K</kbd>
          </button>

          {/* Cart */}
          <motion.button
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.93 }}
            onClick={() => setCartOpen(true)}
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
              title={user.displayName || user.email}
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400 flex items-center justify-center text-white font-black text-sm shadow-md shadow-orange-300/30 shrink-0 cursor-pointer"
            >
              {(user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
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
          SEARCH OVERLAY
      ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* backdrop */}
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSearch}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            {/* panel */}
            <motion.div
              key="search-panel"
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[61] w-[92vw] max-w-xl"
            >
              {/* Input row */}
              <div className="flex items-center gap-3 bg-white rounded-2xl shadow-2xl shadow-black/20 px-4 py-3 border border-slate-200/60">
                <SearchIcon size={18} className="text-orange-500 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search food, restaurants…"
                  className="flex-1 text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none bg-transparent"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Results dropdown */}
              <AnimatePresence>
                {q && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.18 }}
                    className="mt-2 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-slate-100 overflow-hidden"
                  >
                    {!hasResults && (
                      <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-3">
                        <div className="space-y-1">
                          <p className="text-slate-700 font-black text-sm">No results for "{searchQuery}"</p>
                          <p className="text-slate-400 text-xs font-semibold max-w-[280px]">
                            We couldn't find matches on our site, but we can still deliver it to you!
                          </p>
                        </div>
                        <a
                          href={`https://wa.me/918799884148?text=${encodeURIComponent(`Hello Food Express! I searched for "${searchQuery}" on your website but couldn't find it. Can I order this here?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-500/10 transition-colors cursor-pointer"
                        >
                          <MessageSquare size={13} /> Order "{searchQuery}" on WhatsApp
                        </a>
                      </div>
                    )}

                    {/* Product results */}
                    {resultProducts.length > 0 && (
                      <div>
                        <p className="px-4 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Items</p>
                        {resultProducts.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => goTo(`/product/${p.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors cursor-pointer text-left"
                          >
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                                <Package size={16} className="text-orange-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5 flex-wrap">
                                <span>{p.name}</span>
                                {p.serviceType && (
                                  <span className={`inline-block border text-[9px] font-black px-1.5 py-0.5 rounded-md capitalize ${p.serviceType.toLowerCase() === 'food' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                    p.serviceType.toLowerCase() === 'grocery' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      p.serviceType.toLowerCase() === 'medicine' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-purple-50 text-purple-600 border-purple-100'
                                    }`}>
                                    in {p.serviceType}
                                  </span>
                                )}
                              </p>
                              <p className="text-orange-500 font-black text-xs">₹{p.discountPrice ?? p.price}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Restaurant results */}
                    {resultRestaurants.length > 0 && (
                      <div className={resultProducts.length > 0 ? 'border-t border-slate-50' : ''}>
                        <p className="px-4 pt-3 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Restaurants</p>
                        {resultRestaurants.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => goTo(`/restaurant/${r.id}`)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors cursor-pointer text-left"
                          >
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-50 overflow-hidden shrink-0">
                              {r.banner
                                ? <img src={r.banner} alt={r.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><UtensilsCrossed size={14} className="text-orange-300" /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-slate-800 text-sm truncate">{r.name}</p>
                              {r.address && (
                                <p className="flex items-center gap-1 text-slate-400 text-xs truncate">
                                  <MapPin size={9} /> {r.address}
                                </p>
                              )}
                            </div>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full shrink-0 ${r.isOpen ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'
                              }`}>
                              {r.isOpen ? 'Open' : 'Closed'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-center text-[11px] text-white/70 mt-2">Press <kbd className="bg-white/20 rounded px-1">Esc</kbd> to close</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
                    {(user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
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