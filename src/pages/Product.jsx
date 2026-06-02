import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import {
  UtensilsCrossed, Clock, MapPin, ChevronDown,
  Loader2, AlertCircle, Plus, Minus, CheckCircle2,
  ShoppingBasket, Pill, Bike, Navigation, Package,
  ImagePlus, X as XIcon, FileImage, Heart
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

// ── Cloudinary ────────────────────────────────────────────────────────────────
const CLOUD_NAME = 'ddvxbfyik';
const UPLOAD_PRESET = 'uplode';

async function uploadToCloudinary(file) {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()).secure_url;
}

/* ─── service tabs ─── */
const SERVICE_TABS = [
  { id: 'food', label: 'Food', icon: UtensilsCrossed, color: 'orange' },
  { id: 'grocery', label: 'Grocery', icon: ShoppingBasket, color: 'emerald' },
  { id: 'medicine', label: 'Medicine', icon: Pill, color: 'blue' },
  { id: 'pickup', label: 'Pickup & Drop', icon: Bike, color: 'purple' },
];

/* ─────────────────────────────────────────────
   MEDICINE — PRESCRIPTION BANNER
───────────────────────────────────────────── */
function MedicinePrescriptionBanner() {
  const { prescriptionImageUrl, setPrescriptionImageUrl } = useCart();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(prescriptionImageUrl || '');
  const inputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPrev = URL.createObjectURL(file);
    setPreview(localPrev);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setPrescriptionImageUrl(url);
      setPreview(url);
      toast.success('Prescription uploaded! 💾');
    } catch {
      toast.error('Upload failed. Try again.');
      setPreview('');
      setPrescriptionImageUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setPreview('');
    setPrescriptionImageUrl('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-5 mb-4 text-white shadow-xl shadow-blue-500/25 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute right-8 bottom-0 w-20 h-20 bg-white/5 rounded-full translate-y-6" />
        <div className="flex items-start gap-4 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
            <Pill size={22} />
          </div>
          <div>
            <h2 className="text-base font-black">Medicine Delivery</h2>
            <p className="text-blue-100 text-xs font-semibold mt-0.5 leading-relaxed">
              Upload your prescription to order medicines. Our team will verify and deliver.
            </p>
          </div>
        </div>
      </div>

      {/* Upload card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileImage size={15} className="text-blue-500" />
          <h3 className="font-black text-slate-900 text-sm">Upload Prescription</h3>
          <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Optional</span>
        </div>

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.label
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              htmlFor="rx-upload"
              className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50 rounded-2xl py-8 cursor-pointer transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center transition-colors">
                {uploading
                  ? <Loader2 size={24} className="text-blue-500 animate-spin" />
                  : <ImagePlus size={24} className="text-blue-500" />}
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors">
                  {uploading ? 'Uploading…' : 'Tap to upload prescription'}
                </p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">JPG, PNG, PDF image · Max 10 MB</p>
              </div>
              <input
                id="rx-upload"
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
                disabled={uploading}
              />
            </motion.label>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative rounded-2xl overflow-hidden border-2 border-blue-200"
            >
              <img
                src={preview}
                alt="Prescription"
                className="w-full max-h-52 object-contain bg-slate-50"
              />
              {uploading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                  <Loader2 size={28} className="text-blue-500 animate-spin" />
                </div>
              )}
              {!uploading && (
                <>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/60 hover:bg-red-500 flex items-center justify-center text-white transition-colors cursor-pointer"
                  >
                    <XIcon size={15} />
                  </button>
                  <div className="px-4 py-2.5 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-blue-500 shrink-0" />
                    <p className="text-xs font-bold text-blue-700">Prescription attached to your order</p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

const TAB_COLORS = {
  orange: { active: 'bg-orange-500 text-white shadow-orange-500/25', inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-orange-300' },
  emerald: { active: 'bg-emerald-500 text-white shadow-emerald-500/25', inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300' },
  blue: { active: 'bg-blue-500 text-white shadow-blue-500/25', inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300' },
  purple: { active: 'bg-purple-500 text-white shadow-purple-500/25', inactive: 'bg-white border border-slate-200 text-slate-600 hover:border-purple-300' },
};

/* ═══════════════════════════════════════════
   PRODUCT CARD (no star)
═══════════════════════════════════════════ */
function ProductCard({ product }) {
  const { addToCart, cart, updateQty, pickupOrderData, toggleFavorite, isFavorite } = useCart();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

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
      whileHover={{ y: -4 }}
      transition={{ duration: 0.28 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-100/40 overflow-hidden cursor-pointer group transition-shadow relative"
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
            <UtensilsCrossed size={36} />
          </div>
        )}
        {discount && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-[9px] font-black px-2.5 py-0.5 rounded-full shadow">
            {discount}% OFF
          </div>
        )}
        
        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product);
          }}
          className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-white/90 hover:bg-white border border-slate-100/60 flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-110 z-10"
        >
          <Heart
            size={13}
            className={`transition-all ${
              isFavorite(product.id) ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-400 hover:text-red-500'
            }`}
          />
        </button>

        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">Unavailable</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-black text-slate-900 text-sm leading-tight line-clamp-1">{product.name}</h3>
        <p className="text-slate-400 text-xs mt-0.5 line-clamp-1 font-medium">{product.description}</p>

        {product.preparationTime && (
          <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-400 font-semibold">
            <Clock size={11} /> {product.preparationTime}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div>
            <span className="text-orange-500 font-black text-base">₹{product.discountPrice ?? product.price}</span>
            {product.discountPrice && product.price && (
              <span className="text-slate-400 text-xs font-semibold line-through ml-1">₹{product.price}</span>
            )}
          </div>

          {product.isAvailable !== false && (
            pickupOrderData ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="p-2 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
                title="Remove Pickup & Drop first"
              >
                <Bike size={14} />
              </div>
            ) : cartItem ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => { e.stopPropagation(); updateQty(product.id, cartItem.qty - 1); }}
                  className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
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
                whileHover={{ scale: 1.12 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAdd}
                className={`p-2 rounded-xl shadow-md transition-colors cursor-pointer text-white ${added ? 'bg-emerald-500 shadow-emerald-400/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'
                  }`}
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

/* ═══════════════════════════════════════════
   PICKUP & DROP — LOCATION SELECT DROPDOWN
═══════════════════════════════════════════ */
function LocationSelect({ label, icon: Icon, locations, value, onChange, exclude }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const filtered = locations.filter(
    (l) => l.id !== exclude?.id && (l.name ?? '').toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">{label}</label>
      <div className="relative">
        {value && !open ? (
          <button type="button" onClick={() => { setOpen(true); setSearch(''); }}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border-2 border-purple-400 bg-purple-50 text-sm font-bold text-purple-800 cursor-pointer">
            <span className="flex items-center gap-2"><Icon size={14} className="text-purple-500 shrink-0" />{value.name}</span>
            <ChevronDown size={13} className="text-purple-400" />
          </button>
        ) : (
          <div className="relative">
            <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input autoFocus={open} type="text" value={search}
              onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            />
          </div>
        )}
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              {value && (
                <div className="px-3 pt-2 pb-1">
                  <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Type to search..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              )}
              <div className="max-h-48 overflow-y-auto">
                {filtered.length === 0
                  ? <p className="px-4 py-3 text-xs text-slate-400 font-semibold">No matching areas</p>
                  : filtered.map((loc) => (
                    <button key={loc.id} type="button" onClick={() => { onChange(loc); setOpen(false); setSearch(''); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0">
                      <MapPin size={12} className="text-purple-400 shrink-0" />
                      <span className="flex-1 text-sm font-bold text-slate-800">{loc.name}</span>
                    </button>
                  ))
                }
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PICKUP & DROP FORM
═══════════════════════════════════════════ */
function PickupDropForm() {
  const { setPickupOrderData, pickupOrderData, hasDeliveryItems, cart, prescriptionImageUrl } = useCart();
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(true);
  const [pickupLoc, setPickupLoc] = useState(null);
  const [dropLoc, setDropLoc] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(query(collection(db, 'deliveryLocations'), where('isActive', '==', true)));
        setLocations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch { toast.error('Could not load areas'); }
      finally { setLocLoading(false); }
    })();
  }, []);

  const pickupCharge = Number(pickupLoc?.deliveryCharge ?? 0);
  const dropCharge = Number(dropLoc?.deliveryCharge ?? 0);
  const totalCharge = pickupCharge + dropCharge;
  const sameLocation = pickupLoc && dropLoc && pickupLoc.id === dropLoc.id;
  const canAdd = pickupLoc && dropLoc && !sameLocation && !hasDeliveryItems;

  const buildLocationPayload = (loc) => ({
    id: loc.id,
    name: loc.name ?? '',
    deliveryCharge: Number(loc.deliveryCharge ?? 0),
    assignedPartnerId: loc.assignedPartnerId ?? '',
    assignedPartnerName: loc.assignedPartnerName ?? '',
  });

  const handlePickupChange = (loc) => {
    setPickupLoc(loc);
    if (dropLoc?.id === loc.id) setDropLoc(null);
  };

  const handleDropChange = (loc) => {
    setDropLoc(loc);
    if (pickupLoc?.id === loc.id) setPickupLoc(null);
  };

  const handleAddPickupDrop = () => {
    if (!canAdd) {
      toast.error('Pickup and drop areas must be different');
      return;
    }
    setPickupOrderData({
      type: 'pickup_drop',
      pickupLoc: buildLocationPayload(pickupLoc),
      dropLoc: buildLocationPayload(dropLoc),
      pickupCharge,
      dropCharge,
      totalCharge,
      note: note.trim(),
    });
    toast.success('Pickup & Drop added to cart!');
  };

  if (pickupOrderData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-5 text-white shadow-xl shadow-purple-500/25">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><Bike size={22} /></div>
            <div><h2 className="text-base font-black">Pickup &amp; Drop</h2>
              <p className="text-purple-200 text-xs font-semibold">Request added to cart</p></div>
          </div>
        </div>
        <div className="bg-purple-50 border-2 border-purple-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-purple-500" />
            <p className="font-black text-purple-800 text-sm">Pickup &amp; Drop attached to cart</p>
          </div>
          <div className="space-y-1.5 text-sm pl-1">
            <div className="flex items-center gap-2 text-purple-700 font-semibold">
              <Navigation size={12} className="text-purple-400 shrink-0" />
              <span>From: <strong>{pickupOrderData.pickupLoc.name}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-purple-700 font-semibold">
              <MapPin size={12} className="text-purple-400 shrink-0" />
              <span>To: <strong>{pickupOrderData.dropLoc.name}</strong></span>
            </div>
            <div className="flex justify-between pt-2 border-t border-purple-200 mt-2">
              <span className="text-xs font-black text-purple-600 uppercase tracking-wide">Total Charge</span>
              <span className="font-black text-purple-800">&#x20b9;{pickupOrderData.totalCharge}</span>
            </div>
          </div>
          <button onClick={() => setPickupOrderData(null)}
            className="w-full text-xs text-red-500 font-bold hover:text-red-600 cursor-pointer py-1.5">
            Remove from cart
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 font-semibold">Open cart to proceed to checkout</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto space-y-4">
      <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-purple-500/25 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -translate-y-10 translate-x-10" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><Bike size={24} /></div>
          <div>
            <h2 className="text-lg font-black">Pickup &amp; Drop</h2>
            <p className="text-purple-200 text-xs font-semibold">Select areas &middot; charge = pickup fee + drop fee</p>
          </div>
        </div>
      </div>

      {/* ── Conflict warning: cart has delivery items ── */}
      {hasDeliveryItems && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle size={18} className="text-amber-500" />
          </div>
          <div>
            <p className="font-black text-amber-800 text-sm">Cart has delivery items</p>
            <p className="text-amber-600 text-xs font-semibold mt-0.5 leading-relaxed">
              You have {cart.length > 0 ? `${cart.length} item${cart.length !== 1 ? 's' : ''}` : ''}{cart.length > 0 && prescriptionImageUrl ? ' + ' : ''}{prescriptionImageUrl ? 'a prescription' : ''} in your cart.
              Pickup & Drop cannot be combined with food, grocery, or medicine orders.
              Please clear your cart first.
            </p>
          </div>
        </motion.div>
      )}

      {locLoading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
          <Loader2 size={20} className="animate-spin text-purple-400" />
          <span className="text-sm font-semibold">Loading areas...</span>
        </div>
      ) : (
        <>
          <LocationSelect label="Pickup Area" icon={Navigation} locations={locations} value={pickupLoc} onChange={handlePickupChange} exclude={dropLoc} />
          <LocationSelect label="Drop Area" icon={MapPin} locations={locations} value={dropLoc} onChange={handleDropChange} exclude={pickupLoc} />

          {(pickupLoc || dropLoc) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
              <div className="flex justify-between font-black text-slate-900 text-base">
                <span>Total Charge</span><span className="text-purple-600">&#x20b9;{totalCharge}</span>
              </div>
            </motion.div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider block mb-2">
              Note <span className="text-slate-300 font-semibold normal-case">(optional)</span>
            </label>
            <div className="relative">
              <Package size={14} className="absolute left-3 top-3 text-slate-400" />
              <textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Package details, special instructions..." rows={2}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all resize-none"
              />
            </div>
          </div>

          <motion.button type="button" disabled={!canAdd}
            whileHover={{ scale: canAdd ? 1.02 : 1 }} whileTap={{ scale: canAdd ? 0.97 : 1 }}
            onClick={handleAddPickupDrop}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-slate-200 disabled:text-slate-400 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30 disabled:shadow-none transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <Bike size={18} /> Add to Cart
          </motion.button>
          {!pickupLoc && <p className="text-center text-xs text-slate-400 font-semibold -mt-2">Select pickup area to continue</p>}
          {pickupLoc && !dropLoc && <p className="text-center text-xs text-slate-400 font-semibold -mt-2">Now select drop area</p>}
          {sameLocation && <p className="text-center text-xs text-red-400 font-semibold -mt-2">Pickup and drop areas cannot be same</p>}
        </>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN product PAGE
═══════════════════════════════════════════ */
export default function Product() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') || 'food';
  const activeTab = SERVICE_TABS.some((t) => t.id === tabParam) ? tabParam : 'food';

  const setActiveTab = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
  };

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        setError('Failed to load. Check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const currentTab = SERVICE_TABS.find((t) => t.id === activeTab);

  /* filter by serviceType for the 3 product tabs */
  const filteredProducts = activeTab === 'pickup'
    ? []
    : products.filter((p) => {
      const st = (p.serviceType ?? '').toLowerCase();
      return st === activeTab || (activeTab === 'food' && !st); // fallback: untagged → food
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">

      {/* ── Sticky service tab bar ── */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-14 md:top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            {SERVICE_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const colors = TAB_COLORS[tab.color];
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.94 }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-md ${isActive ? colors.active : colors.inactive
                    }`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 bg-orange-50 rounded-3xl flex items-center justify-center">
              <Loader2 size={32} className="text-orange-500 animate-spin" />
            </div>
            <p className="text-slate-500 font-semibold">Loading…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <p className="text-slate-600 font-semibold max-w-xs">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            {/* ── Pickup & Drop tab ── */}
            {activeTab === 'pickup' && (
              <motion.div
                key="pickup"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
              >
                <PickupDropForm />
              </motion.div>
            )}

            {/* ── Product grid tabs ── */}
            {activeTab !== 'pickup' && (
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.22 }}
              >
                {/* Prescription banner — always visible on medicine tab */}
                {activeTab === 'medicine' && <MedicinePrescriptionBanner />}

                {filteredProducts.length === 0 ? (
                  activeTab !== 'medicine' && (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                      <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                        <currentTab.icon size={28} className="text-slate-400" />
                      </div>
                      <p className="text-slate-400 font-semibold">
                        No {currentTab?.label} items available yet.
                      </p>
                    </div>
                  )
                ) : (
                  <>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-4">
                      {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
