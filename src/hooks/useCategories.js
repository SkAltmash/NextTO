import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Real-time listener for the `categories` Firestore collection.
 * Returns { categories: Category[], loading: boolean }
 *
 * Category shape:
 *   { id, name, image, serviceType: "food"|"medicine"|"grocery", createdAt, updatedAt }
 */
export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error('useCategories error:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { categories, loading };
}

/** Lookup helper — returns category name or fallback */
export function getCategoryName(categories, categoryId) {
  if (!categoryId) return 'Uncategorized';
  return categories.find((c) => c.id === categoryId)?.name ?? categoryId;
}
