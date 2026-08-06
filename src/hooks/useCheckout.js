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
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  runTransaction,
  updateDoc,
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

// ─── Atomic delivery-partner assignment (ported from User App) ────────────────

/**
 * Atomically claims a single delivery partner.
 * Uses a Firestore transaction so two simultaneous orders cannot claim the
 * same partner: the transaction re-reads the document and aborts if the
 * partner is already busy or offline.
 */
async function tryClaimPartner(partnerId) {
  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(doc(db, 'deliveryPartners', partnerId));
      if (!snap.exists()) return null;
      const d = snap.data();
      // Double-check inside the transaction — prevents race conditions
      if (d.isOnline !== true || d.isBusy !== false) return null;
      transaction.update(snap.ref, { isBusy: true });
      return {
        id: snap.id,
        name: d.name ?? d.partnerName ?? '',
        earning: Number(d.commissionFlat ?? d.earning ?? 0),
        telegramChatId: d.telegramChatId ?? '',
        phone: d.phone ?? d.mobile ?? '',
      };
    });
  } catch (e) {
    console.warn(`[tryClaimPartner] Transaction failed for partner ${partnerId}:`, e);
    return null;
  }
}

/**
 * Assignment algorithm:
 *   Phase 1 — Try each partner assigned to the customer's delivery area
 *             (online && !busy), in order. Stop at the first success.
 *   Phase 2 — If all area partners are busy/offline, query ALL delivery
 *             partners for the first available one, skipping area partners
 *             already tried.
 *   Returns null when no partner is available anywhere.
 */
async function assignDeliveryPartner(selectedLocation) {
  // Collect area-assigned partner IDs — prefer the array field, fall back to
  // the legacy single-ID field for backward compatibility.
  const areaPartnerIds = selectedLocation.assignedPartnerIds?.length
    ? selectedLocation.assignedPartnerIds
    : selectedLocation.assignedPartnerId
    ? [selectedLocation.assignedPartnerId]
    : [];

  // ── Phase 1: Area partners (highest priority) ──
  for (const partnerId of areaPartnerIds) {
    const result = await tryClaimPartner(partnerId);
    if (result) return result;
  }

  // ── Phase 2: Global fallback across ALL delivery partners ──
  try {
    const snap = await getDocs(
      query(
        collection(db, 'deliveryPartners'),
        where('isOnline', '==', true),
        where('isBusy', '==', false),
      ),
    );
    for (const partnerDoc of snap.docs) {
      if (areaPartnerIds.includes(partnerDoc.id)) continue; // already tried in Phase 1
      const result = await tryClaimPartner(partnerDoc.id);
      if (result) return result;
    }
  } catch (e) {
    console.warn('[assignDeliveryPartner] Global fallback query failed:', e);
  }

  return null; // No available partner found anywhere
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

  // ── Saved Address State ─────────────────────────────────────────────────────
  const [saveAddress, setSaveAddress] = useState(true);
  const [isAddressAutoFilled, setIsAddressAutoFilled] = useState(false);
  const [savedLocId, setSavedLocId] = useState('');

  // ── Delivery locations ──────────────────────────────────────────────────────
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [locLoading, setLocLoading] = useState(true);

  // ── Order placement ─────────────────────────────────────────────────────────
  const [placing, setPlacing] = useState(false);

  // ── Rain surcharge ──────────────────────────────────────────────────────────
  const [rainCharges, setRainCharges] = useState(null); // { isEnabled, surchargeFlat, customerMessage }

  // ── Distance service fee (from restaurant doc) ──────────────────────────────
  const [distanceServiceFee, setDistanceServiceFee] = useState(0);

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

  // ─── Fetch saved address & mobile from Firestore profile / localStorage ────
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    (async () => {
      try {
        let loadedAddress = '';
        let loadedMobile = '';
        let loadedLocationId = '';

        // 1. Check localStorage for fast instant pre-fill
        const localAddress = localStorage.getItem(`nextto_saved_address_${user.uid}`);
        const localMobile = localStorage.getItem(`nextto_saved_mobile_${user.uid}`);
        const localLocId = localStorage.getItem(`nextto_saved_loc_${user.uid}`);

        if (localAddress) loadedAddress = localAddress;
        if (localMobile) loadedMobile = localMobile;
        if (localLocId) loadedLocationId = localLocId;

        // 2. Fetch Firestore profile (users/{uid})
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData.address) loadedAddress = uData.address;
          if (uData.mobile || uData.phone) loadedMobile = uData.mobile || uData.phone;
          if (uData.locationId || uData.lastLocationId) loadedLocationId = uData.locationId || uData.lastLocationId;
        } else if (user.phoneNumber) {
          const cleanPhone = user.phoneNumber.replace('+91', '').trim();
          if (cleanPhone && !loadedMobile) loadedMobile = cleanPhone;
        }

        if (cancelled) return;

        if (loadedAddress) {
          setAddress((prev) => prev || loadedAddress);
          setIsAddressAutoFilled(true);
        }
        if (loadedMobile) {
          setMobile((prev) => prev || loadedMobile);
        }
        if (loadedLocationId) {
          setSavedLocId(loadedLocationId);
        }
      } catch (err) {
        console.warn('[useCheckout] loadSavedAddress:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // ─── Auto-select saved delivery location when locations arrive ──────────────
  useEffect(() => {
    if (selectedLoc || locations.length === 0 || !savedLocId) return;
    const matched = locations.find((l) => l.id === savedLocId);
    if (matched) {
      setSelectedLoc(matched);
    }
  }, [locations, selectedLoc, savedLocId]);

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

  // ─── Fetch rain surcharge config ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'rainCharges'));
        if (!cancelled && snap.exists()) {
          setRainCharges(snap.data());
        }
      } catch (err) {
        console.warn('[useCheckout] fetchRainCharges:', err);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // ─── Fetch distanceServiceFee from restaurant doc ────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const firstRestId = cart.find((i) => i.restaurantId)?.restaurantId;
    if (!firstRestId) {
      setDistanceServiceFee(0);
      return;
    }

    (async () => {
      try {
        const snap = await getDoc(doc(db, 'restaurants', firstRestId));
        if (!cancelled) {
          setDistanceServiceFee(numberValue(snap.exists() ? snap.data().distanceServiceFee : 0));
        }
      } catch (err) {
        console.warn('[useCheckout] fetchDistanceServiceFee:', err);
        if (!cancelled) setDistanceServiceFee(0);
      }
    })();

    return () => { cancelled = true; };
  }, [cart.map((i) => i.restaurantId).join(',')]);

  // ─── Derived values ──────────────────────────────────────────────────────────
  const isPickupDropOrder = !!pickupOrderData;
  const needsDeliveryArea = cart.length > 0;

  const pickupDropCharge = numberValue(pickupOrderData?.totalCharge);
  const deliveryCharge = numberValue(selectedLoc?.deliveryCharge);

  const couponCartDiscount = couponResult?.cartDiscount ?? 0;
  const couponDeliveryDiscount = couponResult?.deliveryDiscount ?? 0;

  // Rain surcharge (only when enabled)
  const rainSurcharge = rainCharges?.isEnabled ? numberValue(rainCharges.surchargeFlat) : 0;
  const rainMessage = rainCharges?.isEnabled ? (rainCharges.customerMessage ?? '') : '';

  // distanceServiceFee is fetched from restaurants/{restaurantId}.distanceServiceFee (state above)

  // Free delivery: only for food-only orders >= ₹500 (not grocery / medicine)
  const FREE_DELIVERY_THRESHOLD = 500;
  const hasNonFoodItem = cart.some(
    (i) => i.serviceType === 'grocery' || i.serviceType === 'medicine',
  );
  const freeDelivery =
    !isPickupDropOrder &&
    !hasNonFoodItem &&
    totalPrice >= FREE_DELIVERY_THRESHOLD &&
    deliveryCharge > 0;

  const effectiveDeliveryCharge = freeDelivery ? 0 : deliveryCharge;

  const totalAmount =
    totalPrice +
    (needsDeliveryArea ? effectiveDeliveryCharge : 0) +
    pickupDropCharge +
    rainSurcharge +
    distanceServiceFee -
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

      // ── Step 3: Resolve delivery partner (atomic assignment, matching User App) ─
      let selectedDeliveryPartnerId = '';
      let selectedDeliveryPartnerName = '';
      let selectedDeliveryPartnerPhone = '';
      let isPartnerOnline = true;
      let partnerTelegramChatId = '';

      if (!pickupOrderData && selectedLoc) {
        // Atomic multi-partner assignment: tries area partners first, then global fallback.
        // Each attempt uses a Firestore transaction to atomically set isBusy=true
        // so two simultaneous orders can never claim the same partner.
        const partnerResult = await assignDeliveryPartner(selectedLoc);
        if (partnerResult) {
          selectedDeliveryPartnerId = partnerResult.id;
          selectedDeliveryPartnerName = partnerResult.name;
          selectedDeliveryPartnerPhone = partnerResult.phone;
          partnerTelegramChatId = partnerResult.telegramChatId;
          isPartnerOnline = true; // guaranteed by assignDeliveryPartner
        } else {
          // No available partner anywhere — order is saved without one;
          // admin is notified via dispatchOrderNotifications below.
          isPartnerOnline = false;
        }
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
        : selectedDeliveryPartnerId;

      const deliveryPartnerName = pickupDropOnly
        ? pickupDropDetails.assignedPartnerName
        : selectedDeliveryPartnerName;

      // Note: deliveryPartnerEarning is always stored (computed in Step 8)
      // Even if no partner found, we store what they would earn when assigned.
      const deliveryPartnerNumber = pickupDropOnly
        ? ''
        : selectedDeliveryPartnerPhone;

      // ── Step 6: Fetch restaurant data (names, phones, logos) ────────────────
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
                distanceServiceFee: numberValue(d.distanceServiceFee),
              };
            }
          });
        } catch (err) {
          console.warn('[useCheckout] fetchRestaurants partial failure:', err);
        }
      }

      const firstRestData = restaurantDataMap[restaurantIds[0]] ?? {
        name: '', phone: '', logo: '',
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
            commissionRate: numberValue(i.commissionRate),  // from product, not restaurant
            deliveryArea: selectedLoc?.name ?? '',
          };
        }),
        ...pickupDropItem,
      ];

      // ── Step 8: Compute final totals ─────────────────────────────────────────
      const subtotal = totalPrice + (pickupDropDetails?.totalCharge ?? 0);

      // Free delivery: only food-only carts with subtotal >= ₹500
      const orderHasNonFoodItem = cart.some(
        (i) => i.serviceType === 'grocery' || i.serviceType === 'medicine',
      );
      const orderFreeDelivery =
        !pickupDropDetails &&
        !orderHasNonFoodItem &&
        totalPrice >= FREE_DELIVERY_THRESHOLD &&
        deliveryCharge > 0;
      const orderDeliveryCharge = needsDeliveryArea
        ? (orderFreeDelivery ? 0 : deliveryCharge)
        : 0;
      const finalRainSurcharge = rainCharges?.isEnabled ? numberValue(rainCharges.surchargeFlat) : 0;

      // Distance service fee from restaurant doc (already fetched in Step 6)
      const firstRestId = restaurantIds[0] ?? '';
      const restDocData = restaurantDataMap[firstRestId];
      const finalDistanceServiceFee = numberValue(restDocData?.distanceServiceFee ?? distanceServiceFee);

      // ── Delivery partner earning: NEW formula ─────────────────────────────────
      // 70% of raw area delivery charge (always, even when free delivery is applied)
      // + 50% of rain surcharge + 50% of distance service fee
      // Always stored regardless of whether a partner is found or online.
      // NOTE: When free delivery is granted, the store absorbs the partner cost —
      //       so we use `deliveryCharge` (raw) NOT `orderDeliveryCharge` (effective).
      const rawAreaCharge = needsDeliveryArea ? deliveryCharge : 0;
      const areaFeePartnerShare = Math.round(rawAreaCharge * 0.7);
      const rainPartnerBonus = Math.round(finalRainSurcharge * 0.5);
      const distanceServiceFeePartnerBonus = Math.round(finalDistanceServiceFee * 0.5);
      const finalDeliveryPartnerEarning =
        areaFeePartnerShare + rainPartnerBonus + distanceServiceFeePartnerBonus;

      const finalTotalAmount =
        subtotal + orderDeliveryCharge + finalRainSurcharge + finalDistanceServiceFee - finalCouponCartDiscount - finalCouponDeliveryDiscount;

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
        deliveryChargeOriginal: deliveryCharge,
        freeDelivery: orderFreeDelivery,
        deliveryPartnerId,
        deliveryPartnerName,
        deliveryPartnerNumber,
        deliveryPartnerEarning: finalDeliveryPartnerEarning,
        // Earning breakdown (for admin/settlement reference)
        areaFeePartnerShare,           // 70% of orderDeliveryCharge

        // Coupon
        appliedCouponId: finalCouponId,
        appliedCouponCode: finalCouponCode,
        couponCartDiscount: finalCouponCartDiscount,
        couponDeliveryDiscount: finalCouponDeliveryDiscount,

        // Rain surcharge
        rainSurcharge: finalRainSurcharge,
        rainMessage: rainCharges?.isEnabled ? (rainCharges.customerMessage ?? '') : '',
        rainPartnerBonus,               // 50% of rainSurcharge

        // Distance service fee
        distanceServiceFee: finalDistanceServiceFee,
        distanceServiceFeePartnerBonus, // 50% of distanceServiceFee

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
      // ── Step 10: Save address to user profile if enabled ──────────────────────
      if (saveAddress && user?.uid) {
        try {
          const cleanAddr = address.trim();
          const cleanMob = mobile.trim();
          const locIdToSave = selectedLoc?.id || '';

          if (cleanAddr) localStorage.setItem(`nextto_saved_address_${user.uid}`, cleanAddr);
          if (cleanMob) localStorage.setItem(`nextto_saved_mobile_${user.uid}`, cleanMob);
          if (locIdToSave) localStorage.setItem(`nextto_saved_loc_${user.uid}`, locIdToSave);

          setDoc(
            doc(db, 'users', user.uid),
            {
              address: cleanAddr,
              mobile: cleanMob,
              phone: cleanMob,
              lastLocationId: locIdToSave,
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ).catch((err) => console.warn('[useCheckout] save profile error:', err));
        } catch (e) {
          console.warn('[useCheckout] save address localStorage error:', e);
        }
      }

      // ── Step 11: Clear cart and navigate immediately ──────────────────────────
      clearCart();
      toast.success('Order placed successfully! 🎉');
      navigate(`/order/${orderId}`, { replace: true });

      // ── Step 12: Background — increment coupon usage (non-blocking) ──────────
      if (finalCouponId) {
        incrementCouponUsage(finalCouponId).catch((err) =>
          console.warn('[useCheckout] coupon usage increment failed (non-critical):', err)
        );
      }

      // ── Step 13: Background — dispatch all notifications (non-blocking) ──────
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
        noPartnerAvailable: !deliveryPartnerId && !pickupDropOnly,
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
    user, clearCart, navigate, needsDeliveryArea, saveAddress]);

  // ─── Manual Save Address Action ──────────────────────────────────────────────
  const handleSaveAddressNow = useCallback(async () => {
    if (!address.trim()) {
      toast.error('Please enter an address to save');
      return;
    }
    if (!user?.uid) return;

    try {
      const cleanAddr = address.trim();
      const cleanMob = mobile.trim();
      const locIdToSave = selectedLoc?.id || '';

      if (cleanAddr) localStorage.setItem(`nextto_saved_address_${user.uid}`, cleanAddr);
      if (cleanMob) localStorage.setItem(`nextto_saved_mobile_${user.uid}`, cleanMob);
      if (locIdToSave) localStorage.setItem(`nextto_saved_loc_${user.uid}`, locIdToSave);

      await setDoc(
        doc(db, 'users', user.uid),
        {
          address: cleanAddr,
          mobile: cleanMob,
          phone: cleanMob,
          lastLocationId: locIdToSave,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setIsAddressAutoFilled(true);
      toast.success('Address saved for future orders! 🏠');
    } catch (err) {
      console.error('[useCheckout] handleSaveAddressNow:', err);
      toast.error('Failed to save address');
    }
  }, [address, mobile, selectedLoc?.id, user?.uid]);

  // ─── Public API ───────────────────────────────────────────────────────────────
  return {
    // Form state
    address, setAddress,
    mobile, setMobile,
    paymentMethod, setPaymentMethod,
    saveAddress, setSaveAddress,
    isAddressAutoFilled, handleSaveAddressNow,

    // Delivery locations
    locations,
    selectedLoc, setSelectedLoc,
    locLoading,

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
    deliveryCharge: effectiveDeliveryCharge,
    rawDeliveryCharge: deliveryCharge,
    freeDelivery,
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
  };
}
