import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Phone, MapPin, Mail, ChevronRight, Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappNumber = '8799884148';
  const whatsappUrl = `https://wa.me/91${whatsappNumber}`;

  return (
    <footer className="bg-slate-50 text-slate-600 border-t border-slate-200/80 pt-16 pb-28 md:pb-12 relative overflow-hidden">
      {/* Decorative premium accents */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-100/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none" />

      {/* Upper Grid Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 mb-12">

          {/* Logo & Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <img src="/logo.jpeg" className='h-15 w-auto' alt="" />

            </Link>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold leading-relaxed">
              Your absolute express choice for delicious food, daily fresh groceries, crucial medicines, and reliable instant pickup & drop services.
            </p>

            {/* Super Pro WhatsApp Button */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 hover:border-emerald-300 text-emerald-700 transition-all group"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black tracking-wide">WhatsApp Support</span>
              <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-100 px-2 py-0.5 rounded-lg group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-all">
                {whatsappNumber}
              </span>
            </a>
          </div>

          {/* Our Services */}
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-5">Our Services</h3>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-500">
              <li>
                <Link to="/product?tab=food" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Food Delivery
                </Link>
              </li>
              <li>
                <Link to="/product?tab=grocery" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Fresh Grocery
                </Link>
              </li>
              <li>
                <Link to="/product?tab=medicine" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Medicines Delivery
                </Link>
              </li>
              <li>
                <Link to="/product?tab=pickup" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Pickup &amp; Drop
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-5">Quick Links</h3>
            <ul className="space-y-3 text-xs sm:text-sm font-semibold text-slate-500">
              <li>
                <Link to="/" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Home
                </Link>
              </li>
              <li>
                <Link to="/product" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Explore product
                </Link>
              </li>
              <li>
                <Link to="/order" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Your Orders
                </Link>
              </li>
              <li>
                <Link to="/me" className="hover:text-orange-500 flex items-center gap-1 transition-colors">
                  <ChevronRight size={14} className="text-slate-400" /> Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wider mb-5">Contact Details</h3>
            <ul className="space-y-4 text-xs sm:text-sm font-semibold text-slate-500">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                <span>Express Delivery Areas, Gujarat, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-slate-400 shrink-0" />
                <span>+91 {whatsappNumber}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-slate-400 shrink-0" />
                <span className="break-all">support@foodexpress.com</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer Bottom bar */}
        <div className="border-t border-slate-200/80 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 text-center md:text-left">
              &copy; {currentYear} NextTo. All rights reserved. Made with <Heart size={10} className="inline text-red-500 fill-current animate-pulse" /> for delicious moments.
            </p>
            {/* Architected credit */}
            <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 flex items-center gap-1">
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

          <div className="flex items-center gap-6 text-[11px] sm:text-xs font-bold text-slate-400">
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Terms of Service</span>
            <span className="hover:text-slate-600 cursor-pointer transition-colors">Privacy Policy</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
