import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, ChevronDown, Loader2, CheckCircle2, AlertCircle,
  ShoppingBag, ArrowLeft, Package, Truck, Tag, Wallet, Banknote, Phone,
  Bike, Navigation, PauseCircle
} from 'lucide-react';
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { validateCoupon, incrementCouponUsage } from '../utils/couponUtils';

// ─── Delivery Location Dropdown ──────────────────────────────────────────────
function LocationDropdown({ locations, selected, onSelect, disabled }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-sm font-semibold text-slate-800 focus:outline-none focus:border-orange-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {selected ? (
          <span className="flex items-center gap-2">
            <MapPin size={15} className="text-orange-500 shrink-0" />
            <span>{selected.name}</span>
          </span>
        ) : (
          <span className="text-slate-400 flex items-center gap-2">
            <MapPin size={15} className="shrink-0" />
            Select your delivery area…
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 shrink-0 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/80 z-20 overflow-hidden"
          >
            {locations.map((loc, i) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => { onSelect(loc); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-3.5 text-sm font-semibold transition-colors cursor-pointer text-left
                  ${i !== 0 ? 'border-t border-slate-50' : ''}
                  ${selected?.id === loc.id
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <div className="flex items-center gap-2">
                  {selected?.id === loc.id
                    ? <CheckCircle2 size={15} className="text-orange-500" />
                    : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                  <span>{loc.name}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Order Summary Item ───────────────────────────────────────────────────────
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
  const { cart, totalPrice, clearCart, pickupOrderData, isOnline } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [locLoading, setLocLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // ── Coupon state ──────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);   // { valid, coupon, cartDiscount, deliveryDiscount }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // Redirect if cart is empty AND no pickup-drop request
  useEffect(() => {
    if (cart.length === 0 && !pickupOrderData) navigate('/product', { replace: true });
  }, [cart, pickupOrderData, navigate]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  // Fetch active delivery locations
  useEffect(() => {
    const fetch = async () => {
      setLocLoading(true);
      try {
        const q = query(
          collection(db, 'deliveryLocations'),
          where('isActive', '==', true)
        );
        const snap = await getDocs(q);
        setLocations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
        toast.error('Could not load delivery areas');
      } finally {
        setLocLoading(false);
      }
    };
    fetch();
  }, []);

  const isPickupDropOrder = !!pickupOrderData;
  const needsDeliveryArea = cart.length > 0;

  const pickupDropCharge = Number(pickupOrderData?.totalCharge ?? 0);
  const deliveryCharge = Number(selectedLoc?.deliveryCharge ?? 0);

  // Coupon discounts (default 0 when none applied)
  const couponCartDiscount     = couponResult?.cartDiscount     ?? 0;
  const couponDeliveryDiscount = couponResult?.deliveryDiscount ?? 0;

  const totalAmount =
    totalPrice +
    (needsDeliveryArea ? deliveryCharge : 0) +
    pickupDropCharge -
    couponCartDiscount -
    couponDeliveryDiscount;

  const belowMin =
    cart.length > 0 &&
    selectedLoc && totalPrice < (selectedLoc.minOrder ?? 0);

  const canOrder =
    isOnline &&
    (!needsDeliveryArea || selectedLoc) &&
    address.trim().length > 0 &&
    mobile.trim().length >= 10 &&
    paymentMethod === 'cod' &&
    !belowMin &&
    !placing;

  const getPartner = async (partnerId) => {
    if (!partnerId) return null;
    const snap = await getDoc(doc(db, 'deliveryPartners', partnerId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  };

  const getDeliveryLocation = async (location) => {
    if (!location?.id) return location ?? {};
    const snap = await getDoc(doc(db, 'deliveryLocations', location.id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : location;
  };

  const numberValue = (value) => Number(value ?? 0) || 0;

  // ── Coupon handlers ───────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    setCouponError('');
    setCouponResult(null);
    setCouponLoading(true);
    try {
      // For multi-restaurant carts pass '' so scope:all coupons still work
      const primaryRestaurantId = restaurantIds?.[0] ?? '';
      const result = await validateCoupon(
        couponCode,
        totalPrice,           // cart subtotal before delivery
        primaryRestaurantId,
        deliveryCharge
      );
      if (!result.valid) {
        setCouponError(result.error);
      } else {
        setCouponResult(result);
        toast.success(`Coupon "${result.coupon.code}" applied! 🎉`);
      }
    } catch (err) {
      console.error('Coupon validation error:', err);
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponResult(null);
    setCouponCode('');
    setCouponError('');
  };

  // Unique restaurant IDs used both for restaurant fetching AND coupon scope checks
  const restaurantIds = [...new Set(cart.map((i) => i.restaurantId).filter(Boolean))];

  const handlePlaceOrder = async () => {
    if (!canOrder) return;
    setPlacing(true);
    try {
      // ── Delivery Partner from selected delivery area ────────────────────────
      const selectedDeliveryPartnerId = selectedLoc?.assignedPartnerId ?? '';
      const selectedDeliveryPartnerName = selectedLoc?.assignedPartnerName ?? '';
      let selectedDeliveryPartnerEarning = 0;
      let isPartnerOnline = true;
      if (selectedDeliveryPartnerId) {
        const partner = await getPartner(selectedDeliveryPartnerId);
        selectedDeliveryPartnerEarning = numberValue(partner?.commissionFlat);
        isPartnerOnline = partner ? (partner.isOnline !== false) : true;
      }

      // ── Pickup & Drop partner commission from deliveryPartners ─────────────
      let pickupDropDetails = null;
      let pickupDropPartner = null;

      if (pickupOrderData) {
        const [pickupLoc, dropLoc] = await Promise.all([
          getDeliveryLocation(pickupOrderData.pickupLoc),
          getDeliveryLocation(pickupOrderData.dropLoc),
        ]);

        const [pickupPartner, dropPartner] = await Promise.all([
          getPartner(pickupLoc.assignedPartnerId),
          getPartner(dropLoc.assignedPartnerId),
        ]);

        pickupDropPartner = pickupPartner;

        const pickupCommission = numberValue(pickupPartner?.commissionFlat);
        const dropCommission = numberValue(dropPartner?.commissionFlat);
        const partnerEarning = pickupCommission + dropCommission;
        const pickupCharge = numberValue(pickupLoc.deliveryCharge ?? pickupOrderData.pickupCharge);
        const dropCharge = numberValue(dropLoc.deliveryCharge ?? pickupOrderData.dropCharge);
        const routeCharge = pickupCharge + dropCharge;

        pickupDropDetails = {
          pickupLocationId: pickupLoc.id ?? '',
          pickupLocationName: pickupLoc.name ?? '',
          pickupCharge,
          pickupAssignedPartnerId: pickupLoc.assignedPartnerId ?? '',
          pickupAssignedPartnerName: pickupPartner?.name ?? pickupLoc.assignedPartnerName ?? '',
          pickupCommissionFlat: pickupCommission,

          dropLocationId: dropLoc.id ?? '',
          dropLocationName: dropLoc.name ?? '',
          dropCharge,
          dropAssignedPartnerId: dropLoc.assignedPartnerId ?? '',
          dropAssignedPartnerName: dropPartner?.name ?? dropLoc.assignedPartnerName ?? '',
          dropCommissionFlat: dropCommission,

          assignedPartnerId: pickupLoc.assignedPartnerId ?? '',
          assignedPartnerName: pickupPartner?.name ?? pickupLoc.assignedPartnerName ?? '',
          partnerEarning,
          totalCharge: routeCharge,
          note: pickupOrderData.note ?? '',
        };
      }

      const pickupDropOnly = pickupDropDetails && !needsDeliveryArea;
      const deliveryPartnerId = pickupDropOnly
        ? pickupDropDetails.assignedPartnerId
        : (isPartnerOnline ? selectedDeliveryPartnerId : '');
      const deliveryPartnerName = pickupDropOnly
        ? pickupDropDetails.assignedPartnerName
        : (isPartnerOnline ? selectedDeliveryPartnerName : '');
      const deliveryPartnerEarning = pickupDropOnly
        ? pickupDropDetails.partnerEarning
        : (isPartnerOnline ? selectedDeliveryPartnerEarning : 0);

      // Unique restaurant IDs across all cart items (for admin reference) — already computed above

      // Fetch ALL unique restaurants in parallel so each item gets its own commission rate & phone
      const restaurantDataMap = {}; // { [restaurantId]: { phone, commissionRate } }
      if (restaurantIds.length > 0) {
        try {
          const restSnaps = await Promise.all(
            restaurantIds.map((rId) => getDoc(doc(db, 'restaurants', rId)))
          );
          restSnaps.forEach((snap) => {
            if (snap.exists()) {
              const d = snap.data();
              restaurantDataMap[snap.id] = {
                name: d.name ?? '',
                phone: d.phone ?? '',
                logo: d.logo ?? '',
                commissionRate: Number(d.commissionRate ?? 0),
              };
            }
          });
        } catch (err) {
          console.warn('Error fetching restaurant data:', err);
        }
      }

      // Keep the first restaurant's top-level fields for backward compat
      const firstRestData = restaurantDataMap[restaurantIds[0]] ?? { name: '', phone: '', logo: '', commissionRate: 0 };
      const restaurantPhone = firstRestData.phone;
      const restaurantName = firstRestData.name;
      const restaurantLogo = firstRestData.logo;

      const pickupDropItem = pickupDropDetails
        ? [{
          productId: 'pickup-drop',
          productName: 'Pickup & Drop',
          quantity: 1,
          price: pickupDropDetails.totalCharge,
          image: '',
          restaurantId: '',
          serviceType: 'pickup_drop',
        }]
        : [];

      // Each cart item gets the commissionRate and phone of its own restaurant
      const orderItems = [
        ...cart.map((i) => {
          const rData = restaurantDataMap[i.restaurantId] ?? null;
          return {
            productId: i.id,
            productName: i.name,
            quantity: i.qty,
            price: i.discountPrice ?? i.price,
            image: i.images?.[0] ?? '',
            restaurantId: i.restaurantId ?? '',
            restaurantName: rData ? rData.name : '',
            restaurantLogo: rData ? rData.logo : '',
            restaurantPhone: rData ? rData.phone : '',
            commissionRate: rData ? rData.commissionRate : 0,
            deliveryArea: selectedLoc?.name ?? '',
          };
        }),
        ...pickupDropItem,
      ];

      const subtotal = totalPrice + (pickupDropDetails?.totalCharge ?? 0);
      const orderDeliveryCharge = needsDeliveryArea ? deliveryCharge : 0;
      const finalTotalAmount =
        subtotal + orderDeliveryCharge - couponCartDiscount - couponDeliveryDiscount;

      const orderRef = await addDoc(collection(db, 'orders'), {
        // Order type
        isPrescriptionOrder: false,
        isPickupDropOrder: !!pickupDropDetails,
        orderType: pickupDropDetails
          ? 'pickup_drop'
          : 'regular',

        // User
        userId: user.uid,
        userEmail: user.email ?? '',
        userName: user.displayName ?? '',
        userMobile: mobile.trim(),

        // Restaurants involved
        restaurantIds,
        prescriptionImageUrl: '',
        restaurantId: restaurantIds[0] ?? '',
        restaurantName,
        restaurantLogo,
        restaurantPhone,

        // Items
        items: orderItems,
        pickupDrop: pickupDropDetails,
        pickupDropPartnerId: pickupDropDetails?.assignedPartnerId ?? '',
        pickupDropPartnerName: pickupDropDetails?.assignedPartnerName ?? '',
        pickupDropPartnerEarning: pickupDropDetails?.partnerEarning ?? 0,

        // Delivery
        address: address.trim(),
        locationId: selectedLoc?.id ?? '',
        locationName: selectedLoc?.name ?? '',
        deliveryArea: selectedLoc?.name ?? '',
        deliveryCharge: orderDeliveryCharge,
        deliveryPartnerId,
        deliveryPartnerName,
        deliveryPartnerEarning,

        // Coupon
        appliedCouponId:   couponResult?.coupon?.id   ?? null,
        appliedCouponCode: couponResult?.coupon?.code ?? null,
        couponCartDiscount,
        couponDeliveryDiscount,

        // Totals
        subtotal,
        totalAmount: finalTotalAmount,

        // Payment
        paymentMethod: paymentMethod,

        // Status
        status: 'pending',

        // Settlement flags
        settled: false,
        partnerSettled: false,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // ── Telegram notifications ─────────────────────────────────────────────
      const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
      const escapeHtml = (text) => {
        if (!text) return '';
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      const itemLines = cart
        .map((i) => `  • ${escapeHtml(i.name)} × ${i.qty}  ₹${(i.discountPrice ?? i.price) * i.qty}`)
        .join('\n');

      const sendTelegram = async (chatId, text) => {
        console.log('Sending Telegram message to chatId:', chatId);
        try {
          const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
          });
          if (!res.ok) {
            const errBody = await res.json();
            console.error('Telegram API Error details:', errBody);
            throw new Error(errBody.description || 'Unknown Telegram Error');
          }
          console.log('Telegram message sent successfully');
        } catch (err) {
          console.error('Failed to send Telegram:', err);
          throw err;
        }
      };

      // 1️⃣  Restaurants
      if (botToken && restaurantIds.length > 0) {
        const byRestaurant = cart.reduce((acc, item) => {
          const rId = item.restaurantId;
          if (!rId) return acc;
          if (!acc[rId]) acc[rId] = [];
          acc[rId].push(item);
          return acc;
        }, {});

        await Promise.all(
          Object.entries(byRestaurant).map(async ([rId, items]) => {
            try {
              const restSnap = await getDoc(doc(db, 'restaurants', rId));
              if (!restSnap.exists()) return;
              const restChatId = restSnap.data().telegramChatId;
              if (!restChatId) return;

              const restItemLines = items
                .map((i) => `  • ${escapeHtml(i.name)} × ${i.qty}  ₹${(i.discountPrice ?? i.price) * i.qty}`)
                .join('\n');
              const restSubtotal = items.reduce(
                (sum, i) => sum + (i.discountPrice ?? i.price) * i.qty, 0
              );

              const restaurantMsg =
                `🛒 <b>New Order Received!</b>\n` +
                `Order ID: <code>${escapeHtml(orderRef.id)}</code>\n\n` +
                `<b>Items:</b>\n${restItemLines}\n\n` +
                `Subtotal: ₹${restSubtotal}\n\n` +
                `Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}`;

              await sendTelegram(restChatId, restaurantMsg);
            } catch (tgErr) {
              console.warn(`Restaurant ${rId} Telegram notification skipped:`, tgErr);
            }
          })
        );
      }

      // 2️⃣  Pickup & Drop partner — assigned from pickup location
      if (pickupDropDetails && pickupDropPartner?.telegramChatId && botToken) {
        try {
          const pickupDropMsg =
            `🛵 <b>New Pickup & Drop Assignment!</b>\n` +
            `Order ID: <code>${escapeHtml(orderRef.id)}</code>\n\n` +
            `From: ${escapeHtml(pickupDropDetails.pickupLocationName)}  ₹${pickupDropDetails.pickupCharge}\n` +
            `To: ${escapeHtml(pickupDropDetails.dropLocationName)}  ₹${pickupDropDetails.dropCharge}\n\n` +
            `<b>Total Charge: ₹${pickupDropDetails.totalCharge}</b>\n` +
            `<b>Commission: ₹${pickupDropDetails.partnerEarning}</b>\n` +
            `Pickup commission: ₹${pickupDropDetails.pickupCommissionFlat}\n` +
            `Drop commission: ₹${pickupDropDetails.dropCommissionFlat}\n\n` +
            `Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}\n` +
            `Address details: ${escapeHtml(address.trim())}\n` +
            `${pickupDropDetails.note ? `Note: ${escapeHtml(pickupDropDetails.note)}\n` : ''}` +
            `Customer: ${escapeHtml(user.displayName ?? user.email)}\n` +
            `Mobile: ${escapeHtml(mobile.trim())}`;

          await sendTelegram(pickupDropPartner.telegramChatId, pickupDropMsg);
        } catch (tgErr) {
          console.warn('Pickup & Drop Telegram notification skipped:', tgErr);
        }
      }

      // 3️⃣  Delivery partner
      const checkPartnerId = pickupDropOnly
        ? pickupDropDetails?.assignedPartnerId
        : selectedDeliveryPartnerId;

      if (cart.length > 0 && checkPartnerId && botToken) {
        try {
          const partnerSnap = await getDoc(doc(db, 'deliveryPartners', checkPartnerId));
          if (partnerSnap.exists()) {
            const partnerData = partnerSnap.data();
            const isPartnerOnline = partnerData.isOnline !== false;

            if (isPartnerOnline) {
              const partnerChatId = partnerData.telegramChatId;
              if (partnerChatId) {
                const partnerMsg =
                  `🛵 <b>New Delivery Assignment!</b>\n` +
                  `Order ID: <code>${escapeHtml(orderRef.id)}</code>\n\n` +
                  `<b>Items:</b>\n${itemLines}\n\n` +
                  `Subtotal: ₹${totalPrice}\n` +
                  `Delivery: ₹${deliveryCharge}\n` +
                  `<b>Total: ₹${totalPrice + deliveryCharge}</b>\n\n` +
                  `Payment: ${paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase()}\n` +
                  `Address: ${escapeHtml(address.trim())}\n` +
                  `Customer: ${escapeHtml(user.displayName ?? user.email)}\n` +
                  `Mobile: ${escapeHtml(mobile.trim())}`;

                await sendTelegram(partnerChatId, partnerMsg);
              }
            } else {
              // Partner is offline! Send msg to Admin
              const configSnap = await getDoc(doc(db, 'config', 'telegram'));
              const adminChatId = configSnap.exists() ? configSnap.data().adminChatId : null;

              if (adminChatId) {
                // Fetch all online partners
                let onlinePartnersList = 'None';
                try {
                  const partnersSnap = await getDocs(
                    query(collection(db, 'deliveryPartners'), where('isOnline', '==', true))
                  );
                  const onlinePartners = partnersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                  if (onlinePartners.length > 0) {
                    onlinePartnersList = onlinePartners
                      .map(p => `  • ${escapeHtml(p.name)} (${escapeHtml(p.mobile || p.phone || 'No Mobile')})`)
                      .join('\n');
                  }
                } catch (err) {
                  console.warn('Failed to fetch online partners:', err);
                }

                const adminMsg =
                  `⚠️ <b>Delivery Partner Offline Alert!</b>\n\n` +
                  `The assigned partner for this order's location is currently <b>offline</b>.\n\n` +
                  `<b>Order Details:</b>\n` +
                  `Order ID: <code>${escapeHtml(orderRef.id)}</code>\n` +
                  `Location: <b>${escapeHtml(selectedLoc?.name || '')}</b>\n` +
                  `Total: ₹${totalPrice + deliveryCharge}\n` +
                  `<b>Items:</b>\n${itemLines}\n\n` +
                  `<b>Assigned Partner Details (Offline):</b>\n` +
                  `Name: ${escapeHtml(partnerData.name || 'Unknown')}\n` +
                  `Mobile: ${escapeHtml(partnerData.mobile || partnerData.phone || 'N/A')}\n\n` +
                  `<b>Online Delivery Partners:</b>\n${onlinePartnersList}`;

                await sendTelegram(adminChatId, adminMsg);
              }
            }
          }
        } catch (tgErr) {
          console.warn('Partner/Admin Telegram notification skipped:', tgErr);
        }
      }

      // ── Increment coupon usage AFTER order is saved ──────────────────────
      if (couponResult?.coupon?.id) {
        try {
          await incrementCouponUsage(couponResult.coupon.id);
        } catch (couponErr) {
          console.warn('Coupon usage increment failed (non-critical):', couponErr);
        }
      }

      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate('/order', { replace: true });
    } catch (err) {
      console.error(err);
      toast.error('Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
  };

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
                    <p className="text-purple-500 text-xs font-semibold">₹{pickupDropCharge}</p>
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
              <div className="flex items-center justify-between rounded-2xl bg-purple-50 border border-purple-100 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-purple-800 min-w-0">
                  <Navigation size={14} className="text-purple-400 shrink-0" />
                  <span className="truncate">{pickupOrderData.pickupLoc?.name}</span>
                </span>
                <span className="text-xs font-black text-purple-600">₹{pickupOrderData.pickupCharge}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-purple-50 border border-purple-100 px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-purple-800 min-w-0">
                  <MapPin size={14} className="text-purple-400 shrink-0" />
                  <span className="truncate">{pickupOrderData.dropLoc?.name}</span>
                </span>
                <span className="text-xs font-black text-purple-600">₹{pickupOrderData.dropCharge}</span>
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
          <div className="flex items-center gap-2.5 mb-1">
            <MapPin size={17} className="text-orange-500" />
            <h2 className="font-black text-slate-900 text-sm">
              {isPickupDropOrder ? 'Pickup / Drop Address Details' : 'Delivery Address'}
            </h2>
          </div>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={isPickupDropOrder
              ? 'Enter pickup and drop address details — building, landmark, contact person…'
              : 'Enter your full delivery address — flat/house no., street, landmark…'}
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border-2 border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all resize-none"
          />
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
                    {couponLoading
                      ? <Loader2 size={15} className="animate-spin" />
                      : 'Apply'}
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
                <p className="text-slate-400 text-xs font-semibold mt-0.5">GPay, PhonePe, Paytm & more</p>
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
            {isPickupDropOrder ? 'Enter pickup/drop address details to continue' : 'Enter your delivery address to continue'}
          </p>
        )}
      </div>
    </div>
  );
}
