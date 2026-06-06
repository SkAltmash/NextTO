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

  // ── Guarded addToCart: block if Pickup & Drop is in cart ──
  const addToCart = useCallback((item) => {
    if (!isOnline) {
      toast.error('Store is currently paused. Please try again later.', { id: 'store-offline' });
      return;
    }
    if (pickupOrderData) {
      toast.error('Remove Pickup & Drop from cart first to add items', { id: 'cart-conflict' });
      return;
    }
    dispatch({ type: 'ADD', item });
  }, [isOnline, pickupOrderData]);

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
        cart, addToCart, removeFromCart, updateQty, clearCart, totalItems, totalPrice,
        pickupOrderData, setPickupOrderData,
        hasDeliveryItems,
        favorites, toggleFavorite, isFavorite,
        isOnline, storeLoading
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
