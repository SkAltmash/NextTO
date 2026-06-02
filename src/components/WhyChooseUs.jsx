import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, HeartHandshake, Smile } from 'lucide-react';

const ADVANTAGES = [
  {
    icon: Zap,
    title: "Lightning Fast Delivery",
    desc: "Average delivery under 30 minutes. Supercharged local logistics networks to deliver food hot and groceries fresh.",
    color: "from-orange-500 to-amber-500",
    bgLight: "bg-orange-50/50",
    iconColor: "text-orange-500"
  },
  {
    icon: ShieldCheck,
    title: "Verified Categories",
    desc: "Get restaurant food, fresh daily groceries, and verified pharmacy medicines safely handled and delivered.",
    color: "from-blue-500 to-indigo-500",
    bgLight: "bg-blue-50/50",
    iconColor: "text-blue-500"
  },
  {
    icon: HeartHandshake,
    title: "Dedicated Support",
    desc: "Order items not in our app or resolve any query instantly via our active priority support on WhatsApp.",
    color: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50/50",
    iconColor: "text-emerald-500"
  },
  {
    icon: Smile,
    title: "Best Price Guarantee",
    desc: "Zero hidden charges, nominal delivery fee based on area, and exciting discounts on all service categories.",
    color: "from-purple-500 to-pink-500",
    bgLight: "bg-purple-50/50",
    iconColor: "text-purple-500"
  }
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block bg-orange-50 text-orange-600 border border-orange-100 text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-wider"
          >
            The NextTo Edge
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight"
          >
            Why Customers <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Choose Us</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 text-sm sm:text-base font-semibold leading-relaxed"
          >
            Experience seamless ordering, hyper-local logistics, and absolute reliability for all your home delivery needs.
          </motion.p>
        </div>

        {/* Advantage Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {ADVANTAGES.map((adv, idx) => {
            const IconComponent = adv.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-6 sm:p-8 transition-all hover:shadow-2xl hover:shadow-slate-200/50 flex flex-col items-start gap-5 relative group"
              >
                {/* Visual glow backdrop on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${adv.color} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300 rounded-3xl`} />

                {/* Icon wrapper */}
                <div className={`w-14 h-14 rounded-2xl ${adv.bgLight} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                  <IconComponent size={24} className={adv.iconColor} />
                </div>

                <div className="space-y-2">
                  <h3 className="font-black text-slate-800 text-lg leading-snug">{adv.title}</h3>
                  <p className="text-slate-400 text-xs sm:text-sm font-semibold leading-relaxed">{adv.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
