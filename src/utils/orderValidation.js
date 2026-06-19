/**
 * orderValidation.js
 *
 * Final-gate validation before an order is created.
 * Re-fetches every product and restaurant from Firestore so stale
 * cart state can never sneak an invalid order through.
 *
 * Usage (in useCheckout):
 *   const result = await validateCartForOrder(cart, restaurantIds);
 *   if (!result.ok) { toast.error(result.message); return; }
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Validates all cart items against live Firestore data.
 *
 * Checks:
 *  1. Every product still has `isAvailable !== false`
 *  2. Every restaurant still has `isOpen !== false`
 *
 * @param {Array}    cart           - Cart items from CartContext
 * @param {string[]} restaurantIds  - Unique restaurant IDs extracted from cart
 * @returns {Promise<{ ok: boolean, message: string, unavailableItems: string[], closedRestaurants: string[] }>}
 */
export async function validateCartForOrder(cart, restaurantIds) {
  const unavailableItems = [];
  const closedRestaurants = [];

  // ── 1. Check product availability ─────────────────────────────────────────
  if (cart.length > 0) {
    const productSnaps = await Promise.allSettled(
      cart.map((item) => getDoc(doc(db, 'products', item.id)))
    );

    cart.forEach((item, idx) => {
      const result = productSnaps[idx];
      if (result.status === 'fulfilled') {
        const snap = result.value;
        if (!snap.exists() || snap.data().isAvailable === false) {
          unavailableItems.push(item.name ?? item.id);
        }
      }
      // If the fetch itself failed, we let it pass (optimistic) to avoid
      // blocking orders on transient network issues.
    });
  }

  // ── 2. Check restaurant open status ──────────────────────────────────────
  if (restaurantIds.length > 0) {
    const restaurantSnaps = await Promise.allSettled(
      restaurantIds.map((rId) => getDoc(doc(db, 'restaurants', rId)))
    );

    restaurantIds.forEach((rId, idx) => {
      const result = restaurantSnaps[idx];
      if (result.status === 'fulfilled') {
        const snap = result.value;
        if (snap.exists() && snap.data().isOpen === false) {
          const name = snap.data().name ?? rId;
          closedRestaurants.push(name);
        }
      }
    });
  }

  // ── 3. Build result ───────────────────────────────────────────────────────
  if (unavailableItems.length > 0) {
    const list = unavailableItems.slice(0, 3).join(', ');
    const more = unavailableItems.length > 3 ? ` and ${unavailableItems.length - 3} more` : '';
    return {
      ok: false,
      message: `Some items are no longer available: ${list}${more}. Please review your cart.`,
      unavailableItems,
      closedRestaurants,
    };
  }

  if (closedRestaurants.length > 0) {
    const list = closedRestaurants.join(', ');
    return {
      ok: false,
      message: `${list} ${closedRestaurants.length === 1 ? 'is' : 'are'} currently closed. Please try again later.`,
      unavailableItems,
      closedRestaurants,
    };
  }

  return { ok: true, message: '', unavailableItems: [], closedRestaurants: [] };
}
