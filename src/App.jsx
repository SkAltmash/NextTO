import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Product from './pages/Product';
import Order from './pages/Order';
import Me from './pages/Me';
import Search from './pages/Search';
import Favorites from './pages/Favorites';
import Auth from './pages/Auth';
import ProductDetail from './pages/ProductDetail';
import RestaurantDetail from './pages/RestaurantDetail';
import Restaurants from './pages/Restaurants';
import Checkout from './pages/Checkout';
import OrderDetail from './pages/OrderDetail';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

/* Applies top padding on all pages except those that manage their own layout */
function AppLayout() {
  const { pathname } = useLocation();

  const isAuth = pathname === '/auth';
  const noMobilePad = pathname === '/product'
    || pathname === '/search'
    || pathname === '/restaurants'
    || pathname === '/checkout'
    || pathname === '/order'
    || pathname === '/favorites'
    || pathname.startsWith('/order/')
    || pathname.startsWith('/restaurant/')
    || pathname.startsWith('/product/');

  // /auth        → no padding at all (full screen)
  // noMobilePad  → no mobile top gap (page handles own layout), keep desktop
  // others       → full pt-14 md:pt-[64px]
  const mainClass = isAuth
    ? ''
    : noMobilePad
      ? 'md:pt-[64px]'
      : 'pt-10   md:pt-[64px]';

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '14px',
            fontWeight: '700',
            fontSize: '13px',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#f97316', secondary: '#fff' } },
        }}
      />
      <Navbar />
      <ScrollToTop />
      <main className={mainClass}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<Product />} />
          <Route path="/order" element={<Order />} />
          <Route path="/me" element={<Me />} />
          <Route path="/search" element={<Search />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/restaurants" element={<Restaurants />} />
          <Route path="/restaurant/:id" element={<RestaurantDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderDetail />} />
        </Routes>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;