import React from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Mail, ChevronRight, ClipboardList, Settings,
  Lock, Link2, Handshake, FileText, MessageCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const CONTACT_EMAIL = 'rudrakshmakre@gmail.com';

const sections = [
  {
    title: 'Information We Collect',
    Icon: ClipboardList,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-100',
    content: null,
    list: [
      'Name',
      'Email Address',
      'Phone Number',
      'Account Information',
    ],
  },
  {
    title: 'How We Use Your Information',
    Icon: Settings,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    content: 'We use the collected information to:',
    list: [
      'Create and manage user accounts',
      'Process orders',
      'Provide customer support',
      'Improve our services',
    ],
  },
  {
    title: 'Data Security',
    Icon: Lock,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    content:
      'We take reasonable measures to protect your information from unauthorized access or disclosure.',
    list: null,
  },
  {
    title: 'Third-Party Services',
    Icon: Link2,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    content:
      'NextTo may use trusted third-party services such as Firebase for authentication, database management, and app functionality.',
    list: null,
  },
  {
    title: 'Data Sharing',
    Icon: Handshake,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    content:
      'We do not sell or rent your personal information to third parties.',
    list: null,
  },
  {
    title: 'Changes to This Policy',
    Icon: FileText,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    content:
      'We may update this Privacy Policy from time to time. Any changes will be posted on this page.',
    list: null,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 pb-28 md:pb-16">
      <SEO
        title="Privacy Policy"
        description="NextTo's Privacy Policy — learn how we collect, use, and protect your personal information when you use our delivery platform."
        canonical="/privacy-policy"
        keywords={['privacy policy', 'data protection', 'NextTo privacy']}
      />

      {/* Hero header */}
      <div className="relative bg-white border-b border-slate-100 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-50 border border-orange-100 rounded-2xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-orange-500" />
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Link to="/" className="hover:text-orange-500 transition-colors">Home</Link>
              <ChevronRight size={12} />
              <span className="text-slate-600">Privacy Policy</span>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-sm font-semibold mt-2">
            Last Updated: <span className="text-slate-500">June 2026</span>
          </p>
          <p className="text-slate-500 text-sm sm:text-base font-medium mt-4 leading-relaxed max-w-xl">
            NextTo values your privacy and is committed to protecting your personal information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-5">
        {sections.map((sec, i) => {
          const { Icon } = sec;
          return (
            <motion.div
              key={sec.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:shadow-orange-100/30 transition-shadow p-6 sm:p-7"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 ${sec.bg} border ${sec.border} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={17} className={sec.color} />
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">{sec.title}</h2>
              </div>
              {sec.content && (
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-3">
                  {sec.content}
                </p>
              )}
              {sec.list && (
                <ul className="space-y-2">
                  {sec.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm font-semibold text-slate-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          );
        })}

        {/* Contact box */}
        <motion.div
          custom={sections.length}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl border border-orange-100 p-6 sm:p-7"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-orange-100 border border-orange-200 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={17} className="text-orange-500" />
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">Contact Us</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium leading-relaxed mb-4">
            If you have any questions regarding this Privacy Policy, please contact us at:
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 bg-white border border-orange-200 text-orange-600 font-black text-sm px-4 py-2.5 rounded-2xl hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
          >
            <Mail size={15} />
            {CONTACT_EMAIL}
          </a>
        </motion.div>

        {/* Bottom nav */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <Link
            to="/"
            className="text-xs font-bold text-slate-400 hover:text-orange-500 transition-colors"
          >
            ← Back to Home
          </Link>
          <Link
            to="/terms-of-service"
            className="text-xs font-bold text-orange-500 hover:text-orange-600 transition-colors"
          >
            View Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
