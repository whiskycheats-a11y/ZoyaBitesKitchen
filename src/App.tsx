import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { lazy, Suspense } from "react";
import Index from "./pages-vite-legacy/Index";
import SEOHead from "./components/SEOHead";

// Lazy-load all non-home pages — unka bundle sirf tab aayega jab kholo
const MenuPage = lazy(() => import("./pages-vite-legacy/MenuPage"));
const CartPage = lazy(() => import("./pages-vite-legacy/CartPage"));
const CheckoutPage = lazy(() => import("./pages-vite-legacy/CheckoutPage"));
const OrdersPage = lazy(() => import("./pages-vite-legacy/OrdersPage"));
const AuthPage = lazy(() => import("./pages-vite-legacy/AuthPage"));
const AdminPage = lazy(() => import("./pages-vite-legacy/AdminPage"));
const AboutPage = lazy(() => import("./pages-vite-legacy/AboutPage"));
const ProfilePage = lazy(() => import("./pages-vite-legacy/ProfilePage"));
const NotFound = lazy(() => import("./pages-vite-legacy/NotFound"));

// React Query cache: 5 min tak data fresh rehega, bar bar DB call nahi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 minutes
      gcTime: 10 * 60 * 1000,     // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SEOHead />
            <Suspense fallback={
              <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            }>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin1122" element={<AdminPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
