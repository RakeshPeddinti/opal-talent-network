import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';
import { 
  Calendar, Clock, User, Shield, Star, CheckCircle, ArrowRight, Menu, X, 
  MapPin, Phone, Mail, Instagram, Facebook, Twitter, LogOut, Settings, 
  ShoppingBag, Sparkles, MessageSquare, Compass, Plus, Package, Layers, ChevronRight
} from 'lucide-react';
import { BookingSection } from '../components/BookingSection';
import { AdminDashboard } from '../components/AdminDashboard';
import { SellerDashboard } from '../components/SellerDashboard';
import { DiscussionsSection } from '../components/DiscussionsSection';
import { PortalVideoModal } from '../components/PortalVideoModal';
import { OrderTrackingModal } from '../components/OrderTrackingModal';
import { AIPortalAssistant } from '../components/AIPortalAssistant';
import { ProviderLanding } from '../components/ProviderLanding';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { cn } from '../utils';
import { VISIBLE_SERVICE_CATEGORIES } from '../constants';

const Navbar = ({ 
  view, 
  setView, 
  isAdmin, 
  isSeeker, 
  isSeller, 
  user, 
  onOpenLogin, 
  onLogout, 
  onOpenTracking,
  portalPillar = 'services',
  onSelectPillar
}: { 
  view: 'client' | 'admin' | 'seeker' | 'discussions' | 'seller', 
  setView: (v: 'client' | 'admin' | 'seeker' | 'discussions' | 'seller') => void, 
  isAdmin: boolean, 
  isSeeker: boolean, 
  isSeller: boolean, 
  user: any, 
  onOpenLogin: (role?: any) => void, 
  onLogout: () => void, 
  onOpenTracking?: (id?: string) => void,
  portalPillar?: 'services' | 'department',
  onSelectPillar?: (pillar: 'services' | 'department') => void
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks: { name: string; href: string; onClick?: () => void }[] = [
    { name: 'About', href: '#about' },
  ];
  const isLightPage = view !== 'client';

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4",
      isScrolled || isMobileMenuOpen || isLightPage ? "bg-white/95 backdrop-blur-md shadow-xs border-b border-brand-gold/15" : "bg-transparent"
    )}>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a 
            href="#" 
            onClick={() => setView('client')} 
            className={cn(
              "text-3xl font-serif tracking-tighter transition-colors",
              isScrolled || isLightPage ? "text-brand-dark" : "text-white"
            )}
          >
            OPAL PORTAL
          </a>
          
          {user && view !== 'admin' && (
            <div className="hidden lg:flex items-center bg-brand-cream/90 p-1 rounded-full border border-brand-gold/30 shadow-xs">
              <button
                type="button"
                onClick={() => setView('client')}
                className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                  view === 'client' ? "bg-white text-brand-dark shadow-xs" : "text-brand-muted hover:text-brand-dark"
                )}
              >
                Storefront
              </button>
              {isSeller && (
                <button
                  type="button"
                  onClick={() => setView('seller')}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1",
                    view === 'seller' ? "bg-brand-gold text-brand-dark shadow-xs font-extrabold" : "text-brand-muted hover:text-brand-dark"
                  )}
                >
                  <ShoppingBag className="w-3 h-3" />
                  Seller Portal
                </button>
              )}
              {isSeeker && (
                <button
                  type="button"
                  onClick={() => setView('seeker')}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                    view === 'seeker' ? "bg-brand-gold text-brand-dark shadow-xs font-extrabold" : "text-brand-muted hover:text-brand-dark"
                  )}
                >
                  My Orders
                </button>
              )}
            </div>
          )}

          {view === 'client' && onSelectPillar && (
            <div className="hidden md:flex items-center p-1 rounded-full bg-black/40 backdrop-blur-md border border-brand-gold/30 shadow-md">
              <button
                type="button"
                onClick={() => onSelectPillar('services')}
                className={cn(
                  "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                  portalPillar === 'services'
                    ? "bg-gradient-to-r from-amber-500 to-brand-gold text-brand-dark shadow-sm font-extrabold"
                    : isScrolled ? "text-stone-700 hover:text-stone-900" : "text-white/80 hover:text-white"
                )}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Services</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectPillar('department')}
                className={cn(
                  "px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                  portalPillar === 'department'
                    ? "bg-gradient-to-r from-amber-500 to-brand-gold text-brand-dark shadow-sm font-extrabold"
                    : isScrolled ? "text-stone-700 hover:text-stone-900" : "text-white/80 hover:text-white"
                )}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Retail</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {view === 'client' && (
            <>
              {navLinks.map(link => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className={cn(
                    "text-sm uppercase tracking-widest font-medium transition-colors",
                    isScrolled ? "text-brand-dark hover:text-brand-gold" : "text-white/80 hover:text-white"
                  )}
                >
                  {link.name}
                </a>
              ))}
            </>
          )}

          {user && onOpenTracking && (
            <button
              type="button"
              onClick={() => onOpenTracking()}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs border",
                isScrolled || isLightPage
                  ? "bg-brand-dark text-white border-brand-dark hover:bg-brand-gold hover:text-brand-dark"
                  : "bg-brand-gold/20 text-brand-gold border-brand-gold/50 hover:bg-brand-gold hover:text-brand-dark"
              )}
              title="Track Your Service Booking or Retail Order Status"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Track Order</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className={cn(
                  "block text-xs font-bold uppercase tracking-wider",
                  isScrolled || isLightPage ? "text-brand-dark" : "text-white"
                )}>
                  {user.companyName || user.businessName || user.displayName || user.name || user.email?.split('@')[0]}
                </span>
                <span className="text-[10px] text-brand-gold tracking-widest uppercase font-semibold">
                  {isAdmin ? 'Service Provider' : isSeller ? 'Product Seller' : 'Client'}
                </span>
              </div>
              
              {isAdmin && view === 'client' && (
                <button 
                  onClick={() => setView('admin')}
                  className="px-5 py-2 bg-brand-gold text-brand-dark rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white transition-all shadow-md flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Dashboard
                </button>
              )}

              {isSeller && view === 'client' && (
                <button 
                  onClick={() => setView('seller')}
                  className="px-5 py-2 bg-brand-gold text-brand-dark rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white transition-all shadow-md flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Seller Hub
                </button>
              )}

              {isSeeker && view === 'client' && (
                <button 
                  onClick={() => setView('seeker')}
                  className="px-5 py-2 bg-brand-gold text-brand-dark rounded-full text-xs uppercase tracking-widest font-bold hover:bg-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  My Orders
                </button>
              )}

              <button 
                onClick={onLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200/80 rounded-full font-bold uppercase tracking-wider text-xs transition-all shadow-xs"
                title="Log out of your account"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onOpenLogin()}
              className="px-8 py-3 bg-brand-gold text-white rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand-gold/20"
            >
              Sign In
            </button>
          )}
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "md:hidden p-2 transition-colors",
            isScrolled || isLightPage ? "text-brand-dark" : "text-white"
          )}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white mt-4 p-6 rounded-3xl shadow-2xl border border-brand-gold/10 space-y-4"
        >
          {view === 'client' && navLinks.map(link => (
            <a 
              key={link.name} 
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-brand-dark text-lg font-serif"
            >
              {link.name}
            </a>
          ))}

          {user && onOpenTracking && (
            <button 
              type="button"
              onClick={() => { onOpenTracking(); setIsMobileMenuOpen(false); }}
              className="w-full py-3.5 px-4 rounded-xl bg-stone-900 border border-brand-gold/40 text-brand-gold font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:bg-brand-gold hover:text-brand-dark transition-all"
            >
              <Package className="w-4 h-4 text-brand-gold" />
              <span>Track My Order / Booking</span>
            </button>
          )}

          {user ? (
            <div className="pt-4 border-t border-brand-muted/10 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-brand-cream">
                <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                  {user.companyName || user.businessName || user.displayName || user.name || user.email}
                </span>
                <span className="text-[10px] bg-brand-gold/20 text-brand-dark px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {isAdmin ? 'Provider' : isSeller ? 'Seller' : 'Client'}
                </span>
              </div>
              <button 
                onClick={() => {
                  onLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-center uppercase tracking-widest font-bold text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => {
                onOpenLogin();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-4 bg-brand-gold text-white text-center rounded-xl uppercase tracking-widest font-bold text-xs"
            >
              Sign In
            </button>
          )}
        </motion.div>
      )}
    </nav>
  );
};

const Hero = ({ user, onOpenTracking }: { user?: any, onOpenTracking?: () => void }) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-brand-dark">
      <motion.div style={{ y: y1, opacity }} className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=1920" 
          alt="Multi-Service Portal" 
          className="w-full h-full object-cover opacity-60"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-dark/20 via-transparent to-brand-dark" />
      </motion.div>

      <div className="container mx-auto px-6 relative z-10 text-center text-white">
        <motion.span 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-brand-gold uppercase tracking-[0.4em] text-sm mb-6 block"
        >
          Your All-In-One Service Hub
        </motion.span>
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-7xl md:text-9xl mb-8 leading-tight font-serif"
        >
          Opal Portal
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-brand-cream/80 max-w-2xl mx-auto mb-10 font-light leading-relaxed"
        >
          From premium beauty treatments to expert handyman services, party planning, and culinary experiences. 
          Professional services and curated retail departments, seamlessly in one place.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-4"
        >
          <a
            href="#booking"
            className="px-8 py-4 bg-gradient-to-r from-amber-500 via-brand-gold to-yellow-600 text-brand-dark rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-gold/30 border border-yellow-200 cursor-pointer"
          >
            Explore Services & Retail ↓
          </a>
          {user && onOpenTracking && (
            <button
              type="button"
              onClick={onOpenTracking}
              className="px-7 py-4 bg-brand-gold/15 hover:bg-brand-gold hover:text-brand-dark text-white rounded-full font-bold uppercase tracking-widest text-xs backdrop-blur-md border border-brand-gold/50 transition-all shadow-xl flex items-center gap-2 cursor-pointer group"
            >
              <Package className="w-4 h-4 text-brand-gold group-hover:text-brand-dark group-hover:scale-110 transition-all" />
              <span>Track My Order</span>
            </button>
          )}
        </motion.div>
      </div>

      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll to discover</span>
        <div className="w-px h-12 bg-white/20" />
      </motion.div>
    </section>
  );
};

const Footer = ({ user, onStaffLogin, onOpenVideo, onOpenTracking }: { 
  user?: any, 
  onStaffLogin: () => void, 
  onOpenVideo?: () => void, 
  onOpenTracking?: () => void
}) => {
  return (
    <footer className="bg-brand-dark text-white pt-24 pb-12 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-2">
            <h2 className="text-4xl font-serif mb-6">OPAL PORTAL</h2>
            <p className="text-white/50 max-w-sm mb-8">
              Your trusted partner for all home and personal services. From beauty to building, we bring expertise to your doorstep.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-gold hover:border-brand-gold transition-all"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-gold hover:border-brand-gold transition-all"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-gold hover:border-brand-gold transition-all"><Twitter className="w-5 h-5" /></a>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm uppercase tracking-widest font-bold mb-6">Visit Us</h4>
            <ul className="space-y-4 text-white/60 text-sm">
              <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-brand-gold shrink-0" /> 123 Elite Avenue, <br /> Beverly Hills, CA 90210</li>
              <li className="flex items-center gap-3"><Phone className="w-5 h-5 text-brand-gold shrink-0" /> +1 (555) 000-PORTAL</li>
              <li className="flex items-center gap-3"><Mail className="w-5 h-5 text-brand-gold shrink-0" /> hello@opalportal.com</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-widest font-bold mb-6">Services & Ecosystem</h4>
            <ul className="space-y-3 text-white/60 text-sm">
              {VISIBLE_SERVICE_CATEGORIES.map(cat => (
                <li key={cat}>
                  <a href="#booking" className="hover:text-brand-gold transition-colors flex items-center justify-between">
                    <span>{cat}</span>
                  </a>
                </li>
              ))}
              <li key="Shopping">
                <a href="#booking" className="hover:text-brand-gold transition-colors flex items-center justify-between">
                  <span>Shopping & Retail</span>
                </a>
              </li>
              {user && onOpenTracking && (
                <li key="TrackOrder" className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenTracking}
                    className="hover:text-brand-gold transition-colors flex items-center gap-1.5 text-left cursor-pointer group text-xs text-white/80"
                  >
                    <Package className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Track Booking or Order</span>
                  </button>
                </li>
              )}
              {onOpenVideo && (
                <li key="VideoGuide" className="pt-2 border-t border-white/10">
                  <button 
                    type="button"
                    onClick={onOpenVideo}
                    className="hover:text-white transition-colors flex items-center gap-2 text-brand-gold font-bold text-left cursor-pointer group text-xs"
                  >
                    <span>📺 Watch Portal Video Guide</span>
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-white/40">
          <p>© 2024 Opal Portal. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <button onClick={onStaffLogin} className="hover:text-brand-gold transition-colors font-mono">
              Staff Portal Login
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export const OpalPortalApp: React.FC = () => {
  useEffect(() => {
    document.title = 'Opal Portal | Luxury Services & Curated Retail Hub';
  }, []);

  const [view, setView] = useState<'client' | 'admin' | 'seeker' | 'discussions' | 'seller'>('client');
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSeeker, setIsSeeker] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [portalPillar, setPortalPillar] = useState<'services' | 'department'>('services');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [trackingModalInitialId, setTrackingModalInitialId] = useState('');
  const [logoutTrigger, setLogoutTrigger] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('opal_portal_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        setIsAdmin(u.role === 'provider' || u.role === 'admin' || u.email?.toLowerCase() === 'rakesh2xplore@gmail.com');
        setIsSeller(u.role === 'seller');
        setIsSeeker(u.role === 'seeker');
      } catch (e) {}
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (localStorage.getItem('opal_portal_user')) return;
      if (fbUser) {
        try {
          const uDoc = await getDoc(doc(db, 'users', fbUser.uid));
          if (uDoc.exists()) {
            const data = uDoc.data();
            const fullUser = { ...fbUser, ...data };
            setUser(fullUser);
            setIsAdmin(data.role === 'provider' || data.role === 'admin' || fbUser.email?.toLowerCase() === 'rakesh2xplore@gmail.com');
            setIsSeller(data.role === 'seller');
            setIsSeeker(data.role === 'seeker');
          }
        } catch (e) {}
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    localStorage.removeItem('opal_portal_user');
    setUser(null);
    setIsAdmin(false);
    setIsSeller(false);
    setIsSeeker(false);
    setView('client');
    setLogoutTrigger(prev => prev + 1);
  };

  const handleOpenTracking = (id?: string) => {
    setTrackingModalInitialId(id || '');
    setIsTrackingModalOpen(true);
  };

  const handleSelectPortalPillar = (pillar: 'services' | 'department') => {
    setPortalPillar(pillar);
    if (view !== 'client') setView('client');
    setTimeout(() => {
      const el = document.getElementById('booking') || document.getElementById('portal');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  return (
    <div className="min-h-screen bg-white text-brand-dark flex flex-col font-sans">
      <Navbar
        view={view}
        setView={setView}
        isAdmin={isAdmin}
        isSeeker={isSeeker}
        isSeller={isSeller}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenTracking={user ? handleOpenTracking : undefined}
        portalPillar={portalPillar}
        onSelectPillar={handleSelectPortalPillar}
      />

      <main className="flex-1 w-full">
        {view === 'client' ? (
          <>
            <Hero user={user} onOpenTracking={user ? handleOpenTracking : undefined} />
            <BookingSection
              key={`booking-section-${logoutTrigger}`}
              user={user}
              isAdmin={isAdmin}
              onSwitchToDashboard={() => setView('admin')}
              onOpenTracking={user ? handleOpenTracking : undefined}
              initialPillar={portalPillar}
              onOpenLogin={() => setIsLoginModalOpen(true)}
              onFastLogin={() => {}}
              onSwitchView={(v: any) => setView(v)}
            />
            <Footer
              user={user}
              onStaffLogin={() => setIsLoginModalOpen(true)}
              onOpenVideo={() => setIsVideoModalOpen(true)}
              onOpenTracking={user ? handleOpenTracking : undefined}
            />
            <AIPortalAssistant />
          </>
        ) : view === 'discussions' ? (
          <>
            <DiscussionsSection onOpenLogin={() => setIsLoginModalOpen(true)} user={user} />
            <Footer
              user={user}
              onStaffLogin={() => setIsLoginModalOpen(true)}
              onOpenVideo={() => setIsVideoModalOpen(true)}
              onOpenTracking={user ? handleOpenTracking : undefined}
            />
          </>
        ) : view === 'seller' ? (
          <SellerDashboard
            user={user || {
              uid: 'demo_seller_preview',
              email: 'seller@opalportal.com',
              displayName: 'Milano Sartoriale',
              companyName: 'Milano Sartoriale',
              role: 'seller'
            }}
            onLogout={handleLogout}
            onSwitchToClientView={() => setView('client')}
          />
        ) : view === 'seeker' ? (
          user ? (
            <AdminDashboard
              onLogout={handleLogout}
              user={user}
              onSwitchToClientView={() => setView('client')}
              onOpenTracking={handleOpenTracking}
            />
          ) : (
            <Hero user={user} onOpenTracking={user ? handleOpenTracking : undefined} />
          )
        ) : (
          user ? (
            <AdminDashboard
              onLogout={handleLogout}
              user={user}
              onSwitchToClientView={() => setView('client')}
              onOpenTracking={handleOpenTracking}
            />
          ) : (
            <ProviderLanding onLogin={() => setIsLoginModalOpen(true)} />
          )
        )}
      </main>

      <PortalVideoModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      <OrderTrackingModal
        isOpen={isTrackingModalOpen && !!user}
        user={user}
        onClose={() => {
          setIsTrackingModalOpen(false);
          setTrackingModalInitialId('');
        }}
        initialTrackingId={trackingModalInitialId}
      />
    </div>
  );
};
