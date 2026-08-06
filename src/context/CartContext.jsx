import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useStorestatus } from '../hooks/useStoreStatus';

const CartContext = createContext(null);

const STORAGE_KEY = 'fe_cart';
const PICKUP_STORAGE_KEY = 'fe_pickup_drop';

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find((i) => i.id === action.item.id);
      if (existing) {
        return state.map((i) =>
          i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...state, { ...action.item, qty: 1 }];
    }
    case 'REMOVE':
      return state.filter((i) => i.id !== action.id);
    case 'UPDATE_QTY':
      if (action.qty <= 0) return state.filter((i) => i.id !== action.id);
      return state.map((i) =>
        i.id === action.id ? { ...i, qty: action.qty } : i
      );
    case 'CLEAR':
      return [];
    case 'INIT':
      return action.items;
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const { isOnline, loading: storeLoading } = useStorestatus();
  const [cart, dispatch] = useReducer(cartReducer, [], () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // ── Cart drawer open state (shared so any component can open it) ──
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const openCartDrawer = useCallback(() => setCartDrawerOpen(true), []);
  const closeCartDrawer = useCallback(() => setCartDrawerOpen(false), []);

  const [pickupOrderData, setPickupOrderDataRaw] = useState(() => {
    try {
      const saved = localStorage.getItem(PICKUP_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (pickupOrderData) {
      localStorage.setItem(PICKUP_STORAGE_KEY, JSON.stringify(pickupOrderData));
    } else {
      localStorage.removeItem(PICKUP_STORAGE_KEY);
    }
  }, [pickupOrderData]);

  // ── Cart has delivery-type items (food/grocery/medicine) ──
  const hasDeliveryItems = cart.length > 0;

  // ── Current restaurant in cart (first item's restaurantId) ──
  const cartRestaurantId = cart.length > 0 ? cart[0].restaurantId ?? null : null;

  // ── clearAndAdd: wipe cart + pickup, then add new item (used for cross-restaurant) ──
  const clearAndAdd = useCallback((item) => {
    dispatch({ type: 'CLEAR' });
    setPickupOrderDataRaw(null);
    dispatch({ type: 'ADD', item });
    setCartDrawerOpen(true);
  }, []);

  // ── Guarded addToCart: blocks Pickup & Drop conflict + cross-restaurant conflict ──
  const addToCart = useCallback((item) => {
    if (!isOnline) {
      toast.error('Store is currently paused. Please try again later.', { id: 'store-offline' });
      return;
    }
    if (pickupOrderData) {
      toast.error('Remove Pickup & Drop from cart first to add items', { id: 'cart-conflict' });
      return;
    }

    // Block cross-restaurant: if cart has items from a different restaurant, prompt user
    const currentRestaurantId = cart.length > 0 ? cart[0].restaurantId ?? null : null;
    if (
      item.restaurantId &&
      currentRestaurantId &&
      item.restaurantId !== currentRestaurantId
    ) {
      toast(
        (t) => (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#1e293b' }}>
              Start fresh?
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
              Your cart has items from another restaurant. Clear it and add this item?
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <button
                onClick={() => {
                  clearAndAdd(item);
                  toast.dismiss(t.id);
                }}
                style={{
                  flex: 1, padding: '6px 12px', borderRadius: 10,
                  background: '#f97316', color: '#fff',
                  border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                }}
              >
                Yes, clear &amp; add
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                style={{
                  flex: 1, padding: '6px 12px', borderRadius: 10,
                  background: '#f1f5f9', color: '#475569',
                  border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ),
        {
          id: 'cart-restaurant-conflict',
          duration: 6000,
          style: { maxWidth: 300, padding: '14px 16px' },
        }
      );
      return;
    }

    dispatch({ type: 'ADD', item });
    setCartDrawerOpen(true);
  }, [isOnline, pickupOrderData, cart, clearAndAdd]);

  const removeFromCart = (id) => dispatch({ type: 'REMOVE', id });
  const updateQty = (id, qty) => dispatch({ type: 'UPDATE_QTY', id, qty });
  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
    setPickupOrderDataRaw(null);
  };

  // ── Guarded setPickupOrderData: block if delivery items exist ──
  const setPickupOrderData = useCallback((data) => {
    if (data && !isOnline) {
      toast.error('Store is currently paused. Please try again later.', { id: 'store-offline' });
      return;
    }
    if (data && hasDeliveryItems) {
      toast.error('Remove Food/Grocery/Medicine items from cart first to add Pickup & Drop', { id: 'cart-conflict' });
      return;
    }
    setPickupOrderDataRaw(data);
  }, [isOnline, hasDeliveryItems]);

  const FAV_STORAGE_KEY = 'fe_favorites';
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(FAV_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((product) => {
    setFavorites((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        toast.success(`Removed ${product.name} from favorites 🤍`, { id: 'fav' });
        return prev.filter((p) => p.id !== product.id);
      } else {
        toast.success(`Added ${product.name} to favorites ❤️`, { id: 'fav' });
        return [...prev, product];
      }
    });
  }, []);

  const isFavorite = useCallback((productId) => {
    return favorites.some((p) => p.id === productId);
  }, [favorites]);

  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0) + (pickupOrderData ? 1 : 0);
  const totalPrice = cart.reduce(
    (sum, i) => sum + (i.discountPrice ?? i.price) * i.qty,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart, addToCart, clearAndAdd, removeFromCart, updateQty, clearCart, totalItems, totalPrice,
        pickupOrderData, setPickupOrderData,
        hasDeliveryItems,
        cartRestaurantId,
        favorites, toggleFavorite, isFavorite,
        isOnline, storeLoading,
        cartDrawerOpen, openCartDrawer, closeCartDrawer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
