/**
 * Help.jsx
 *
 * Help & Support page — Contact options + FAQ accordion.
 * Ported from UserApp/app/help.tsx (without the support request form).
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Phone, MessageCircle, Mail,
  ChevronDown, ChevronUp, HelpCircle, Headphones,
} from 'lucide-react';
import SEO from '../components/SEO';

// ─── FAQ Data (matches User App) ──────────────────────────────────────────────
const FAQS = [
  {
    id: '1',
    question: 'Can I cancel my order?',
    answer:
      "Yes! You can cancel your order anytime while its status is 'Pending'. Once the restaurant accepts or prepares your order, cancellation is no longer permitted.",
  },
  {
    id: '2',
    question: 'How do I track my live order status?',
    answer:
      "Go to the 'Orders' page and click on any active order to view live status updates (Pending, Accepted, Out for Delivery, Delivered) and delivery details.",
  },
  {
    id: '3',
    question: 'What is the Distance Service Fee & Rain Surcharge?',
    answer:
      'Distance Service Fee is charged by select partner restaurants based on location distance. Rain Surcharge is an extra fee applied during bad weather to compensate delivery partners.',
  },
  {
    id: '4',
    question: 'How do I apply a coupon discount?',
    answer:
      "At Checkout, enter your promo code in the Coupon section and click 'Apply'. Valid discounts will automatically reduce your order subtotal or delivery fee.",
  },
  {
    id: '5',
    question: 'What payment methods are supported?',
    answer:
      'We currently support Cash on Delivery (COD) for all regular and pickup & drop orders. Additional payment modes will be available soon.',
  },
  {
    id: '6',
    question: 'How does Pickup & Drop service work?',
    answer:
      'With Pickup & Drop, you can send packages across town! Specify pickup and drop locations, enter package details, and a delivery partner will complete the task.',
  },
];

// ─── Contact card data ────────────────────────────────────────────────────────
const CONTACTS = [
  {
    id: 'call',
    label: 'Call Us',
    sublabel: 'Instant',
    icon: Phone,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    href: 'tel:+919876543210',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    sublabel: 'Fast Chat',
    icon: MessageCircle,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    href: 'https://wa.me/919876543210?text=Hi%20NextTo%20Support,',
  },
  {
    id: 'email',
    label: 'Email Us',
    sublabel: '24 Hr Response',
    icon: Mail,
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    href: 'mailto:support.nextto@gmail.com?subject=Help%20Request',
  },
];

export default function Help() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState('1');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/20 pb-28 md:pb-16">
      <SEO
        title="Help & Support | NextTo"
        description="Get help with your NextTo orders. Contact support via call, WhatsApp, or email. Browse FAQs."
        canonical="/help"
      />

      {/* ── Top bar ── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-0 md:top-[64px] z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Headphones size={15} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900">Help & Support</h1>
            <p className="text-[10px] font-semibold text-slate-400">We're here to help 24/7</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Contact Options ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">
            Contact Us Directly
          </p>
          <div className="grid grid-cols-3 gap-3">
            {CONTACTS.map((c, i) => (
              <motion.a
                key={c.id}
                href={c.href}
                target={c.id === 'whatsapp' ? '_blank' : undefined}
                rel={c.id === 'whatsapp' ? 'noopener noreferrer' : undefined}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md p-4 flex flex-col items-center gap-2.5 transition-shadow no-underline"
              >
                <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center`}>
                  <c.icon size={20} className={c.iconColor} />
                </div>
                <div className="text-center">
                  <p className="text-[13px] font-black text-slate-900">{c.label}</p>
                  <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{c.sublabel}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* ── FAQ Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">
            Frequently Asked Questions
          </p>
          <div className="space-y-2.5">
            {FAQS.map((faq, i) => {
              const isOpen = expandedFaq === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.04 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                    className={`w-full px-5 py-4 flex items-center justify-between text-left transition-colors cursor-pointer ${
                      isOpen ? 'bg-slate-50/60' : 'hover:bg-slate-50/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                        isOpen ? 'bg-orange-100' : 'bg-slate-100'
                      }`}>
                        <HelpCircle size={13} className={isOpen ? 'text-orange-500' : 'text-slate-400'} />
                      </div>
                      <span className="text-[13px] font-black text-slate-900 line-clamp-2">{faq.question}</span>
                    </div>
                    <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center ml-2 ${
                      isOpen ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-4 pt-1 border-t border-slate-50">
                          <p className="text-[13px] text-slate-500 leading-relaxed font-medium pl-10">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Footer note ── */}
        <p className="text-center text-[11px] text-slate-300 font-semibold pt-4">
          NextTo Customer Support · 24/7 Assistance
        </p>
      </div>
    </div>
  );
}
