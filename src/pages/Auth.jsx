import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, ArrowRight, Loader2, ChevronLeft, User, CheckCircle2, Shield,
  UtensilsCrossed, Mail, Lock, X, Eye, EyeOff, Building2, PartyPopper,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';

/* ── constants ── */
const INDIA_CODE = '+91';
const OTP_LENGTH = 6;

/* ── tiny helpers ── */
const cleanPhone = (raw) => raw.replace(/\D/g, '');
const fullPhone   = (raw) => `${INDIA_CODE}${cleanPhone(raw).slice(-10)}`;

/* ─────────────────────────────────────────────────────────────────────────────
   Steps:
     'phone'   → enter mobile number
     'otp'     → enter 6-digit OTP
     'name'    → new user: enter name (only on first login)
──────────────────────────────────────────────────────────────────────────────*/
export default function Auth() {
  const { loginWithCustomToken } = useAuth();
  const navigate = useNavigate();
  const location  = useLocation();
  const from = location.state?.from || '/';

  const [step,      setStep]      = useState('phone');  // 'phone' | 'otp' | 'name'
  const [phone,     setPhone]     = useState('');
  const [otp,       setOtp]       = useState(Array(OTP_LENGTH).fill(''));
  const [name,      setName]      = useState('');
  const [sessionId, setSessionId] = useState('');
  const [uid,       setUid]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [resendSec, setResendSec] = useState(0);

  /* ── Restaurant owner registration state ── */
  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [ownerDone,     setOwnerDone]     = useState(false);
  const [ownerLoading,  setOwnerLoading]  = useState(false);
  const [showOwnerPass, setShowOwnerPass] = useState(false);
  const [ownerData,     setOwnerData]     = useState({ name: '', email: '', password: '' });

  const otpRefs   = useRef([]);
  const timerRef  = useRef(null);

  /* ── countdown for resend ── */
  useEffect(() => {
    if (resendSec <= 0) return;
    timerRef.current = setTimeout(() => setResendSec((s) => s - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [resendSec]);

  /* ── Step 1 — send OTP ── */
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    const digits = cleanPhone(phone).slice(-10);
    if (digits.length !== 10) {
      toast.error('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/send-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phoneNumber: fullPhone(phone) }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to send OTP');

      setSessionId(data.sessionId);
      setOtp(Array(OTP_LENGTH).fill(''));
      setStep('otp');
      setResendSec(30);
      toast.success('OTP sent!');
      setTimeout(() => otpRefs.current[0]?.focus(), 150);
    } catch (err) {
      toast.error(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 2 — verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const otpStr = otp.join('');
    if (otpStr.length < OTP_LENGTH) {
      toast.error('Enter the complete 6-digit OTP');
      return;
    }
    setLoading(true);
    try {
      const res  = await fetch('/api/verify-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          phoneNumber: fullPhone(phone),
          sessionId,
          otp: otpStr,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Invalid OTP');

      // Sign in to Firebase client
      await loginWithCustomToken(data.token);
      setUid(data.uid);

      if (data.isNewUser) {
        // Brand new user — ask for name
        setStep('name');
      } else {
        // Existing user — check if they have a Firestore profile
        const snap = await getDoc(doc(db, 'users', data.uid));
        if (!snap.exists()) {
          // Token exists in Auth but no Firestore doc (edge case)
          setStep('name');
        } else {
          toast.success('Welcome back! 🎉');
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      toast.error(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  /* ── Step 3 — save name (new user) ── */
  const handleSaveName = async (e) => {
    e?.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) { toast.error('Please enter your name'); return; }
    setLoading(true);
    try {
      const phoneStr = fullPhone(phone);
      await setDoc(doc(db, 'users', uid), {
        uid,
        name:      trimmedName,
        phone:     phoneStr,
        email:     '',
        createdAt: serverTimestamp(),
      });
      toast.success(`Welcome, ${trimmedName}! 🎉`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error('Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── OTP input handlers ── */
  const handleOtpChange = (idx, val) => {
    // Allow pasting full OTP
    if (val.length > 1) {
      const digits = val.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const next   = Array(OTP_LENGTH).fill('');
      digits.split('').forEach((d, i) => { next[i] = d; });
      setOtp(next);
      const focusIdx = Math.min(digits.length, OTP_LENGTH - 1);
      otpRefs.current[focusIdx]?.focus();
      return;
    }
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx]  = val;
    setOtp(next);
    if (val && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
    if (e.key === 'Enter') handleVerifyOtp();
  };

  /* ── derived ── */
  const phoneDigits  = cleanPhone(phone).slice(-10);
  const isPhoneValid = phoneDigits.length === 10;
  const isOtpFull    = otp.every(Boolean);

  /* ── slide variant ── */
  const slide = {
    initial:  { opacity: 0, x: 40 },
    animate:  { opacity: 1, x: 0  },
    exit:     { opacity: 0, x: -40 },
    transition: { duration: 0.28, ease: 'easeOut' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-200/25 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-100/20 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-sm z-10"
      >
        {/* Card */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-orange-100/60 border border-white/70 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />

          <div className="p-8">
            {/* Logo + brand */}
            <div className="flex flex-col items-center mb-7">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg shadow-orange-200/60 border-2 border-orange-100">
                  <img src="/logo.jpeg" alt="NextTo" className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Shield size={9} className="text-white" />
                </div>
              </div>
              <h1 className="text-xl font-black text-slate-900 mt-3 tracking-tight">NextTo</h1>
              <p className="text-slate-400 text-xs font-semibold mt-0.5">Fast food & grocery delivery</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-7">
              {['phone', 'otp', 'name'].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center transition-all duration-300
                    ${step === s
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-400/40 scale-110'
                      : ['phone', 'otp', 'name'].indexOf(step) > i
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {['phone', 'otp', 'name'].indexOf(step) > i
                      ? <CheckCircle2 size={12} />
                      : i + 1}
                  </div>
                  {i < 2 && (
                    <div className={`h-0.5 w-6 rounded-full transition-all duration-300
                      ${['phone', 'otp', 'name'].indexOf(step) > i ? 'bg-emerald-400' : 'bg-slate-100'}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* ── Steps ── */}
            <AnimatePresence mode="wait">

              {/* ── Step 1: Phone ── */}
              {step === 'phone' && (
                <motion.div key="phone" {...slide}>
                  <div className="mb-5 text-center">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-orange-100">
                      <Phone size={22} className="text-orange-500" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Enter your mobile</h2>
                    <p className="text-slate-400 text-xs font-medium mt-1">We'll send a 6-digit OTP to verify</p>
                  </div>

                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Mobile Number
                      </label>
                      <div className="flex rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 focus-within:border-transparent transition-all">
                        {/* Country code */}
                        <div className="flex items-center gap-1.5 px-3.5 border-r border-slate-200 bg-white/60 shrink-0">
                          <span className="text-base">🇮🇳</span>
                          <span className="text-sm font-black text-slate-700">+91</span>
                        </div>
                        <input
                          id="auth-phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          className="flex-1 px-4 py-3.5 bg-transparent text-slate-800 text-sm font-bold placeholder-slate-300 focus:outline-none"
                          autoFocus
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading || !isPhoneValid}
                      whileHover={{ scale: loading || !isPhoneValid ? 1 : 1.02, y: loading || !isPhoneValid ? 0 : -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-orange-300 disabled:to-amber-300 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-400/30 transition-all mt-1 cursor-pointer"
                    >
                      {loading
                        ? <Loader2 size={18} className="animate-spin" />
                        : <><span>Send OTP</span><ArrowRight size={16} /></>
                      }
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── Step 2: OTP ── */}
              {step === 'otp' && (
                <motion.div key="otp" {...slide}>
                  {/* Back button */}
                  <button
                    onClick={() => setStep('phone')}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-700 text-xs font-bold mb-4 cursor-pointer transition-colors"
                  >
                    <ChevronLeft size={14} /> Change number
                  </button>

                  <div className="mb-5 text-center">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-orange-100">
                      <Shield size={22} className="text-orange-500" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">Verify OTP</h2>
                    <p className="text-slate-400 text-xs font-medium mt-1">
                      Sent to <span className="text-slate-700 font-black">+91 {phoneDigits}</span>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    {/* 6-digit OTP boxes */}
                    <div className="flex justify-center gap-2">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => { otpRefs.current[idx] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          onFocus={(e) => e.target.select()}
                          className={`w-11 h-12 rounded-xl text-center text-lg font-black border-2 transition-all focus:outline-none
                            ${digit
                              ? 'border-orange-400 bg-orange-50 text-orange-600'
                              : 'border-slate-200 bg-slate-50 text-slate-800 focus:border-orange-400'
                            }`}
                        />
                      ))}
                    </div>

                    {/* Resend */}
                    <div className="text-center">
                      {resendSec > 0 ? (
                        <p className="text-slate-400 text-xs font-semibold">
                          Resend in <span className="text-orange-500 font-black">{resendSec}s</span>
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-orange-500 font-black text-xs hover:underline cursor-pointer"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading || !isOtpFull}
                      whileHover={{ scale: loading || !isOtpFull ? 1 : 1.02, y: loading || !isOtpFull ? 0 : -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-orange-300 disabled:to-amber-300 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-400/30 transition-all cursor-pointer"
                    >
                      {loading
                        ? <Loader2 size={18} className="animate-spin" />
                        : <><span>Verify & Continue</span><ArrowRight size={16} /></>
                      }
                    </motion.button>
                  </form>
                </motion.div>
              )}

              {/* ── Step 3: Name (new user only) ── */}
              {step === 'name' && (
                <motion.div key="name" {...slide}>
                  <div className="mb-5 text-center">
                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-orange-100">
                      <User size={22} className="text-orange-500" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900">What's your name?</h2>
                    <p className="text-slate-400 text-xs font-medium mt-1">Just once — so we can personalise your experience</p>
                  </div>

                  <form onSubmit={handleSaveName} className="space-y-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                        Full Name
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          id="auth-name"
                          type="text"
                          required
                          autoFocus
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rahul Sharma"
                          className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-bold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={loading || !name.trim()}
                      whileHover={{ scale: loading || !name.trim() ? 1 : 1.02, y: loading || !name.trim() ? 0 : -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-orange-300 disabled:to-amber-300 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-400/30 transition-all cursor-pointer"
                    >
                      {loading
                        ? <Loader2 size={18} className="animate-spin" />
                        : <><span>Let's Go!</span><ArrowRight size={16} /></>
                      }
                    </motion.button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              By continuing you agree to our{' '}
              <a href="/terms-of-service" className="text-orange-400 hover:underline">Terms</a>
              {' '}&amp;{' '}
              <a href="/privacy-policy" className="text-orange-400 hover:underline">Privacy Policy</a>
            </p>
          </div>
        </div>

        {/* Tagline below card */}
        <p className="text-center text-xs text-slate-400 font-semibold mt-5">
          🔒 Secured by 2-Factor Authentication
        </p>

        {/* Restaurant owner CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-5 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-orange-100 rounded-2xl px-4 py-2.5 shadow-sm">
            <UtensilsCrossed size={14} className="text-orange-400" />
            <span className="text-xs text-slate-500 font-semibold">Restaurant owner?</span>
            <button
              onClick={() => { setShowOwnerForm(true); setOwnerDone(false); }}
              className="text-xs text-orange-500 font-black hover:underline cursor-pointer"
            >
              Register here →
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Restaurant Owner Registration Modal ── */}
      <AnimatePresence>
        {showOwnerForm && (
          <motion.div
            key="owner-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowOwnerForm(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 32, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Modal accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

              <div className="p-7">
                {/* Close */}
                <button
                  onClick={() => setShowOwnerForm(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
                >
                  <X size={15} />
                </button>

                <AnimatePresence mode="wait">
                  {ownerDone ? (
                    /* ── Success screen ── */
                    <motion.div
                      key="owner-success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center text-center py-4"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                        className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-200 mb-5"
                      >
                        <PartyPopper size={36} className="text-white" />
                      </motion.div>
                      <h2 className="text-xl font-black text-slate-900">Account Created! 🎉</h2>
                      <p className="text-slate-500 text-sm font-medium mt-2 max-w-xs leading-relaxed">
                        Your Firebase account has been created successfully.
                        The admin will assign your restaurant panel shortly.
                      </p>
                      <div className="mt-5 w-full bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3.5 text-left">
                        <p className="text-[11px] font-black text-emerald-700 uppercase tracking-wider mb-2">What happens next?</p>
                        {[
                          'Admin links your account to a restaurant',
                          'You can log in to the restaurant panel',
                          'Start managing orders & products',
                        ].map((s, i) => (
                          <div key={i} className="flex items-start gap-2 mt-1.5">
                            <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-xs text-slate-600 font-semibold">{s}</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowOwnerForm(false)}
                        className="mt-6 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-2xl font-black text-sm shadow-lg shadow-emerald-300/40 cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition-all"
                      >
                        Done
                      </button>
                    </motion.div>
                  ) : (
                    /* ── Registration form ── */
                    <motion.div key="owner-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                          <Building2 size={20} className="text-emerald-600" />
                        </div>
                        <div>
                          <h2 className="text-lg font-black text-slate-900 leading-tight">Restaurant Owner</h2>
                          <p className="text-slate-400 text-xs font-semibold">Register your restaurant with NextTo</p>
                        </div>
                      </div>

                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const { name, email, password } = ownerData;
                          if (!name.trim() || !email.trim() || !password.trim()) {
                            toast.error('Please fill in all fields');
                            return;
                          }
                          if (password.length < 6) {
                            toast.error('Password must be at least 6 characters');
                            return;
                          }
                          setOwnerLoading(true);
                          try {
                            // Create Firebase Auth account
                            const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
                            // Set display name
                            await updateProfile(cred.user, { displayName: name.trim() });
                            // Save profile to Firestore users collection
                            await setDoc(doc(db, 'users', cred.user.uid), {
                              uid:       cred.user.uid,
                              name:      name.trim(),
                              email:     email.trim().toLowerCase(),
                              createdAt: serverTimestamp(),
                            });
                            // Immediately sign out — owner is NOT logged in on this site
                            await signOut(auth);
                            setOwnerDone(true);
                          } catch (err) {
                            console.error(err);
                            const msg = err.code === 'auth/email-already-in-use'
                              ? 'This email is already registered.'
                              : err.code === 'auth/invalid-email'
                              ? 'Invalid email address.'
                              : err.message || 'Failed to create account.';
                            toast.error(msg);
                          } finally {
                            setOwnerLoading(false);
                          }
                        }}
                        className="space-y-3"
                      >
                        {/* Name */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                          <div className="relative">
                            <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text" required autoFocus
                              value={ownerData.name}
                              onChange={(e) => setOwnerData((d) => ({ ...d, name: e.target.value }))}
                              placeholder="Your full name"
                              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email</label>
                          <div className="relative">
                            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="email" required
                              value={ownerData.email}
                              onChange={(e) => setOwnerData((d) => ({ ...d, email: e.target.value }))}
                              placeholder="owner@example.com"
                              className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Password</label>
                          <div className="relative">
                            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type={showOwnerPass ? 'text' : 'password'}
                              required minLength={6}
                              value={ownerData.password}
                              onChange={(e) => setOwnerData((d) => ({ ...d, password: e.target.value }))}
                              placeholder="Min. 6 characters"
                              className="w-full pl-9 pr-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-semibold placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                            />
                            <button
                              type="button"
                              onClick={() => setShowOwnerPass((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {showOwnerPass ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        <motion.button
                          type="submit"
                          disabled={ownerLoading}
                          whileHover={{ scale: ownerLoading ? 1 : 1.02, y: ownerLoading ? 0 : -1 }}
                          whileTap={{ scale: 0.97 }}
                          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-emerald-300 disabled:to-teal-300 text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/30 transition-all mt-1 cursor-pointer"
                        >
                          {ownerLoading
                            ? <Loader2 size={18} className="animate-spin" />
                            : <><span>Create Account</span><ArrowRight size={16} /></>}
                        </motion.button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
