import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Index from "./pages-vite-legacy/Index";
import MenuPage from "./pages-vite-legacy/MenuPage";
import CartPage from "./pages-vite-legacy/CartPage";
import CheckoutPage from "./pages-vite-legacy/CheckoutPage";
import OrdersPage from "./pages-vite-legacy/OrdersPage";
import AuthPage from "./pages-vite-legacy/AuthPage";
import AdminPage from "./pages-vite-legacy/AdminPage";
import AboutPage from "./pages-vite-legacy/AboutPage";
import ProfilePage from "./pages-vite-legacy/ProfilePage";
import NotFound from "./pages-vite-legacy/NotFound";
import SEOHead from "./components/SEOHead";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <SEOHead />
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
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
