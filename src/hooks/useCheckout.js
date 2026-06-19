/**
 * useCheckout.js
 *
 * Custom hook that owns all checkout business logic:
 *   1. Form state (address, mobile, payment method, coupon)
 *   2. Delivery-location fetching
 *   3. Derived totals and validation flags
 *   4. Order creation in Firestore
 *   5. Immediate navigation to /orders/:orderId on success
 *   6. Background dispatch of all notifications (non-blocking)
 *
 * The Checkout page only needs to import this hook and wire up the
 * returned state/handlers to its JSX — no business logic lives in the view.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { validateCoupon, incrementCouponUsage } from '../utils/couponUtils';
import { dispatchOrderNotifications } from '../utils/notificationUtils';
import { validateCartForOrder } from '../utils/orderValidation';

// ─── Small helpers (pure, no side-effects) ───────────────────────────────────

const numberValue = (v) => Number(v ?? 0) || 0;

async function fetchPartner(partnerId) {
  if (!partnerId) return null;
  const snap = await getDoc(doc(db, 'deliveryPartners', partnerId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

async function fetchDeliveryLocation(location) {
  if (!location?.id) return location ?? {};
  const snap = await getDoc(doc(db, 'deliveryLocations', location.id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : location;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCheckout() {
  const { cart, totalPrice, clearCart, pickupOrderData, isOnline } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [address, setAddress] = useState('');
  const [mobile, setMobile] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // ── Delivery locations ──────────────────────────────────────────────────────
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [locLoading, setLocLoading] = useState(true);

  // ── Order placement ─────────────────────────────────────────────────────────
  const [placing, setPlacing] = useState(false);

  // ── Coupon state ────────────────────────────────────────────────────────────
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null); // { valid, coupon, cartDiscount, deliveryDiscount }
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  // ─── Guards: redirect if cart is empty / store offline / not logged in ──────
  useEffect(() => {
    if (cart.length === 0 && !pickupOrderData) navigate('/product', { replace: true });
  }, [cart, pickupOrderData, navigate]);

  useEffect(() => {
    if (!isOnline) {
      toast.error('Store is currently paused. Checkout is disabled.', { id: 'store-offline' });
      navigate('/product', { replace: true });
    }
  }, [isOnline, navigate]);

  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout');
      navigate('/auth', { replace: true });
    }
  }, [user, navigate]);

  // ─── Fetch active delivery locations ────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLocLoading(true);
      try {
        const q = query(collection(db, 'deliveryLocations'), where('isActive', '==', true));
        const snap = await getDocs(q);
        if (!cancelled) setLocations(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('[useCheckout] fetchLocations:', err);
        toast.error('Could not load delivery areas');
      } finally {
        if (!cancelled) setLocLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ─── Derived values ──────────────────────────────────────────────────────────
  const isPickupDropOrder = !!pickupOrderData;
  const needsDeliveryArea = cart.length > 0;

  const pickupDropCharge = numberValue(pickupOrderData?.totalCharge);
  const deliveryCharge = numberValue(selectedLoc?.deliveryCharge);

  const couponCartDiscount = couponResult?.cartDiscount ?? 0;
  const couponDeliveryDiscount = couponResult?.deliveryDiscount ?? 0;

  const totalAmount =
    totalPrice +
    (needsDeliveryArea ? deliveryCharge : 0) +
    pickupDropCharge -
    couponCartDiscount -
    couponDeliveryDiscount;

  const belowMin =
    cart.length > 0 && selectedLoc != null && totalPrice < (selectedLoc.minOrder ?? 0);

  const canOrder =
    isOnline &&
    (!needsDeliveryArea || selectedLoc) &&
    address.trim().length > 0 &&
    mobile.trim().length >= 10 &&
    paymentMethod === 'cod' &&
    !belowMin &&
    !placing;

  /** Unique restaurant IDs across all cart items (used for coupon scope + Firestore fetches). */
  const restaurantIds = [...new Set(cart.map((i) => i.restaurantId).filter(Boolean))];

  // ─── Coupon handlers ─────────────────────────────────────────────────────────
  const handleApplyCoupon = useCallback(async () => {
    setCouponError('');
    setCouponResult(null);
    setCouponLoading(true);
    try {
      const result = await validateCoupon(couponCode, totalPrice, restaurantIds, deliveryCharge);
      if (!result.valid) {
        setCouponError(result.error);
      } else {
        setCouponResult(result);
        toast.success(`Coupon "${result.coupon.code}" applied! 🎉`);
      }
    } catch (err) {
      console.error('[useCheckout] coupon validation:', err);
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, totalPrice, restaurantIds.join(','), deliveryCharge]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponResult(null);
    setCouponCode('');
    setCouponError('');
  }, []);

  // ─── Place order ─────────────────────────────────────────────────────────────
  const handlePlaceOrder = useCallback(async () => {
    if (!isOnline) {
      toast.error('Store is currently paused. We cannot accept your order right now.', {
        id: 'store-offline',
      });
      return;
    }
    if (!canOrder) return;

    setPlacing(true);
    try {
      // ── Step 1: Validate product availability + restaurant open status ────────
      if (cart.length > 0) {
        const validation = await validateCartForOrder(cart, restaurantIds);
        if (!validation.ok) {
          toast.error(validation.message, { duration: 5000 });
          setPlacing(false);
          return;
        }
      }

      // ── Step 2: Re-validate coupon at the moment of order placement ──────────
      let finalCouponCartDiscount = 0;
      let finalCouponDeliveryDiscount = 0;
      let finalCouponId = null;
      let finalCouponCode = null;

      if (couponResult?.coupon?.code) {
        const check = await validateCoupon(
          couponResult.coupon.code,
          totalPrice,
          restaurantIds,
          deliveryCharge
        );
        if (!check.valid) {
          toast.error(`Coupon error: ${check.error}`);
          setCouponResult(null);
          setCouponError(check.error);
          setPlacing(false);
          return;
        }
        finalCouponCartDiscount = check.cartDiscount;
        finalCouponDeliveryDiscount = check.deliveryDiscount;
        finalCouponId = check.coupon.id;
        finalCouponCode = check.coupon.code;
      }

      // ── Step 3: Resolve delivery partner for regular delivery ────────────────
      const selectedDeliveryPartnerId = selectedLoc?.assignedPartnerId ?? '';
      const selectedDeliveryPartnerName = selectedLoc?.assignedPartnerName ?? '';
      let selectedDeliveryPartnerEarning = 0;
      let isPartnerOnline = true;

      if (selectedDeliveryPartnerId) {
        const partner = await fetchPartner(selectedDeliveryPartnerId);
        selectedDeliveryPartnerEarning = numberValue(partner?.commissionFlat);
        isPartnerOnline = partner ? partner.isOnline !== false : true;
      }

      // ── Step 4: Resolve Pickup & Drop details ────────────────────────────────
      let pickupDropDetails = null;

      if (pickupOrderData) {
        const [pickupLoc, dropLoc] = await Promise.all([
          fetchDeliveryLocation(pickupOrderData.pickupLoc),
          fetchDeliveryLocation(pickupOrderData.dropLoc),
        ]);

        const pickupDropPartner = await fetchPartner(pickupLoc.assignedPartnerId);
        const pickupCommission = numberValue(pickupDropPartner?.commissionFlat);
        const pickupCharge = numberValue(pickupLoc.deliveryCharge ?? pickupOrderData.pickupCharge);
        const dropCharge = numberValue(dropLoc.deliveryCharge ?? pickupOrderData.dropCharge);

        pickupDropDetails = {
          pickupLocationId: pickupLoc.id ?? '',
          pickupLocationName: pickupLoc.name ?? '',
          pickupCharge,

          dropLocationId: dropLoc.id ?? '',
          dropLocationName: dropLoc.name ?? '',
          dropCharge,

          assignedPartnerId: pickupLoc.assignedPartnerId ?? '',
          assignedPartnerName: pickupDropPartner?.name ?? pickupLoc.assignedPartnerName ?? '',
          partnerEarning: pickupCommission,
          totalCharge: pickupCharge + dropCharge,
          note: pickupOrderData.note ?? '',
        };
      }

      // ── Step 5: Determine final delivery partner fields ──────────────────────
      const pickupDropOnly = pickupDropDetails != null && !needsDeliveryArea;

      const deliveryPartnerId = pickupDropOnly
        ? pickupDropDetails.assignedPartnerId
        : isPartnerOnline ? selectedDeliveryPartnerId : '';

      const deliveryPartnerName = pickupDropOnly
        ? pickupDropDetails.assignedPartnerName
        : isPartnerOnline ? selectedDeliveryPartnerName : '';

      const deliveryPartnerEarning = pickupDropOnly
        ? pickupDropDetails.partnerEarning
        : isPartnerOnline ? selectedDeliveryPartnerEarning : 0;

      // ── Step 6: Fetch restaurant data (commission rates, phones) ─────────────
      const restaurantDataMap = {};
      if (restaurantIds.length > 0) {
        try {
          const snaps = await Promise.all(
            restaurantIds.map((rId) => getDoc(doc(db, 'restaurants', rId)))
          );
          snaps.forEach((snap) => {
            if (snap.exists()) {
              const d = snap.data();
              restaurantDataMap[snap.id] = {
                name: d.name ?? '',
                phone: d.phone ?? '',
                logo: d.logo ?? '',
                commissionRate: numberValue(d.commissionRate),
              };
            }
          });
        } catch (err) {
          console.warn('[useCheckout] fetchRestaurants partial failure:', err);
        }
      }

      const firstRestData = restaurantDataMap[restaurantIds[0]] ?? {
        name: '', phone: '', logo: '', commissionRate: 0,
      };

      // ── Step 7: Build order items array ──────────────────────────────────────
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
            restaurantName: rData?.name ?? '',
            restaurantLogo: rData?.logo ?? '',
            restaurantPhone: rData?.phone ?? '',
            commissionRate: rData?.commissionRate ?? 0,
            deliveryArea: selectedLoc?.name ?? '',
          };
        }),
        ...pickupDropItem,
      ];

      // ── Step 8: Compute final totals ─────────────────────────────────────────
      const subtotal = totalPrice + (pickupDropDetails?.totalCharge ?? 0);
      const orderDeliveryCharge = needsDeliveryArea ? deliveryCharge : 0;
      const finalTotalAmount =
        subtotal + orderDeliveryCharge - finalCouponCartDiscount - finalCouponDeliveryDiscount;

      // ── Step 9: Save the order to Firestore ───────────────────────────────────
      const orderRef = await addDoc(collection(db, 'orders'), {
        // Order type
        isPrescriptionOrder: false,
        isPickupDropOrder: !!pickupDropDetails,
        orderType: pickupDropDetails ? 'pickup_drop' : 'regular',

        // User
        userId: user.uid,
        userEmail: user.email ?? '',
        userName: user.displayName ?? '',
        userMobile: mobile.trim(),

        // Restaurants
        restaurantIds,
        prescriptionImageUrl: '',
        restaurantId: restaurantIds[0] ?? '',
        restaurantName: firstRestData.name,
        restaurantLogo: firstRestData.logo,
        restaurantPhone: firstRestData.phone,

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
        appliedCouponId: finalCouponId,
        appliedCouponCode: finalCouponCode,
        couponCartDiscount: finalCouponCartDiscount,
        couponDeliveryDiscount: finalCouponDeliveryDiscount,

        // Totals
        subtotal,
        totalAmount: finalTotalAmount,

        // Payment
        paymentMethod,

        // Status
        status: 'pending',
        settled: false,
        partnerSettled: false,

        // Timestamps
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const orderId = orderRef.id;

      // ── Step 10: Clear cart and navigate immediately ──────────────────────────
      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/order/${orderId}`, { replace: true });

      // ── Step 11: Background — increment coupon usage (non-blocking) ──────────
      if (finalCouponId) {
        incrementCouponUsage(finalCouponId).catch((err) =>
          console.warn('[useCheckout] coupon usage increment failed (non-critical):', err)
        );
      }

      // ── Step 12: Background — dispatch all notifications (non-blocking) ──────
      dispatchOrderNotifications({
        orderId,
        cart,
        pickupDropDetails,
        pickupDropOnly,
        deliveryPartnerId,
        selectedLocName: selectedLoc?.name ?? '',
        totalPrice,
        deliveryCharge: orderDeliveryCharge,
        paymentMethod,
        address: address.trim(),
        user,
        mobile: mobile.trim(),
      });

    } catch (err) {
      console.error('[useCheckout] handlePlaceOrder:', err);
      toast.error('Failed to place order. Try again.');
    } finally {
      setPlacing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canOrder, isOnline, couponResult, totalPrice, deliveryCharge, selectedLoc,
      address, mobile, paymentMethod, cart, pickupOrderData, restaurantIds.join(','),
      user, clearCart, navigate, needsDeliveryArea]);

  // ─── Public API ───────────────────────────────────────────────────────────────
  return {
    // Form state
    address,        setAddress,
    mobile,         setMobile,
    paymentMethod,  setPaymentMethod,

    // Delivery locations
    locations,
    selectedLoc,    setSelectedLoc,
    locLoading,

    // Coupon
    couponCode,     setCouponCode,
    couponResult,
    couponError,    setCouponError,
    couponLoading,
    handleApplyCoupon,
    handleRemoveCoupon,

    // Derived
    isPickupDropOrder,
    needsDeliveryArea,
    pickupDropCharge,
    deliveryCharge,
    couponCartDiscount,
    couponDeliveryDiscount,
    totalAmount,
    belowMin,
    canOrder,

    // Actions
    placing,
    handlePlaceOrder,
  };
}
