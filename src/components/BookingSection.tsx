import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import { Service, SpecialOffer, ProductArticle, ProductArticleColor, SelectedProductArticle, CarrierShippingOption, ShipmentTrackingRecord, TaxInvoiceData } from '../types';
import { ArticleAvailabilityModal } from './ArticleAvailabilityModal';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { downloadPdfInvoice } from '../utils/pdfInvoiceGenerator';
import { cn } from '../utils';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  CheckCircle2, 
  Star, 
  ChevronRight, 
  Phone, 
  Settings, 
  Sparkles,
  MapPin,
  Crosshair,
  ChevronDown,
  Navigation,
  Search,
  X,
  Smartphone,
  MessageSquare,
  Send,
  Check,
  ShoppingBag,
  Tag,
  Truck,
  Package,
  Plus,
  Minus,
  Trash2,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Barcode,
  Copy,
  Briefcase
} from 'lucide-react';
import { VISIBLE_SERVICE_CATEGORIES, SHOP_DEPARTMENTS, DEPARTMENT_ITEMS } from '../constants';
import { 
  UserLocation, 
  PRESET_LOCATIONS, 
  DEFAULT_USER_LOCATION, 
  calculateDistanceMiles,
  findNearestMetro,
  searchLocation
} from '../utils/distance';

import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { format, addMinutes, parse, isBefore, isAfter, startOfDay, endOfDay, parseISO } from 'date-fns';

interface BookingSectionProps {
  user: any;
  isAdmin?: boolean;
  onSwitchToDashboard?: () => void;
  onOpenTracking?: (trackingId?: string) => void;
  initialPillar?: 'services' | 'department' | 'talent';
  initialTalentModule?: string;
  onOpenLogin?: (preselectedRole?: 'talent' | 'talent_seeker') => void;
  onFastLogin?: (role: 'talent' | 'talent_seeker', email?: string) => void;
  onSwitchView?: (view: string) => void;
}

/**
 * Helper to compute distance for a service in miles from the current active user location.
 */
function computeServiceDistance(service: Service, currentLoc: UserLocation): number {
  if (service.location?.lat != null && service.location?.lng != null) {
    return calculateDistanceMiles(currentLoc.lat, currentLoc.lng, service.location.lat, service.location.lng);
  }
  if (typeof service.relativeDistanceMiles === 'number') {
    return service.relativeDistanceMiles;
  }
  if (typeof service.distance === 'number') {
    return service.distance;
  }
  // Deterministic distance for custom provider services without explicit coordinates (between 1.5 and 22 miles)
  let hash = 0;
  const str = service.providerName || service.name || service.id;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const simulated = 1.5 + (absHash % 200) / 10;
  return Math.round(simulated * 10) / 10;
}

export const BookingSection: React.FC<BookingSectionProps> = ({ 
  user, 
  isAdmin = false, 
  onSwitchToDashboard,
  onOpenTracking,
  initialPillar,
  initialTalentModule,
  onOpenLogin,
  onFastLogin,
  onSwitchView
}) => {
  const [firestoreServices, setFirestoreServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [browseMode, setBrowseMode] = useState<'services' | 'providers'>('services');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastConfirmedBookingId, setLastConfirmedBookingId] = useState<string>('');
  const [lastConfirmedOrderId, setLastConfirmedOrderId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: ''
  });

  // SMS Text Message Notification State
  const [sentSmsDetails, setSentSmsDetails] = useState<any>(null);
  const [showSmsToast, setShowSmsToast] = useState(false);
  const [showPhoneSimulator, setShowPhoneSimulator] = useState(false);
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);

  // "Near Me" Geolocation State
  const [userLocation, setUserLocation] = useState<UserLocation>(DEFAULT_USER_LOCATION);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);
  const [citySearchQuery, setCitySearchQuery] = useState('');

  // Multi-tier location detection function:
  // 1. Tries Browser GPS (navigator.geolocation)
  // 2. If blocked by iframe sandbox or denied, falls back to IP Geolocation via backend (/api/detect-location)
  // 3. If backend network fails, falls back to client direct IP lookup
  // 4. Resolves nearest named metro city so user gets a real city name
  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    setLocationStatusMessage("Detecting your location via GPS/network...");

    let detectedLocation: UserLocation | null = null;

    // Tier 1: Browser GPS
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 4500,
            enableHighAccuracy: true,
            maximumAge: 60000
          });
        });

        if (position && position.coords) {
          const { latitude, longitude } = position.coords;
          const nearest = findNearestMetro(latitude, longitude);
          detectedLocation = {
            lat: latitude,
            lng: longitude,
            city: nearest.city,
            state: nearest.state,
            isCustom: true
          };
          setLocationStatusMessage(`📍 Located via device GPS in ${nearest.city}${nearest.state ? `, ${nearest.state}` : ''}!`);
        }
      } catch (gpsError: any) {
        console.warn("Browser GPS unavailable or blocked by iframe permissions policy, trying IP geolocation:", gpsError.message);
      }
    }

    // Tier 2: IP-based Geolocation via backend proxy
    if (!detectedLocation) {
      try {
        const res = await fetch("/api/detect-location");
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.lat === "number" && typeof data.lng === "number") {
            const nearest = findNearestMetro(data.lat, data.lng);
            const cityName = data.city && data.city !== "San Francisco" && data.source === "ip"
              ? data.city
              : nearest.city;
            const stateName = data.state || nearest.state;

            detectedLocation = {
              lat: data.lat,
              lng: data.lng,
              city: cityName,
              state: stateName,
              zip: data.zip,
              isCustom: true
            };
            setLocationStatusMessage(`📍 Located via Network: ${cityName}${stateName ? `, ${stateName}` : ''}!`);
          }
        }
      } catch (err) {
        console.warn("Backend IP detection error:", err);
      }
    }

    // Tier 3: Client direct IP lookup fallback
    if (!detectedLocation) {
      try {
        const res = await fetch("https://freeipapi.com/api/json");
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
            const nearest = findNearestMetro(data.latitude, data.longitude);
            const cityName = data.cityName || nearest.city;
            const region = data.regionName || nearest.state;
            detectedLocation = {
              lat: data.latitude,
              lng: data.longitude,
              city: cityName,
              state: region,
              isCustom: true
            };
            setLocationStatusMessage(`📍 Located: ${cityName}${region ? `, ${region}` : ''}!`);
          }
        }
      } catch (err) {
        console.warn("Client fallback IP detection error:", err);
      }
    }

    // Finalize
    if (detectedLocation) {
      setUserLocation(detectedLocation);
    } else {
      setUserLocation(DEFAULT_USER_LOCATION);
      setLocationStatusMessage("📍 Defaulted to San Francisco, CA. You can switch city or search below.");
    }

    setIsDetectingLocation(false);
    setTimeout(() => setLocationStatusMessage(null), 4500);
  };

  // Attempt detection once on initial load (non-intrusive)
  useEffect(() => {
    let isMounted = true;
    const runInitialDetection = async () => {
      if (typeof window === 'undefined') return;
      try {
        const res = await fetch("/api/detect-location");
        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && typeof data.lat === "number" && typeof data.lng === "number" && data.source === "ip") {
            const nearest = findNearestMetro(data.lat, data.lng);
            setUserLocation({
              lat: data.lat,
              lng: data.lng,
              city: data.city || nearest.city,
              state: data.state || nearest.state,
              zip: data.zip,
              isCustom: true
            });
          }
        }
      } catch (e) {
        // Silent fallback
      }
    };

    runInitialDetection();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const servicesRef = collection(db, 'services');
    const unsubscribe = onSnapshot(servicesRef, (snapshot) => {
      const servicesData = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          price: typeof d.price === 'number' && !Number.isNaN(d.price) ? d.price : (parseFloat(String(d.price)) || 0),
          providerRating: typeof d.providerRating === 'number' && !Number.isNaN(d.providerRating) ? d.providerRating : 5
        };
      }) as Service[];
      setFirestoreServices(servicesData);
    }, (error) => {
      console.error("Fetch services error:", error);
    });

    return () => unsubscribe();
  }, []);

  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  useEffect(() => {
    const offersRef = collection(db, 'special_offers');
    const unsub = onSnapshot(offersRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SpecialOffer[];
      setSpecialOffers(list.filter(o => o.status === 'active'));
    }, (err) => {
      console.warn("Special offers subscription notice:", err);
    });
    return () => unsub();
  }, []);

  const [firestoreProducts, setFirestoreProducts] = useState<ProductArticle[]>([]);
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const unsub = onSnapshot(productsRef, (snap) => {
      const list: ProductArticle[] = [];
      snap.forEach(docSnap => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          name: d.name || '',
          description: d.description || '',
          price: typeof d.price === 'number' && !Number.isNaN(d.price) ? d.price : (parseFloat(String(d.price)) || 0),
          originalPrice: d.originalPrice ? (typeof d.originalPrice === 'number' ? d.originalPrice : parseFloat(String(d.originalPrice))) : undefined,
          department: d.department || 'Clothing',
          brand: d.brand || d.sellerCompanyName || 'Exclusive Retailer',
          image: d.image || '',
          rating: typeof d.rating === 'number' ? d.rating : 5,
          reviewsCount: typeof d.reviewsCount === 'number' ? d.reviewsCount : 1,
          sizes: Array.isArray(d.sizes) && d.sizes.length > 0 ? d.sizes : ['Standard'],
          colors: Array.isArray(d.colors) && d.colors.length > 0 ? d.colors : [{ name: 'Standard', hex: '#000000' }],
          inStock: d.inStock !== false,
          stockCount: typeof d.stockCount === 'number' ? d.stockCount : 10,
          sku: d.sku || `SKU-${docSnap.id.substring(0, 6).toUpperCase()}`,
          tags: d.tags || ['Brand New', d.department],
          sellerUid: d.sellerUid,
          sellerEmail: d.sellerEmail,
          sellerCompanyName: d.sellerCompanyName || d.brand,
          sellerAddress: d.sellerAddress || (d.brand === 'Milano Sartoriale' ? '450 N Rodeo Dr, Beverly Hills, CA 90210' : undefined),
          createdAt: d.createdAt
        });
      });
      setFirestoreProducts(list);
    }, (err) => {
      console.warn("Firestore products subscription notice:", err);
    });
    return () => unsub();
  }, []);

  const prevUserRef = useRef<any>(user);

  useEffect(() => {
    const wasLoggedIn = Boolean(prevUserRef.current);
    const isNowLoggedOff = !user;

    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || user.name || user.companyName || user.businessName || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone
      }));
    } else if (wasLoggedIn && isNowLoggedOff) {
      // User is logged off -> Explicitly clear all Boutique Bag & Checkout field values and cart
      setFormData({
        name: '',
        email: '',
        phone: '',
        date: '',
        time: ''
      });
      setSelectedProducts([]);
      setProductSelections({});
      setShippingAddress('');
      setFulfillmentType('delivery');
      setSelectedCarrierId('fedex_2day');
      setActiveShipmentRecord(null);
      setShowTrackingModal(false);
      setTrackingLookupRecord(null);
      setTrackingLookupError(null);
      setSelectedServices([]);
      setIsSubmitted(false);
      setSentSmsDetails(null);
      setShowSmsToast(false);
      setShowPhoneSimulator(false);
      setError(null);
    }

    prevUserRef.current = user;
  }, [user]);

  const [error, setError] = useState<string | null>(null);

  // Check if current user is a logged-in service provider
  const isProviderLoggedIn = isAdmin || user?.role === 'provider' || user?.email === 'rakesh2xplore@gmail.com';

  const isMyService = (s: Service) => {
    if (!user) return false;
    if (s.providerId && s.providerId === user.uid) return true;
    if (s.providerId && user.email && s.providerId.toLowerCase() === user.email.toLowerCase()) return true;
    const bName = user.businessName || user.displayName || user.name;
    if (bName && s.providerName && s.providerName.trim().toLowerCase() === bName.trim().toLowerCase()) return true;
    return false;
  };

  // Strictly display live services from Firestore database created by providers
  const allCatalogServices = useMemo(() => {
    return firestoreServices;
  }, [firestoreServices]);

  // If a service provider is logged in, show ONLY his/her services matching their registered business category; otherwise show all platform services
  const userServices = useMemo(() => {
    if (!isProviderLoggedIn) return allCatalogServices;
    const providerCat = user?.category;
    return allCatalogServices.filter(s => {
      if (!isMyService(s)) return false;
      // Strict category relevance: Handyman provider view only has Handyman services, Beauty only Beauty, etc.
      if (providerCat) {
        if (providerCat === 'Beauty') {
          return s.category === 'Beauty' || (s.category as string) === 'Beauty & Wellness';
        }
        return s.category === providerCat;
      }
      return true;
    });
  }, [isProviderLoggedIn, allCatalogServices, user]);

  // Augment each service with distance calculated from current user location
  const servicesWithDistance = useMemo(() => {
    return userServices.map(s => {
      const dist = computeServiceDistance(s, userLocation);
      return {
        ...s,
        distance: dist
      };
    });
  }, [userServices, userLocation]);

  // Implement "near me" logic:
  // 1. Only nearby (<= 50 miles) service providers / services
  // 2. Order of nearest comes first (ascending distance)
  const nearbyServices = useMemo(() => {
    return servicesWithDistance
      .filter(s => (s.distance ?? 999) <= 50)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }, [servicesWithDistance]);

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (isProviderLoggedIn && user?.category) {
      return user.category;
    }
    return 'SELECT';
  });

  // When a service provider logs in or updates category, default selectedCategory to their category
  useEffect(() => {
    if (isProviderLoggedIn && user?.category && (selectedCategory === 'SELECT' || selectedCategory !== user.category)) {
      setSelectedCategory(user.category);
      setSelectedDepartment('SELECT');
    }
  }, [isProviderLoggedIn, user?.category]);

  const [selectedDepartment, setSelectedDepartment] = useState<string>('SELECT');
  // Sync pillar navigation if initialPillar changes externally
  useEffect(() => {
    if (initialPillar === 'services') {
      setSelectedCategory(prev => prev !== 'SELECT' ? prev : 'Beauty');
      setSelectedDepartment('SELECT');
      setSelectedProducts([]);
    } else if (initialPillar === 'department') {
      setSelectedDepartment(prev => prev !== 'SELECT' ? prev : 'Clothing');
      setSelectedCategory('SELECT');
      setSelectedProvider(null);
      setSelectedServices([]);
    }
  }, [initialPillar]);

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Brand new products / articles state for Shop by Department
  const [selectedProducts, setSelectedProducts] = useState<SelectedProductArticle[]>([]);
  const [productSelections, setProductSelections] = useState<Record<string, { size: string; color: ProductArticleColor }>>({});
  const [fulfillmentType, setFulfillmentType] = useState<'delivery' | 'pickup'>('delivery');
  const [shippingAddress, setShippingAddress] = useState('');

  // Real Carrier Shipping Services & Live Rates State
  const [carrierOptions, setCarrierOptions] = useState<CarrierShippingOption[]>([
    {
      carrierId: 'fedex_2day',
      carrierName: 'FedEx',
      serviceName: 'FedEx 2Day® Express',
      rate: 19.95,
      transitDays: 2,
      estimatedDeliveryDate: '2-Day Express Guaranteed',
      deliveryGuarantee: '2 Business Days to US Residences',
      carrierLogoText: 'FedEx 2Day',
      trackingNumberFormat: '7946 0000 0000'
    },
    {
      carrierId: 'usps_priority_express',
      carrierName: 'USPS',
      serviceName: 'Priority Mail Express®',
      rate: 21.50,
      transitDays: 1,
      estimatedDeliveryDate: 'Next-Day to 2-Day Guaranteed',
      deliveryGuarantee: 'Next-Day to 2-Day Money-Back Guarantee',
      carrierLogoText: 'USPS Express',
      trackingNumberFormat: '9400 1000 0000 0000 0000 00'
    },
    {
      carrierId: 'ups_2nd_day_air',
      carrierName: 'UPS',
      serviceName: 'UPS 2nd Day Air®',
      rate: 20.75,
      transitDays: 2,
      estimatedDeliveryDate: 'Guaranteed 2nd Business Day',
      deliveryGuarantee: 'Guaranteed 2nd Business Day',
      carrierLogoText: 'UPS Air',
      trackingNumberFormat: '1Z 999 999 02 0000 000 0'
    },
    {
      carrierId: 'standard_ground',
      carrierName: 'Standard',
      serviceName: 'Complimentary Ground Delivery',
      rate: 0.00,
      transitDays: 4,
      estimatedDeliveryDate: '3-5 Business Days',
      deliveryGuarantee: '3-5 Business Days',
      carrierLogoText: 'Standard Ground',
      trackingNumberFormat: 'OPAL-GRN-0000'
    }
  ]);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string>('fedex_2day');
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(false);
  const [activeShipmentRecord, setActiveShipmentRecord] = useState<ShipmentTrackingRecord | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState<boolean>(false);
  const [trackingLookupNumber, setTrackingLookupNumber] = useState<string>('');
  const [trackingLookupRecord, setTrackingLookupRecord] = useState<ShipmentTrackingRecord | null>(null);
  const [isSearchingTracking, setIsSearchingTracking] = useState<boolean>(false);
  const [trackingLookupError, setTrackingLookupError] = useState<string | null>(null);
  const [hasCopiedTracking, setHasCopiedTracking] = useState<boolean>(false);
  const [confirmedPickupDetails, setConfirmedPickupDetails] = useState<{ showroomName: string; address: string; hours: string } | null>(null);

  // Home / Store Visit Appointment Modal state
  const [selectedArticleForVisit, setSelectedArticleForVisit] = useState<ProductArticle | null>(null);
  const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState<boolean>(false);

  // Commercial Tax & Invoicing Modal state (for buyers only)
  const [confirmedTaxInvoice, setConfirmedTaxInvoice] = useState<TaxInvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  const handleCopyTracking = (trkNum: string) => {
    try {
      navigator.clipboard?.writeText(trkNum.replace(/\s/g, ''));
      setHasCopiedTracking(true);
      setTimeout(() => setHasCopiedTracking(false), 2000);
    } catch (e) {
      console.warn("Clipboard write notice:", e);
    }
  };

  // Fetch real-time carrier rates whenever location or cart items change
  useEffect(() => {
    let isSubscribed = true;
    const fetchLiveRates = async () => {
      try {
        setIsLoadingRates(true);
        const totalCount = selectedProducts.reduce((sum, item) => sum + item.quantity, 0);
        const res = await fetch('/api/shipping/rates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            destinationCity: userLocation.city,
            destinationState: userLocation.state,
            destinationZip: userLocation.zip,
            itemsCount: Math.max(1, totalCount)
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (isSubscribed && Array.isArray(data.rates) && data.rates.length > 0) {
            setCarrierOptions(data.rates);
          }
        }
      } catch (e) {
        console.warn("Carrier shipping rates fetch note:", e);
      } finally {
        if (isSubscribed) setIsLoadingRates(false);
      }
    };

    fetchLiveRates();
    return () => { isSubscribed = false; };
  }, [userLocation.city, userLocation.state, userLocation.zip, selectedProducts.length]);

  const selectedCarrier = useMemo(() => {
    return carrierOptions.find(c => c.carrierId === selectedCarrierId) || carrierOptions[0];
  }, [carrierOptions, selectedCarrierId]);

  const shippingCost = useMemo(() => {
    if (fulfillmentType !== 'delivery') return 0;
    return selectedCarrier?.rate ?? 0;
  }, [fulfillmentType, selectedCarrier]);

  // Derive verified physical Boutique Showroom Address from seller articles in customer's bag
  const pickupLocationInfo = useMemo(() => {
    // 1. Check if any selected article has an explicit seller showroom address
    const itemWithAddress = selectedProducts.find(
      p => p.article?.sellerAddress || (p as any).product?.sellerAddress
    );
    const sellerAddress = itemWithAddress?.article?.sellerAddress || (itemWithAddress as any)?.product?.sellerAddress;

    // 2. Identify brand or company name
    const itemWithSeller = selectedProducts.find(
      p => p.article?.sellerCompanyName || p.article?.brand || (p as any).product?.sellerCompanyName || (p as any).product?.brand
    );
    const brandName = itemWithSeller?.article?.sellerCompanyName || 
      itemWithSeller?.article?.brand || 
      (itemWithSeller as any)?.product?.sellerCompanyName || 
      (itemWithSeller as any)?.product?.brand || 
      'Milano Sartoriale';

    const defaultAddress = '450 N Rodeo Dr, Beverly Hills, CA 90210';
    const fallbackCity = userLocation.city || 'Beverly Hills';
    const resolvedAddress = sellerAddress || (userLocation.isCustom ? `${userLocation.city} Luxury District Showroom, ${userLocation.state || 'Metro'}` : defaultAddress);
    const showroomName = brandName ? `${brandName} Flagship Showroom` : `Opal Partner Boutique (${fallbackCity})`;

    return {
      showroomName,
      address: resolvedAddress,
      city: fallbackCity,
      hours: 'Mon – Sun: 10:00 AM – 8:00 PM',
      isCustomSellerAddress: Boolean(sellerAddress)
    };
  }, [selectedProducts, userLocation.city, userLocation.state, userLocation.isCustom]);

  const handleQueryTrackingNumber = async (trkNum?: string) => {
    const numToSearch = (trkNum || trackingLookupNumber).trim();
    if (!numToSearch) return;
    setIsSearchingTracking(true);
    setTrackingLookupError(null);
    try {
      const res = await fetch(`/api/shipping/track/${encodeURIComponent(numToSearch)}`);
      if (res.ok) {
        const data = await res.json();
        setTrackingLookupRecord(data.shipment);
        setShowTrackingModal(true);
      } else {
        setTrackingLookupError("Tracking number not found in carrier network. Please verify and retry.");
      }
    } catch (err: any) {
      setTrackingLookupError(err.message || "Failed to query carrier tracking service");
    } finally {
      setIsSearchingTracking(false);
    }
  };

  // Active products in the selected department: combines Firestore seller products + default curated articles
  const activeDepartmentProducts = useMemo(() => {
    if (selectedDepartment === 'SELECT') return [];
    const staticItems = DEPARTMENT_ITEMS[selectedDepartment] || [];
    const sellerItems = firestoreProducts.filter(p => p.department === selectedDepartment);
    return [...sellerItems, ...staticItems];
  }, [selectedDepartment, firestoreProducts]);

  // Helper to obtain current active size and color selection for an article
  const getProductSelection = (product: ProductArticle) => {
    return productSelections[product.id] || {
      size: product.sizes[0] || 'Standard',
      color: product.colors[0] || { name: 'Standard', hex: '#000000' }
    };
  };

  const handleSelectSize = (productId: string, size: string) => {
    setProductSelections(prev => {
      const activeDeptItems = activeDepartmentProducts;
      const item = activeDeptItems.find(p => p.id === productId);
      const current = prev[productId] || {
        size: item?.sizes[0] || 'Standard',
        color: item?.colors[0] || { name: 'Standard', hex: '#000000' }
      };
      return {
        ...prev,
        [productId]: { ...current, size }
      };
    });
  };

  const handleSelectColor = (productId: string, color: ProductArticleColor) => {
    setProductSelections(prev => {
      const activeDeptItems = activeDepartmentProducts;
      const item = activeDeptItems.find(p => p.id === productId);
      const current = prev[productId] || {
        size: item?.sizes[0] || 'Standard',
        color: item?.colors[0] || { name: 'Standard', hex: '#000000' }
      };
      return {
        ...prev,
        [productId]: { ...current, color }
      };
    });
  };

  const handleAddProductToCart = (product: ProductArticle) => {
    const selection = getProductSelection(product);
    const cartItemId = `${product.id}-${selection.size}-${selection.color.name}`;
    
    setSelectedProducts(prev => {
      const existingIdx = prev.findIndex(item => item.id === cartItemId);
      if (existingIdx >= 0) {
        return prev.map((item, idx) => idx === existingIdx ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, {
          id: cartItemId,
          article: product,
          selectedSize: selection.size,
          selectedColor: selection.color,
          quantity: 1
        }];
      }
    });
  };

  const handleUpdateProductQty = (cartItemId: string, delta: number) => {
    setSelectedProducts(prev => {
      return prev.map(item => {
        if (item.id === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter((item): item is SelectedProductArticle => item !== null);
    });
  };

  const handleRemoveProduct = (cartItemId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.id !== cartItemId));
  };

  const totalProductPrice = useMemo(() => {
    return selectedProducts.reduce((sum, item) => sum + (item.article.price * item.quantity), 0);
  }, [selectedProducts]);

  // Sales Tax & Commercial Invoicing logic:
  // Applied ONLY to purchasers buying articles from the portal (8.25% standard commercial rate).
  // Complimentary home and showroom visits carry $0 tax liability and no commercial invoices.
  const salesTaxRate = 0.0825;
  const salesTaxAmount = useMemo(() => {
    return Math.round(totalProductPrice * salesTaxRate * 100) / 100;
  }, [totalProductPrice]);

  const finalTotalProductPrice = useMemo(() => {
    return Math.round((totalProductPrice + shippingCost + salesTaxAmount) * 100) / 100;
  }, [totalProductPrice, shippingCost, salesTaxAmount]);

  // Handle Product Order Checkout & Immediate SMS text confirmation
  const handleProductOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError("Please select at least one brand new article on the left");
      return;
    }
    if (!formData.name || !formData.email || !formData.phone) {
      setError("Please provide your name, email, and mobile phone number for order tracking");
      return;
    }
    if (fulfillmentType === 'delivery' && !shippingAddress.trim()) {
      setError("Please provide your delivery address");
      return;
    }
    setError(null);

    try {
      const orderRefId = `OPAL-ORD-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      const generatedInvoiceNumber = `INV-OPAL-${Math.floor(100000 + Math.random() * 900000)}`;
      const currentInvoiceDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const businessTaxId = 'US-EIN-95-4819201';

      setLastConfirmedOrderId(orderRefId);
      try {
        const stored = JSON.parse(localStorage.getItem('opal_recent_tracking_ids') || '[]');
        const updated = [orderRefId, ...stored.filter((x: string) => x !== orderRefId)].slice(0, 4);
        localStorage.setItem('opal_recent_tracking_ids', JSON.stringify(updated));
      } catch (e) {}

      // 1. Create real carrier shipment & electronic barcode manifest if delivery is selected
      let carrierShipment: ShipmentTrackingRecord | null = null;
      if (fulfillmentType === 'delivery') {
        try {
          const shipRes = await fetch('/api/shipping/create-shipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderRefId,
              carrierId: selectedCarrierId,
              customerName: formData.name,
              customerPhone: formData.phone,
              shippingAddress,
              items: selectedProducts.map(p => ({
                name: p.article.name,
                quantity: p.quantity,
                price: p.article.price
              })),
              totalPrice: finalTotalProductPrice
            })
          });

          if (shipRes.ok) {
            const shipData = await shipRes.json();
            if (shipData.shipment) {
              carrierShipment = shipData.shipment;
              setActiveShipmentRecord(carrierShipment);
            }
          }
        } catch (shipErr) {
          console.error("Carrier manifest dispatch notice:", shipErr);
        }
      }

      // 2. Prepare official commercial tax invoice data for the purchaser
      const invoiceRecord: TaxInvoiceData = {
        invoiceNumber: generatedInvoiceNumber,
        orderId: orderRefId,
        invoiceDate: currentInvoiceDate,
        status: 'paid',
        seller: {
          businessName: pickupLocationInfo.showroomName || 'Milano Sartoriale Home Atelier',
          ownerName: 'Opal Certified Home Artisan',
          taxId: businessTaxId,
          studioAddress: pickupLocationInfo.address,
          phone: '(415) 890-6725',
          email: 'atelier@opal-business.portal'
        },
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: fulfillmentType === 'delivery' ? shippingAddress : pickupLocationInfo.address
        },
        fulfillmentType,
        items: selectedProducts.map(p => ({
          name: p.article.name,
          brand: p.article.brand,
          sku: p.article.sku,
          price: p.article.price,
          unitPrice: p.article.price,
          size: p.selectedSize,
          color: p.selectedColor.name,
          quantity: p.quantity
        })),
        subtotal: totalProductPrice,
        taxRate: salesTaxRate,
        taxRatePercentage: '8.25%',
        taxAmount: salesTaxAmount,
        shippingFee: shippingCost,
        grandTotal: finalTotalProductPrice,
        paymentMethod: 'Credit / Debit Card (Secured)'
      };
      setConfirmedTaxInvoice(invoiceRecord);

      // 3. Save complete order record to Firestore database including tax & invoice breakdown
      await addDoc(collection(db, 'orders'), {
        orderId: orderRefId,
        invoiceNumber: generatedInvoiceNumber,
        invoiceDate: currentInvoiceDate,
        sellerTaxId: businessTaxId,
        department: selectedDepartment,
        items: selectedProducts.map(p => ({
          id: p.article.id,
          name: p.article.name,
          brand: p.article.brand,
          price: p.article.price,
          unitPrice: p.article.price,
          size: p.selectedSize,
          color: p.selectedColor.name,
          colorHex: p.selectedColor.hex,
          quantity: p.quantity,
          sku: p.article.sku
        })),
        itemsSubtotal: totalProductPrice,
        subtotal: totalProductPrice,
        taxRate: salesTaxRate,
        taxRatePercentage: '8.25%',
        taxAmount: salesTaxAmount,
        shippingFee: shippingCost,
        totalPrice: finalTotalProductPrice,
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerUid: user?.uid || null,
        fulfillmentType,
        shippingCarrier: carrierShipment ? carrierShipment.carrier : (fulfillmentType === 'delivery' ? selectedCarrier.carrierName : 'Store Showroom'),
        shippingService: carrierShipment ? carrierShipment.serviceName : (fulfillmentType === 'delivery' ? selectedCarrier.serviceName : 'Boutique Pickup'),
        carrierRate: shippingCost,
        trackingNumber: carrierShipment?.trackingNumber || null,
        trackingUrl: carrierShipment?.trackingUrl || null,
        estimatedDelivery: carrierShipment?.estimatedDelivery || (fulfillmentType === 'delivery' ? selectedCarrier.estimatedDeliveryDate : 'Today (within 2h)'),
        shippingAddress: fulfillmentType === 'delivery' ? shippingAddress : pickupLocationInfo.address,
        pickupAddress: fulfillmentType === 'pickup' ? pickupLocationInfo.address : null,
        pickupShowroom: fulfillmentType === 'pickup' ? pickupLocationInfo.showroomName : null,
        status: 'confirmed',
        paymentStatus: 'paid_on_delivery',
        createdAt: serverTimestamp()
      });

      // 3. Send SMS text message to customer's mobile phone including carrier tracking / showroom pickup
      const itemSummaries = selectedProducts.map(p => `${p.article.name} (${p.selectedSize}, ${p.selectedColor.name} x${p.quantity})`).join(', ');
      const brandNames = Array.from(new Set(selectedProducts.map(p => p.article.brand))).join(', ');
      
      let fulfillmentDesc = `Free Boutique Store Pickup at ${pickupLocationInfo.showroomName}, ${pickupLocationInfo.address}`;
      let orderSmsMessage = '';

      if (fulfillmentType === 'delivery') {
        const carrierName = carrierShipment?.carrier || selectedCarrier.carrierName;
        const trackingNum = carrierShipment?.trackingNumber;
        fulfillmentDesc = `${carrierName} Express (${selectedCarrier.serviceName}) to ${shippingAddress || userLocation.city}`;
        
        if (trackingNum) {
          orderSmsMessage = `Opal Portal: Hi ${formData.name}! Your order #${orderRefId} ($${finalTotalProductPrice}) is confirmed! Dispatched via ${carrierName} (${selectedCarrier.serviceName}). Verified Tracking #: ${trackingNum}. Estimated delivery: ${carrierShipment?.estimatedDelivery || selectedCarrier.estimatedDeliveryDate}. Track live: ${carrierShipment?.trackingUrl || 'opal-portal.web.app'}`;
        } else {
          orderSmsMessage = `Opal Portal: Hi ${formData.name}! Your order #${orderRefId} for ${itemSummaries} from ${brandNames} is confirmed! Total: $${finalTotalProductPrice}. Fulfillment: ${fulfillmentDesc}. We'll text you dispatch tracking updates!`;
        }
      } else {
        orderSmsMessage = `Opal Portal: Hi ${formData.name}! Your order #${orderRefId} for ${itemSummaries} from ${brandNames} is confirmed! Total: $${finalTotalProductPrice}. Showroom Pickup: ${pickupLocationInfo.showroomName}, ${pickupLocationInfo.address}. Ready for pickup in 2 hours!`;
        setConfirmedPickupDetails({
          showroomName: pickupLocationInfo.showroomName,
          address: pickupLocationInfo.address,
          hours: pickupLocationInfo.hours
        });
      }

      try {
        const smsRes = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.phone,
            customerName: formData.name,
            message: orderSmsMessage,
            serviceNames: selectedProducts.map(p => p.article.name),
            providerName: brandNames,
            date: 'Brand New Order',
            time: fulfillmentType === 'delivery' ? selectedCarrier.serviceName : 'Ready in 2 Hours',
            totalPrice: finalTotalProductPrice
          })
        });

        if (smsRes.ok) {
          const smsData = await smsRes.json();
          setSentSmsDetails(smsData);
          setShowSmsToast(true);
          setTimeout(() => setShowSmsToast(false), 9000);
        }
      } catch (smsErr) {
        console.error("SMS notification dispatch error:", smsErr);
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedProducts([]);
        setFormData({ name: '', email: '', phone: '', date: '', time: '' });
        setShippingAddress('');
        setSentSmsDetails(null);
        setConfirmedPickupDetails(null);
      }, 15000);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'orders');
    }
  };

  // Categories that the provider actually has services for (if logged in as provider)
  const providerCategories = useMemo(() => {
    return Array.from(
      new Set(userServices.map(s => s.category).filter(Boolean))
    );
  }, [userServices]);

  // Categories displayed in the category dropdown (Beauty, Handyman, Party Planner, Cloud Kitchen)
  const displayedCategories = VISIBLE_SERVICE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }
    if (selectedCategory !== 'Cloud Kitchen' && !formData.time) {
      setError("Please select a preferred time slot");
      return;
    }
    if (selectedCategory !== 'Cloud Kitchen' && !formData.date) {
      setError("Please select a date");
      return;
    }
    setError(null);

    try {
      const bookingRefId = `OPAL-BK-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      setLastConfirmedBookingId(bookingRefId);
      try {
        const stored = JSON.parse(localStorage.getItem('opal_recent_tracking_ids') || '[]');
        const updated = [bookingRefId, ...stored.filter((x: string) => x !== bookingRefId)].slice(0, 4);
        localStorage.setItem('opal_recent_tracking_ids', JSON.stringify(updated));
      } catch (e) {}

      // Create a booking for each selected service
      const bookingPromises = selectedServices.map(service => {
        return addDoc(collection(db, 'bookings'), {
          bookingRefId,
          serviceId: service.id,
          serviceName: service.name,
          category: service.category || selectedCategory,
          duration: service.duration || '60 min',
          providerId: service.providerId || null,
          providerName: service.providerName || null,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          customerUid: user?.uid || null,
          date: selectedCategory === 'Cloud Kitchen' ? 'N/A' : formData.date,
          time: selectedCategory === 'Cloud Kitchen' ? 'N/A' : formData.time,
          price: service.price,
          status: 'confirmed',
          paymentStatus: 'unpaid',
          createdAt: serverTimestamp()
        });
      });

      await Promise.all(bookingPromises);

      // Send SMS text message to service seeker's mobile phone
      const serviceNames = selectedServices.map(s => s.name);
      const providerNames = Array.from(new Set(selectedServices.map(s => s.providerName).filter(Boolean))).join(', ') || 'Service Provider';
      const scheduledDate = selectedCategory === 'Cloud Kitchen' ? 'Direct Delivery' : formData.date;
      const scheduledTime = selectedCategory === 'Cloud Kitchen' ? 'Immediate Preparation' : formData.time;

      try {
        const smsRes = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: formData.phone,
            customerName: formData.name,
            serviceNames,
            providerName: providerNames,
            date: scheduledDate,
            time: scheduledTime,
            totalPrice
          })
        });

        if (smsRes.ok) {
          const smsData = await smsRes.json();
          setSentSmsDetails(smsData);
          setShowSmsToast(true);
          setTimeout(() => setShowSmsToast(false), 9000);
        }
      } catch (smsErr) {
        console.error("SMS notification dispatch error:", smsErr);
      }

      setIsSubmitted(true);
      setTimeout(() => {
        setIsSubmitted(false);
        setSelectedServices([]);
        setFormData({ name: '', email: '', phone: '', date: '', time: '' });
        setSentSmsDetails(null);
      }, 10000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'bookings');
    }
  };

  const handleSendTestSms = async () => {
    if (!formData.phone || formData.phone.trim().length < 5) {
      setError("Please type a mobile phone number first to test the built-in SMS.");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setError(null);
    setIsSendingTestSms(true);
    try {
      const activeService = selectedServices[0] || filteredServices[0] || {
        name: 'Selected Service',
        providerName: 'Service Provider',
        price: 50
      };
      const res = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: formData.phone,
          customerName: formData.name || 'Valued Client',
          serviceNames: selectedServices.length > 0 ? selectedServices.map(s => s.name) : [activeService.name],
          providerName: selectedServices[0]?.providerName || activeService.providerName || 'Service Provider',
          date: formData.date || 'Tomorrow',
          time: formData.time || '11:00 AM',
          totalPrice: totalPrice || activeService.price
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSentSmsDetails(data);
        setShowSmsToast(true);
        setShowPhoneSimulator(true);
      }
    } catch (err) {
      console.error("Test SMS error:", err);
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const toggleService = (service: Service) => {
    setSelectedServices(prev => {
      const isSelected = prev.find(s => s.id === service.id);
      if (isSelected) {
        return prev.filter(s => s.id !== service.id);
      } else {
        // If selecting a service from another provider, notify and group with that provider
        if (prev.length > 0 && prev[0].providerName && service.providerName && prev[0].providerName !== service.providerName) {
          setError(`Switched appointment to ${service.providerName}. Appointments are scheduled with one provider at a time.`);
          setTimeout(() => setError(null), 4500);
          return [service];
        }
        return [...prev, service];
      }
    });
  };

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Helper to parse duration string to minutes
  const parseDuration = (durationStr?: string): number => {
    if (!durationStr) return 45;
    const lower = durationStr.toLowerCase().trim();
    if (lower.includes('hour') || lower.includes('hr')) {
      const parts = lower.split(/hour|hr/);
      const hours = parseFloat(parts[0]) || 0;
      let extraMins = 0;
      if (parts[1] && parts[1].includes('min')) {
        extraMins = parseFloat(parts[1]) || 0;
      }
      return Math.round(hours * 60 + extraMins);
    }
    const num = parseFloat(lower);
    if (!isNaN(num) && num > 0) return Math.round(num);
    return 45; // Default to 45 min
  };

  const formatDurationDisplay = (mins: number) => {
    if (mins <= 0) return '0 min';
    const hrs = Math.floor(mins / 60);
    const remaining = mins % 60;
    if (hrs > 0 && remaining > 0) return `${hrs} hr ${remaining} min`;
    if (hrs > 0) return `${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`;
    return `${remaining} min`;
  };

  // Determine effective provider from selection or active filter
  const effectiveProviderName = useMemo(() => {
    return selectedProvider || selectedServices[0]?.providerName || null;
  }, [selectedProvider, selectedServices]);

  const effectiveProviderId = useMemo(() => {
    return selectedServices[0]?.providerId || null;
  }, [selectedServices]);

  // Fetch existing bookings for the selected provider and date
  useEffect(() => {
    if ((!effectiveProviderName && !effectiveProviderId) || !formData.date || selectedCategory === 'Cloud Kitchen') {
      setExistingBookings([]);
      return;
    }

    setIsLoadingSlots(true);
    const bookingsRef = collection(db, 'bookings');
    let q;
    if (effectiveProviderId) {
      q = query(bookingsRef, where('providerId', '==', effectiveProviderId), where('date', '==', formData.date));
    } else {
      q = query(bookingsRef, where('providerName', '==', effectiveProviderName), where('date', '==', formData.date));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingsData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((b: any) => b.status !== 'cancelled');
      setExistingBookings(bookingsData);
      setIsLoadingSlots(false);
    }, (error) => {
      console.warn("Fetch existing bookings notice:", error);
      setIsLoadingSlots(false);
    });

    return () => unsubscribe();
  }, [effectiveProviderName, effectiveProviderId, formData.date, selectedCategory]);

  // Filter nearby services by the currently selected category tab (Beauty, Handyman, Party Planner, Cloud Kitchen)
  const filteredServices = useMemo(() => {
    if (selectedCategory === 'SELECT') return [];
    if (selectedCategory === 'Beauty') {
      return nearbyServices.filter(s => s.category === 'Beauty' || (s.category as string) === 'Beauty & Wellness');
    }
    return nearbyServices.filter(s => s.category === selectedCategory);
  }, [nearbyServices, selectedCategory]);
  
  // Clear time if it becomes invalid due to service or date changes
  useEffect(() => {
    if (!formData.time || !formData.date || isLoadingSlots) return;

    if (selectedServices.length === 0) {
      setFormData(prev => ({ ...prev, time: '' }));
      return;
    }

    const totalDuration = selectedServices.reduce((sum, s) => sum + parseDuration(s.duration), 0);
    const bookingsByTime = existingBookings.reduce((acc: any, b) => {
      if (!acc[b.time]) acc[b.time] = 0;
      const service = allCatalogServices.find(s => s.id === b.serviceId);
      const duration = b.duration ? parseDuration(b.duration) : (service ? parseDuration(service.duration) : 60);
      acc[b.time] += duration;
      return acc;
    }, {});

    const slotTime = parse(formData.time, 'h:mm a', new Date());
    const slotEndTime = addMinutes(slotTime, totalDuration);
    
    // Check overlap
    let isOverlap = false;
    for (const [existingTime, duration] of Object.entries(bookingsByTime)) {
      const existingStartTime = parse(existingTime as string, 'h:mm a', new Date());
      const existingEndTime = addMinutes(existingStartTime, duration as number);
      if (isBefore(slotTime, existingEndTime) && isAfter(slotEndTime, existingStartTime)) {
        isOverlap = true;
        break;
      }
    }

    // Check if it fits before 9 PM
    const dayEnd = parse('9:00 PM', 'h:mm a', new Date());
    const isPastEnd = isAfter(slotEndTime, dayEnd);

    // Check if it's in the past (if date is today)
    let isPast = false;
    const today = format(new Date(), 'yyyy-MM-dd');
    if (formData.date === today) {
      const now = new Date();
      if (isBefore(slotTime, now)) {
        isPast = true;
      }
    }

    if (isOverlap || isPastEnd || isPast) {
      setFormData(prev => ({ ...prev, time: '' }));
      setError(`Selected time slot is unavailable for the updated service duration (${totalDuration} min). Please pick an available timeslot.`);
      setTimeout(() => setError(null), 5000);
    }
  }, [selectedServices, formData.date, existingBookings, isLoadingSlots, allCatalogServices]);

  // Group services by provider and find their closest distance, sorting nearest first
  const providers = useMemo(() => {
    return Array.from(new Set(filteredServices.map(s => s.providerName))).map(name => {
      const pServices = filteredServices.filter(s => s.providerName === name);
      const avgRating = pServices[0]?.providerRating || 4.8;
      const distances = pServices.map(s => s.distance).filter((d): d is number => typeof d === 'number');
      const minDistance = distances.length > 0 ? Math.min(...distances) : 0;
      return {
        name,
        rating: avgRating,
        serviceCount: pServices.length,
        minPrice: Math.min(...pServices.map(s => s.price)),
        distance: minDistance
      };
    }).sort((a, b) => a.distance - b.distance); // Nearest comes first
  }, [filteredServices]);

  const providerServices = useMemo(() => {
    return filteredServices.filter(s => s.providerName === selectedProvider);
  }, [filteredServices, selectedProvider]);

  const activeCategoryOffers = useMemo(() => {
    return specialOffers.filter(o => 
      o.category === selectedCategory || 
      (selectedCategory === 'Beauty' && (o.category?.includes('Beauty') || o.category === 'Beauty & Wellness'))
    );
  }, [specialOffers, selectedCategory]);

  return (
    <section id="booking" className="py-24 bg-brand-cream relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          {(isAdmin || user?.role === 'provider' || user?.email === 'rakesh2xplore@gmail.com') && onSwitchToDashboard && (
            <div className="mb-10 p-6 bg-white border-2 border-brand-gold/40 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 flex items-center justify-center shrink-0 border border-brand-gold/20">
                  <Settings className="w-6 h-6 text-brand-dark" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-brand-gold text-brand-dark">
                      Provider View Active
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800">
                      Showing Your Services ({userServices.length})
                    </span>
                    <span className="text-xs text-brand-muted">
                      ({user?.businessName || user?.displayName || user?.email || 'Logged in'})
                    </span>
                  </div>
                  <h4 className="font-serif text-lg font-bold text-brand-dark">
                    Viewing Client Reservation Preview
                  </h4>
                  <p className="text-xs text-brand-muted max-w-xl">
                    You are currently previewing how clients browse services and book appointments. To manage your schedule, view incoming bookings, or add and edit services, visit your Provider Dashboard.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onSwitchToDashboard}
                className="w-full md:w-auto px-6 py-3.5 bg-brand-dark text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md shrink-0 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-brand-gold" />
                Open Appointment Dashboard & Services →
              </button>
            </div>
          )}

          <div className="text-center mb-8">
            <h2 className="text-5xl mb-4">Reserve Your Service</h2>
            <p className="text-brand-muted max-w-xl mx-auto">Select a category and service to find a professional for your needs.</p>
          </div>

          {/* "Near Me" Location & 50-Mile Radius Bar */}
          <div className="mb-8 p-4 sm:p-5 bg-white border border-brand-gold/30 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-brand-gold/15 flex items-center justify-center shrink-0 text-brand-dark border border-brand-gold/25 shadow-inner">
                <MapPin className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                    Near Me: <span className="text-brand-gold font-bold">{userLocation.city}{userLocation.state ? `, ${userLocation.state}` : ''}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ≤ 50 Miles
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-brand-cream text-brand-muted border border-brand-gold/20">
                    Nearest First
                  </span>
                </div>
                <p className="text-xs text-brand-muted mt-0.5">
                  Showing providers within 50 miles ordered by closest proximity to you.
                </p>
                {locationStatusMessage && (
                  <p className="text-[11px] text-brand-gold font-semibold mt-1 animate-pulse">
                    {locationStatusMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto justify-end flex-wrap">
              {user && onOpenTracking && (
                <button
                  type="button"
                  onClick={() => onOpenTracking()}
                  className="px-3.5 py-2.5 bg-brand-gold hover:bg-yellow-500 text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="Track your order or service booking status"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Track Order</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isDetectingLocation}
                className="px-3.5 py-2.5 bg-brand-cream/80 hover:bg-brand-cream text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-brand-gold/20 shadow-xs disabled:opacity-50"
                title="Detect device coordinates via GPS"
              >
                <Crosshair className={cn("w-3.5 h-3.5 text-brand-gold", isDetectingLocation && "animate-spin")} />
                {isDetectingLocation ? "Detecting GPS..." : "Detect GPS"}
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowLocationSelector(prev => !prev)}
                  className="px-4 py-2.5 bg-brand-dark text-white hover:bg-brand-gold hover:text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm"
                >
                  <Navigation className="w-3.5 h-3.5 text-brand-gold" />
                  <span>Switch City</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                {showLocationSelector && (
                  <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-brand-gold/25 p-3.5 z-40">
                    <div className="pb-2.5 mb-2 border-b border-brand-gold/15">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-muted">
                          Choose or Search City / ZIP:
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowLocationSelector(false);
                            setCitySearchQuery('');
                          }}
                          className="p-1 rounded-lg text-brand-muted hover:text-brand-dark hover:bg-brand-cream/60 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* City or ZIP search input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-brand-muted absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={citySearchQuery}
                          onChange={(e) => setCitySearchQuery(e.target.value)}
                          placeholder="Enter city or ZIP (e.g. Austin, 78701)..."
                          className="w-full pl-8 pr-7 py-2 text-xs bg-brand-cream/40 border border-brand-gold/20 rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-gold text-brand-dark"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const found = searchLocation(citySearchQuery);
                              if (found) {
                                setUserLocation(found);
                                setShowLocationSelector(false);
                                setCitySearchQuery('');
                              }
                            }
                          }}
                        />
                        {citySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCitySearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                      {(() => {
                        const filtered = PRESET_LOCATIONS.filter(loc => {
                          if (!citySearchQuery.trim()) return true;
                          const q = citySearchQuery.toLowerCase().trim();
                          return (
                            loc.city.toLowerCase().includes(q) ||
                            (loc.state && loc.state.toLowerCase().includes(q)) ||
                            (loc.zip && loc.zip.includes(q))
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-4">
                              <p className="text-xs text-brand-muted mb-2">No predefined city matched.</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setUserLocation({
                                    lat: DEFAULT_USER_LOCATION.lat,
                                    lng: DEFAULT_USER_LOCATION.lng,
                                    city: citySearchQuery.trim(),
                                    isCustom: true
                                  });
                                  setShowLocationSelector(false);
                                  setCitySearchQuery('');
                                }}
                                className="px-3 py-1.5 bg-brand-gold text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-dark transition-all"
                              >
                                Set As "{citySearchQuery.trim()}"
                              </button>
                            </div>
                          );
                        }

                        return filtered.map(preset => (
                          <button
                            key={preset.city}
                            type="button"
                            onClick={() => {
                              setUserLocation(preset);
                              setShowLocationSelector(false);
                              setCitySearchQuery('');
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between group",
                              userLocation.city === preset.city
                                ? "bg-brand-gold text-white font-bold shadow-xs"
                                : "text-brand-dark hover:bg-brand-cream/70"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <MapPin className={cn(
                                "w-3.5 h-3.5 shrink-0",
                                userLocation.city === preset.city ? "text-white" : "text-brand-gold"
                              )} />
                              <span>{preset.city}, {preset.state}</span>
                              {preset.zip && (
                                <span className={cn(
                                  "text-[10px] font-mono opacity-60",
                                  userLocation.city === preset.city ? "text-white" : "text-brand-muted"
                                )}>
                                  ({preset.zip})
                                </span>
                              )}
                            </div>
                            {userLocation.city === preset.city && <CheckCircle2 className="w-3.5 h-3.5 text-white shrink-0" />}
                          </button>
                        ));
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dual Dropdowns: Select Service Category & SHOP By DEPARTMENT */}
          <div className="max-w-5xl mx-auto mb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Dropdown 1: Select Service Category */}
              <div className="bg-white p-5 rounded-3xl border-2 border-brand-gold/30 shadow-md flex flex-col justify-between">
                <div>
                  <label 
                    htmlFor="service-category-dropdown" 
                    className="block text-xs font-bold uppercase tracking-widest text-brand-muted mb-2 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                      {isProviderLoggedIn ? 'Select Service' : 'SERVICE CATEGORY'}
                    </span>
                    <span className="text-[11px] font-bold text-brand-gold">
                      {isProviderLoggedIn && userServices.length === 1 ? userServices[0].name : selectedCategory}
                    </span>
                  </label>

                  {/* IN SERVICE PROVIDER'S VIEW: Service dropdown is visible ONLY if provider has more than one service, else removed */}
                  {isProviderLoggedIn && userServices.length <= 1 ? (
                    <div className="py-3 px-4 bg-brand-cream/60 rounded-2xl border border-brand-gold/25 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-serif font-bold text-brand-dark">
                          {userServices.length === 1 ? userServices[0].name : 'No Active Services'}
                        </p>
                        <p className="text-[11px] text-brand-muted mt-0.5">
                          {userServices.length === 1 
                            ? `${userServices[0].category || selectedCategory} • ${userServices[0].duration || 'Standard'}`
                            : 'Create services in your Provider Dashboard to start accepting client bookings'}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold px-2.5 py-1 bg-brand-gold/15 rounded-full border border-brand-gold/25">
                        {userServices.length === 1 ? `$${userServices[0].price} • Single Service` : '0 Services'}
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        id="service-category-dropdown"
                        value={selectedCategory}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedCategory(val);
                          setSelectedProvider(null);
                          setSelectedServices([]);
                          setSelectedProducts([]);
                          if (val !== 'SELECT') {
                            setSelectedDepartment('SELECT');
                          }
                        }}
                        className="w-full appearance-none pl-4 pr-10 py-3.5 bg-brand-cream/60 hover:bg-brand-cream focus:bg-white border border-brand-gold/25 focus:border-brand-gold rounded-2xl text-base font-serif font-bold text-brand-dark focus:ring-2 focus:ring-brand-gold/30 outline-none shadow-inner cursor-pointer transition-all"
                      >
                        <option value="SELECT" className="text-brand-dark font-sans py-2 font-medium">
                          SELECT
                        </option>
                        {displayedCategories.map(cat => {
                          const countInCat = selectedServices.filter(s => s.category === cat).length;
                          const availableInCat = nearbyServices.filter(s => s.category === cat).length;
                          return (
                            <option key={cat} value={cat} className="text-brand-dark font-sans py-2 font-medium">
                              {cat} ({availableInCat} available{countInCat > 0 ? ` • ${countInCat} selected` : ''})
                            </option>
                          );
                        })}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-brand-gold">
                        <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-brand-muted px-1 flex-wrap gap-2 pt-2 border-t border-brand-gold/10">
                  <span>
                    Services: <strong className="text-brand-dark">{selectedCategory}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedCategory !== 'SELECT' ? (
                      <>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold/15 text-brand-dark border border-brand-gold/25">
                          {nearbyServices.filter(s => s.category === selectedCategory).length} Available
                        </span>
                        {selectedServices.filter(s => s.category === selectedCategory).length > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {selectedServices.filter(s => s.category === selectedCategory).length} Selected
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-cream text-brand-muted border border-brand-gold/20">
                        Choose category
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Dropdown 2: SHOP BY DEPARTMENT */}
              <div className="bg-white p-5 rounded-3xl border-2 border-brand-gold/30 shadow-md flex flex-col justify-between">
                <div>
                  <label 
                    htmlFor="shop-department-dropdown" 
                    className="block text-xs font-bold uppercase tracking-widest text-brand-muted mb-2 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-brand-gold" />
                      SHOP BY DEPARTMENT
                    </span>
                    <span className="text-[11px] font-bold text-brand-gold">
                      {selectedDepartment}
                    </span>
                  </label>

                  <div className="relative">
                    <select
                      id="shop-department-dropdown"
                      value={selectedDepartment}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedDepartment(val);
                        setSelectedServices([]);
                        setSelectedProducts([]);
                        if (val !== 'SELECT') {
                          setSelectedCategory('SELECT');
                          setSelectedProvider(null);
                        }
                      }}
                      className="w-full appearance-none pl-4 pr-10 py-3.5 bg-brand-cream/60 hover:bg-brand-cream focus:bg-white border border-brand-gold/25 focus:border-brand-gold rounded-2xl text-base font-serif font-bold text-brand-dark focus:ring-2 focus:ring-brand-gold/30 outline-none shadow-inner cursor-pointer transition-all"
                    >
                      <option value="SELECT" className="text-brand-dark font-sans py-2 font-medium">
                        SELECT
                      </option>
                      {SHOP_DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept} className="text-brand-dark font-sans py-2 font-medium">
                          {dept}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none flex items-center text-brand-gold">
                      <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-brand-muted px-1 flex-wrap gap-2 pt-2 border-t border-brand-gold/10">
                  <span>
                    Department: <strong className="text-brand-dark">{selectedDepartment}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedDepartment !== 'SELECT' ? (
                      <>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold/15 text-brand-dark border border-brand-gold/25 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" /> {activeDepartmentProducts.length} Brand New
                        </span>
                        {selectedProducts.length > 0 && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} In Bag
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-cream text-brand-muted border border-brand-gold/20">
                        Choose department
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area: Mutual Exclusivity between Category and Department */}
          {selectedCategory === 'SELECT' && selectedDepartment === 'SELECT' ? (
            <div className="max-w-4xl mx-auto my-6 p-8 sm:p-12 bg-white/95 backdrop-blur-md rounded-3xl border border-brand-gold/30 shadow-md animate-fadeIn">
              <div className="text-center max-w-xl mx-auto mb-10">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-gold/15 text-brand-dark text-xs font-bold uppercase tracking-wider mb-3 border border-brand-gold/25">
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  Select a Category or Department
                </div>
                <h3 className="text-3xl font-serif font-bold text-brand-dark tracking-tight mb-2">
                  Explore Services & Boutiques
                </h3>
                <p className="text-sm text-brand-muted leading-relaxed">
                  Choose a <strong>Service Category</strong> or <strong>Shop by Department</strong> from the dropdowns above to explore available offerings.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Service Category Discovery Card */}
                <div className="p-6 bg-brand-cream/40 rounded-3xl border border-brand-gold/25 hover:border-brand-gold transition-all flex flex-col justify-between group shadow-2xs hover:shadow-md">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center mb-4 border border-brand-gold/30 group-hover:scale-105 transition-transform">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold block mb-1">
                      Direct Appointments
                    </span>
                    <h4 className="text-xl font-serif font-bold text-brand-dark mb-2">
                      Service Category
                    </h4>
                    <p className="text-xs text-brand-muted leading-relaxed mb-4">
                      Book certified master providers across Beauty, Handyman, Party Planning, and Cloud Kitchens with direct real-time appointment scheduling.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(displayedCategories[0] || 'Beauty');
                      setSelectedDepartment('SELECT');
                      setSelectedServices([]);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-brand-dark hover:bg-brand-gold text-white hover:text-brand-dark transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Browse {displayedCategories[0] || 'Beauty'} Services →
                  </button>
                </div>

                {/* Shop by Department Discovery Card */}
                <div className="p-6 bg-brand-cream/40 rounded-3xl border border-brand-gold/25 hover:border-brand-gold transition-all flex flex-col justify-between group shadow-2xs hover:shadow-md">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-brand-gold/15 text-brand-gold flex items-center justify-center mb-4 border border-brand-gold/30 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold block mb-1">
                      Curated Boutique
                    </span>
                    <h4 className="text-xl font-serif font-bold text-brand-dark mb-2">
                      Shop by Department
                    </h4>
                    <p className="text-xs text-brand-muted leading-relaxed mb-4">
                      Curated brand-new luxury articles with size swatches, live stock availability checking, and in-home preview visit reservations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDepartment('Clothing');
                      setSelectedCategory('SELECT');
                      setSelectedServices([]);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-brand-dark hover:bg-brand-gold text-white hover:text-brand-dark transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Shop Clothing Department →
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Active Special Offers on Specific Dates Banner for Cloud Kitchen and Beauty (only when Service Category is active) */}
              {selectedCategory !== 'SELECT' && (selectedCategory === 'Cloud Kitchen' || selectedCategory === 'Beauty') && activeCategoryOffers.length > 0 && (
                <div className="mb-10 p-6 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 border-2 border-brand-gold/40 rounded-3xl shadow-sm animate-fadeIn">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-pulse" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-brand-dark flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                        Special Date Offers Available ({activeCategoryOffers.length})
                      </span>
                    </div>
                    <span className="text-[10px] text-brand-muted font-medium">
                      {selectedCategory} Provider Broadcasts
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {activeCategoryOffers.map(offer => (
                      <div 
                        key={offer.id}
                        className="p-4 bg-white rounded-2xl border border-brand-gold/25 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="px-2.5 py-0.5 rounded-md bg-brand-gold text-brand-dark text-[10px] font-bold">
                              {offer.discount}
                            </span>
                            <span className="text-xs font-bold text-brand-dark flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                              Date: {offer.specificDate}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-brand-dark font-serif">
                            {offer.title}
                          </h4>
                          <p className="text-xs text-brand-muted mt-1 line-clamp-2">
                            {offer.description}
                          </p>
                        </div>
                        <div className="mt-3 pt-2.5 border-t border-brand-gold/15 flex items-center justify-between">
                          {offer.promoCode ? (
                            <span className="text-[11px] text-brand-dark font-mono font-bold">
                              Code: <span className="text-brand-gold">{offer.promoCode}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-brand-muted">Special Offer</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, date: offer.specificDate }));
                            }}
                            className="text-[11px] text-brand-gold font-bold hover:underline flex items-center gap-1"
                          >
                            Select Date ({offer.specificDate}) →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-12 items-start">
                {/* Left Column: EITHER Services Selection OR Shopping Articles Selection */}
                {selectedCategory !== 'SELECT' ? (
                  /* Service Selection */
                  <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-2xl font-serif">
                    {selectedProvider 
                      ? `Services by ${selectedProvider}` 
                      : browseMode === 'services' 
                        ? `${selectedCategory} Nearby (${filteredServices.length})` 
                        : `Top Providers in ${selectedCategory} (${providers.length})`}
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {browseMode === 'services' && !selectedProvider 
                      ? 'Within 50 miles, sorted nearest first' 
                      : 'Verified local providers within 50 miles'}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  {selectedProvider ? (
                    <button 
                      onClick={() => setSelectedProvider(null)}
                      className="text-xs font-bold uppercase tracking-widest text-brand-gold hover:underline flex items-center gap-1"
                    >
                      ← Back to All
                    </button>
                  ) : (
                    <div className="flex bg-white p-1 rounded-xl border border-brand-gold/15 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setBrowseMode('services')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                          browseMode === 'services' ? "bg-brand-gold text-white shadow-sm" : "text-brand-muted hover:text-brand-dark"
                        )}
                      >
                        All Services
                      </button>
                      <button
                        type="button"
                        onClick={() => setBrowseMode('providers')}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                          browseMode === 'providers' ? "bg-brand-gold text-white shadow-sm" : "text-brand-muted hover:text-brand-dark"
                        )}
                      >
                        By Provider
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {browseMode === 'providers' && !selectedProvider ? (
                  // Provider List
                  providers.length === 0 ? (
                    <div className="text-center py-10 px-6 bg-white rounded-2xl border border-brand-gold/15">
                      <MapPin className="w-8 h-8 text-brand-gold/50 mx-auto mb-2" />
                      <p className="text-brand-dark font-medium text-sm">No providers found within 50 miles.</p>
                      <p className="text-brand-muted text-xs mt-1">Try switching to another city in the location bar above.</p>
                    </div>
                  ) : (
                    providers.map((provider) => (
                      <button
                        key={provider.name}
                        onClick={() => setSelectedProvider(provider.name)}
                        className="flex items-center justify-between p-5 rounded-2xl border border-brand-gold/15 bg-white hover:border-brand-gold/40 hover:shadow-md transition-all text-left group shadow-xs"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <p className="font-bold text-lg text-brand-dark group-hover:text-brand-gold transition-colors">{provider.name}</p>
                            <span className="flex items-center gap-1 text-xs font-bold bg-brand-gold/10 text-brand-gold px-2 py-0.5 rounded-full">
                              <Star className="w-3 h-3 fill-brand-gold" />
                              {provider.rating}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              {provider.distance} mi away
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-brand-muted flex-wrap">
                            <span className="flex items-center gap-1 px-2.5 py-0.5 bg-brand-dark/5 rounded-md text-brand-dark font-bold">
                              <CheckCircle2 className="w-3 h-3 text-brand-gold" />
                              {provider.serviceCount} {provider.serviceCount === 1 ? 'Service' : 'Services'}
                            </span>
                            <span className="text-brand-muted font-medium">
                              Starts from <span className="font-mono font-bold text-brand-dark">${provider.minPrice}</span>
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-brand-gold/40 group-hover:text-brand-gold transition-colors ml-2 shrink-0" />
                      </button>
                    ))
                  )
                ) : (
                  // Service List (either All Services or Provider-Specific)
                  (selectedProvider ? providerServices : filteredServices).length === 0 ? (
                    <div className="text-center py-12 px-6 bg-white rounded-2xl border border-brand-gold/20 shadow-sm">
                      <Sparkles className="w-8 h-8 text-brand-gold mx-auto mb-2" />
                      <p className="text-brand-dark font-serif text-lg font-bold mb-1">
                        {isProviderLoggedIn ? `No services in ${selectedCategory} for your business` : `No services found within 50 miles in ${selectedCategory}`}
                      </p>
                      {isProviderLoggedIn ? (
                        <div className="mt-2">
                          <p className="text-brand-muted text-xs mb-4">
                            You only see your own services when logged in. Head over to your dashboard to add or load services for this category.
                          </p>
                          {onSwitchToDashboard && (
                            <button
                              type="button"
                              onClick={onSwitchToDashboard}
                              className="px-5 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-gold transition-colors"
                            >
                              + Add Services in Dashboard
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-brand-muted italic text-xs">No services currently available within 50 miles of your selected location.</p>
                      )}
                    </div>
                  ) : (
                    (selectedProvider ? providerServices : filteredServices).map((service) => {
                      const isSelected = selectedServices.some(s => s.id === service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service)}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border transition-all text-left group",
                            isSelected
                              ? "border-brand-gold bg-brand-gold/5 shadow-md"
                              : "border-brand-gold/10 bg-white hover:border-brand-gold/30 hover:shadow-sm"
                          )}
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            {service.image && (
                              <img 
                                src={service.image} 
                                alt={service.name} 
                                className="w-14 h-14 rounded-xl object-cover shrink-0 border border-brand-gold/10"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1 pr-2">
                                <p className="font-bold text-brand-dark group-hover:text-brand-gold transition-colors truncate">{service.name}</p>
                                <span className="font-mono font-bold text-brand-gold shrink-0 ml-2">${service.price}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-brand-muted mb-1 flex-wrap">
                                <span className="font-semibold text-brand-dark/70">{service.duration}</span>
                                <span>•</span>
                                <span className="truncate font-medium text-brand-dark/80">{service.providerName || 'Local Provider'}</span>
                                {service.providerRating && (
                                  <span className="flex items-center gap-0.5 text-[10px] bg-brand-cream px-1.5 py-0.5 rounded text-brand-gold font-bold shrink-0">
                                    ★ {service.providerRating}
                                  </span>
                                )}
                                {typeof service.distance === 'number' && (
                                  <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-full font-bold shrink-0">
                                    <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                                    {service.distance} mi away
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-brand-muted/80 line-clamp-1">{service.description}</p>
                            </div>
                          </div>
                          <div className="ml-3 shrink-0">
                            {isSelected ? (
                              <CheckCircle2 className="w-6 h-6 text-brand-gold" />
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-brand-gold/25 group-hover:border-brand-gold/50 transition-colors" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )
                )}
              </div>
            </div>
          ) : (
            /* Shopping Articles Selection */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-2xl font-serif flex items-center gap-2">
                    <ShoppingBag className="w-6 h-6 text-brand-gold" />
                    {selectedDepartment} Articles ({ activeDepartmentProducts.length })
                  </h3>
                  <p className="text-xs text-brand-muted mt-0.5">
                    Brand new curated articles & products • Select sizes and colors to order
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-gold/15 text-brand-dark border border-brand-gold/30 flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-brand-gold" />
                    Brand New
                  </span>
                  {selectedProducts.length > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} In Bag
                    </span>
                  )}
                </div>
              </div>

              <div className="grid gap-4 max-h-[560px] overflow-y-auto pr-2 custom-scrollbar">
                {activeDepartmentProducts.length === 0 ? (
                  <div className="text-center py-12 px-6 bg-white rounded-2xl border border-brand-gold/20 shadow-sm">
                    <ShoppingBag className="w-8 h-8 text-brand-gold mx-auto mb-2" />
                    <p className="text-brand-dark font-serif text-lg font-bold mb-1">
                      No articles found in {selectedDepartment}
                    </p>
                    <p className="text-brand-muted text-xs">
                      Try selecting another department from the dropdown above.
                    </p>
                  </div>
                ) : (
                  activeDepartmentProducts.map((item) => {
                    const currentSelection = getProductSelection(item);
                    const cartItemKey = `${item.id}-${currentSelection.size}-${currentSelection.color.name}`;
                    const inCartItem = selectedProducts.find(p => p.id === cartItemKey);
                    const totalItemInCart = selectedProducts
                      .filter(p => p.article.id === item.id)
                      .reduce((sum, p) => sum + p.quantity, 0);

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-4 rounded-3xl border transition-all bg-white shadow-sm flex flex-col justify-between group",
                          totalItemInCart > 0
                            ? "border-brand-gold/60 ring-1 ring-brand-gold/30 bg-amber-50/15"
                            : "border-brand-gold/15 hover:border-brand-gold/40 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-brand-gold/15 shadow-xs"
                              referrerPolicy="no-referrer"
                            />
                            <span className="absolute -top-1.5 -left-1.5 bg-brand-dark text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                              Brand New
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                              <span className="text-[11px] font-bold uppercase tracking-widest text-brand-gold">
                                {item.brand}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] font-semibold text-brand-dark">
                                <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />
                                <span>{item.rating}</span>
                                {item.reviewsCount && (
                                  <span className="text-[10px] text-brand-muted">({item.reviewsCount})</span>
                                )}
                              </div>
                            </div>

                            <h4 className="font-serif text-base font-bold text-brand-dark leading-tight line-clamp-1">
                              {item.name}
                            </h4>

                            {/* Price Tag (No duration) */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="text-xl font-serif font-bold text-brand-dark">
                                ${item.price}
                              </span>
                              {item.originalPrice && (
                                <>
                                  <span className="text-xs line-through text-brand-muted">
                                    ${item.originalPrice}
                                  </span>
                                  <span className="text-[10px] font-bold text-red-700 bg-red-100/90 px-1.5 py-0.2 rounded-md">
                                    Save ${item.originalPrice - item.price}
                                  </span>
                                </>
                              )}
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-200/60 ml-auto">
                                In Stock ({item.stockCount})
                              </span>
                            </div>

                            <p className="text-xs text-brand-muted/90 line-clamp-2 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Sizes & Colors Configuration Bar */}
                        <div className="mt-3.5 pt-3 border-t border-brand-gold/10 space-y-2.5">
                          {/* Sizes Selector */}
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1">
                              <span className="font-bold text-brand-dark uppercase tracking-wider text-[10px]">
                                Size: <strong className="text-brand-gold">{currentSelection.size}</strong>
                              </span>
                              <span className="text-[10px] text-brand-muted font-mono">SKU: {item.sku}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {item.sizes.map(size => {
                                const isCurrentSize = currentSelection.size === size;
                                return (
                                  <button
                                    key={size}
                                    type="button"
                                    onClick={() => handleSelectSize(item.id, size)}
                                    className={cn(
                                      "px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer",
                                      isCurrentSize
                                        ? "bg-brand-dark text-white border-brand-dark shadow-xs"
                                        : "bg-brand-cream/40 text-brand-dark border-brand-gold/25 hover:border-brand-gold hover:bg-white"
                                    )}
                                  >
                                    {size}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Colors Selector */}
                          <div>
                            <span className="font-bold text-brand-dark uppercase tracking-wider text-[10px] block mb-1">
                              Color: <strong className="text-brand-gold">{currentSelection.color.name}</strong>
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.colors.map(col => {
                                const isCurrentColor = currentSelection.color.name === col.name;
                                return (
                                  <button
                                    key={col.name}
                                    type="button"
                                    title={col.name}
                                    onClick={() => handleSelectColor(item.id, col)}
                                    className={cn(
                                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs transition-all cursor-pointer",
                                      isCurrentColor
                                        ? "border-brand-dark bg-brand-dark text-white shadow-xs font-bold"
                                        : "border-brand-gold/20 bg-white text-brand-dark hover:border-brand-gold/40"
                                    )}
                                  >
                                    <span 
                                      className="w-3.5 h-3.5 rounded-full inline-block border border-black/15 shadow-inner shrink-0" 
                                      style={{ backgroundColor: col.hex }} 
                                    />
                                    <span className="text-[11px]">{col.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Add to Order & Availability Visit Buttons */}
                          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="text-[11px] text-brand-muted">
                              Selected: <strong className="text-brand-dark">{currentSelection.size}</strong> / <strong className="text-brand-dark">{currentSelection.color.name}</strong>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedArticleForVisit(item);
                                  setIsAvailabilityModalOpen(true);
                                }}
                                className="px-3 py-2 bg-brand-cream/80 hover:bg-brand-gold/20 text-brand-dark rounded-xl font-semibold text-xs border border-brand-gold/30 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                title="Check real-time stock availability and book an in-home trial or home-studio visit"
                              >
                                <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                                <span>Check Availability / Book Visit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAddProductToCart(item)}
                                className="px-4 py-2 bg-brand-dark hover:bg-brand-gold text-white hover:text-brand-dark rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>+ Add to Cart (${item.price})</span>
                                {inCartItem && (
                                  <span className="bg-brand-gold text-brand-dark px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                                    {inCartItem.quantity}
                                  </span>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Right Column: Either Service Appointment Form OR Product Order & Checkout Form */}
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-brand-gold/10 relative">
            {selectedCategory !== 'SELECT' ? (
              isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl mb-1 font-serif">Booking Confirmed!</h3>
                  <p className="text-brand-muted text-xs">
                    Your reservation has been booked. A confirmation has been emailed to <span className="font-semibold text-brand-dark">{formData.email}</span>.
                  </p>

                  {/* Booking Reference ID Card */}
                  <div className="mt-4 p-4 bg-stone-900 text-white rounded-2xl border border-brand-gold/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-md">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold block">
                        Booking Reference ID
                      </span>
                      <span className="font-mono font-bold text-sm text-white">
                        {lastConfirmedBookingId || 'OPAL-BK-CONFIRMED'}
                      </span>
                    </div>
                    {user && onOpenTracking && (
                      <button
                        type="button"
                        onClick={() => onOpenTracking(lastConfirmedBookingId)}
                        className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Track My Booking
                      </button>
                    )}
                  </div>

                  {/* SMS Confirmation Card */}
                  <div className="mt-5 p-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl text-left shadow-sm">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-200/60">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Text Message (SMS) Sent
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Delivered
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-950">
                        <span>Recipient Mobile:</span>
                        <span className="font-mono font-bold text-emerald-800">{sentSmsDetails?.to || formData.phone}</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-emerald-200/60 shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Message Preview
                          </span>
                          <span className="text-gray-400 font-normal">Now</span>
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed font-sans italic">
                          "{sentSmsDetails?.message || `Opal Portal: Hi ${formData.name}! Your reservation has been confirmed. Ref: #OPAL-CONFIRMED.`}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-emerald-700/80 pt-1 font-mono">
                        <span>Carrier: {sentSmsDetails?.carrierProvider || 'Opal Mobile SMS Network'}</span>
                        <button
                          type="button"
                          onClick={() => setShowPhoneSimulator(true)}
                          className="font-sans font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-1"
                        >
                          <Smartphone className="w-3 h-3" />
                          View on Mobile Screen →
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPhoneSimulator(true)}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                    >
                      <Smartphone className="w-4 h-4" />
                      Open Mobile SMS View
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setSelectedServices([]);
                        setFormData({ name: '', email: '', phone: '', date: '', time: '' });
                        setSentSmsDetails(null);
                      }}
                      className="px-5 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-brand-dark transition-all shadow-md"
                    >
                      Book Another Service
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h3 className="text-2xl mb-6 font-serif">Your Details</h3>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
                      {error}
                    </div>
                  )}

                  <div className="space-y-4">
                    {selectedServices.length > 0 && (
                      <div className="p-4 bg-brand-gold/5 rounded-xl border border-brand-gold/20 mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Selected Services</p>
                          <button 
                            type="button"
                            onClick={() => setSelectedServices([])}
                            className="text-[10px] text-red-500 hover:underline font-bold uppercase tracking-tighter"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-1">
                          {selectedServices.map(s => (
                            <div key={s.id} className="flex justify-between text-sm">
                              <div className="flex flex-col">
                                <span className="font-medium">{s.name}</span>
                                <span className="text-[10px] text-brand-muted">{s.providerName}</span>
                              </div>
                              <span className="font-mono">${s.price}</span>
                            </div>
                          ))}
                          <div className="pt-2 mt-2 border-t border-brand-gold/20 flex justify-between font-bold">
                            <span>Total</span>
                            <span>${totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                      <input
                        required
                        type="text"
                        placeholder="Full Name"
                        className="w-full pl-12 pr-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                      <input
                        required
                        type="email"
                        placeholder="Email Address"
                        className="w-full pl-12 pr-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1">
                          <Smartphone className="w-3 h-3 text-brand-gold" />
                          Mobile Number
                        </label>
                        <button
                          type="button"
                          onClick={handleSendTestSms}
                          disabled={isSendingTestSms}
                          className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold uppercase tracking-wider flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 transition-all disabled:opacity-50"
                          title="Send a sample reservation text message to test the built-in SMS gateway"
                        >
                          <Send className="w-2.5 h-2.5" />
                          {isSendingTestSms ? 'Sending SMS...' : 'Test Built-in SMS Now'}
                        </button>
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-muted" />
                        <input
                          required
                          type="tel"
                          placeholder="e.g. +1 555-234-5678"
                          className="w-full pl-12 pr-4 py-3 bg-brand-cream/50 border-none rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none text-brand-dark"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      </div>
                      <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pl-1">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        A reservation text message (SMS) is sent automatically once booked.
                      </p>
                    </div>
                    {selectedCategory !== 'Cloud Kitchen' && (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs uppercase tracking-widest font-bold text-brand-muted flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-brand-gold" /> Select Date
                            </p>
                            {formData.date && (
                              <span className="text-[11px] text-brand-gold font-bold">
                                {format(parseISO(formData.date), 'EEEE, MMMM do')}
                              </span>
                            )}
                          </div>
                          <input
                            required
                            type="date"
                            min={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full px-4 py-3 bg-brand-cream/50 border border-brand-gold/15 rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none transition-all font-medium text-brand-dark"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value, time: ''})}
                          />
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <p className="text-xs uppercase tracking-widest font-bold text-brand-muted flex items-center gap-2">
                              <Clock className="w-4 h-4 text-brand-gold" /> Select Preferred Time Slot
                            </p>
                            {selectedServices.length > 0 && (
                              <span className="text-[11px] font-bold text-brand-dark bg-brand-gold/15 px-2.5 py-0.5 rounded-full border border-brand-gold/30">
                                Required Duration: {formatDurationDisplay(selectedServices.reduce((sum, s) => sum + parseDuration(s.duration), 0))}
                              </span>
                            )}
                          </div>

                          {/* Dynamic helper banner based on selected services */}
                          {selectedServices.length === 0 ? (
                            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                              <span className="text-base shrink-0">⚠️</span>
                              <div>
                                <p className="font-bold">
                                  No {selectedCategory !== 'SELECT' ? selectedCategory : selectedDepartment !== 'SELECT' ? selectedDepartment : 'items'} selected
                                </p>
                                <p className="text-[11px] text-amber-800 mt-0.5">
                                  Please select at least one service on the left
                                </p>
                              </div>
                            </div>
                          ) : !formData.date ? (
                            <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-xl text-xs text-brand-dark flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-brand-gold shrink-0" />
                              <span>Please choose an appointment date above to check real-time slot availability.</span>
                            </div>
                          ) : (
                            <div className="p-3 bg-brand-cream/60 border border-brand-gold/20 rounded-xl text-xs text-brand-dark flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[11px] font-semibold">
                                  Duration: <strong className="text-brand-dark">{formatDurationDisplay(selectedServices.reduce((sum, s) => sum + parseDuration(s.duration), 0))}</strong>
                                </span>
                              </div>
                              {formData.time ? (
                                <span className="text-[11px] font-bold text-brand-gold">
                                  Window: {formData.time} – {(() => {
                                    const totalDur = selectedServices.reduce((sum, s) => sum + parseDuration(s.duration), 0);
                                    const startTime = parse(formData.time, 'h:mm a', new Date());
                                    return format(addMinutes(startTime, totalDur), 'h:mm a');
                                  })()}
                                </span>
                              ) : (
                                <span className="text-[11px] text-brand-muted">
                                  Operating Hours: 9:00 AM – 9:00 PM
                                </span>
                              )}
                            </div>
                          )}

                          {isLoadingSlots ? (
                            <div className="flex justify-center py-6">
                              <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                {(() => {
                                  const totalDuration = selectedServices.reduce((sum, s) => sum + parseDuration(s.duration), 0);
                                  const noServicesSelected = selectedServices.length === 0;
                                  const noDateSelected = !formData.date;

                                  // Group existing bookings by time to get their total duration
                                  const bookingsByTime = existingBookings.reduce((acc: any, b) => {
                                    if (!acc[b.time]) acc[b.time] = 0;
                                    const service = allCatalogServices.find(s => s.id === b.serviceId);
                                    const duration = b.duration ? parseDuration(b.duration) : (service ? parseDuration(service.duration) : 60);
                                    acc[b.time] += duration;
                                    return acc;
                                  }, {});

                                  // Generate slots from 9:00 AM to 8:30 PM (every 30 min)
                                  const slots = [];
                                  const today = format(new Date(), 'yyyy-MM-dd');
                                  const now = new Date();
                                  const dayEndTime = parse('9:00 PM', 'h:mm a', new Date());

                                  for (let hour = 9; hour <= 20; hour++) {
                                    for (let min = 0; min < 60; min += 30) {
                                      const timeStr = `${hour > 12 ? hour - 12 : hour}:${min === 0 ? '00' : min} ${hour >= 12 ? 'PM' : 'AM'}`;
                                      const slotStartTime = parse(timeStr, 'h:mm a', new Date());
                                      const slotEndTime = addMinutes(slotStartTime, totalDuration > 0 ? totalDuration : 30);
                                      const formattedEndTime = format(slotEndTime, 'h:mm a');

                                      // Overlap with existing booking for this provider
                                      let isOverlap = false;
                                      let overlapInfo = '';
                                      for (const [existingTime, duration] of Object.entries(bookingsByTime)) {
                                        const existingStartTime = parse(existingTime as string, 'h:mm a', new Date());
                                        const existingEndTime = addMinutes(existingStartTime, duration as number);
                                        
                                        if (isBefore(slotStartTime, existingEndTime) && isAfter(slotEndTime, existingStartTime)) {
                                          isOverlap = true;
                                          overlapInfo = `Booked (${existingTime} - ${format(existingEndTime, 'h:mm a')})`;
                                          break;
                                        }
                                      }

                                      // Check if service duration pushes appointment past 9:00 PM closing
                                      const isExceedsHours = totalDuration > 0 && isAfter(slotEndTime, dayEndTime);

                                      // Check if slot has already passed today
                                      const isPast = formData.date === today && isBefore(slotStartTime, now);

                                      // Determine disablement
                                      const isDisabled = noServicesSelected || noDateSelected || isPast || isExceedsHours || isOverlap;
                                      const isSelected = formData.time === timeStr;

                                      let disableReason = '';
                                      if (noServicesSelected) disableReason = 'Select a service first';
                                      else if (noDateSelected) disableReason = 'Select a date first';
                                      else if (isPast) disableReason = 'Time has passed';
                                      else if (isOverlap) disableReason = overlapInfo || 'Already booked';
                                      else if (isExceedsHours) disableReason = `Exceeds 9 PM (ends ${formattedEndTime})`;

                                      slots.push(
                                        <button
                                          key={timeStr}
                                          type="button"
                                          disabled={isDisabled}
                                          onClick={() => {
                                            if (!isDisabled) {
                                              setFormData({...formData, time: timeStr});
                                            }
                                          }}
                                          title={isDisabled ? disableReason : `${timeStr} – ${formattedEndTime} (${totalDuration} min)`}
                                          className={cn(
                                            "relative py-2.5 px-1.5 rounded-xl text-[11px] font-bold uppercase tracking-tight transition-all border flex flex-col items-center justify-center gap-0.5",
                                            isSelected 
                                              ? "bg-brand-dark text-white border-brand-dark shadow-md ring-2 ring-brand-gold" 
                                              : isDisabled
                                                ? "bg-stone-100/80 text-stone-400 border-stone-200/60 cursor-not-allowed opacity-60"
                                                : "bg-white text-brand-dark border-brand-gold/25 hover:border-brand-gold hover:bg-brand-gold/10 hover:shadow-sm"
                                          )}
                                        >
                                          <span>{timeStr}</span>
                                          {isSelected ? (
                                            <span className="text-[9px] text-brand-gold font-normal lowercase tracking-normal">
                                              ends {formattedEndTime}
                                            </span>
                                          ) : isDisabled && isOverlap ? (
                                            <span className="text-[8px] text-red-500 font-medium tracking-tighter uppercase">
                                              Booked
                                            </span>
                                          ) : isDisabled && isExceedsHours ? (
                                            <span className="text-[8px] text-stone-400 font-medium tracking-tighter uppercase">
                                              Too late
                                            </span>
                                          ) : !isDisabled && totalDuration > 0 ? (
                                            <span className="text-[8px] text-brand-muted font-normal lowercase tracking-normal">
                                              → {formattedEndTime}
                                            </span>
                                          ) : null}
                                        </button>
                                      );
                                    }
                                  }

                                  return slots;
                                })()}
                              </div>

                              {/* Timeslot Legend */}
                              <div className="pt-2 border-t border-brand-gold/10 flex flex-wrap items-center justify-between gap-2 text-[10px] text-brand-muted">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-white border border-brand-gold/40 inline-block" />
                                  <span>Available</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-brand-dark inline-block" />
                                  <span>Selected</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-sm bg-stone-200 inline-block" />
                                  <span>Booked / Exceeds Hours</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-dark text-white rounded-xl font-medium hover:bg-brand-gold transition-colors shadow-lg"
                  >
                    Confirm Appointment
                  </button>
                </form>
              )
            ) : (
              /* Product Order & Checkout Form (NO duration, NO timeslots, Price tags, Sizes, Colors, Delivery/Pickup, and SMS Confirmation) */
              isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <h3 className="text-2xl mb-1 font-serif">Order Confirmed!</h3>
                  <p className="text-brand-muted text-xs">
                    Your order for brand new boutique articles has been placed! A confirmation was sent to <span className="font-semibold text-brand-dark">{formData.email}</span>.
                  </p>

                  {/* Order Reference ID Card */}
                  <div className="mt-4 p-4 bg-stone-900 text-white rounded-2xl border border-brand-gold/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-left shadow-md">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold block">
                        Order Reference ID
                      </span>
                      <span className="font-mono font-bold text-sm text-white">
                        {lastConfirmedOrderId || 'OPAL-ORD-CONFIRMED'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmedTaxInvoice) {
                            downloadPdfInvoice(confirmedTaxInvoice);
                          } else {
                            setIsInvoiceModalOpen(true);
                          }
                        }}
                        className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                        title="Download official commercial PDF tax invoice"
                      >
                        <span>📥</span>
                        <span>Download PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInvoiceModalOpen(true)}
                        className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                      >
                        <span>📄</span>
                        <span>View Invoice</span>
                      </button>
                      {user && onOpenTracking && (
                        <button
                          type="button"
                          onClick={() => onOpenTracking(lastConfirmedOrderId)}
                          className="px-4 py-2 bg-brand-gold hover:bg-yellow-500 text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                        >
                          <Package className="w-3.5 h-3.5" />
                          Track My Order
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SMS Confirmation Card */}
                  <div className="mt-5 p-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl text-left shadow-sm">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-200/60">
                      <div className="flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Order SMS Sent
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Delivered
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-950">
                        <span>Customer Mobile:</span>
                        <span className="font-mono font-bold text-emerald-800">{sentSmsDetails?.to || formData.phone}</span>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-emerald-200/60 shadow-inner">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-1">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            SMS Order Notification
                          </span>
                          <span className="text-gray-400 font-normal">Now</span>
                        </div>
                        <p className="text-xs text-gray-800 leading-relaxed font-sans italic">
                          "{sentSmsDetails?.message || `Opal Portal: Hi ${formData.name}! Your order has been placed successfully.`}"
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-emerald-700/80 pt-1 font-mono">
                        <span>Carrier: {sentSmsDetails?.carrierProvider || 'Opal Mobile SMS Network'}</span>
                        <button
                          type="button"
                          onClick={() => setShowPhoneSimulator(true)}
                          className="underline font-bold text-emerald-800 hover:text-emerald-950"
                        >
                          Open Phone View 📱
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Real Carrier Dispatch & Tracking Card */}
                  {activeShipmentRecord && (
                    <div className="mt-4 p-4 bg-white border border-brand-gold/30 rounded-2xl text-left shadow-md">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-brand-gold/15">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-brand-gold" />
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                            {activeShipmentRecord.carrier} Express Dispatch Manifest
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                          <Barcode className="w-3 h-3 text-amber-700" />
                          Label Created & Manifested
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted">Carrier & Service:</span>
                          <span className="font-semibold text-brand-dark">{activeShipmentRecord.serviceName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted">Tracking Number:</span>
                          <span className="font-mono font-bold text-brand-gold bg-brand-cream/80 px-2 py-0.5 rounded border border-brand-gold/20">
                            {activeShipmentRecord.trackingNumber}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted">Guaranteed Arrival:</span>
                          <span className="font-medium text-emerald-700">{activeShipmentRecord.estimatedDelivery}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted">Destination:</span>
                          <span className="font-medium text-brand-dark truncate max-w-[200px]">{activeShipmentRecord.destination}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-brand-gold/15 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTrackingLookupRecord(activeShipmentRecord);
                            setShowTrackingModal(true);
                          }}
                          className="px-3 py-1.5 bg-brand-dark text-white rounded-lg text-xs font-bold hover:bg-brand-gold hover:text-brand-dark transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Package className="w-3.5 h-3.5" />
                          Track Live Milestones
                        </button>
                        {activeShipmentRecord.trackingUrl && activeShipmentRecord.trackingUrl !== '#' && (
                          <a
                            href={activeShipmentRecord.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-brand-gold hover:underline flex items-center gap-1"
                          >
                            Carrier Portal <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Boutique Showroom Pickup Pass Card */}
                  {confirmedPickupDetails && (
                    <div className="mt-4 p-4 bg-white border border-brand-gold/30 rounded-2xl text-left shadow-md">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-brand-gold/15">
                        <div className="flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-brand-gold" />
                          <span className="text-xs font-bold uppercase tracking-wider text-brand-dark">
                            Boutique Showroom Pickup Pass
                          </span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          Ready in 2 Hours
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-brand-muted shrink-0">Showroom:</span>
                          <span className="font-bold text-brand-dark text-right font-serif">{confirmedPickupDetails.showroomName}</span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-brand-muted shrink-0">Physical Address:</span>
                          <span className="font-semibold text-brand-dark text-right font-sans">
                            {confirmedPickupDetails.address}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted">Showroom Hours:</span>
                          <span className="font-medium text-emerald-700">{confirmedPickupDetails.hours}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-brand-muted">Collection Pass:</span>
                          <span className="text-brand-dark font-mono font-medium">Show SMS Order Text or Photo ID</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-brand-gold/15 flex items-center justify-between">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(confirmedPickupDetails.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-brand-dark text-white rounded-lg text-xs font-bold hover:bg-brand-gold hover:text-brand-dark transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Navigation className="w-3.5 h-3.5 text-brand-gold" />
                          Get Driving Directions
                        </a>
                        <span className="text-[10px] text-brand-muted font-mono">
                          Express Curbside Available
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <form onSubmit={handleProductOrderSubmit} className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-gold/15">
                    <div>
                      <h3 className="text-2xl font-serif">Boutique Bag & Checkout</h3>
                      <p className="text-xs text-brand-muted mt-0.5">Brand new articles reserved & delivered</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-brand-gold/15 text-brand-dark border border-brand-gold/25">
                      {selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} Items
                    </span>
                  </div>

                  {/* Selected Products in Bag */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase tracking-widest font-bold text-brand-muted flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-brand-gold" /> Selected Articles
                      </p>
                      {selectedProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedProducts([])}
                          className="text-[11px] text-red-600 hover:underline font-semibold"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    {selectedProducts.length === 0 ? (
                      <div className="p-6 bg-brand-cream/40 border border-dashed border-brand-gold/30 rounded-2xl text-center">
                        <ShoppingBag className="w-8 h-8 text-brand-gold/50 mx-auto mb-2" />
                        <p className="text-sm font-bold text-brand-dark">Your bag is empty</p>
                        <p className="text-xs text-brand-muted mt-1 max-w-xs mx-auto">
                          Select your desired size and color from the brand new articles on the left and tap "+ Add to Cart".
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {selectedProducts.map((p) => (
                          <div 
                            key={p.id} 
                            className="p-3 bg-brand-cream/30 border border-brand-gold/20 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
                          >
                            <img 
                              src={p.article.image} 
                              alt={p.article.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-brand-gold/15 shrink-0" 
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-brand-dark truncate">{p.article.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-brand-muted flex-wrap">
                                <span className="font-serif font-bold text-brand-gold">${p.article.price}</span>
                                <span>•</span>
                                <span className="bg-white px-1.5 py-0.2 rounded border border-brand-gold/20 font-semibold text-brand-dark">
                                  Size: {p.selectedSize}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-brand-dark font-medium">
                                  <span 
                                    className="w-2.5 h-2.5 rounded-full inline-block border border-black/15 shadow-2xs" 
                                    style={{ backgroundColor: p.selectedColor.hex }} 
                                  />
                                  {p.selectedColor.name}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center bg-white border border-brand-gold/25 rounded-xl p-0.5 shadow-2xs">
                                <button 
                                  type="button" 
                                  onClick={() => handleUpdateProductQty(p.id, -1)} 
                                  className="w-5 h-5 flex items-center justify-center text-brand-dark hover:bg-brand-cream rounded-md text-xs font-bold cursor-pointer"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="w-6 text-center text-xs font-bold font-mono">{p.quantity}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleUpdateProductQty(p.id, 1)} 
                                  className="w-5 h-5 flex items-center justify-center text-brand-dark hover:bg-brand-cream rounded-md text-xs font-bold cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveProduct(p.id)} 
                                className="text-brand-muted hover:text-red-600 p-1 transition-colors cursor-pointer" 
                                title="Remove"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fulfillment Preference & Carrier Integration */}
                  <div className="space-y-3 pt-2 border-t border-brand-gold/10">
                    <div className="flex items-center justify-between">
                      <label className="text-xs uppercase tracking-widest font-bold text-brand-muted block">
                        Fulfillment Method
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingLookupNumber('');
                          setTrackingLookupRecord(null);
                          setShowTrackingModal(true);
                        }}
                        className="text-[10px] text-brand-gold hover:underline font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Barcode className="w-3 h-3" /> Track Existing Order
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('delivery')}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5",
                          fulfillmentType === 'delivery'
                            ? "bg-brand-gold/15 border-brand-gold shadow-xs"
                            : "bg-white border-brand-gold/20 hover:border-brand-gold/40"
                        )}
                      >
                        <Truck className="w-4 h-4 text-brand-gold shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-brand-dark">Express Delivery</p>
                          <p className="text-[10px] text-brand-muted">Real Carrier • Live Tracking</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFulfillmentType('pickup')}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5",
                          fulfillmentType === 'pickup'
                            ? "bg-brand-gold/15 border-brand-gold shadow-xs"
                            : "bg-white border-brand-gold/20 hover:border-brand-gold/40"
                        )}
                      >
                        <ShoppingBag className="w-4 h-4 text-brand-gold shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-brand-dark">Boutique Pickup</p>
                          <p className="text-[10px] text-brand-muted truncate">Ready in 2h • {pickupLocationInfo.showroomName.split(' ')[0]}</p>
                        </div>
                      </button>
                    </div>

                    {/* Real Carrier Shipping Selection (Shown when Express Delivery is active) */}
                    {fulfillmentType === 'delivery' && (
                      <div className="p-3 bg-brand-cream/35 border border-brand-gold/25 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-brand-gold/15">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-brand-gold" />
                            Select Carrier Service
                          </span>
                          <span className="text-[10px] text-brand-muted flex items-center gap-1 font-mono">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Live Commercial Tariff
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {carrierOptions.map((opt) => (
                            <label
                              key={opt.carrierId}
                              onClick={() => setSelectedCarrierId(opt.carrierId)}
                              className={cn(
                                "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer",
                                selectedCarrierId === opt.carrierId
                                  ? "bg-white border-brand-gold shadow-xs ring-1 ring-brand-gold/20"
                                  : "bg-white/60 border-brand-gold/15 hover:bg-white"
                              )}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="radio"
                                  name="carrierSelection"
                                  checked={selectedCarrierId === opt.carrierId}
                                  onChange={() => setSelectedCarrierId(opt.carrierId)}
                                  className="w-3.5 h-3.5 text-brand-gold focus:ring-brand-gold/30 accent-brand-gold cursor-pointer"
                                />
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(
                                      "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider",
                                      opt.carrierName === 'FedEx' ? "bg-purple-100 text-purple-900 border border-purple-200" :
                                      opt.carrierName === 'USPS' ? "bg-blue-100 text-blue-900 border border-blue-200" :
                                      opt.carrierName === 'UPS' ? "bg-amber-100 text-amber-900 border border-amber-200" :
                                      "bg-stone-100 text-stone-800 border border-stone-200"
                                    )}>
                                      {opt.carrierName}
                                    </span>
                                    <span className="text-xs font-bold text-brand-dark">{opt.serviceName}</span>
                                  </div>
                                  <p className="text-[10px] text-brand-muted mt-0.5">
                                    ETA: <strong className="text-emerald-700">{opt.estimatedDeliveryDate}</strong> • {opt.deliveryGuarantee}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-serif font-bold text-xs text-brand-dark">
                                  {opt.rate === 0 ? (
                                    <span className="text-emerald-700 font-sans font-bold text-[11px] uppercase">Free</span>
                                  ) : (
                                    `$${opt.rate.toFixed(2)}`
                                  )}
                                </span>
                              </div>
                            </label>
                          ))}
                        </div>

                        <p className="text-[10px] text-brand-muted/90 italic pt-1">
                          * Parcels are digitally manifested directly into {selectedCarrier?.carrierName} courier dispatch networks upon order placement.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Contact & Delivery Details */}
                  <div className="space-y-3 pt-2 border-t border-brand-gold/10">
                    <div>
                      <label className="text-xs uppercase tracking-widest font-bold text-brand-muted block mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-brand-gold absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          required
                          type="text"
                          placeholder="Full name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full pl-11 pr-4 py-2.5 bg-brand-cream/50 border border-brand-gold/15 rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none text-xs text-brand-dark font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs uppercase tracking-widest font-bold text-brand-muted block mb-1">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-brand-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            required
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full pl-10 pr-3 py-2.5 bg-brand-cream/50 border border-brand-gold/15 rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none text-xs text-brand-dark font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs uppercase tracking-widest font-bold text-brand-muted">
                            Mobile (for SMS & Carrier Alerts)
                          </label>
                        </div>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-brand-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            required
                            type="tel"
                            placeholder="Mobile number"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full pl-10 pr-3 py-2.5 bg-brand-cream/50 border border-brand-gold/15 rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none text-xs text-brand-dark font-medium"
                          />
                        </div>
                      </div>
                    </div>

                    {fulfillmentType === 'delivery' ? (
                      <div>
                        <label className="text-xs uppercase tracking-widest font-bold text-brand-muted block mb-1">
                          Delivery Shipping Address
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="Street address, City, State, ZIP code"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="w-full px-4 py-2.5 bg-brand-cream/50 border border-brand-gold/15 rounded-xl focus:ring-2 focus:ring-brand-gold/30 outline-none text-xs text-brand-dark font-medium"
                        />
                      </div>
                    ) : (
                      <div className="p-3.5 bg-brand-cream/70 border border-brand-gold/25 rounded-2xl text-xs text-brand-dark space-y-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-brand-gold/15">
                          <span className="font-bold uppercase tracking-wider text-[11px] text-brand-dark flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                            Verified Showroom Pickup
                          </span>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded uppercase tracking-wider">
                            Ready in 2h
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="font-serif font-bold text-sm text-brand-dark">
                            {pickupLocationInfo.showroomName}
                          </p>
                          <p className="text-brand-muted text-xs font-sans flex items-start gap-1.5">
                            <Navigation className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                            <span>{pickupLocationInfo.address}</span>
                          </p>
                          <p className="text-[10px] text-stone-500 pt-0.5 font-sans">
                            {pickupLocationInfo.hours} • Order SMS & ID required for pickup
                          </p>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 pl-1">
                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                      Live carrier tracking barcode & SMS dispatch update sent immediately upon order placement.
                    </p>
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-3 border-t border-brand-gold/15 space-y-1.5 text-xs">
                    <div className="flex justify-between text-brand-muted">
                      <span>Items Subtotal</span>
                      <span className="font-mono font-bold text-brand-dark">${totalProductPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-brand-muted">
                      <span>
                        Shipping & Handling {fulfillmentType === 'delivery' ? `(${selectedCarrier?.carrierName || 'Express'})` : '(Boutique Pickup)'}
                      </span>
                      <span className="font-semibold text-brand-dark font-mono">
                        {fulfillmentType === 'pickup' || shippingCost === 0 ? (
                          <span className="text-emerald-700 font-sans uppercase">FREE</span>
                        ) : (
                          `$${shippingCost.toFixed(2)}`
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-brand-muted">
                      <span className="flex items-center gap-1.5">
                        <span>Sales Tax (8.25%)</span>
                        <span className="text-[10px] text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded font-medium border border-amber-300/60">
                          Commercial Tax Invoice
                        </span>
                      </span>
                      <span className="font-mono font-bold text-amber-700">
                        ${salesTaxAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-brand-dark pt-1.5 border-t border-brand-gold/10">
                      <span>Total Price</span>
                      <span className="font-serif text-xl font-bold text-brand-gold">${finalTotalProductPrice.toFixed(2)}</span>
                    </div>
                    <p className="text-[10px] text-brand-muted/80 italic pt-0.5">
                      * Sales tax & commercial invoices apply exclusively to buyers purchasing goods from this portal. Home & studio visits for trial are complimentary ($0.00) non-taxable services.
                    </p>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={selectedProducts.length === 0}
                    className={cn(
                      "w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg flex items-center justify-center gap-2",
                      selectedProducts.length > 0
                        ? "bg-brand-dark text-white hover:bg-brand-gold hover:text-brand-dark cursor-pointer"
                        : "bg-brand-dark/30 text-white/60 cursor-not-allowed"
                    )}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Place Order & Dispatch SMS Confirmation</span>
                  </button>
                </form>
              )
            )}
          </div>
          </div>
        </>
      )}
        </div>
      </div>

      {/* Floating Incoming SMS Notification Simulation Banner */}
      {showSmsToast && sentSmsDetails && (
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-brand-dark text-white p-4 rounded-3xl shadow-2xl border-2 border-brand-gold/40 flex items-start gap-3.5 backdrop-blur-md"
        >
          <div className="w-11 h-11 rounded-2xl bg-brand-gold/20 flex items-center justify-center shrink-0 border border-brand-gold/30">
            <Smartphone className="w-5 h-5 text-brand-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div 
              onClick={() => setShowPhoneSimulator(true)}
              className="cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold flex items-center gap-1 group-hover:underline">
                  <MessageSquare className="w-3 h-3" />
                  SMS Delivered to {sentSmsDetails.to}
                </span>
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSmsToast(false);
                  }} 
                  className="text-white/60 hover:text-white p-0.5 rounded-md hover:bg-white/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-white/95 leading-snug line-clamp-2 italic">
                "{sentSmsDetails.message}"
              </p>
              <div className="flex items-center justify-between mt-1 text-[9px] text-brand-gold/80 font-mono">
                <span>{sentSmsDetails.carrierProvider || 'Opal Mobile SMS Network'}</span>
                <span className="font-bold underline text-white">Tap to Open Phone View 📱</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Simulated Smartphone Screen Modal for Testing Built-in SMS */}
      {showPhoneSimulator && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative w-full max-w-[340px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-700 ring-1 ring-white/10"
          >
            {/* Phone Screen Container */}
            <div className="bg-[#0f172a] rounded-[36px] overflow-hidden text-white flex flex-col h-[580px] relative border border-slate-800">
              {/* Dynamic Island / Camera Notch */}
              <div className="pt-3 px-6 pb-2 flex items-center justify-between text-[11px] font-semibold text-slate-400 bg-slate-900/90 border-b border-slate-800/80">
                <span>9:41</span>
                <div className="w-20 h-4 bg-black rounded-full mx-auto" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">5G</span>
                  <div className="w-5 h-2.5 border border-slate-400 rounded-xs p-0.5 flex items-center">
                    <div className="w-full h-full bg-slate-300 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* SMS Header */}
              <div className="px-4 py-3 bg-slate-900/70 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold text-xs border border-brand-gold/30">
                    OP
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs text-white">Opal Portal</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium">Verified SMS Service</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPhoneSimulator(false)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-gradient-to-b from-slate-950/60 to-slate-900/90">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800 font-mono">
                    Today • SMS Message
                  </span>
                </div>

                {/* Received SMS Bubble */}
                <div className="flex flex-col items-start max-w-[90%]">
                  <div className="bg-slate-800 border border-slate-700 text-white rounded-2xl rounded-tl-xs p-3.5 shadow-md">
                    <p className="text-xs leading-relaxed text-slate-100">
                      {sentSmsDetails?.message || 
                        `Opal Portal: Hi ${formData.name || 'there'}! Your reservation is confirmed! Ref: #OPAL-CONFIRMED. We look forward to seeing you!`
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-slate-400">
                    <span>Delivered to {sentSmsDetails?.to || formData.phone || 'Your Mobile'}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-medium">✓ Just now</span>
                  </div>
                </div>

                {/* Gateway Metadata Note */}
                <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/20 text-center">
                  <p className="text-[10px] text-emerald-400 font-medium">
                    ⚡ {sentSmsDetails?.carrierProvider || 'Built-in Opal SMS Gateway active'}
                  </p>
                  {sentSmsDetails?.twilioDetails?.delivered && (
                    <p className="text-[9px] text-emerald-300 font-mono mt-0.5">
                      ✓ Sent via Twilio Carrier SID: {sentSmsDetails.twilioDetails.sid?.substring(0, 14)}...
                    </p>
                  )}
                  {sentSmsDetails?.twilioDetails?.attempted && !sentSmsDetails?.twilioDetails?.delivered && (
                    <div className="mt-2 p-2 bg-amber-950/40 border border-amber-500/30 rounded-lg text-left">
                      <p className="text-[10px] font-bold text-amber-300">
                        ℹ️ Twilio Trial Policy:
                      </p>
                      <p className="text-[9px] text-amber-200/90 leading-tight mt-0.5">
                        {sentSmsDetails.twilioDetails.trialNotice || "Twilio trial accounts can only send SMS to numbers registered in your Twilio Console under Verified Caller IDs."}
                      </p>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-400 font-mono mt-1">
                    Ref ID: {sentSmsDetails?.referenceId || 'OPAL-DEMO'}
                  </p>
                </div>
              </div>

              {/* SMS Reply Bottom Bar */}
              <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
                <input 
                  type="text" 
                  disabled 
                  placeholder="Text Message • SMS"
                  className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-full px-3.5 py-1.5 text-xs text-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPhoneSimulator(false)}
                  className="px-3 py-1.5 bg-brand-gold text-brand-dark rounded-full text-xs font-bold hover:bg-white transition-all shadow-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Real-time Carrier Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-brand-gold/30 text-brand-dark max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-gold/15 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-brand-dark">Carrier Shipment Tracking</h3>
                  <p className="text-[11px] text-brand-muted">Live courier milestone checkpoints & GPS dispatch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrackingModal(false)}
                className="w-8 h-8 rounded-full bg-brand-cream/80 hover:bg-brand-cream flex items-center justify-center text-brand-muted hover:text-brand-dark transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Tracking Search Bar */}
            <div className="pt-3 pb-2 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleQueryTrackingNumber();
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Barcode className="w-4 h-4 text-brand-gold absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Enter Tracking # (e.g. 7946..., 9400..., 1Z...)"
                    value={trackingLookupNumber}
                    onChange={(e) => setTrackingLookupNumber(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-brand-cream/40 border border-brand-gold/20 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-brand-gold/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingTracking || !trackingLookupNumber.trim()}
                  className="px-4 py-2 bg-brand-dark text-white rounded-xl text-xs font-bold hover:bg-brand-gold hover:text-brand-dark transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                >
                  {isSearchingTracking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Track
                </button>
              </form>
              {trackingLookupError && (
                <p className="text-[11px] text-red-600 mt-1 pl-1">{trackingLookupError}</p>
              )}
            </div>

            {/* Tracking Record Details */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar pt-2">
              {(() => {
                const rec = trackingLookupRecord || activeShipmentRecord;
                if (!rec) {
                  return (
                    <div className="text-center py-8 bg-brand-cream/30 rounded-2xl border border-dashed border-brand-gold/20">
                      <Barcode className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
                      <p className="text-xs font-bold text-brand-dark">No active shipment selected</p>
                      <p className="text-[11px] text-brand-muted mt-0.5 max-w-xs mx-auto">
                        Place an Express Delivery order or enter a valid carrier tracking number above to inspect live courier progress.
                      </p>
                    </div>
                  );
                }

                return (
                  <>
                    {/* Carrier & Tracking Banner */}
                    <div className="p-4 bg-brand-cream/50 border border-brand-gold/20 rounded-2xl flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                            rec.carrier === 'FedEx' ? "bg-purple-100 text-purple-900 border border-purple-200" :
                            rec.carrier === 'USPS' ? "bg-blue-100 text-blue-900 border border-blue-200" :
                            rec.carrier === 'UPS' ? "bg-amber-100 text-amber-900 border border-amber-200" :
                            "bg-brand-dark text-white"
                          )}>
                            {rec.carrier}
                          </span>
                          <span className="text-xs font-bold text-brand-dark">{rec.serviceName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-xs font-bold text-brand-gold bg-white px-2 py-0.5 rounded border border-brand-gold/20">
                            {rec.trackingNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyTracking(rec.trackingNumber)}
                            className="p-1 text-brand-muted hover:text-brand-dark hover:bg-brand-cream rounded transition-colors cursor-pointer"
                            title="Copy tracking number"
                          >
                            {hasCopiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {rec.status.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[10px] text-brand-muted mt-1">
                          ETA: <strong className="text-emerald-700">{rec.estimatedDelivery}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Destination info */}
                    {rec.destination && (
                      <div className="p-3 bg-white border border-brand-gold/15 rounded-xl text-xs flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-brand-gold shrink-0" />
                        <span className="truncate">Destination: <strong>{rec.destination}</strong></span>
                      </div>
                    )}

                    {/* Timeline Checkpoints */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs uppercase tracking-widest font-bold text-brand-muted">
                          Live Courier Milestones
                        </h4>
                        <button
                          type="button"
                          onClick={() => handleQueryTrackingNumber(rec.trackingNumber)}
                          className="text-[10px] text-brand-gold hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <RefreshCw className={cn("w-3 h-3", isSearchingTracking && "animate-spin")} />
                          Refresh Status
                        </button>
                      </div>
                      <div className="space-y-3 relative pl-4 border-l-2 border-brand-gold/30 ml-2">
                        {rec.checkpoints && rec.checkpoints.length > 0 ? (
                          rec.checkpoints.map((cp, idx) => (
                            <div key={idx} className="relative group">
                              <span className={cn(
                                "w-3 h-3 rounded-full absolute -left-[23px] top-1 border-2 border-white shadow-2xs",
                                idx === 0 ? "bg-emerald-600 ring-2 ring-emerald-200" : "bg-brand-gold"
                              )} />
                              <div className="bg-white p-3 rounded-xl border border-brand-gold/15 shadow-2xs">
                                <div className="flex items-center justify-between text-xs font-bold text-brand-dark">
                                  <span>{cp.status}</span>
                                  <span className="text-[10px] font-normal text-brand-muted font-mono">
                                    {new Date(cp.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <p className="text-[11px] text-brand-muted font-medium mt-0.5">{cp.location}</p>
                                <p className="text-[11px] text-brand-dark/80 mt-1 leading-relaxed">{cp.description}</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-brand-muted">Awaiting first scan from local dispatch hub.</p>
                        )}
                      </div>
                    </div>

                    {/* External Link */}
                    {rec.trackingUrl && rec.trackingUrl !== '#' && (
                      <div className="pt-2 text-center">
                        <a
                          href={rec.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-cream border border-brand-gold/30 text-xs font-bold text-brand-dark hover:bg-brand-gold hover:text-white transition-all shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View on Official {rec.carrier} Tracking Portal
                        </a>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        </div>
      )}

      {/* Article Availability & Home/Store Visit Booking Modal */}
      <ArticleAvailabilityModal
        isOpen={isAvailabilityModalOpen}
        onClose={() => {
          setIsAvailabilityModalOpen(false);
          setSelectedArticleForVisit(null);
        }}
        article={selectedArticleForVisit}
        user={user}
      />

      {/* Official Commercial Tax Invoice Modal (For Buyers Only) */}
      <TaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={confirmedTaxInvoice}
      />
    </section>
  );
};
