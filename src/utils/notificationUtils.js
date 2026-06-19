/**
 * notificationUtils.js
 *
 * Centralised notification layer for order events.
 *
 * Architecture
 * ────────────
 * Each `notify*` function is fire-and-forget (returns void) so callers
 * never need to await them, keeping the critical order-creation path
 * completely unblocked.
 *
 * To add a new channel (SMS, WhatsApp, Push …) simply add a new helper
 * below and call it inside the relevant `notify*` function alongside the
 * existing Telegram call.
 */

import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Escapes characters that have special meaning in Telegram HTML. */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sends a single Telegram message.
 *
 * Uses `keepalive: true` so the request is NOT cancelled when the checkout
 * page navigates away. Without this flag, the browser aborts all in-flight
 * fetch calls on page unload, producing "TypeError: Failed to fetch".
 *
 * @param {string} botToken
 * @param {string|number} chatId
 * @param {string} text  HTML-formatted message
 */
async function sendTelegramMessage(botToken, chatId, text) {
  const body = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    // keepalive keeps the request alive even after the initiating page
    // navigates away or is unloaded — essential for fire-and-forget calls.
    keepalive: true,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.description || `Telegram error ${res.status}`);
  }
}

/** Fetches all currently-online delivery partners as a formatted list string. */
async function getOnlinePartnersText() {
  try {
    const snap = await getDocs(
      query(collection(db, 'deliveryPartners'), where('isOnline', '==', true))
    );
    if (snap.empty) return 'None';
    return snap.docs
      .map((d) => {
        const p = d.data();
        return `  • ${escapeHtml(p.name)} (${escapeHtml(p.mobile || p.phone || 'No Mobile')})`;
      })
      .join('\n');
  } catch {
    return 'Unable to fetch';
  }
}

/** Fetches the admin Telegram chat ID from config/telegram. */
async function getAdminChatId() {
  try {
    const snap = await getDoc(doc(db, 'config', 'telegram'));
    return snap.exists() ? snap.data().adminChatId : null;
  } catch {
    return null;
  }
}

// ─── Notification Functions ───────────────────────────────────────────────────

/**
 * Sends per-restaurant order notifications via Telegram.
 *
 * @param {{
 *   botToken: string,
 *   orderId: string,
 *   cart: Array,
 *   paymentMethod: string,
 * }} params
 */
export async function notifyRestaurants({ botToken, orderId, cart, paymentMethod }) {
  if (!botToken || !cart.length) return;

  // Group cart items by restaurantId
  const byRestaurant = cart.reduce((acc, item) => {
    if (!item.restaurantId) return acc;
    (acc[item.restaurantId] ??= []).push(item);
    return acc;
  }, {});

  await Promise.allSettled(
    Object.entries(byRestaurant).map(async ([rId, items]) => {
      try {
        const snap = await getDoc(doc(db, 'restaurants', rId));
        if (!snap.exists()) return;
        const chatId = snap.data().telegramChatId;
        if (!chatId) return;

        const itemLines = items
          .map((i) => `  • ${escapeHtml(i.name)} × ${i.qty}  ₹${(i.discountPrice ?? i.price) * i.qty}`)
          .join('\n');
        const subtotal = items.reduce((s, i) => s + (i.discountPrice ?? i.price) * i.qty, 0);
        const payLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase();

        const msg =
          `🛒 <b>New Order Received!</b>\n` +
          `Order ID: <code>${escapeHtml(orderId)}</code>\n\n` +
          `<b>Items:</b>\n${itemLines}\n\n` +
          `Subtotal: ₹${subtotal}\n\n` +
          `Payment: ${payLabel}`;

        await sendTelegramMessage(botToken, chatId, msg);
      } catch (err) {
        console.warn(`[notify] Restaurant ${rId} Telegram skipped:`, err.message);
      }
    })
  );
}

/**
 * Sends a delivery-partner assignment notification via Telegram.
 * When the partner is offline, escalates to admin with the list of online partners.
 *
 * @param {{
 *   botToken: string,
 *   orderId: string,
 *   partnerId: string,
 *   cart: Array,
 *   totalPrice: number,
 *   deliveryCharge: number,
 *   paymentMethod: string,
 *   address: string,
 *   user: object,
 *   mobile: string,
 *   selectedLocName: string,
 * }} params
 */
export async function notifyDeliveryPartner({
  botToken,
  orderId,
  partnerId,
  cart,
  totalPrice,
  deliveryCharge,
  paymentMethod,
  address,
  user,
  mobile,
  selectedLocName,
}) {
  if (!botToken || !partnerId || !cart.length) return;
  console.log(botToken, partnerId, cart);

  try {
    const snap = await getDoc(doc(db, 'deliveryPartners', partnerId));
    if (!snap.exists()) return;

    const partnerData = snap.data();
    const isOnline = partnerData.isOnline !== false;
    const payLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase();

    const itemLines = cart
      .map((i) => `  • ${escapeHtml(i.name)} × ${i.qty}  ₹${(i.discountPrice ?? i.price) * i.qty}`)
      .join('\n');

    if (isOnline) {
      const chatId = partnerData.telegramChatId;
      if (!chatId) return;

      const msg =
        `🛵 <b>New Delivery Assignment!</b>\n` +
        `Order ID: <code>${escapeHtml(orderId)}</code>\n\n` +
        `<b>Items:</b>\n${itemLines}\n\n` +
        `Subtotal: ₹${totalPrice}\n` +
        `Delivery: ₹${deliveryCharge}\n` +
        `<b>Total: ₹${totalPrice + deliveryCharge}</b>\n\n` +
        `Payment: ${payLabel}\n` +
        `Address: ${escapeHtml(address)}\n` +
        `Customer: ${escapeHtml(user.displayName ?? user.email)}\n` +
        `Mobile: ${escapeHtml(mobile)}`;

      await sendTelegramMessage(botToken, chatId, msg);
    } else {
      // Partner offline → escalate to admin
      const adminChatId = await getAdminChatId();
      if (!adminChatId) return;

      const onlineList = await getOnlinePartnersText();

      const msg =
        `⚠️ <b>Delivery Partner Offline Alert!</b>\n\n` +
        `The assigned partner for this order is currently <b>offline</b>.\n\n` +
        `<b>Order Details:</b>\n` +
        `Order ID: <code>${escapeHtml(orderId)}</code>\n` +
        `Location: <b>${escapeHtml(selectedLocName)}</b>\n` +
        `Total: ₹${totalPrice + deliveryCharge}\n` +
        `<b>Items:</b>\n${itemLines}\n\n` +
        `<b>Assigned Partner Details (Offline):</b>\n` +
        `Name: ${escapeHtml(partnerData.name || 'Unknown')}\n` +
        `Mobile: ${escapeHtml(partnerData.mobile || partnerData.phone || 'N/A')}\n\n` +
        `<b>Online Delivery Partners:</b>\n${onlineList}`;

      await sendTelegramMessage(botToken, adminChatId, msg);
    }
  } catch (err) {
    console.warn('[notify] Delivery partner Telegram skipped:', err.message);
  }
}

/**
 * Sends a Pickup & Drop assignment notification via Telegram.
 * When the partner is offline, escalates to admin.
 *
 * @param {{
 *   botToken: string,
 *   orderId: string,
 *   pickupDropDetails: object,
 *   paymentMethod: string,
 *   address: string,
 *   user: object,
 *   mobile: string,
 * }} params
 */
export async function notifyPickupDropPartner({
  botToken,
  orderId,
  pickupDropDetails,
  paymentMethod,
  address,
  user,
  mobile,
}) {
  if (!botToken || !pickupDropDetails?.assignedPartnerId) return;

  try {
    const snap = await getDoc(doc(db, 'deliveryPartners', pickupDropDetails.assignedPartnerId));
    if (!snap.exists()) return;

    const partnerData = snap.data();
    const isOnline = partnerData.isOnline !== false;
    const payLabel = paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.toUpperCase();

    if (isOnline) {
      const chatId = partnerData.telegramChatId;
      if (!chatId) return;

      const msg =
        `🛵 <b>New Pickup & Drop Assignment!</b>\n` +
        `Order ID: <code>${escapeHtml(orderId)}</code>\n\n` +
        `📍 From: ${escapeHtml(pickupDropDetails.pickupLocationName)}\n` +
        `📍 To: ${escapeHtml(pickupDropDetails.dropLocationName)}\n\n` +
        `<b>Total Charge: ₹${pickupDropDetails.totalCharge}</b>\n` +
        `<b>Your Commission: ₹${pickupDropDetails.partnerEarning}</b>\n\n` +
        `Payment: ${payLabel}\n` +
        `Address details: ${escapeHtml(address)}\n` +
        (pickupDropDetails.note ? `Note: ${escapeHtml(pickupDropDetails.note)}\n` : '') +
        `Customer: ${escapeHtml(user.displayName ?? user.email)}\n` +
        `Mobile: ${escapeHtml(mobile)}`;

      await sendTelegramMessage(botToken, chatId, msg);
    } else {
      // Partner offline → escalate to admin
      const adminChatId = await getAdminChatId();
      if (!adminChatId) return;

      const onlineList = await getOnlinePartnersText();

      const msg =
        `⚠️ <b>Pickup & Drop Partner Offline Alert!</b>\n\n` +
        `The assigned rider for this Pickup & Drop order is currently <b>offline</b>.\n\n` +
        `<b>Order Details:</b>\n` +
        `Order ID: <code>${escapeHtml(orderId)}</code>\n` +
        `From: <b>${escapeHtml(pickupDropDetails.pickupLocationName)}</b>\n` +
        `To: <b>${escapeHtml(pickupDropDetails.dropLocationName)}</b>\n` +
        `Total Charge: ₹${pickupDropDetails.totalCharge}\n` +
        (pickupDropDetails.note ? `Note: ${escapeHtml(pickupDropDetails.note)}\n` : '') +
        `Customer: ${escapeHtml(user.displayName ?? user.email)}\n` +
        `Mobile: ${escapeHtml(mobile)}\n` +
        `Address: ${escapeHtml(address)}\n\n` +
        `<b>Assigned Partner (Offline):</b>\n` +
        `Name: ${escapeHtml(partnerData.name || 'Unknown')}\n` +
        `Mobile: ${escapeHtml(partnerData.mobile || partnerData.phone || 'N/A')}\n\n` +
        `<b>Online Delivery Partners:</b>\n${onlineList}`;

      await sendTelegramMessage(botToken, adminChatId, msg);
    }
  } catch (err) {
    console.warn('[notify] Pickup & Drop Telegram skipped:', err.message);
  }
}

/**
 * Master dispatcher — fires all applicable notifications in the background.
 * Never throws; individual channel failures are silently logged.
 *
 * Call this AFTER the order has been saved to Firestore and AFTER
 * navigating the user away from checkout.
 *
 * @param {{
 *   orderId: string,
 *   cart: Array,
 *   pickupDropDetails: object|null,
 *   pickupDropOnly: boolean,
 *   deliveryPartnerId: string,
 *   selectedLocName: string,
 *   totalPrice: number,
 *   deliveryCharge: number,
 *   paymentMethod: string,
 *   address: string,
 *   user: object,
 *   mobile: string,
 * }} params
 */
export function dispatchOrderNotifications(params) {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.warn('[notify] VITE_TELEGRAM_BOT_TOKEN not set — skipping all notifications.');
    return;
  }

  const {
    orderId,
    cart,
    pickupDropDetails,
    pickupDropOnly,
    deliveryPartnerId,
    selectedLocName,
    totalPrice,
    deliveryCharge,
    paymentMethod,
    address,
    user,
    mobile,
  } = params;

  // 1️⃣  Restaurant notifications (regular cart items only)
  if (cart.length > 0) {
    notifyRestaurants({ botToken, orderId, cart, paymentMethod }).catch(() => { });
  }

  // 2️⃣  Pickup & Drop partner
  if (pickupDropDetails) {
    notifyPickupDropPartner({
      botToken, orderId, pickupDropDetails, paymentMethod, address, user, mobile,
    }).catch(() => { });
  }

  // 3️⃣  Regular delivery partner (skip if this is a pickup-drop-only order)
  if (cart.length > 0 && !pickupDropOnly && deliveryPartnerId) {
    notifyDeliveryPartner({
      botToken,
      orderId,
      partnerId: deliveryPartnerId,
      cart,
      totalPrice,
      deliveryCharge,
      paymentMethod,
      address,
      user,
      mobile,
      selectedLocName,
    }).catch(() => { });
  }
}
