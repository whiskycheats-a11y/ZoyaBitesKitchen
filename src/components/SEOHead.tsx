import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  noindex?: boolean;
}

const defaultMeta = {
  title: 'ZoyaBites — Taste the Authentic Flavors | Order Online',
  description: 'ZoyaBites delivers authentic biryani, sizzling kebabs, rich curries & more — handcrafted with love, delivered fresh to your doorstep in 30 mins. Order now!',
  keywords: 'ZoyaBites, food delivery, biryani, kebabs, curries, authentic food, order online, fresh food delivery, Indian food, homemade food',
  image: '/og-image.jpg',
  type: 'website',
};

const pageSEO: Record<string, Partial<SEOHeadProps>> = {
  '/': {
    title: 'ZoyaBites — Taste the Authentic Flavors | Order Online',
    description: 'ZoyaBites delivers authentic biryani, sizzling kebabs, rich curries & more — handcrafted with love, delivered fresh to your doorstep in 30 mins!',
  },
  '/menu': {
    title: 'Menu — ZoyaBites | Biryani, Kebabs, Curries & More',
    description: 'Explore our handcrafted menu — aromatic biryanis, charcoal-grilled kebabs, rich curries, and traditional desserts. Order online for fast delivery!',
    keywords: 'ZoyaBites menu, biryani menu, kebab menu, Indian food menu, order food online, food delivery menu',
  },
  '/about': {
    title: 'About ZoyaBites — Our Story & Passion for Authentic Food',
    description: 'Learn about ZoyaBites — our passion for authentic flavors, our master chefs, and our promise to deliver the freshest food to your doorstep.',
    keywords: 'about ZoyaBites, our story, authentic food, master chefs, food delivery story',
  },
  '/cart': {
    title: 'Your Cart — ZoyaBites',
    description: 'Review your order and checkout. Fresh food delivered to your doorstep in 30 minutes!',
    noindex: true,
  },
  '/checkout': {
    title: 'Checkout — ZoyaBites',
    description: 'Complete your order. Fast, secure payment with Razorpay.',
    noindex: true,
  },
  '/orders': {
    title: 'My Orders — ZoyaBites',
    description: 'Track your food orders in real-time.',
    noindex: true,
  },
  '/auth': {
    title: 'Sign In — ZoyaBites | Order Authentic Food Online',
    description: 'Sign in or create your ZoyaBites account to order authentic biryani, kebabs, curries and more!',
  },
  '/profile': {
    title: 'My Profile — ZoyaBites',
    noindex: true,
  },
};

const SEOHead = ({ title, description, keywords, image, type, noindex }: SEOHeadProps) => {
  const location = useLocation();
  const pageDefaults = pageSEO[location.pathname] || {};

  const finalTitle = title || pageDefaults.title || defaultMeta.title;
  const finalDescription = description || pageDefaults.description || defaultMeta.description;
  const finalKeywords = keywords || pageDefaults.keywords || defaultMeta.keywords;
  const finalImage = image || pageDefaults.image || defaultMeta.image;
  const finalType = type || pageDefaults.type || defaultMeta.type;
  const shouldNoindex = noindex ?? pageDefaults.noindex ?? false;

  useEffect(() => {
    // Title
    document.title = finalTitle;

    // Meta tags helper
    const setMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    // Primary
    setMeta('description', finalDescription);
    setMeta('keywords', finalKeywords);
    setMeta('robots', shouldNoindex ? 'noindex, nofollow' : 'index, follow');

    // OG
    setMeta('og:title', finalTitle, true);
    setMeta('og:description', finalDescription, true);
    setMeta('og:image', finalImage, true);
    setMeta('og:type', finalType, true);
    setMeta('og:url', `https://zoyabites.com${location.pathname}`, true);

    // Twitter
    setMeta('twitter:title', finalTitle);
    setMeta('twitter:description', finalDescription);
    setMeta('twitter:image', finalImage);

    // Canonical
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = `https://zoyabites.com${location.pathname}`;
  }, [finalTitle, finalDescription, finalKeywords, finalImage, finalType, shouldNoindex, location.pathname]);

  return null;
};

export default SEOHead;
