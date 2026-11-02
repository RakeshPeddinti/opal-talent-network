import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, Mail, Clock, Tag, List, DollarSign, CreditCard, Settings, Plus, Phone, Megaphone, TrendingUp, BarChart2, PieChart as PieChartIcon, X, Sparkles, Eye, CheckCircle2, Edit2, ShoppingBag, Package, Star, ThumbsUp, ChevronDown, Briefcase } from 'lucide-react';
import { cn } from '../utils';
import { VISIBLE_SERVICE_CATEGORIES } from '../constants';
import { CalendarView } from './CalendarView';
import { ServiceManager } from './ServiceManager';
import { CloudKitchenMarketing } from './CloudKitchenMarketing';
import { SpecialOffersPublisher } from './SpecialOffersPublisher';
import { OrderHistoryView } from './OrderHistoryView';
import { StarRating } from './StarRating';
import { RetailOrderRecord, ReviewRecord } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, 
  parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth, subMonths,
  subQuarters, subYears, isAfter, subDays, parse, addDays
} from 'date-fns';

import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, updateDoc, doc, getDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface BookingRecord {
  id: string;
  bookingRefId?: string;
  serviceId: string;
  serviceName: string;
  serviceNames?: string[];
  category?: string;
  duration?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  price: number;
  createdAt: any;
}

interface AdminDashboardProps {
  onLogout: () => void;
  user: any;
  onSwitchToClientView?: () => void;
  onOpenTracking?: (trackingId?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  onLogout, 
  user, 
  onSwitchToClientView,
  onOpenTracking
}) => {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [providerCatalogServices, setProviderCatalogServices] = useState<any[]>([]);
  const [selectedServiceFilter, setSelectedServiceFilter] = useState<string>('ALL');
  const [orders, setOrders] = useState<RetailOrderRecord[]>([]);
  const [providerReviews, setProviderReviews] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  const [isSeedingOrders, setIsSeedingOrders] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'revenue' | 'services' | 'marketing' | 'specialOffers' | 'orderHistory' | 'reviews'>(() => {
    return user?.role === 'seeker' ? 'orderHistory' : 'list';
  });
  const [userProfile, setUserProfile] = useState<{ businessName: string, role: string, category: string, name?: string, uid?: string, email?: string } | null>(null);
  const [addServiceTrigger, setAddServiceTrigger] = useState(0);
  const [isCompletingProfile, setIsCompletingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ businessName: '', category: 'Beauty' });
  const [frequentTimeframe, setFrequentTimeframe] = useState<'month' | 'quarter' | 'halfYear' | 'year'>('month');

  const isPlatformAdmin = user?.email === 'rakesh2xplore@gmail.com' || userProfile?.role === 'admin' || user?.role === 'admin';
  const isSeeker = userProfile?.role === 'seeker' || user?.role === 'seeker';
  const isProvider = !isSeeker || userProfile?.role === 'provider' || user?.role === 'provider' || isPlatformAdmin;
  const isEligibleForSpecialOffers = 
    userProfile?.category === 'Cloud Kitchen' || 
    userProfile?.category === 'Beauty' || 
    userProfile?.category === 'Beauty & Wellness';
  const [isSeedingBookings, setIsSeedingBookings] = useState(false);
  const [seedSuccessMessage, setSeedSuccessMessage] = useState<string | null>(null);

  const averageRating = useMemo(() => {
    if (providerReviews.length === 0) return 5.0;
    const sum = providerReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
    return Math.round((sum / providerReviews.length) * 10) / 10;
  }, [providerReviews]);

  useEffect(() => {
    if (!user) return;

    // Category-specific business name helper
    const getCategoryDefaultBusinessName = (cat: string) => {
      switch (cat) {
        case 'Handyman': return 'Apex Handyman Solutions';
        case 'Cloud Kitchen': return 'Gourmet Cloud Kitchen';
        case 'Party Planner': return 'Grand Moments Event Planning';
        case 'Beauty':
        default:
          return 'Opal Luxury Salon & Spa';
      }
    };

    // Fetch Profile
    const fetchProfile = async () => {
      try {
        const defaultCat = user.category || 'Handyman';
        const defaultBiz = user.businessName || getCategoryDefaultBusinessName(defaultCat);

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as any;
          // Priority: user.category (current session selection) -> data.category -> Handyman
          const effectiveCat = user.category || data.category || 'Handyman';
          const effectiveBiz = user.businessName || data.businessName || getCategoryDefaultBusinessName(effectiveCat);
          data.role = data.role || user.role || 'provider';
          data.businessName = effectiveBiz;
          data.category = effectiveCat;

          setUserProfile(data);
          if (data.role === 'provider' && (!data.businessName || !data.category)) {
            setIsCompletingProfile(true);
            setProfileForm({ 
              businessName: effectiveBiz, 
              category: effectiveCat 
            });
          }
        } else if (user.uid.startsWith('guest_')) {
          // Handle guest profile
          const guestCat = user.category || 'Handyman';
          const guestBiz = user.businessName || getCategoryDefaultBusinessName(guestCat);
          const guestData = {
            uid: user.uid,
            email: user.email,
            role: user.role || 'provider',
            name: user.displayName || 'Guest Provider',
            businessName: guestBiz,
            category: guestCat
          };
          setUserProfile(guestData);
          if (user.role === 'provider') {
            setIsCompletingProfile(true);
            setProfileForm({ businessName: guestBiz, category: guestCat });
          }
        } else if (user.email === 'rakesh2xplore@gmail.com') {
          const effectiveCat = user.category || 'Handyman';
          const effectiveBiz = user.businessName || getCategoryDefaultBusinessName(effectiveCat);
          setUserProfile({
            uid: user.uid,
            email: user.email,
            role: 'provider',
            name: user.displayName || 'Rakesh',
            businessName: effectiveBiz,
            category: effectiveCat
          });
        } else {
          // Fallback profile initialization from local user state
          const fallbackCat = user.category || 'Handyman';
          const fallbackBiz = user.businessName || getCategoryDefaultBusinessName(fallbackCat);
          const fallbackData = {
            uid: user.uid,
            email: user.email || '',
            role: user.role || 'provider',
            name: user.name || user.displayName || 'Provider',
            businessName: fallbackBiz,
            category: fallbackCat
          };
          setUserProfile(fallbackData);
          if ((user.role === 'provider' || !user.role) && !user.businessName) {
            setIsCompletingProfile(true);
            setProfileForm({ 
              businessName: fallbackBiz, 
              category: fallbackCat 
            });
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      }
    };
    fetchProfile();

    // Fetch Bookings (Real-time strictly filtered to provider/seeker)
    const bookingsRef = collection(db, 'bookings');
    const isMyBooking = (b: any) => {
      if (isSeeker) return b.customerUid === user.uid || (user.email && b.customerEmail === user.email);
      if (b.providerId && b.providerId === user.uid) return true;
      if (b.providerId && user.email && b.providerId.toLowerCase() === user.email.toLowerCase()) return true;
      const bName = userProfile?.businessName || user.businessName || user.displayName || user.name;
      if (bName && b.providerName && b.providerName.trim().toLowerCase() === bName.trim().toLowerCase()) return true;
      if (user.email === 'rakesh2xplore@gmail.com' && (b.providerId === 'provider-opal-beauty' || b.providerName === 'Opal Luxury Salon' || b.providerId === user.uid)) return true;
      return false;
    };

    const unsubscribeBookings = onSnapshot(bookingsRef, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          price: typeof d.price === 'number' && !Number.isNaN(d.price) ? d.price : (parseFloat(String(d.price)) || 0)
        };
      }) as BookingRecord[];
      const myBookings = allDocs.filter(isMyBooking);
      setBookings(myBookings);
      setIsLoading(false);
    }, (error) => {
      console.error("Bookings fetch error:", error);
      setIsLoading(false);
    });

    // Fetch Retail Orders (real-time, filtered to customer or platform admin)
    const ordersRef = collection(db, 'orders');
    const isMyOrder = (ord: any) => {
      if (isPlatformAdmin) return true;
      if (ord.customerUid && ord.customerUid === user.uid) return true;
      if (ord.customerEmail && user.email && ord.customerEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
      if (user.phone && ord.customerPhone && ord.customerPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')) return true;
      return false;
    };

    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      const allOrders = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          totalPrice: typeof d.totalPrice === 'number' && !Number.isNaN(d.totalPrice) ? d.totalPrice : (parseFloat(String(d.totalPrice)) || 0)
        };
      }) as RetailOrderRecord[];
      const myOrders = allOrders.filter(isMyOrder);
      setOrders(myOrders);
      setIsOrdersLoading(false);
    }, (error) => {
      console.warn("Orders fetch notice:", error);
      setIsOrdersLoading(false);
    });

    // Fetch Reviews (real-time for this provider or all if admin)
    const reviewsRef = collection(db, 'reviews');
    const isMyReview = (rev: any) => {
      if (isPlatformAdmin) return true;
      if (rev.targetId && rev.targetId === user.uid) return true;
      const bName = userProfile?.businessName || user.businessName || user.displayName || user.name;
      if (bName && rev.targetName && rev.targetName.trim().toLowerCase() === bName.trim().toLowerCase()) return true;
      if (isSeeker) {
        if (rev.customerUid === user.uid) return true;
        if (user.email && rev.customerEmail?.toLowerCase() === user.email.toLowerCase()) return true;
      }
      return false;
    };

    const unsubscribeReviews = onSnapshot(reviewsRef, (snapshot) => {
      const allRev = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReviewRecord[];
      setProviderReviews(allRev.filter(isMyReview));
    }, (error) => {
      console.warn("Reviews fetch notice:", error);
    });

    // Fetch Services for this provider to know their catalog offerings
    const servicesRef = collection(db, 'services');
    const isMyCatalogService = (s: any) => {
      if (!user) return false;
      const isOwner = (s.providerId && s.providerId === user.uid) ||
        (s.providerId && user.email && s.providerId.toLowerCase() === user.email.toLowerCase()) ||
        (userProfile?.businessName && s.providerName && s.providerName.trim().toLowerCase() === userProfile.businessName.trim().toLowerCase());
      return isOwner;
    };

    const unsubscribeServices = onSnapshot(servicesRef, (snapshot) => {
      const allServices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const myServices = allServices.filter(isMyCatalogService);
      setProviderCatalogServices(myServices);
    }, (error) => {
      console.warn("Services fetch notice in dashboard:", error);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeOrders();
      unsubscribeReviews();
      unsubscribeServices();
    };
  }, [isSeeker, user, userProfile]);

  const handleSeedSampleBookings = async () => {
    if (!user) return;
    setIsSeedingBookings(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      const currentCat = userProfile?.category || user.category || 'Handyman';
      const providerDisplayName = userProfile?.businessName || user.businessName || user.displayName || user.name || (currentCat === 'Handyman' ? 'Apex Handyman Solutions' : currentCat === 'Cloud Kitchen' ? 'Gourmet Cloud Kitchen' : 'Opal Luxury Salon');
      
      let sample1: any;
      let sample2: any;

      if (currentCat === 'Handyman') {
        sample1 = {
          serviceId: 'sample-handyman-1',
          serviceName: 'Furniture Assembly & Wall Mounting',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'Marcus Vance',
          customerEmail: 'marcus.v@example.com',
          customerPhone: '+1 (555) 432-8765',
          customerUid: 'sample-cust-handy-1',
          date: todayStr,
          time: '1:00 PM',
          price: 130,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: serverTimestamp()
        };
        sample2 = {
          serviceId: 'sample-handyman-2',
          serviceName: 'Drywall Repair & Hole Patching',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'David Miller',
          customerEmail: 'david.m@example.com',
          customerPhone: '+1 (555) 876-5432',
          customerUid: 'sample-cust-handy-2',
          date: tomorrowStr,
          time: '3:30 PM',
          price: 180,
          status: 'done',
          paymentStatus: 'paid',
          paymentMethod: 'Cash',
          createdAt: serverTimestamp()
        };
      } else if (currentCat === 'Cloud Kitchen') {
        sample1 = {
          serviceId: 'sample-kitchen-1',
          serviceName: 'Artisan Gourmet Tasting Box (3-Course)',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'Chloe Bennett',
          customerEmail: 'chloe.b@example.com',
          customerPhone: '+1 (555) 998-1234',
          customerUid: 'sample-cust-kitchen-1',
          date: 'N/A',
          time: 'N/A',
          price: 95,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: serverTimestamp()
        };
        sample2 = {
          serviceId: 'sample-kitchen-2',
          serviceName: 'Weekly Healthy Meal Prep Plan',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'Alex Mercer',
          customerEmail: 'alex.m@example.com',
          customerPhone: '+1 (555) 776-8899',
          customerUid: 'sample-cust-kitchen-2',
          date: 'N/A',
          time: 'N/A',
          price: 160,
          status: 'done',
          paymentStatus: 'paid',
          paymentMethod: 'Zelle',
          createdAt: serverTimestamp()
        };
      } else if (currentCat === 'Party Planner') {
        sample1 = {
          serviceId: 'sample-party-1',
          serviceName: 'Luxury Birthday Celebration Styling',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'Olivia Wilde',
          customerEmail: 'olivia.w@example.com',
          customerPhone: '+1 (555) 345-6789',
          customerUid: 'sample-cust-party-1',
          date: todayStr,
          time: '11:00 AM',
          price: 350,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: serverTimestamp()
        };
        sample2 = {
          serviceId: 'sample-party-2',
          serviceName: 'Corporate Gala Decor & Setup',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'Robert Vance',
          customerEmail: 'robert.v@example.com',
          customerPhone: '+1 (555) 987-6543',
          customerUid: 'sample-cust-party-2',
          date: tomorrowStr,
          time: '5:00 PM',
          price: 550,
          status: 'done',
          paymentStatus: 'paid',
          paymentMethod: 'Zelle',
          createdAt: serverTimestamp()
        };
      } else {
        sample1 = {
          serviceId: 'sample-beauty-1',
          serviceName: 'Bridal Radiance Glow Facial',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'Emma Watson',
          customerEmail: 'emma.w@example.com',
          customerPhone: '+1 (555) 321-9876',
          customerUid: 'sample-cust-1',
          date: todayStr,
          time: '2:00 PM',
          price: 180,
          status: 'pending',
          paymentStatus: 'unpaid',
          createdAt: serverTimestamp()
        };
        sample2 = {
          serviceId: 'sample-beauty-2',
          serviceName: '24K Gold Luxury Facial',
          providerId: user.uid,
          providerName: providerDisplayName,
          customerName: 'Sophia Loren',
          customerEmail: 'sophia.l@example.com',
          customerPhone: '+1 (555) 765-4321',
          customerUid: 'sample-cust-2',
          date: tomorrowStr,
          time: '4:30 PM',
          price: 220,
          status: 'done',
          paymentStatus: 'paid',
          paymentMethod: 'Zelle',
          createdAt: serverTimestamp()
        };
      }

      await Promise.all([
        addDoc(collection(db, 'bookings'), sample1),
        addDoc(collection(db, 'bookings'), sample2)
      ]);

      setSeedSuccessMessage(`Added 2 sample ${currentCat} bookings to your schedule!`);
      setTimeout(() => setSeedSuccessMessage(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'bookings');
    } finally {
      setIsSeedingBookings(false);
    }
  };

  const handleSeedSampleOrders = async () => {
    if (!user) return;
    setIsSeedingOrders(true);
    try {
      const customerDisplayName = userProfile?.name || user.displayName || user.name || 'Valued Client';
      const customerEmail = user.email || 'client@opalportal.com';
      const customerPhone = user.phone || '+1 (310) 555-0199';

      const order1 = {
        orderId: 'OPAL-ORD-90210-LUX',
        customerUid: user.uid,
        customerName: customerDisplayName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        totalPrice: 345,
        currency: 'USD',
        paymentStatus: 'paid',
        paymentMethod: 'Apple Pay',
        fulfillmentType: 'delivery',
        shippingCarrier: 'FedEx Priority Overnight',
        trackingNumber: 'FDX-9948271038',
        status: 'in_transit',
        shippingAddress: '9405 Wilshire Blvd, Penthouse 800, Beverly Hills, CA 90212',
        estimatedDelivery: 'Tomorrow by 2:00 PM',
        items: [
          {
            id: 'item-101',
            name: '24K Gold Cellular Rejuvenation Serum (50ml)',
            quantity: 1,
            unitPrice: 220,
            brand: 'Opal Atelier',
            category: 'Luxury Skincare'
          },
          {
            id: 'item-102',
            name: 'Artisan Obsidian Body Elixir (100ml)',
            quantity: 1,
            unitPrice: 125,
            brand: 'Opal Maison',
            category: 'Aromatherapy & Body'
          }
        ],
        createdAt: serverTimestamp()
      };

      const order2 = {
        orderId: 'OPAL-ORD-77341-PKP',
        customerUid: user.uid,
        customerName: customerDisplayName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        totalPrice: 180,
        currency: 'USD',
        paymentStatus: 'paid',
        paymentMethod: 'Opal Concierge Vault',
        fulfillmentType: 'pickup',
        pickupShowroom: 'Opal Beverly Hills Flagship Boutique',
        pickupAddress: '468 N Rodeo Dr, Beverly Hills, CA 90210',
        pickupInstructions: 'Present your digital verification code at the VIP Salon concierge counter.',
        status: 'ready_for_pickup',
        items: [
          {
            id: 'item-201',
            name: 'Botanical Silk Infusion Hair Mask (250ml)',
            quantity: 2,
            unitPrice: 90,
            brand: 'Opal Pure Botanical',
            category: 'Hair Care'
          }
        ],
        createdAt: serverTimestamp()
      };

      await Promise.all([
        addDoc(collection(db, 'orders'), order1),
        addDoc(collection(db, 'orders'), order2)
      ]);

      setSeedSuccessMessage('Added 2 luxury retail orders to your Order History!');
      setTimeout(() => setSeedSuccessMessage(null), 4000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    } finally {
      setIsSeedingOrders(false);
    }
  };

  const updateBookingStatus = async (ids: string | string[], updates: { status?: string, paymentStatus?: string, paymentMethod?: string }) => {
    const idArray = Array.isArray(ids) ? ids : [ids];
    try {
      await Promise.all(idArray.map(id => updateDoc(doc(db, 'bookings', id), updates)));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${idArray.join(',')}`);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...profileForm,
        updatedAt: serverTimestamp()
      });
      setUserProfile(prev => prev ? { ...prev, ...profileForm } : null);
      setIsCompletingProfile(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayBookings = bookings.filter(b => b.date === today);
  const todayRevenue = todayBookings.reduce((sum, b) => b.paymentStatus === 'paid' ? sum + b.price : sum, 0);
  const potentialRevenue = todayBookings.reduce((sum, b) => sum + b.price, 0);

  // --- Revenue Data Processing ---
  
  // Weekly Revenue (Last 7 days)
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date()
  });

  const weeklyData = last7Days.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayRevenue = bookings
      .filter(b => b.date === dayStr && b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + b.price, 0);
    return {
      name: format(day, 'EEE'),
      revenue: dayRevenue
    };
  });

  // Monthly Revenue (Last 6 months)
  const last6Months = eachMonthOfInterval({
    start: subMonths(new Date(), 5),
    end: new Date()
  });

  const monthlyData = last6Months.map(month => {
    const monthRevenue = bookings
      .filter(b => {
        const bDate = parseISO(b.date);
        return isSameMonth(bDate, month) && b.paymentStatus === 'paid';
      })
      .reduce((sum, b) => sum + b.price, 0);
    return {
      name: format(month, 'MMM'),
      revenue: monthRevenue
    };
  });

  // Service Specific Revenue
  const serviceRevenueMap: Record<string, number> = {};
  bookings
    .filter(b => b.paymentStatus === 'paid')
    .forEach(b => {
      serviceRevenueMap[b.serviceName] = (serviceRevenueMap[b.serviceName] || 0) + b.price;
    });

  const serviceData = Object.entries(serviceRevenueMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 services

  const COLORS = ['#D4AF37', '#1A1A1A', '#8E9299', '#E4E3E0', '#F5F2ED'];

  // --- Seeker Specific Revenue & Frequency ---
  
  const getFrequentSeekers = (timeframe: 'month' | 'quarter' | 'halfYear' | 'year') => {
    const now = new Date();
    let startDate: Date;
    
    switch(timeframe) {
      case 'month': startDate = subMonths(now, 1); break;
      case 'quarter': startDate = subQuarters(now, 1); break;
      case 'halfYear': startDate = subMonths(now, 6); break;
      case 'year': startDate = subYears(now, 1); break;
      default: startDate = subMonths(now, 1);
    }

    const counts: Record<string, { name: string, count: number, revenue: number }> = {};
    bookings.forEach(b => {
      try {
        const bDate = parseISO(b.date);
        if (isAfter(bDate, startDate)) {
          const key = b.customerEmail || b.customerName;
          if (!counts[key]) {
            counts[key] = { name: b.customerName, count: 0, revenue: 0 };
          }
          counts[key].count += 1;
          if (b.paymentStatus === 'paid') {
            counts[key].revenue += b.price;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const frequentSeekersMonth = getFrequentSeekers('month');
  const frequentSeekersQuarter = getFrequentSeekers('quarter');
  const frequentSeekersHalfYear = getFrequentSeekers('halfYear');
  const frequentSeekersYear = getFrequentSeekers('year');

  const seekerRevenueMap: Record<string, number> = {};
  bookings
    .filter(b => b.paymentStatus === 'paid')
    .forEach(b => {
      seekerRevenueMap[b.customerName] = (seekerRevenueMap[b.customerName] || 0) + b.price;
    });

  const seekerRevenueData = Object.entries(seekerRevenueMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const currentFrequentSeekers = frequentTimeframe === 'month' ? frequentSeekersMonth :
                                frequentTimeframe === 'quarter' ? frequentSeekersQuarter :
                                frequentTimeframe === 'halfYear' ? frequentSeekersHalfYear :
                                frequentSeekersYear;

  // Group bookings by seeker, date, and time for display
  const groupedBookings = bookings.reduce((acc: Record<string, any>, booking) => {
    const key = `${booking.customerEmail || booking.customerName}-${booking.date}-${booking.time}`;
    if (!acc[key]) {
      acc[key] = {
        ...booking,
        serviceNames: [booking.serviceName],
        totalPrice: booking.price,
        bookingIds: [booking.id],
        paymentMethod: booking.paymentMethod,
      };
    } else {
      acc[key].serviceNames.push(booking.serviceName);
      acc[key].totalPrice += booking.price;
      acc[key].bookingIds.push(booking.id);
      // If any booking is pending, keep status as pending
      if (booking.status === 'pending') acc[key].status = 'pending';
      // If any booking is unpaid, keep paymentStatus as unpaid
      if (booking.paymentStatus === 'unpaid') acc[key].paymentStatus = 'unpaid';
    }
    return acc;
  }, {});

  const displayBookings = Object.values(groupedBookings).sort((a: any, b: any) => {
    try {
      // Handle Cloud Kitchen 'N/A' cases
      if (a.date === 'N/A' || b.date === 'N/A') {
        if (a.date === 'N/A' && b.date === 'N/A') {
          const createdA = a.createdAt?.seconds || 0;
          const createdB = b.createdAt?.seconds || 0;
          return createdB - createdA;
        }
        return a.date === 'N/A' ? 1 : -1;
      }

      const dateA = parse(`${a.date} ${a.time}`, 'yyyy-MM-dd h:mm a', new Date());
      const dateB = parse(`${b.date} ${b.time}`, 'yyyy-MM-dd h:mm a', new Date());
      return dateB.getTime() - dateA.getTime();
    } catch (e) {
      return 0;
    }
  });

  // Compute distinct services owned or booked by this provider
  const distinctServices = useMemo(() => {
    const set = new Set<string>();
    providerCatalogServices.forEach(s => {
      if (s.name && typeof s.name === 'string') set.add(s.name.trim());
    });
    bookings.forEach(b => {
      if (b.serviceNames && Array.isArray(b.serviceNames)) {
        b.serviceNames.forEach(sn => sn && typeof sn === 'string' && set.add(sn.trim()));
      } else if (b.serviceName && typeof b.serviceName === 'string') {
        set.add(b.serviceName.trim());
      }
    });
    return Array.from(set).filter(Boolean);
  }, [providerCatalogServices, bookings]);

  // Filter display bookings if a specific service is selected in the service dropdown
  const filteredDisplayBookings = useMemo(() => {
    if (selectedServiceFilter === 'ALL' || distinctServices.length <= 1) {
      return displayBookings;
    }
    return displayBookings.filter((booking: any) => {
      if (booking.serviceNames && Array.isArray(booking.serviceNames)) {
        return booking.serviceNames.some((sn: string) => sn.trim() === selectedServiceFilter);
      }
      return booking.serviceName && booking.serviceName.trim() === selectedServiceFilter;
    });
  }, [displayBookings, selectedServiceFilter, distinctServices.length]);

  return (
    <div className="p-8 bg-brand-cream min-h-screen pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-5xl">
                {isSeeker ? `Welcome, ${userProfile?.name || 'Client'}` : `${userProfile?.businessName || 'Provider'} Dashboard`}
              </h2>
              {!isSeeker && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileForm({
                      businessName: userProfile?.businessName || '',
                      category: userProfile?.category || 'Handyman'
                    });
                    setIsCompletingProfile(true);
                  }}
                  className="p-2 rounded-xl border border-brand-gold/30 hover:border-brand-gold bg-white text-brand-dark/70 hover:text-brand-gold transition-colors text-xs flex items-center gap-1.5 shadow-2xs"
                  title="Edit Provider Business Name & Category"
                >
                  <Edit2 className="w-3.5 h-3.5 text-brand-gold" />
                  <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Edit Business Name</span>
                </button>
              )}
              {userProfile?.category && !isSeeker && (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand-gold/20">
                    {userProfile.category} View
                  </span>
                  {distinctServices.length > 1 && (
                    <select
                      value={userProfile.category}
                      onChange={async (e) => {
                        const newCat = e.target.value;
                        setUserProfile(prev => prev ? { ...prev, category: newCat } : null);
                        try {
                          if (user?.uid) {
                            await updateDoc(doc(db, 'users', user.uid), { category: newCat, updatedAt: serverTimestamp() });
                          }
                        } catch (err) {
                          console.warn("Could not persist category change:", err);
                        }
                      }}
                      className="text-[10px] font-bold uppercase tracking-widest bg-white border border-brand-gold/30 text-brand-dark px-2.5 py-1 rounded-full outline-none cursor-pointer hover:border-brand-gold transition-colors shadow-xs"
                      title="Switch active provider category view"
                    >
                      {VISIBLE_SERVICE_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat} View</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {isSeeker && (
                <span className="px-3 py-1 bg-brand-dark/10 text-brand-dark text-[10px] font-bold uppercase tracking-widest rounded-full border border-brand-dark/20">
                  Service Seeker
                </span>
              )}
            </div>
            <p className="text-brand-muted">
              {isSeeker ? 'Track your upcoming appointments and service history.' : 'Manage your business appointments and client requests.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isSeeker ? (
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleSeedSampleOrders}
                  disabled={isSeedingOrders}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-dark rounded-xl hover:bg-brand-dark hover:text-white transition-all shadow-sm font-bold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                  title="Add 2 sample luxury retail orders to test history and tracking"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSeedingOrders ? 'Seeding...' : '+ Sample Orders'}
                </button>
                {onOpenTracking && (
                  <button 
                    onClick={() => onOpenTracking()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md font-bold text-xs uppercase tracking-wider cursor-pointer"
                    title="Track an order by entering booking or order reference ID"
                  >
                    <Package className="w-4 h-4" />
                    Track by ID
                  </button>
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={() => {
                    setViewMode('services');
                    setAddServiceTrigger(prev => prev + 1);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md font-bold text-xs uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  Add Service
                </button>

                <button 
                  onClick={handleSeedSampleBookings}
                  disabled={isSeedingBookings}
                  className="flex items-center gap-2 px-4 py-2.5 bg-brand-gold text-brand-dark rounded-xl hover:bg-white transition-all shadow-sm font-bold text-xs uppercase tracking-wider disabled:opacity-50"
                  title="Add sample appointments to preview schedule, calendar, and payment tracking"
                >
                  <Sparkles className="w-4 h-4" />
                  {isSeedingBookings ? 'Seeding...' : '+ Sample Bookings'}
                </button>

                <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-xl border border-brand-gold/20 shadow-sm text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-brand-dark uppercase tracking-wider">My Appointments ({bookings.length})</span>
                </div>

                <div className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-xl border border-brand-gold/20 shadow-sm text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-brand-dark uppercase tracking-wider">{averageRating}</span>
                  <span className="text-brand-muted font-normal text-[11px]">({providerReviews.length} Reviews)</span>
                </div>
              </>
            )}

            <div className="flex bg-white p-1 rounded-xl border border-brand-gold/20 shadow-sm">
              <button 
                onClick={() => setViewMode('orderHistory')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
                  viewMode === 'orderHistory' ? "bg-brand-gold text-white shadow-md" : "text-brand-muted hover:bg-brand-gold/5"
                )}
                title="View combined timeline of retail purchases and service appointments"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order History</span>
                {(orders.length > 0 || bookings.length > 0) && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                    viewMode === 'orderHistory' ? "bg-brand-dark text-white" : "bg-brand-gold/20 text-brand-dark"
                  )}>
                    {orders.length + bookings.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
                  viewMode === 'list' ? "bg-brand-gold text-white shadow-md" : "text-brand-muted hover:bg-brand-gold/5"
                )}
              >
                <List className="w-4 h-4" />
                <span>{isSeeker ? 'Appointments' : 'List'}</span>
                {bookings.length > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                    viewMode === 'list' ? "bg-brand-dark text-white" : "bg-brand-gold/20 text-brand-dark"
                  )}>
                    {bookings.length}
                  </span>
                )}
              </button>
              {!isSeeker && (
                <>
                  <button 
                    onClick={() => setViewMode('calendar')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      viewMode === 'calendar' ? "bg-brand-gold text-white shadow-md" : "text-brand-muted hover:bg-brand-gold/5"
                    )}
                  >
                    <Calendar className="w-4 h-4" />
                    Calendar
                  </button>
                  <button 
                    onClick={() => setViewMode('revenue')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      viewMode === 'revenue' ? "bg-brand-gold text-white shadow-md" : "text-brand-muted hover:bg-brand-gold/5"
                    )}
                  >
                    <DollarSign className="w-4 h-4" />
                    Revenue
                  </button>
                  <button 
                    onClick={() => setViewMode('services')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                      viewMode === 'services' ? "bg-brand-gold text-white shadow-md" : "text-brand-muted hover:bg-brand-gold/5"
                    )}
                  >
                    <Settings className="w-4 h-4" />
                    Services
                  </button>
                  {isEligibleForSpecialOffers && (
                    <button 
                      onClick={() => setViewMode('specialOffers')}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                        viewMode === 'specialOffers' ? "bg-brand-gold text-white shadow-md" : "text-brand-muted hover:bg-brand-gold/5"
                      )}
                      title="Publish special offers on specific dates to all existing customers"
                    >
                      <Sparkles className="w-4 h-4 text-brand-gold" />
                      Special Offers
                    </button>
                  )}
                  <button 
                    onClick={() => setViewMode('reviews')}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer",
                      viewMode === 'reviews' ? "bg-brand-gold text-white shadow-md" : "text-brand-muted hover:bg-brand-gold/5"
                    )}
                    title="Client star ratings and verified testimonials"
                  >
                    <Star className="w-4 h-4" />
                    <span>Reviews</span>
                    {providerReviews.length > 0 && (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-black",
                        viewMode === 'reviews' ? "bg-brand-dark text-white" : "bg-brand-gold/20 text-brand-dark"
                      )}>
                        {providerReviews.length}
                      </span>
                    )}
                  </button>
                </>
              )}
            </div>

            {onSwitchToClientView && (
              <button 
                onClick={onSwitchToClientView}
                className="flex items-center gap-2 px-4 py-2.5 bg-white text-brand-dark border border-brand-gold/30 rounded-xl hover:bg-brand-gold hover:text-white transition-all shadow-sm font-bold text-xs uppercase tracking-wider"
                title="Preview client reservation screen"
              >
                <Eye className="w-4 h-4 text-brand-gold" />
                Client View
              </button>
            )}
          </div>
        </div>

        {seedSuccessMessage && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-medium animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {seedSuccessMessage}
            </span>
            <button onClick={() => setSeedSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isCompletingProfile ? (
          <div className="max-w-md mx-auto bg-white p-8 rounded-[40px] border border-brand-gold/20 shadow-xl">
            <h3 className="text-3xl font-serif mb-6 text-center">Complete Your Profile</h3>
            <p className="text-brand-muted text-center mb-8">Tell us about your business to start managing your services.</p>
            
            <form onSubmit={handleCompleteProfile} className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">
                    Service Provider Name
                  </label>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold bg-brand-gold/15 px-2 py-0.5 rounded">
                    Official Name
                  </span>
                </div>
                <input
                  required
                  type="text"
                  placeholder="e.g., Apex Handyman Solutions, Luxury Glow Studio"
                  className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                />
                <p className="text-[11px] text-brand-muted">
                  This will be used as your uneditable Service Provider Name when creating services.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-muted">Service Category</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                  value={profileForm.category}
                  onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                >
                  {VISIBLE_SERVICE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="submit"
                className="w-full py-4 bg-brand-dark text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold transition-all shadow-lg"
              >
                Save & Continue
              </button>
            </form>
          </div>
        ) : viewMode === 'services' ? (
          <ServiceManager 
            onLogout={onLogout} 
            providerName={userProfile?.businessName || user?.businessName || user?.displayName || user?.name || ''} 
            providerCategory={userProfile?.category || user?.category}
            addTrigger={addServiceTrigger}
            user={user}
          />
        ) : viewMode === 'specialOffers' ? (
          <SpecialOffersPublisher 
            providerName={userProfile?.businessName || (userProfile?.category === 'Cloud Kitchen' ? 'Gourmet Cloud Kitchen' : 'Opal Luxury Salon & Spa')}
            providerCategory={userProfile?.category || 'Beauty'}
            providerId={user?.uid}
            bookings={bookings}
            isEmbeddedPlaceholder={false}
          />
        ) : viewMode === 'marketing' ? (
          <CloudKitchenMarketing businessName={userProfile?.businessName || ''} />
        ) : viewMode === 'revenue' ? (
          <div className="space-y-8">
            {/* Revenue Stats */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm">
                <p className="text-xs uppercase tracking-widest font-bold text-brand-muted mb-2">Today's Revenue</p>
                <p className="text-4xl font-serif text-brand-dark">${todayRevenue}</p>
                <p className="text-xs text-green-600 mt-2 font-medium">Collected from paid services</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm">
                <p className="text-xs uppercase tracking-widest font-bold text-brand-muted mb-2">Potential Revenue</p>
                <p className="text-4xl font-serif text-brand-dark">${potentialRevenue}</p>
                <p className="text-xs text-brand-muted mt-2 font-medium">Total value of today's bookings</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm">
                <p className="text-xs uppercase tracking-widest font-bold text-brand-muted mb-2">Today's Bookings</p>
                <p className="text-4xl font-serif text-brand-dark">{todayBookings.length}</p>
                <p className="text-xs text-brand-muted mt-2 font-medium">Appointments scheduled for today</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Weekly Revenue Chart */}
              <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-serif flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-gold" />
                    Weekly Revenue
                  </h3>
                  <span className="text-xs text-brand-muted uppercase tracking-widest font-bold">Last 7 Days</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F2ED" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8E9299', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8E9299', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1A1A1A', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#FFFFFF'
                        }}
                        itemStyle={{ color: '#D4AF37' }}
                        formatter={(value) => [`$${value}`, 'Revenue']}
                      />
                      <Bar 
                        dataKey="revenue" 
                        fill="#D4AF37" 
                        radius={[6, 6, 0, 0]} 
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Revenue Chart */}
              <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-serif flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-brand-gold" />
                    Monthly Revenue
                  </h3>
                  <span className="text-xs text-brand-muted uppercase tracking-widest font-bold">Last 6 Months</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F2ED" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8E9299', fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#8E9299', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1A1A1A', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#FFFFFF'
                        }}
                        itemStyle={{ color: '#D4AF37' }}
                        formatter={(value) => [`$${value}`, 'Revenue']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#D4AF37" 
                        strokeWidth={3}
                        dot={{ fill: '#D4AF37', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Service Distribution Chart */}
              <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm lg:col-span-2">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-serif flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-brand-gold" />
                    Revenue by Service
                  </h3>
                  <span className="text-xs text-brand-muted uppercase tracking-widest font-bold">Top 5 Services</span>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={serviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {serviceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Revenue']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {serviceData.map((service, index) => (
                      <div key={service.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{service.name}</span>
                        </div>
                        <span className="text-sm font-serif">${service.value}</span>
                      </div>
                    ))}
                    {serviceData.length === 0 && (
                      <p className="text-brand-muted italic text-center">No revenue data available yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Insights Section */}
            <div className="bg-white p-8 rounded-3xl border border-brand-gold/10 shadow-sm lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-serif flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-gold" />
                  Customer Insights
                </h3>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Revenue by Customer */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-brand-muted">Revenue by Customer</h4>
                    <span className="text-[10px] text-brand-muted uppercase tracking-widest font-bold">Top 5 Customers</span>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={seekerRevenueData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {seekerRevenueData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => [`$${value}`, 'Revenue']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-2">
                    {seekerRevenueData.map((seeker, index) => (
                      <div key={seeker.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-2 h-2 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{seeker.name}</span>
                        </div>
                        <span className="font-serif">${seeker.value}</span>
                      </div>
                    ))}
                    {seekerRevenueData.length === 0 && (
                      <p className="text-xs text-brand-muted italic text-center">No customer data yet.</p>
                    )}
                  </div>
                </div>

                {/* Frequent Customers */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-brand-muted">Frequent Customers</h4>
                    <div className="flex gap-1 bg-brand-cream/50 p-1 rounded-lg">
                      {(['month', 'quarter', 'halfYear', 'year'] as const).map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setFrequentTimeframe(tf)}
                          className={cn(
                            "px-2 py-1 text-[8px] font-bold uppercase tracking-widest rounded-md transition-all",
                            frequentTimeframe === tf 
                              ? "bg-brand-gold text-white shadow-sm" 
                              : "text-brand-muted hover:text-brand-dark"
                          )}
                        >
                          {tf === 'halfYear' ? '6M' : tf === 'quarter' ? '3M' : tf === 'month' ? '1M' : '1Y'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentFrequentSeekers.map((seeker, index) => (
                      <div key={seeker.name} className="flex items-center justify-between p-3 bg-brand-cream/20 rounded-xl border border-brand-gold/5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold font-serif text-xs">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{seeker.name}</p>
                            <p className="text-[10px] text-brand-muted uppercase tracking-widest">{seeker.count} Bookings</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-serif text-brand-gold">${seeker.revenue}</p>
                          <p className="text-[10px] text-brand-muted uppercase tracking-widest">Revenue</p>
                        </div>
                      </div>
                    ))}
                    {currentFrequentSeekers.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-xs text-brand-muted italic">No data for this period.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Individual Payments */}
            <div className="bg-white rounded-3xl border border-brand-gold/10 shadow-sm overflow-hidden">
              <div className="p-8 border-b border-brand-gold/5">
                <h3 className="text-2xl font-serif">Individual Payments</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-brand-cream/30 text-xs uppercase tracking-widest font-bold text-brand-muted">
                      <th className="px-8 py-4">Customer</th>
                      <th className="px-8 py-4">Service</th>
                      <th className="px-8 py-4">Price</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-gold/5">
                    {displayBookings.map((booking: any) => (
                      <tr key={booking.bookingIds.join('-')} className="hover:bg-brand-cream/10 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-medium">{booking.customerName}</p>
                          <p className="text-xs text-brand-muted">{booking.customerEmail}</p>
                          <p className="text-xs text-brand-muted">{booking.customerPhone}</p>
                        </td>
                        <td className="px-8 py-6">
                          <p className="font-medium">{booking.serviceNames.join(', ')}</p>
                          <p className="text-xs text-brand-muted">{booking.date} at {booking.time}</p>
                        </td>
                        <td className="px-8 py-6 font-serif text-lg">${booking.totalPrice}</td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-center",
                              booking.status === 'pending' ? "bg-yellow-100 text-yellow-700" : 
                              booking.status === 'cancelled' ? "bg-gray-100 text-gray-700" :
                              "bg-green-100 text-green-700"
                            )}>
                              {booking.status}
                            </span>
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-center",
                              booking.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {booking.paymentStatus} {booking.paymentMethod && `(${booking.paymentMethod})`}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-2">
                            {booking.paymentStatus === 'unpaid' && !isSeeker && booking.status !== 'cancelled' && (
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => updateBookingStatus(booking.bookingIds, { paymentStatus: 'paid', paymentMethod: 'Cash' })}
                                  className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold transition-colors"
                                >
                                  <DollarSign className="w-3 h-3" />
                                  Paid (Cash)
                                </button>
                                <button
                                  onClick={() => updateBookingStatus(booking.bookingIds, { paymentStatus: 'paid', paymentMethod: 'Zelle' })}
                                  className="flex items-center justify-center gap-2 px-4 py-2 border border-brand-gold text-brand-gold rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-colors"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  Paid (Zelle)
                                </button>
                              </div>
                            )}
                            {booking.status === 'pending' && booking.paymentStatus === 'unpaid' && (
                              <button
                                onClick={() => updateBookingStatus(booking.bookingIds, { status: 'cancelled' })}
                                className="flex items-center justify-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView bookings={bookings} onUpdateStatus={(id, status) => updateBookingStatus(id, { status })} onLogout={onLogout} />
        ) : viewMode === 'orderHistory' ? (
          <OrderHistoryView
            user={user}
            userProfile={userProfile}
            orders={orders}
            bookings={bookings}
            isLoading={isLoading || isOrdersLoading}
            onOpenTracking={onOpenTracking}
            onSwitchToClientView={onSwitchToClientView}
            onSeedSampleOrders={handleSeedSampleOrders}
            isSeedingOrders={isSeedingOrders}
          />
        ) : viewMode === 'reviews' ? (
          <div className="space-y-8 animate-fadeIn">
            {/* Reviews Overview Header */}
            <div className="bg-gradient-to-r from-stone-900 via-[#181716] to-stone-900 text-white p-8 rounded-3xl border border-brand-gold/30 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 mb-6 border-b border-brand-gold/15">
                <div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold text-brand-dark inline-block mb-2">
                    Client Reputation & Trust
                  </span>
                  <h3 className="text-3xl font-serif text-white">Client Star Ratings & Feedback</h3>
                  <p className="text-xs text-brand-cream/70 mt-1 max-w-xl">
                    Real verified customer testimonials and star scores left by clients after completed appointments and delivery orders.
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-black/40 px-6 py-4 rounded-2xl border border-brand-gold/20">
                  <div className="text-center">
                    <span className="text-4xl font-serif text-brand-gold font-bold block">{averageRating}</span>
                    <StarRating rating={averageRating} size="sm" className="mt-1" />
                  </div>
                  <div className="border-l border-white/10 pl-4 text-xs">
                    <p className="font-bold text-white">{providerReviews.length} Verified Reviews</p>
                    <p className="text-emerald-400 font-medium text-[11px] mt-0.5">
                      {providerReviews.length > 0 
                        ? `${Math.round((providerReviews.filter(r => r.recommend !== false).length / providerReviews.length) * 100)}% Recommend`
                        : '100% Positive Reputation'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Star Rating Distribution */}
              <div className="grid grid-cols-5 gap-3 pt-2">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = providerReviews.filter(r => Math.round(r.rating) === stars).length;
                  const pct = providerReviews.length > 0 ? (count / providerReviews.length) * 100 : (stars === 5 ? 100 : 0);
                  return (
                    <div key={stars} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-brand-gold flex items-center gap-1">
                          {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        </span>
                        <span className="text-white/60 text-[10px]">{count}</span>
                      </div>
                      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-brand-gold h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews List */}
            {providerReviews.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-brand-gold/30 p-8 shadow-sm">
                <Star className="w-12 h-12 text-brand-gold/40 mx-auto mb-4" />
                <h4 className="text-2xl font-serif mb-2">No Customer Reviews Yet</h4>
                <p className="text-brand-muted text-sm max-w-md mx-auto mb-6">
                  Reviews are collected automatically when customers rate your completed services in their Order History view. Customers can also leave compliments, recommendations, and feedback notes.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {providerReviews.map((rev) => (
                  <motion.div
                    key={rev.id || `${rev.referenceId}-${rev.customerName}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-3xl border border-brand-gold/20 shadow-md flex flex-col justify-between space-y-4 hover:border-brand-gold/40 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-brand-gold/15">
                        <div>
                          <p className="font-serif font-bold text-base text-brand-dark">{rev.title || 'Client Feedback'}</p>
                          <p className="text-[11px] text-brand-muted mt-0.5">
                            For <strong className="text-brand-dark">{rev.itemTitle}</strong> (Ref: {rev.referenceId})
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <StarRating rating={rev.rating} size="sm" />
                          <span className="font-mono font-bold text-xs text-brand-dark">{rev.rating}.0</span>
                        </div>
                      </div>

                      <p className="text-xs text-brand-dark/90 leading-relaxed font-serif italic">
                        "{rev.comment}"
                      </p>

                      {rev.tags && rev.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {rev.tags.map((t: string) => (
                            <span key={t} className="text-[10px] font-medium px-2.5 py-0.5 bg-brand-cream/60 rounded-lg border border-brand-gold/20 text-brand-dark">
                              ✓ {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-brand-gold/15 flex items-center justify-between text-xs text-brand-muted">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-dark">{rev.customerName}</span>
                        {rev.verified && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Verified
                          </span>
                        )}
                      </div>
                      {rev.recommend && (
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3 text-emerald-600" /> Recommends
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {!isSeeker && isEligibleForSpecialOffers && (
              <SpecialOffersPublisher 
                providerName={userProfile?.businessName || (userProfile?.category === 'Cloud Kitchen' ? 'Gourmet Cloud Kitchen' : 'Opal Luxury Salon & Spa')}
                providerCategory={userProfile?.category || 'Beauty'}
                providerId={user?.uid}
                bookings={bookings}
                isEmbeddedPlaceholder={true}
                onOpenFullView={() => setViewMode('specialOffers')}
              />
            )}

            {bookings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-brand-gold/30 p-8 shadow-sm">
            <Calendar className="w-12 h-12 text-brand-gold/40 mx-auto mb-4" />
            <h4 className="text-2xl font-serif mb-2">No Appointments Scheduled Yet</h4>
            <p className="text-brand-muted text-sm max-w-md mx-auto mb-6">
              You currently have 0 appointments under this filter. You can seed sample {userProfile?.category || 'provider'} appointments to immediately test calendar schedules, booking counts, and payment tracking, or create your own services.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={handleSeedSampleBookings}
                disabled={isSeedingBookings}
                className="px-6 py-3.5 bg-brand-gold text-brand-dark rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-brand-dark hover:text-white transition-all shadow-md flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                {isSeedingBookings ? 'Adding Sample Bookings...' : `+ Seed Sample ${userProfile?.category || 'Provider'} Appointments`}
              </button>
              <button
                onClick={() => {
                  setViewMode('services');
                  setAddServiceTrigger(prev => prev + 1);
                }}
                className="px-6 py-3.5 bg-brand-dark text-white rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add / Manage Services
              </button>
              {onSwitchToClientView && (
                <button
                  onClick={onSwitchToClientView}
                  className="px-6 py-3.5 bg-white border border-brand-gold/30 text-brand-dark rounded-xl font-bold uppercase tracking-wider text-xs hover:bg-brand-cream transition-all shadow-sm flex items-center gap-2"
                >
                  <Eye className="w-4 h-4 text-brand-gold" />
                  Preview Client Booking Screen
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Service Dropdown - visible ONLY if the provider has more than one service, else completely removed */}
            {distinctServices.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-brand-gold/20 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                    Appointments: <span className="text-brand-gold font-serif text-sm font-bold">{filteredDisplayBookings.length}</span>
                  </span>
                  {selectedServiceFilter !== 'ALL' && (
                    <span className="text-[11px] font-medium text-brand-muted bg-brand-cream/60 px-2.5 py-0.5 rounded-full border border-brand-gold/15">
                      Filtered by: <strong className="text-brand-dark">{selectedServiceFilter}</strong>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <label htmlFor="provider-service-dropdown" className="text-xs font-bold uppercase tracking-wider text-brand-muted shrink-0">
                    Filter by Service:
                  </label>
                  <div className="relative">
                    <select
                      id="provider-service-dropdown"
                      value={selectedServiceFilter}
                      onChange={(e) => setSelectedServiceFilter(e.target.value)}
                      className="appearance-none pl-3.5 pr-9 py-2 bg-brand-cream/40 hover:bg-brand-cream focus:bg-white border border-brand-gold/30 focus:border-brand-gold rounded-xl text-xs font-bold text-brand-dark outline-none cursor-pointer transition-all shadow-xs"
                    >
                      <option value="ALL">All Services ({distinctServices.length})</option>
                      {distinctServices.map((srvName) => (
                        <option key={srvName} value={srvName}>
                          {srvName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-brand-gold absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6">
              {filteredDisplayBookings.map((booking: any) => (
              <motion.div
                key={booking.bookingIds.join('-')}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-brand-gold/10 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Client</p>
                      <p className="font-medium">{booking.customerName}</p>
                      <p className="text-xs text-brand-muted flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3" /> {booking.customerEmail}
                      </p>
                      <p className="text-xs text-brand-muted flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {booking.customerPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Services</p>
                      <p className="font-medium">{booking.serviceNames.join(', ')}</p>
                      <p className="text-xs text-brand-muted mt-1 font-serif">${booking.totalPrice}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Date</p>
                      <p className="font-medium">{booking.date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div>
                      <p className="text-xs text-brand-muted uppercase tracking-wider font-bold mb-1">Time</p>
                      <p className="font-medium">{booking.time}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      booking.status === 'pending' ? "bg-yellow-100 text-yellow-700" : 
                      booking.status === 'cancelled' ? "bg-gray-100 text-gray-700" :
                      "bg-green-100 text-green-700"
                    )}>
                      {booking.status}
                    </span>
                    <span className={cn(
                      "px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                      booking.paymentStatus === 'paid' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {booking.paymentStatus} {booking.paymentMethod && `(${booking.paymentMethod})`}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {booking.status === 'pending' && !isSeeker && (
                      <button
                        onClick={() => updateBookingStatus(booking.bookingIds, { status: 'done' })}
                        className="px-4 py-2 bg-brand-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold transition-colors"
                      >
                        Mark Done
                      </button>
                    )}
                    {booking.paymentStatus === 'unpaid' && !isSeeker && booking.status !== 'cancelled' && (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => updateBookingStatus(booking.bookingIds, { paymentStatus: 'paid', paymentMethod: 'Cash' })}
                          className="px-4 py-2 bg-brand-dark text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold transition-colors flex items-center justify-center gap-2"
                        >
                          <DollarSign className="w-3 h-3" />
                          Paid (Cash)
                        </button>
                        <button
                          onClick={() => updateBookingStatus(booking.bookingIds, { paymentStatus: 'paid', paymentMethod: 'Zelle' })}
                          className="px-4 py-2 border border-brand-gold text-brand-gold rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          <CreditCard className="w-3 h-3" />
                          Paid (Zelle)
                        </button>
                      </div>
                    )}
                    {booking.status === 'pending' && booking.paymentStatus === 'unpaid' && (
                      <button
                        onClick={() => updateBookingStatus(booking.bookingIds, { status: 'cancelled' })}
                        className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                      >
                        <X className="w-3 h-3" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
    )}

    {/* Provider Business Setup / Profile Edit Modal */}
    {isCompletingProfile && (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-brand-gold/30"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-serif text-brand-dark">Service Provider Profile</h3>
              <p className="text-xs text-brand-muted mt-1">
                Configure your verified business name and primary service category.
              </p>
            </div>
            <button 
              type="button" 
              onClick={() => setIsCompletingProfile(false)}
              className="p-2 hover:bg-brand-cream rounded-full text-brand-muted hover:text-brand-dark transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCompleteProfile} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block">
                Service Provider Company / Business Name
              </label>
              <input 
                type="text"
                required
                value={profileForm.businessName}
                onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
                placeholder="e.g. Apex Handyman Solutions, Luxury Glow Studio"
                className="w-full px-4 py-3 bg-brand-cream rounded-xl border border-brand-gold/20 text-brand-dark text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
              />
              <p className="text-[11px] text-brand-muted mt-1.5">
                This official name identifies your business to clients on all service listings, provider directory cards, and booking receipts.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-muted mb-1.5 block">
                Primary Service Category
              </label>
              <select
                value={profileForm.category}
                onChange={(e) => setProfileForm({ ...profileForm, category: e.target.value })}
                className="w-full px-4 py-3 bg-brand-cream rounded-xl border border-brand-gold/20 text-brand-dark text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-gold transition-all"
              >
                {VISIBLE_SERVICE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCompletingProfile(false)}
                className="px-5 py-2.5 rounded-xl border border-brand-gold/30 text-brand-dark text-xs font-bold uppercase tracking-wider hover:bg-brand-cream transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!profileForm.businessName.trim()}
                className="px-6 py-2.5 bg-brand-gold text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-colors shadow-md disabled:opacity-50"
              >
                Save Business Profile
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
  </div>
</div>
  );
};
