import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Listens to `settings/Storestatus` in Firestore.
 * Returns { isOnline: boolean, loading: boolean }
 *
 * Firestore document shape expected:
 *   settings/Storestatus  →  { isOnline: true | false }
 *
 * Defaults to isOnline = true while loading so the UI
 * doesn't flash a "closed" banner on first render.
 */
export function useStorestatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'settings', 'Storestatus');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setIsOnline(snap.data().isOnline !== false); // treat missing field as true
        } else {
          setIsOnline(true); // document doesn't exist → treat as online
        }
        setLoading(false);
      },
      (err) => {
        console.error('useStorestatus error:', err);
        setIsOnline(true); // fail-open so users aren't blocked by a permissions error
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { isOnline, loading };
}
