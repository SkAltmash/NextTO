import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

/* ─── shimmer keyframe injected once ─── */
const shimmerStyle = `
@keyframes hero-shimmer {
  0%   { background-position: -700px 0; }
  100% { background-position:  700px 0; }
}
.hero-shimmer {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 700px 100%;
  animation: hero-shimmer 1.4s infinite linear;
}
`;
if (typeof document !== "undefined" && !document.getElementById("hero-shimmer-css")) {
  const tag = document.createElement("style");
  tag.id = "hero-shimmer-css";
  tag.textContent = shimmerStyle;
  document.head.appendChild(tag);
}

function HeroBannerSkeleton() {
  return (
    <div className="w-full -mt-14 md:mt-0">
      {/* image placeholder */}
      <div
        className="hero-shimmer w-full"
        style={{ aspectRatio: "16 / 6", minHeight: "160px" }}
      />
      {/* text strip placeholder */}
      <div className="bg-white border-b border-slate-100 px-4 sm:px-8 lg:px-12 py-3 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="hero-shimmer h-2.5 w-24 rounded-full" />
          <div className="hero-shimmer h-4 w-48 rounded-full" />
        </div>
        <div className="flex gap-1.5 shrink-0">
          {[0, 1, 2].map((i) => (
            <div key={i} className="hero-shimmer h-1.5 w-1.5 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── slide transition variants ─── */
const slideVariants = {
  enter: (dir) => ({
    x: dir > 0 ? "100%" : "-100%",
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] },
  },
  exit: (dir) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  }),
};

const AUTO_PLAY_MS = 5000;

/* ─────────────────────────────────────── */
/*  HERO BANNER SLIDER                     */
/* ─────────────────────────────────────── */
function HeroBannerSlider({ slides }) {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);

  const go = useCallback(
    (nextIdx, dir) => {
      setDirection(dir);
      setCurrent((nextIdx + slides.length) % slides.length);
    },
    [slides.length]
  );

  const next = useCallback(() => go(current + 1, 1), [current, go]);
  const prev = useCallback(() => go(current - 1, -1), [current, go]);

  useEffect(() => {
    timerRef.current = setInterval(next, AUTO_PLAY_MS);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(next, AUTO_PLAY_MS);
  };

  const handlePrev = () => { prev(); resetTimer(); };
  const handleNext = () => { next(); resetTimer(); };
  const handleDot = (i) => { go(i, i > current ? 1 : -1); resetTimer(); };

  const slide = slides[current];

  return (
    <div className="w-full">
      {/* ── IMAGE AREA (clickable) ── */}
      <div
        className="relative w-full  overflow-hidden bg-slate-100"
        style={{ aspectRatio: "16 / 6", minHeight: "160px" }}
      >
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <motion.div
            key={slide.id ?? current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 cursor-pointer"
            onClick={() => navigate(slide.btnLink ?? "/product")}
          >
            <img
              src={slide.imageUrl}
              alt={slide.title ?? "Banner"}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        {/* nav arrows — stop propagation so they don't trigger navigation */}
        {slides.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10 cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-sm text-white flex items-center justify-center transition-all z-10 cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight size={17} />
            </button>
          </>
        )}

        {/* progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-black/10 z-10">
          <motion.div
            key={`${current}-progress`}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: AUTO_PLAY_MS / 1000, ease: "linear" }}
            style={{ transformOrigin: "left" }}
            className="h-full bg-orange-500"
          />
        </div>
      </div>

      {/* ── TEXT STRIP (below image) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${slide.id ?? current}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-white border-b border-slate-100 px-4 sm:px-8 lg:px-12 py-3 flex flex-row items-center justify-between gap-3"
        >
          <div>
            {slide.subtitle && (
              <p className="text-orange-500 text-[10px] font-extrabold uppercase tracking-widest mb-0.5">
                ⚡ {slide.subtitle}
              </p>
            )}
            {slide.title && (
              <h2 className="text-slate-800 text-sm sm:text-base font-black leading-snug">
                {slide.title}
              </h2>
            )}
          </div>

          {/* dot indicators */}
          {slides.length > 1 && (
            <div className="flex gap-1.5 shrink-0">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDot(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === current
                    ? "w-5 bg-orange-500"
                    : "w-1.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────── */
/*  MAIN HERO EXPORT                       */
/* ─────────────────────────────────────── */
export default function Hero() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "heroBanner"));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.slides) && data.slides.length > 0) {
            setSlides(data.slides);
          } else if (data.imageUrl) {
            // backwards-compat: wrap legacy single imageUrl
            setSlides([
              {
                id: "legacy",
                imageUrl: data.imageUrl,
                title: null,
                subtitle: null,
                btnLink: "/product",
              },
            ]);
          }
        }
      } catch (e) {
        console.warn("Hero banner fetch failed:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, []);

  if (loading) return <HeroBannerSkeleton />;
  if (slides.length === 0) return null;

  return (
    <section className="-mt-14 md:mt-0">
      <HeroBannerSlider slides={slides} />
    </section>
  );
}