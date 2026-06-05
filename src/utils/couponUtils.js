import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Validates a coupon code at checkout.
 *
 * @param {string} code           - Code the user typed
 * @param {number} cartSubtotal   - Sum of all item prices (before delivery)
 * @param {string|string[]} restaurantId - ID or array of IDs of the restaurant(s) in the cart
 * @param {number} deliveryCharge - Current delivery charge
 * @returns {{ valid, cartDiscount, deliveryDiscount, error, coupon }}
 */
export async function validateCoupon(code, cartSubtotal, restaurantId, deliveryCharge) {
  const normalised = code.toUpperCase().trim();

  if (!normalised) {
    return { valid: false, error: 'Please enter a coupon code.', cartDiscount: 0, deliveryDiscount: 0 };
  }

  // Step 1: Find the coupon in Firestore
  const q = query(
    collection(db, 'coupons'),
    where('code', '==', normalised),
    where('isActive', '==', true)
  );
  const snap = await getDocs(q);

  if (snap.empty) {
    return { valid: false, error: 'Invalid or expired coupon code.', cartDiscount: 0, deliveryDiscount: 0 };
  }

  const coupon = { id: snap.docs[0].id, ...snap.docs[0].data() };

  // Step 2: Check expiry
  if (coupon.expiresAt) {
    const expiryDate = coupon.expiresAt.toDate
      ? coupon.expiresAt.toDate()
      : new Date(coupon.expiresAt);
    if (expiryDate < new Date()) {
      return { valid: false, error: 'This coupon has expired.', cartDiscount: 0, deliveryDiscount: 0 };
    }
  }

  // Step 3: Check usage limit
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, error: 'Coupon usage limit reached.', cartDiscount: 0, deliveryDiscount: 0 };
  }

  // Step 4: Check minimum order amount
  if (cartSubtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      error: `Minimum order of ₹${coupon.minOrderAmount} required to use this coupon.`,
      cartDiscount: 0,
      deliveryDiscount: 0,
    };
  }

  // Step 5: Check restaurant scope
  if (coupon.scope === 'specific_restaurants') {
    const ids = Array.isArray(restaurantId)
      ? restaurantId
      : (restaurantId ? [restaurantId] : []);

    if (ids.length === 0) {
      return {
        valid: false,
        error: 'This coupon is not valid for the selected items.',
        cartDiscount: 0,
        deliveryDiscount: 0,
      };
    }

    const hasInvalid = ids.some((id) => !coupon.restaurantIds || !coupon.restaurantIds.includes(id));
    if (hasInvalid) {
      return {
        valid: false,
        error: 'This coupon is only valid for specific restaurants. Please remove items from other restaurants to use it.',
        cartDiscount: 0,
        deliveryDiscount: 0,
      };
    }
  }

  // Step 6: Calculate cart discount
  let cartDiscount = 0;
  if (coupon.discountType === 'percentage') {
    cartDiscount = Math.round((cartSubtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount > 0) {
      cartDiscount = Math.min(cartDiscount, coupon.maxDiscountAmount);
    }
  } else {
    // flat discount — never deduct more than the cart value
    cartDiscount = Math.min(coupon.discountValue, cartSubtotal);
  }

  // Step 7: Calculate delivery discount
  let deliveryDiscount = 0;
  if (coupon.deliveryDiscountValue > 0) {
    if (coupon.deliveryDiscountType === 'percentage') {
      deliveryDiscount = Math.round((deliveryCharge * coupon.deliveryDiscountValue) / 100);
    } else {
      deliveryDiscount = Math.min(coupon.deliveryDiscountValue, deliveryCharge);
    }
  }

  return { valid: true, coupon, cartDiscount, deliveryDiscount };
}

/**
 * Increments the coupon's usedCount by 1.
 * Call this ONLY after the order has been successfully saved.
 *
 * @param {string} couponId - Firestore document ID of the coupon
 */
export async function incrementCouponUsage(couponId) {
  await updateDoc(doc(db, 'coupons', couponId), {
    usedCount: increment(1),
  });
}
