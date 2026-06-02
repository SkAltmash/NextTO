# 🛵 NextTo · Express Delivery SPA

Welcome to **NextTo** (Food Express), a state-of-the-art, hyper-local single-page web application designed for lightning-fast deliveries of Food, Groceries, Medicines, and custom Pickup & Drop packages. 

Architected with visual excellence, premium animations, and secure cloud workflows, NextTo delivers an premium experience matching industry giants.

---

## ✨ Features

### 1. 🛍️ Hyper-Local Delivery Hub
* **Food & Gourmet**: Dynamic menus with preparation times, categories, and real-time availability filters.
* **Daily Groceries**: Fast grid listing of household essentials.
* **Essential Medicines**: Secure medicine catalog including a **Prescription Upload module** for custom pharmacy order fulfillment.
* **Pickup & Drop**: Integrated courier delivery form calculating automated charges, partner commissions, and instructions.

### 2. ⚡ Secure Environment & Configurations
* Fully modularized configurations.
* Secure variable bindings using Vite's `import.meta.env` system.
* Preconfigured Git constraints ignoring local credential setups.

### 3. 🎯 Deep Linking & Advanced Search
* **Tab Parameter Syncing**: `/product?tab=grocery` deep links instantly activate the corresponding shop categories.
* **Clean Global Search**: High-performance instant filtering matching product names and category IDs, completely excluding background description clutter.
* **Custom WhatsApp Fallback**: If an item is out of stock or unlisted, customers are presented with an instant WhatsApp Order button redirecting the exact query directly to `8799884148`.

### 4. ❤️ Favorites Engine
* One-click absolute floating Heart additions across all views (Products list, Search list, related sliders, and detail pages).
* LocalStorage persistent state keeping favorites available between sessions.
* Dedicated **Favorites Hub** accessible through the Profile (`/me`) page dashboard, complete with quick-add cart integrations and empty state sliders.

### 5. 🔔 Automated Telegram Dispatches
* Auto-calculates delivery partner earnings, flat pickups, and drops.
* Delivers distinct notifications instantly:
  1. **Restaurants**: Bullet-point items, subtotals, and COD details.
  2. **Couriers**: Pickup locations, flat earnings, and delivery instructions.
  3. **Delivery Partners**: Specific breakdowns and prescription attachments.

---

## 🛠️ Technology Stack

* **Frontend Framework**: React 18 + Vite (built client-side for rapid HMR).
* **Styling & UI**: Vanilla CSS + Tailwind Utility mappings for high-fidelity animations.
* **Transitions**: Framer Motion providing spring physics and layout-aware transitions.
* **Database & Auth**: Firestore (real-time listeners) and Firebase Authentication.
* **Icons**: Lucide Icons.

---

## 🚀 Getting Started

### 1. Environment Setup
Create a `.env` file in the root directory by copying the example template:
```bash
cp .env.example .env
```
Fill in your credentials inside `.env`:
```env
VITE_TELEGRAM_BOT_TOKEN=your_bot_token
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 📂 Project Directory Structure

```
├── src/
│   ├── assets/           # Premium brand assets and icons
│   ├── components/       # Reusable components (Navbar, Footer, CartDrawer, etc.)
│   ├── context/          # Global Context Providers (Auth, Cart, Favorites)
│   ├── pages/            # Core views (Home, Checkout, Favorites, ProductDetail, etc.)
│   ├── firebase.js       # Secure Firebase initialization
│   ├── App.jsx           # Main routing & state setup
│   └── main.jsx          # Entrypoint mount
├── vercel.json           # Client routing rewrites configuration
└── .env.example          # Environment variables template
```

---

## 🎨 Category Theming Guide
We use harmonious, distinct visual styles for each category service:
* **Food**: `bg-orange-50 text-orange-600 border-orange-100` (Orange Theme)
* **Grocery**: `bg-emerald-50 text-emerald-600 border-emerald-100` (Green Theme)
* **Medicine**: `bg-blue-50 text-blue-600 border-blue-100` (Blue Theme)
* **Pickup & Drop**: `bg-purple-50 text-purple-600 border-purple-100` (Purple Theme)
