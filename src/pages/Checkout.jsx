import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ChevronDown, Loader2, CheckCircle2, AlertCircle,
  ShoppingBag, ArrowLeft, Package, Truck, Tag, Wallet, Banknote, Phone,
  Bike, Navigation, PauseCircle, CloudRain, Search, X, Bookmark, Save, Route,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useCheckout } from '../hooks/useCheckout';

// ─── Delivery Location Modal Selector ─────────────────────────────────────────
function LocationDropdown({ locations, selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpen = () => {
    if (disabled) return;
    setSearchQuery('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSelect = (loc) => {
    onSelect(loc);
    setOpen(false);
  };

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase().trim();
    return locations.filter((loc) =>
      loc.name?.toLowerCase().includes(q)
    );
  }, [locations, searchQuery]);

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 hover:border-orange-400 bg-white text-sm font-semibold text-slate-800 focus:outline-none transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-xs hover:shadow-md"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 text-left">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white text-orange-500 transition-colors">
            <MapPin size={20} />
          </div>
          <div className="flex-1 min-w-0">
            {selected ? (
              <p className="font-bold text-slate-900 text-sm truncate">{selected.name}</p>
            ) : (
              <div>
                <p className="text-slate-600 font-bold text-sm">Select your delivery area</p>
                <p className="text-xs text-slate-400 font-medium">Choose from {locations.length || '100+'} available locations</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3.5 py-2 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-colors">
            {selected ? 'Change Area' : 'Select Area'}
          </span>
        </div>
      </button>

      {/* Modal Dialog */}
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 border border-slate-100"
            >
              {/* Modal Header */}
              <div className="px-5 pt-5 pb-4 border-b border-slate-100 bg-gradient-to-r from-orange-50/40 via-white to-amber-50/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-base leading-tight">Select Delivery Area</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {locations.length} delivery areas available
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
                <div className="relative flex items-center">
                  <Search size={18} className="absolute left-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by area name or location..."
                    autoFocus
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Counter / Header badge */}
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 text-xs font-extrabold text-slate-400 flex items-center justify-between shrink-0">
                <span>
                  {searchQuery ? `FOUND (${filteredLocations.length})` : `ALL AREAS (${locations.length})`}
                </span>
                {selected && (
                  <span className="text-orange-600 font-bold">Current: {selected.name}</span>
                )}
              </div>

              {/* Scrollable Locations List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[55vh]">
                {filteredLocations.length > 0 ? (
                  filteredLocations.map((loc) => {
                    const isSelected = selected?.id === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelect(loc)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-orange-50/90 border-2 border-orange-500 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border border-slate-150 hover:border-orange-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'bg-orange-500 text-white'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {isSelected ? <CheckCircle2 size={18} /> : <MapPin size={18} />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-bold truncate ${
                                isSelected ? 'text-orange-950' : 'text-slate-800'
                              }`}
                            >
                              {loc.name}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="ml-2 px-2.5 py-1 rounded-lg bg-orange-500 text-white text-xs font-black shrink-0">
                            Selected
                          </span>
                        )}
                      </button>
                    );
                  })
                ) : (() => {
                    // When search returns nothing, offer the "Other" area as a fallback
                    // so users whose area isn't listed can still proceed.
                    const OTHER_ID = 'VNQRg6tm55nOe4PFepfg';
                    const otherLoc = locations.find((l) => l.id === OTHER_ID);
                    const isSelected = selected?.id === OTHER_ID;

                    return otherLoc ? (
                      <div>
                        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wide py-3 px-4">
                          No exact match — try selecting "Other"
                        </p>
                        <button
                          type="button"
                          onClick={() => handleSelect(otherLoc)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-orange-50/90 border-2 border-orange-500 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border border-slate-150 hover:border-orange-200 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {isSelected ? <CheckCircle2 size={18} /> : <MapPin size={18} />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-bold truncate ${isSelected ? 'text-orange-950' : 'text-slate-800'}`}>
                                {otherLoc.name}
                              </p>
                              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                                Your area isn't listed? Pick this option
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="ml-2 px-2.5 py-1 rounded-lg bg-orange-500 text-white text-xs font-black shrink-0">
                              Selected
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="w-full mt-2 text-xs font-bold text-slate-400 hover:text-slate-600 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          ← Back to all areas
                        </button>
                      </div>
                    ) : (
                      <div className="py-12 px-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mx-auto mb-3">
                          <Search size={22} />
                        </div>
                        <p className="font-bold text-slate-800 text-sm">No delivery areas found</p>
                        <p className="text-xs text-slate-400 mt-1">
                          No location matches "{searchQuery}". Try searching with a different keyword.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="mt-3 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    );
                  })()
}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Order Summary Item ────────────────────────────────────────────────────────
function SummaryItem({ item }) {
  const price = item.discountPrice ?? item.price;
  return (
    <div className="flex items-center gap-3">
      {item.images?.[0] ? (
        <img
          src={item.images[0]}
          alt={item.name}
          className="w-12 h-12 rounded-xl object-cover shrink-0"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
          <Package size={18} className="text-orange-300" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
        <p className="text-slate-400 text-xs font-semibold mt-0.5">₹{price} × {item.qty}</p>
      </div>
      <p className="font-black text-slate-900 text-sm shrink-0">₹{price * item.qty}</p>
    </div>
  );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function Checkout() {
  const navigate = useNavigate();
  const { cart, totalPrice, pickupOrderData, isOnline } = useCart();

  const {
    // Form state
    address, setAddress,
    mobile, setMobile,
    paymentMethod, setPaymentMethod,
    saveAddress, setSaveAddress,
    isAddressAutoFilled, handleSaveAddressNow,

    // Delivery locations
    locations, selectedLoc, setSelectedLoc, locLoading,

    // Coupon
    couponCode, setCouponCode,
    couponResult,
    couponError, setCouponError,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,

    // Derived
    isPickupDropOrder,
    needsDeliveryArea,
    pickupDropCharge,
    deliveryCharge,
    rainSurcharge,
    rainMessage,
    distanceServiceFee,
    couponCartDiscount,
    couponDeliveryDiscount,
    totalAmount,
    belowMin,
    canOrder,

    // Actions
    placing,
    handlePlaceOrder,
  } = useCheckout();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-10">

      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <h1 className="text-lg font-black text-slate-900">Checkout</h1>
          <p className="text-xs text-slate-400 font-semibold">Review and place your order</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ── Store Paused Banner ── */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-4"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <PauseCircle size={20} className="text-amber-500" />
              </div>
              <div>
                <p className="font-black text-amber-800 text-sm">Store is temporarily paused</p>
                <p className="text-amber-600 text-xs font-semibold mt-0.5 leading-relaxed">
                  We're not accepting new orders right now. Please check back soon!
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Rain Surcharge Banner ── */}
        <AnimatePresence>
          {rainSurcharge > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 bg-blue-50 border-2 border-blue-200 rounded-2xl px-4 py-4"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                <CloudRain size={20} className="text-blue-500" />
              </div>
              <div>
                <p className="font-black text-blue-800 text-sm">Rain Surcharge Applied</p>
                <p className="text-blue-600 text-xs font-semibold mt-0.5 leading-relaxed">
                  {rainMessage || 'Rainy weather surcharge applied'} — +₹{rainSurcharge}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Distance Service Fee Banner ── */}
        <AnimatePresence>
          {distanceServiceFee > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-3 bg-violet-50 border-2 border-violet-200 rounded-2xl px-4 py-4"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Route size={20} className="text-violet-500" />
              </div>
              <div>
                <p className="font-black text-violet-800 text-sm">Distance Service Fee</p>
                <p className="text-violet-600 text-xs font-semibold mt-0.5 leading-relaxed">
                  A service fee applies for your delivery distance — +₹{distanceServiceFee}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Order Summary ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-50">
            <ShoppingBag size={17} className="text-orange-500" />
            <h2 className="font-black text-slate-900 text-sm">Order Summary</h2>
            <span className="ml-auto text-xs font-black text-slate-400">
              {`${cart.length + (isPickupDropOrder ? 1 : 0)} item${cart.length + (isPickupDropOrder ? 1 : 0) !== 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="px-5 py-4 space-y-4">
            {cart.map((item) => (
              <SummaryItem key={item.id} item={item} />
            ))}

            {isPickupDropOrder && (
              <div className="rounded-2xl border border-purple-100 bg-purple-50 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0">
                    <Bike size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-purple-900 text-sm">Pickup &amp; Drop</p>
                  </div>
                </div>
                <div className="grid gap-1.5 pl-0.5">
                  <p className="flex items-center gap-2 text-xs font-bold text-purple-700">
                    <Navigation size={12} className="text-purple-400 shrink-0" />
                    <span className="truncate">From: {pickupOrderData.pickupLoc?.name}</span>
                  </p>
                  <p className="flex items-center gap-2 text-xs font-bold text-purple-700">
                    <MapPin size={12} className="text-purple-400 shrink-0" />
                    <span className="truncate">To: {pickupOrderData.dropLoc?.name}</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Delivery Location / Pickup Route ── */}
        {needsDeliveryArea ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2.5 mb-1">
              <Truck size={17} className="text-orange-500" />
              <h2 className="font-black text-slate-900 text-sm">Delivery Area</h2>
            </div>

            {locLoading ? (
              <div className="flex items-center gap-2 py-3 text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin text-orange-400" />
                Loading delivery areas…
              </div>
            ) : locations.length === 0 ? (
              <div className="flex items-center gap-2 py-3 text-red-400 text-sm font-semibold">
                <AlertCircle size={15} /> No delivery areas available right now
              </div>
            ) : (
              <LocationDropdown
                locations={locations}
                selected={selectedLoc}
                onSelect={setSelectedLoc}
                disabled={locLoading}
              />
            )}

            {/* Min-order warning */}
            <AnimatePresence>
              {belowMin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-xs font-semibold">
                    <AlertCircle size={14} className="shrink-0" />
                    Add ₹{selectedLoc.minOrder - totalPrice} more to meet the minimum order of ₹{selectedLoc.minOrder} for {selectedLoc.name}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : isPickupDropOrder ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2.5 mb-1">
              <Bike size={17} className="text-purple-500" />
              <h2 className="font-black text-slate-900 text-sm">Pickup &amp; Drop Route</h2>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center gap-2 rounded-2xl bg-purple-50 border border-purple-100 px-4 py-3">
                <Navigation size={14} className="text-purple-400 shrink-0" />
                <span className="text-sm font-bold text-purple-800 truncate">{pickupOrderData.pickupLoc?.name}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-purple-50 border border-purple-100 px-4 py-3">
                <MapPin size={14} className="text-purple-400 shrink-0" />
                <span className="text-sm font-bold text-purple-800 truncate">{pickupOrderData.dropLoc?.name}</span>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Mobile Number ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2.5 mb-1">
            <Phone size={17} className="text-orange-500" />
            <h2 className="font-black text-slate-900 text-sm">Mobile Number</h2>
          </div>
          <input
            type="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Enter your 10-digit mobile number"
            maxLength={10}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
          />
          {mobile.length > 0 && mobile.length < 10 && (
            <p className="text-xs text-amber-500 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> Enter a valid 10-digit number
            </p>
          )}
        </div>

        {/* ── Delivery / Pickup Address ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2.5">
              <MapPin size={17} className="text-orange-500" />
              <h2 className="font-black text-slate-900 text-sm">
                {isPickupDropOrder ? 'Pickup / Drop Address Details' : 'Delivery Address'}
              </h2>
            </div>
            {isAddressAutoFilled && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shrink-0">
                <CheckCircle2 size={12} className="text-emerald-500" /> Saved Address Loaded
              </span>
            )}
          </div>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={
              isPickupDropOrder
                ? 'Enter pickup and drop address details — building, landmark, contact person…'
                : 'Enter your full delivery address — flat/house no., street, landmark…'
            }
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all resize-none"
          />

          {/* Save Address Options */}
          <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100/80">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 focus:ring-orange-400 accent-orange-500 cursor-pointer"
              />
              <span>Save this address for future orders</span>
            </label>

            {address.trim() && (
              <button
                type="button"
                onClick={handleSaveAddressNow}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Bookmark size={13} /> Save Now
              </button>
            )}
          </div>
        </div>

        {/* ── Coupon Code ── */}
        {cart.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2.5 mb-1">
              <Tag size={17} className="text-orange-500" />
              <h2 className="font-black text-slate-900 text-sm">Coupon Code</h2>
            </div>

            {!couponResult ? (
              <>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && couponCode.trim() && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    maxLength={30}
                    className="flex-1 px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-bold text-slate-800 uppercase placeholder-slate-400 placeholder:normal-case focus:outline-none focus:border-orange-400 focus:bg-white transition-all tracking-wider"
                  />
                  <button
                    type="button"
                    disabled={!couponCode.trim() || couponLoading}
                    onClick={handleApplyCoupon}
                    className="px-5 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-sm transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
                  >
                    {couponLoading ? <Loader2 size={15} className="animate-spin" /> : 'Apply'}
                  </button>
                </div>
                {couponError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold">
                    <AlertCircle size={13} className="shrink-0" />
                    {couponError}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-start justify-between gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="flex items-center gap-1.5 text-sm font-black text-green-700">
                    <CheckCircle2 size={15} className="shrink-0 text-green-500" />
                    <span className="tracking-wider">{couponResult.coupon.code}</span>
                    <span className="font-semibold text-green-600">applied!</span>
                  </p>
                  {couponResult.coupon.description && (
                    <p className="text-xs text-green-600 font-semibold mt-1 pl-5">{couponResult.coupon.description}</p>
                  )}
                  <div className="pl-5 mt-1 space-y-0.5">
                    {couponResult.cartDiscount > 0 && (
                      <p className="text-xs font-bold text-green-700">Cart discount: −₹{couponResult.cartDiscount}</p>
                    )}
                    {couponResult.deliveryDiscount > 0 && (
                      <p className="text-xs font-bold text-green-700">Delivery discount: −₹{couponResult.deliveryDiscount}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="text-xs font-black text-red-400 hover:text-red-600 transition-colors shrink-0 mt-0.5 cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Price Breakdown ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Tag size={17} className="text-orange-500" />
            <h2 className="font-black text-slate-900 text-sm">Bill Details</h2>
          </div>
          <div className="space-y-2.5">
            {cart.length > 0 && (
              <div className="flex justify-between text-sm font-semibold text-slate-500">
                <span>Item total</span>
                <span>₹{totalPrice}</span>
              </div>
            )}
            {isPickupDropOrder && (
              <div className="flex justify-between text-sm font-semibold text-slate-500">
                <span>Pickup &amp; Drop</span>
                <span className="text-purple-600 font-bold">₹{pickupDropCharge}</span>
              </div>
            )}
            {needsDeliveryArea && (
              <div className="flex justify-between text-sm font-semibold text-slate-500">
                <span>Delivery charge</span>
                {selectedLoc ? (
                  <span className={couponDeliveryDiscount > 0 ? 'line-through text-slate-400' : 'text-orange-500 font-bold'}>
                    ₹{deliveryCharge}
                  </span>
                ) : (
                  <span className="text-slate-300">— select area</span>
                )}
              </div>
            )}
            {couponCartDiscount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-green-600">
                <span className="flex items-center gap-1">
                  <Tag size={12} className="shrink-0" /> Coupon discount
                </span>
                <span>−₹{couponCartDiscount}</span>
              </div>
            )}
            {couponDeliveryDiscount > 0 && (
              <div className="flex justify-between text-sm font-semibold text-green-600">
                <span className="flex items-center gap-1">
                  <Truck size={12} className="shrink-0" /> Delivery discount
                </span>
                <span>−₹{couponDeliveryDiscount}</span>
              </div>
            )}
            {rainSurcharge > 0 && (
              <div className="flex justify-between text-sm font-semibold text-blue-600">
                <span className="flex items-center gap-1">
                  <CloudRain size={12} className="shrink-0" /> Rain surcharge
                </span>
                <span>+₹{rainSurcharge}</span>
              </div>
            )}
            {distanceServiceFee > 0 && (
              <div className="flex justify-between text-sm font-semibold text-violet-600">
                <span className="flex items-center gap-1">
                  <Route size={12} className="shrink-0" /> Distance service fee
                </span>
                <span>+₹{distanceServiceFee}</span>
              </div>
            )}
            {(couponCartDiscount > 0 || couponDeliveryDiscount > 0) && (
              <div className="flex justify-between text-xs font-bold text-green-500 bg-green-50 px-3 py-1.5 rounded-xl">
                <span>You save</span>
                <span>₹{couponCartDiscount + couponDeliveryDiscount}</span>
              </div>
            )}
            <div className="border-t border-slate-100 pt-2.5 flex justify-between font-black text-slate-900 text-base">
              <span>To Pay</span>
              <span>₹{Math.max(totalAmount, 0)}</span>
            </div>
          </div>
        </div>

        {/* ── Payment Method ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <Wallet size={17} className="text-orange-500" />
            <h2 className="font-black text-slate-900 text-sm">Payment Method</h2>
          </div>
          <div className="space-y-3">

            {/* COD */}
            <button
              type="button"
              onClick={() => setPaymentMethod('cod')}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all cursor-pointer
                ${paymentMethod === 'cod'
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'}`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                ${paymentMethod === 'cod' ? 'bg-orange-500' : 'bg-slate-100'}`}>
                <Banknote size={18} className={paymentMethod === 'cod' ? 'text-white' : 'text-slate-400'} />
              </div>
              <div className="flex-1 text-left">
                <p className={`font-black text-sm ${paymentMethod === 'cod' ? 'text-orange-600' : 'text-slate-800'}`}>
                  Cash on Delivery
                </p>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">Pay when your order arrives</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0
                ${paymentMethod === 'cod' ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                {paymentMethod === 'cod' && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>

            {/* UPI — coming soon */}
            <div className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed select-none">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                <Wallet size={18} className="text-slate-400" />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <p className="font-black text-sm text-slate-500">UPI / Online</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200">
                    Coming Soon
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-semibold mt-0.5">GPay, PhonePe, Paytm &amp; more</p>
              </div>
              <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0" />
            </div>

          </div>
        </div>

        {/* ── Place Order Button ── */}
        <motion.button
          whileHover={{ scale: canOrder ? 1.02 : 1 }}
          whileTap={{ scale: canOrder ? 0.97 : 1 }}
          onClick={handlePlaceOrder}
          disabled={!canOrder}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {placing ? (
            <Loader2 size={20} className="animate-spin" />
          ) : !isOnline ? (
            <>
              <PauseCircle size={20} />
              Store Paused
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              Place Order · ₹{Math.max(totalAmount, 0)}
            </>
          )}
        </motion.button>

        {/* Hint text below button */}
        {needsDeliveryArea && !selectedLoc && (
          <p className="text-center text-xs text-slate-400 font-semibold -mt-2">
            Select a delivery area to continue
          </p>
        )}
        {(!needsDeliveryArea || selectedLoc) && mobile.trim().length < 10 && (
          <p className="text-center text-xs text-slate-400 font-semibold -mt-2">
            Enter a valid 10-digit mobile number to continue
          </p>
        )}
        {(!needsDeliveryArea || selectedLoc) && mobile.trim().length >= 10 && !address.trim() && (
          <p className="text-center text-xs text-slate-400 font-semibold -mt-2">
            {isPickupDropOrder
              ? 'Enter pickup/drop address details to continue'
              : 'Enter your delivery address to continue'}
          </p>
        )}
      </div>
    </div>
  );
}
