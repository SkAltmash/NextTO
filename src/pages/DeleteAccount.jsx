import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trash2, ChevronRight, AlertTriangle, Mail, Phone,
  CheckCircle2, Loader2, ShieldAlert, ClipboardList, Info,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import SEO from '../components/SEO';

const REASONS = [
  'I no longer use the app',
  'I have privacy concerns',
  'I created a duplicate account',
  'The app is not useful for me',
  'Other',
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: 'easeOut' },
  }),
};

export default function DeleteAccount() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    reason: '',
    customReason: '',
    confirm: false,
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  /* ── validation ── */
  function validate() {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email address is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter a valid email address.';
    if (form.phone && !/^\+?[\d\s\-()]{7,15}$/.test(form.phone))
      e.phone = 'Enter a valid phone number.';
    if (!form.reason) e.reason = 'Please select a reason.';
    if (form.reason === 'Other' && !form.customReason.trim())
      e.customReason = 'Please describe your reason.';
    if (!form.confirm) e.confirm = 'You must acknowledge this action.';
    return e;
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  /* ── submit ── */
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setStatus('loading');
    try {
      await addDoc(collection(db, 'account_deletion_requests'), {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        reason: form.reason === 'Other' ? form.customReason.trim() : form.reason,
        status: 'pending',          // pending | processing | done
        createdAt: serverTimestamp(),
      });
      setStatus('success');
    } catch (err) {
      console.error('Deletion request failed:', err);
      setStatus('error');
    }
  }

  /* ── success screen ── */
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center px-4 pb-28 md:pb-10">
        <SEO
          title="Account Deletion Request"
          description="Request account deletion for your NextTo account."
          canonical="/delete-account"
          noIndex
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl max-w-md w-full p-8 sm:p-10 text-center"
        >
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Request Received</h2>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
            Your account deletion request has been submitted. Our team will process it
            within <span className="text-slate-700 font-bold">7 business days</span> and
            send a confirmation to your email.
          </p>
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-left">
            <p className="text-amber-700 text-xs font-semibold leading-relaxed">
              ⚠️ Until the deletion is complete, your account and all data remain active.
              If you change your mind, contact us at{' '}
              <a href="mailto:rudrakshmakre@gmail.com" className="underline">rudrakshmakre@gmail.com</a>.
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm px-6 py-3 rounded-2xl transition-colors"
          >
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      <SEO
        title="Delete Account"
        description="Submit a request to permanently delete your NextTo account and all associated data."
        canonical="/delete-account"
        noIndex
      />

      {/* ── Hero header ── */}
      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-orange-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center shrink-0">
              <Trash2 size={20} className="text-red-500" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-slate-600">Delete Account</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            Account Deletion Request
          </h1>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-4 leading-relaxed max-w-lg">
            We're sorry to see you go. Fill out this form and our team will permanently
            delete your account and all associated data within 7 business days.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* ── Warning banner ── */}
        <motion.div
          custom={0} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="bg-red-50 border border-red-100 rounded-3xl p-5 flex gap-4"
        >
          <div className="w-9 h-9 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={17} className="text-red-500" />
          </div>
          <div>
            <p className="text-red-700 font-black text-sm mb-1">This action is irreversible</p>
            <p className="text-red-600/80 text-xs font-medium leading-relaxed">
              Deleting your account will permanently remove your profile, order history,
              saved addresses, and all personal data from our systems. This cannot be undone.
            </p>
          </div>
        </motion.div>

        {/* ── What gets deleted ── */}
        <motion.div
          custom={1} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center shrink-0">
              <ClipboardList size={17} className="text-slate-500" />
            </div>
            <h2 className="text-base font-black text-slate-900">What will be deleted</h2>
          </div>
          <ul className="space-y-2">
            {[
              'Your profile — name, email, phone number',
              'All saved delivery addresses',
              'Order history and receipts',
              'Saved favourites and preferences',
              'Any linked payment methods',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Form ── */}
        <motion.div
          custom={2} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0">
              <ShieldAlert size={17} className="text-orange-500" />
            </div>
            <h2 className="text-base font-black text-slate-900">Submit Deletion Request</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="del-fullName"
                type="text"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={`w-full border rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
              />
              {errors.fullName && <p className="text-red-500 text-xs font-semibold mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="del-email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full border rounded-2xl pl-9 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs font-semibold mt-1">{errors.email}</p>}
              <p className="text-slate-400 text-xs font-medium mt-1 flex items-center gap-1">
                <Info size={11} /> Must match the email used on your NextTo account.
              </p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">
                Phone Number <span className="text-slate-400 font-semibold">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="del-phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full border rounded-2xl pl-9 pr-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                />
              </div>
              {errors.phone && <p className="text-red-500 text-xs font-semibold mt-1">{errors.phone}</p>}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">
                Reason for Deletion <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 cursor-pointer rounded-2xl border px-4 py-3 transition-all ${form.reason === r ? 'border-orange-400 bg-orange-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={form.reason === r}
                      onChange={() => handleChange('reason', r)}
                      className="accent-orange-500"
                    />
                    <span className="text-sm font-semibold text-slate-700">{r}</span>
                  </label>
                ))}
              </div>
              {errors.reason && <p className="text-red-500 text-xs font-semibold mt-1">{errors.reason}</p>}
            </div>

            {/* Custom reason */}
            <AnimatePresence>
              {form.reason === 'Other' && (
                <motion.div
                  key="customReason"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wide">
                    Please describe <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="del-customReason"
                    rows={3}
                    placeholder="Tell us more..."
                    value={form.customReason}
                    onChange={(e) => handleChange('customReason', e.target.value)}
                    className={`w-full border rounded-2xl px-4 py-3 text-sm font-semibold text-slate-800 placeholder:text-slate-300 outline-none resize-none transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-100 ${errors.customReason ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'}`}
                  />
                  {errors.customReason && <p className="text-red-500 text-xs font-semibold mt-1">{errors.customReason}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Confirmation checkbox */}
            <div>
              <label
                className={`flex items-start gap-3 cursor-pointer rounded-2xl border px-4 py-4 transition-all ${form.confirm ? 'border-red-300 bg-red-50' : errors.confirm ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
              >
                <input
                  id="del-confirm"
                  type="checkbox"
                  checked={form.confirm}
                  onChange={(e) => handleChange('confirm', e.target.checked)}
                  className="accent-red-500 mt-0.5 shrink-0"
                />
                <span className="text-sm font-semibold text-slate-700 leading-snug">
                  I understand that deleting my account is{' '}
                  <span className="text-red-600 font-black">permanent and irreversible</span>.
                  All my data will be erased and cannot be recovered.
                </span>
              </label>
              {errors.confirm && <p className="text-red-500 text-xs font-semibold mt-1">{errors.confirm}</p>}
            </div>

            {/* Error state */}
            {status === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-red-600 text-sm font-semibold">
                  Something went wrong. Please try again or email us at{' '}
                  <a href="mailto:rudrakshmakre@gmail.com" className="underline font-black">rudrakshmakre@gmail.com</a>.
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              id="del-submit"
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black text-sm px-6 py-3.5 rounded-2xl transition-colors shadow-sm"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Submitting Request…
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  Submit Deletion Request
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* ── Alternative: contact email ── */}
        <motion.div
          custom={3} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border border-orange-100 p-6 sm:p-7"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center shrink-0">
              <Mail size={17} className="text-orange-500" />
            </div>
            <h2 className="text-base font-black text-slate-900">Prefer to email us?</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">
            You can also send your account deletion request directly to our support team.
          </p>
          <a
            href="mailto:rudrakshmakre@gmail.com?subject=Account%20Deletion%20Request"
            className="inline-flex items-center gap-2 bg-white border border-orange-200 text-orange-600 font-black text-sm px-4 py-2.5 rounded-2xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
          >
            <Mail size={15} />
            rudrakshmakre@gmail.com
          </a>
        </motion.div>

        {/* Bottom nav */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link to="/" className="text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors">
            ← Back to Home
          </Link>
          <Link to="/privacy-policy" className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors">
            View Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
