import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone, MapPin, Mail, ChevronRight, Heart, ExternalLink,
  Zap, ShieldCheck, Navigation,
} from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappNumber = '7972081926';
  const whatsappUrl = `https://wa.me/91${whatsappNumber}`;

  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200/80 pt-10 pb-28 md:pb-12 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10 space-y-8">

        {/* ── 1. Brand Card + WhatsApp ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <img src="/logo.jpeg" className="h-11 w-auto rounded-xl" alt="NextTo" />
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Next<span className="text-orange-500">To</span>
                </h2>
                <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
                  Everything Delivered Next To You
                </p>
              </div>
            </Link>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed mb-5">
            Your ultimate express choice for food delivery, groceries, medicines, and instant pickup &amp; drop.
          </p>

          {/* WhatsApp Support CTA */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white transition-all shadow-lg shadow-emerald-500/20"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
            </span>
            <span className="text-xs font-black tracking-wide">WhatsApp Support</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-lg">
              {whatsappNumber}
            </span>
          </a>
        </div>

        {/* ── 2. Trust Badges ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm grid grid-cols-3 divide-x divide-slate-50">
          {[
            { icon: Zap, label: 'Express Delivery', color: 'text-orange-500' },
            { icon: ShieldCheck, label: 'Safe & Secure', color: 'text-blue-500' },
            { icon: Navigation, label: 'Live Order Track', color: 'text-emerald-500' },
          ].map((badge) => (
            <div key={badge.label} className="flex flex-col items-center gap-1.5 py-4 px-2">
              <badge.icon size={18} className={badge.color} />
              <span className="text-[10px] font-extrabold text-slate-700 text-center leading-tight">{badge.label}</span>
            </div>
          ))}
        </div>

        {/* ── 3. Services + Quick Links + Contact ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

          {/* Our Services */}
          <div>
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider mb-4">Our Services</h3>
            <ul className="space-y-2.5 text-sm font-semibold text-slate-500">
              {[
                { label: 'Food Delivery', to: '/product?tab=food' },
                { label: 'Fresh Grocery', to: '/product?tab=grocery' },
                { label: 'Medicines Delivery', to: '/product?tab=medicine' },
                { label: 'Pickup & Drop', to: '/product?tab=pickup' },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-orange-500 flex items-center gap-1.5 transition-colors">
                    <ChevronRight size={13} className="text-slate-300" /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm font-semibold text-slate-500">
              {[
                { label: 'Home Feed', to: '/' },
                { label: 'Shop Catalogue', to: '/product' },
                { label: 'My Orders', to: '/order' },
                { label: 'Help & Support', to: '/help' },
                { label: 'My Account', to: '/me' },
              ].map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="hover:text-orange-500 flex items-center gap-1.5 transition-colors">
                    <ChevronRight size={13} className="text-slate-300" /> {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-wider mb-4">Contact Details</h3>
            <ul className="space-y-3 text-sm font-semibold text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
                <span>Hinganghat, Wardha, Maharashtra, India</span>
              </li>
              <li>
                <a href={`tel:+91${whatsappNumber}`} className="flex items-center gap-3 hover:text-orange-500 transition-colors">
                  <Phone size={15} className="text-slate-400 shrink-0" />
                  <span>+91 {whatsappNumber}</span>
                </a>
              </li>
              <li>
                <a href="mailto:support.nextto@gmail.com" className="flex items-center gap-3 hover:text-orange-500 transition-colors">
                  <Mail size={15} className="text-slate-400 shrink-0" />
                  <span className="break-all">support.nextto@gmail.com</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* ── 4. Bottom Bar ── */}
        <div className="border-t border-slate-200/80 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1.5">
            <p className="text-[11px] font-semibold text-slate-400 text-center md:text-left">
              &copy; {currentYear} NextTo App. All rights reserved. Made with <Heart size={10} className="inline text-red-400 fill-current animate-pulse" /> for delicious moments.
            </p>
            <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              Architected by{' '}
              <a
                href="https://www.arqmarketing.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-800 inline-flex items-center gap-0.5 border-b border-orange-500/25 hover:border-orange-500 transition-all pb-0.5"
              >
                ARQ Marketing <ExternalLink size={8} />
              </a>
            </p>
          </div>

          <div className="flex items-center gap-5 text-[11px] font-bold text-slate-400">
            <Link to="/terms-of-service" className="hover:text-slate-600 transition-colors">Terms of Service</Link>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <Link to="/privacy-policy" className="hover:text-slate-600 transition-colors">Privacy Policy</Link>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <Link to="/delete-account" className="hover:text-red-500 transition-colors">Delete Account</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}