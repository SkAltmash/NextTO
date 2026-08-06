import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Download } from 'lucide-react';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.sk_altamash18.UserApp';

/**
 * Detects if the user is on an Android device by inspecting the User-Agent.
 */
function isAndroid() {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
}

/**
 * A sticky bottom banner shown ONLY to Android users,
 * prompting them to open / install the NextTo app from the Play Store.
 * Dismissing it stores a flag in sessionStorage so it won't reappear
 * during the same browsing session.
 */
export default function AppBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show on Android + not previously dismissed this session
    if (isAndroid() && !sessionStorage.getItem('nextto_app_banner_dismissed')) {
      // Small delay so the banner slides in after page paint
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('nextto_app_banner_dismissed', '1');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className="fixed bottom-16 md:bottom-4 left-3 right-3 z-[9999] max-w-md mx-auto"
        >
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl shadow-black/30 border border-white/10 overflow-hidden">
            {/* Decorative gradient accent */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

            {/* Close button */}
            <button
              onClick={dismiss}
              aria-label="Dismiss app banner"
              className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-3.5 p-3.5 pr-10">
              {/* App icon */}
              <div className="shrink-0 w-12 h-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src="/logo.jpeg"
                  alt="NextTo App"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h4 className="text-sm font-extrabold text-white tracking-tight">
                    Next<span className="text-orange-400">To</span>
                  </h4>
                  <span className="text-[9px] font-bold bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded-md leading-none">
                    APP
                  </span>
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={9}
                      className="text-amber-400 fill-amber-400"
                    />
                  ))}
                  <span className="text-[9px] font-semibold text-white/40 ml-0.5">
                    4.8
                  </span>
                </div>

                <p className="text-[10px] font-medium text-white/40 truncate">
                  Get the best experience on our app
                </p>
              </div>

              {/* CTA Button */}
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/30 transition-all active:scale-95"
              >
                <Download size={13} />
                <span>OPEN</span>
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
