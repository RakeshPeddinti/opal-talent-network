import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  ShoppingBag, 
  Truck, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Copy, 
  CheckCircle2, 
  ExternalLink, 
  Navigation, 
  Search, 
  Filter, 
  Sparkles, 
  ArrowRight,
  ShieldCheck, 
  Tag, 
  Barcode, 
  Eye, 
  RefreshCw, 
  X,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { StarRating } from './StarRating';
import { ReviewModal } from './ReviewModal';
import { CancelBookingModal } from './CancelBookingModal';
import { TaxInvoiceModal } from './TaxInvoiceModal';
import { RetailOrderRecord, OrderItem, ReviewRecord, TaxInvoiceData } from '../types';
import { downloadPdfInvoice } from '../utils/pdfInvoiceGenerator';
import { cn } from '../utils';
import { db } from '../firebase';
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface OrderHistoryViewProps {
  user: any;
  userProfile?: any;
  orders: RetailOrderRecord[];
  bookings: any[];
  isLoading: boolean;
  onOpenTracking?: (trackingId?: string) => void;
  onSwitchToClientView?: () => void;
  onSeedSampleOrders?: () => void;
  isSeedingOrders?: boolean;
}

export const OrderHistoryView: React.FC<OrderHistoryViewProps> = ({
  user,
  userProfile,
  orders,
  bookings,
  isLoading,
  onOpenTracking,
  onSwitchToClientView,
  onSeedSampleOrders,
  isSeedingOrders = false
}) => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'retail' | 'services'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Reviews System State
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalTarget, setReviewModalTarget] = useState<{
    targetType: 'provider' | 'seller';
    targetId?: string;
    targetName: string;
    referenceId: string;
    referenceType: 'booking' | 'order';
    itemTitle: string;
    existingReview?: ReviewRecord | null;
  } | null>(null);
  const [reviewNotification, setReviewNotification] = useState<string | null>(null);

  // Booking Cancellation State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<any | null>(null);
  const [cancelNotification, setCancelNotification] = useState<string | null>(null);

  // Commercial Tax Invoice Modal State (For Buyers Only)
  const [activeInvoiceData, setActiveInvoiceData] = useState<TaxInvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  useEffect(() => {
    const reviewsRef = collection(db, 'reviews');
    const unsubscribe = onSnapshot(reviewsRef, (snapshot) => {
      const allReviews = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as ReviewRecord[];
      setReviews(allReviews);
    }, (error) => {
      console.warn("Reviews fetch notice:", error);
    });

    return () => unsubscribe();
  }, []);

  const getReviewForItem = (refId: string, id?: string) => {
    return reviews.find(r => r.referenceId === refId || (id && r.referenceId === id));
  };

  const handleOpenReview = (item: any) => {
    const existing = getReviewForItem(item.refId, item.id);
    const isService = item.entryType === 'service_booking';
    
    setReviewModalTarget({
      targetType: isService ? 'provider' : 'seller',
      targetId: isService ? (item.originalData?.providerId || '') : (item.originalData?.sellerId || ''),
      targetName: isService 
        ? (item.providerName || 'Service Specialist')
        : (item.originalData?.pickupShowroom ? item.showroomName : (item.items?.[0]?.brand || 'Milano Sartoriale')),
      referenceId: item.refId,
      referenceType: isService ? 'booking' : 'order',
      itemTitle: isService ? item.title : (item.items?.map((it: any) => it.name).join(', ') || item.title),
      existingReview: existing || null
    });
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = async (reviewData: Omit<ReviewRecord, 'id' | 'createdAt'>) => {
    const existing = reviewModalTarget?.existingReview;
    if (existing?.id) {
      await updateDoc(doc(db, 'reviews', existing.id), {
        ...reviewData,
        updatedAt: serverTimestamp()
      });
      setReviewNotification(`Updated review for ${reviewData.targetName}!`);
    } else {
      await addDoc(collection(db, 'reviews'), {
        ...reviewData,
        createdAt: serverTimestamp()
      });
      setReviewNotification(`Published ${reviewData.rating}★ review for ${reviewData.targetName}!`);
    }
    setTimeout(() => setReviewNotification(null), 4000);
  };

  const handleOpenCancelModal = (item: any) => {
    setBookingToCancel(item);
    setIsCancelModalOpen(true);
  };

  const handleConfirmCancelBooking = async (bookingId: string, reason: string, notes?: string) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      cancelledAt: serverTimestamp(),
      cancelledBy: 'seeker',
      cancellationReason: reason,
      cancellationNotes: notes || null,
      updatedAt: serverTimestamp()
    });
    setCancelNotification(`Appointment ${bookingToCancel?.refId || ''} has been cancelled successfully.`);
    setTimeout(() => setCancelNotification(null), 5000);
  };

  const handleViewTaxInvoice = (item: any) => {
    const raw = item.originalData || {};
    const subtotal = raw.subtotal || raw.itemsSubtotal || item.totalPrice || 0;
    const taxRate = raw.taxRate || 0.0825;
    const taxRatePercentage = raw.taxRatePercentage || `${(taxRate * 100).toFixed(2)}%`;
    const taxAmount = raw.taxAmount != null ? raw.taxAmount : Math.round(subtotal * taxRate * 100) / 100;
    const shippingFee = raw.shippingFee || raw.carrierRate || 0;
    const grandTotal = raw.totalPrice || (subtotal + taxAmount + shippingFee);
    const invoiceNumber = raw.invoiceNumber || `INV-${item.refId.replace('OPAL-', '')}`;
    const invoiceDate = raw.invoiceDate || item.dateStr || new Date().toLocaleDateString('en-US');

    const invoice: TaxInvoiceData = {
      invoiceNumber,
      orderId: item.refId,
      invoiceDate,
      status: 'paid',
      seller: {
        businessName: raw.pickupShowroom || item.showroomName || 'Milano Sartoriale Home Atelier',
        ownerName: 'Opal Registered Home Artisan',
        taxId: raw.sellerTaxId || 'US-EIN-95-4819201',
        studioAddress: item.pickupAddress || '450 N Rodeo Dr Suite 300, Beverly Hills, CA 90210',
        phone: '(415) 890-6725',
        email: 'atelier@opal-business.portal'
      },
      customer: {
        name: raw.customerName || user?.displayName || 'Valued Buyer',
        email: raw.customerEmail || user?.email || 'buyer@opal-client.portal',
        phone: raw.customerPhone || '+1 (555) 019-2834',
        address: item.shippingAddress || item.pickupAddress || 'Customer Destination Address'
      },
      fulfillmentType: item.fulfillmentType || 'delivery',
      items: (item.items && item.items.length > 0) ? item.items.map((it: any) => ({
        name: it.name,
        brand: it.brand,
        sku: it.sku,
        price: it.price || it.unitPrice,
        unitPrice: it.unitPrice || it.price,
        size: it.size,
        color: it.color,
        quantity: it.quantity || 1
      })) : [{
        name: item.title,
        price: subtotal,
        unitPrice: subtotal,
        quantity: 1
      }],
      subtotal,
      taxRate,
      taxRatePercentage,
      taxAmount,
      shippingFee,
      grandTotal,
      paymentMethod: raw.paymentMethod || 'Credit / Debit Card (Secured)'
    };

    setActiveInvoiceData(invoice);
    setIsInvoiceModalOpen(true);
  };

  const handleDownloadPdfInvoice = (item: any) => {
    const raw = item.originalData || {};
    const subtotal = raw.subtotal || raw.itemsSubtotal || item.totalPrice || 0;
    const taxRate = raw.taxRate || 0.0825;
    const taxRatePercentage = raw.taxRatePercentage || `${(taxRate * 100).toFixed(2)}%`;
    const taxAmount = raw.taxAmount != null ? raw.taxAmount : Math.round(subtotal * taxRate * 100) / 100;
    const shippingFee = raw.shippingFee || raw.carrierRate || 0;
    const grandTotal = raw.totalPrice || (subtotal + taxAmount + shippingFee);
    const invoiceNumber = raw.invoiceNumber || `INV-${item.refId.replace('OPAL-', '')}`;
    const invoiceDate = raw.invoiceDate || item.dateStr || new Date().toLocaleDateString('en-US');

    const invoice: TaxInvoiceData = {
      invoiceNumber,
      orderId: item.refId,
      invoiceDate,
      status: 'paid',
      seller: {
        businessName: raw.pickupShowroom || item.showroomName || 'Milano Sartoriale Home Atelier',
        ownerName: 'Opal Registered Home Artisan',
        taxId: raw.sellerTaxId || 'US-EIN-95-4819201',
        studioAddress: item.pickupAddress || '450 N Rodeo Dr Suite 300, Beverly Hills, CA 90210',
        phone: '(415) 890-6725',
        email: 'atelier@opal-business.portal'
      },
      customer: {
        name: raw.customerName || user?.displayName || 'Valued Buyer',
        email: raw.customerEmail || user?.email || 'buyer@opal-client.portal',
        phone: raw.customerPhone || '+1 (555) 019-2834',
        address: item.shippingAddress || item.pickupAddress || 'Customer Destination Address'
      },
      fulfillmentType: item.fulfillmentType || 'delivery',
      items: (item.items && item.items.length > 0) ? item.items.map((it: any) => ({
        name: it.name,
        brand: it.brand,
        sku: it.sku,
        price: it.price || it.unitPrice,
        unitPrice: it.unitPrice || it.price,
        size: it.size,
        color: it.color,
        quantity: it.quantity || 1
      })) : [{
        name: item.title,
        price: subtotal,
        unitPrice: subtotal,
        quantity: 1
      }],
      subtotal,
      taxRate,
      taxRatePercentage,
      taxAmount,
      shippingFee,
      grandTotal,
      paymentMethod: raw.paymentMethod || 'Credit / Debit Card (Secured)'
    };

    downloadPdfInvoice(invoice);
  };

  const handleCopy = (text: string, key: string) => {
    try {
      navigator.clipboard?.writeText(text.replace(/\s/g, ''));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.warn("Clipboard copy notice:", e);
    }
  };

  // Normalize and combine both retail orders and service bookings into a unified timeline
  const combinedHistory = useMemo(() => {
    const list: any[] = [];

    // 1. Process Retail Product Orders
    orders.forEach(order => {
      let sortTimestamp = 0;
      if (order.createdAt?.seconds) {
        sortTimestamp = order.createdAt.seconds * 1000;
      } else if (order.createdAt?.toMillis) {
        sortTimestamp = order.createdAt.toMillis();
      } else if (order.createdAt) {
        sortTimestamp = new Date(order.createdAt).getTime();
      }

      list.push({
        id: order.id || order.orderId,
        refId: order.orderId || order.id,
        entryType: 'retail_order',
        title: order.department ? `${order.department} Collection` : 'Boutique Retail Order',
        fulfillmentType: order.fulfillmentType || (order.pickupShowroom ? 'pickup' : 'delivery'),
        carrier: order.shippingCarrier || 'FedEx Express',
        serviceName: order.shippingService || 'FedEx 2Day® Express',
        trackingNumber: order.trackingNumber,
        trackingUrl: order.trackingUrl,
        estimatedDelivery: order.estimatedDelivery || 'In 2 Business Days',
        shippingAddress: order.shippingAddress || 'Customer Destination Address',
        showroomName: order.pickupShowroom || 'Milano Sartoriale Flagship Showroom',
        pickupAddress: order.pickupAddress || '450 N Rodeo Dr, Beverly Hills, CA 90210',
        pickupHours: 'Mon – Sun: 10:00 AM – 8:00 PM',
        status: order.status || 'confirmed',
        items: order.items || [],
        totalPrice: order.totalPrice || 0,
        subtotal: order.itemsSubtotal || order.totalPrice || 0,
        shippingFee: order.shippingFee || 0,
        paymentStatus: order.paymentStatus || 'paid_on_delivery',
        dateStr: order.createdAt?.seconds 
          ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Recent Order',
        timestamp: sortTimestamp,
        originalData: order
      });
    });

    // 2. Process Service Bookings
    bookings.forEach(booking => {
      let sortTimestamp = 0;
      if (booking.createdAt?.seconds) {
        sortTimestamp = booking.createdAt.seconds * 1000;
      } else if (booking.createdAt?.toMillis) {
        sortTimestamp = booking.createdAt.toMillis();
      } else if (booking.createdAt) {
        sortTimestamp = new Date(booking.createdAt).getTime();
      } else if (booking.date && booking.date !== 'N/A') {
        sortTimestamp = new Date(booking.date).getTime();
      }

      const servicesArray = Array.isArray(booking.serviceNames) 
        ? booking.serviceNames 
        : (booking.serviceName ? [booking.serviceName] : ['Service Appointment']);

      list.push({
        id: booking.id,
        refId: booking.bookingRefId || booking.id,
        entryType: 'service_booking',
        title: servicesArray.join(', '),
        category: booking.category || 'Beauty & Wellness',
        providerName: booking.providerName || 'Certified Opal Specialist',
        providerPhone: booking.providerPhone || '+1 (555) 392-8812',
        customerName: booking.customerName || 'Valued Client',
        date: booking.date || 'Upcoming Date',
        time: booking.time || 'Scheduled Time',
        duration: booking.duration || '60 min',
        status: booking.status || 'confirmed',
        address: booking.address || booking.location?.address || '450 N Rodeo Dr Suite 300, Beverly Hills, CA 90210',
        totalPrice: booking.totalPrice || booking.price || 0,
        paymentStatus: booking.paymentStatus || 'unpaid',
        paymentMethod: booking.paymentMethod || 'Pay on Arrival',
        dateStr: booking.date && booking.date !== 'N/A' 
          ? `${booking.date} at ${booking.time || 'Appointment'}`
          : (booking.createdAt?.seconds 
              ? new Date(booking.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Upcoming Service'),
        timestamp: sortTimestamp,
        originalData: booking
      });
    });

    // Sort descending (newest first)
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }, [orders, bookings]);

  // Filter combined history based on type, status, and search query
  const filteredHistory = useMemo(() => {
    return combinedHistory.filter(item => {
      // 1. Filter by Type
      if (typeFilter === 'retail' && item.entryType !== 'retail_order') return false;
      if (typeFilter === 'services' && item.entryType !== 'service_booking') return false;

      // 2. Filter by Status
      if (statusFilter === 'active') {
        const activeStatuses = ['confirmed', 'in_transit', 'ready_for_pickup', 'pending', 'label_created'];
        if (!activeStatuses.includes(item.status?.toLowerCase())) return false;
      }
      if (statusFilter === 'completed') {
        const completedStatuses = ['done', 'delivered', 'completed', 'picked_up'];
        if (!completedStatuses.includes(item.status?.toLowerCase())) return false;
      }
      if (statusFilter === 'cancelled') {
        if (item.status?.toLowerCase() !== 'cancelled') return false;
      }

      // 3. Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesRef = item.refId?.toLowerCase().includes(q);
        const matchesTitle = item.title?.toLowerCase().includes(q);
        const matchesCarrier = item.carrier?.toLowerCase().includes(q);
        const matchesTrackingNum = item.trackingNumber?.toLowerCase().includes(q);
        const matchesProvider = item.providerName?.toLowerCase().includes(q);
        const matchesCategory = item.category?.toLowerCase().includes(q);
        const matchesShowroom = item.showroomName?.toLowerCase().includes(q);
        const matchesAddress = item.pickupAddress?.toLowerCase().includes(q) || item.shippingAddress?.toLowerCase().includes(q) || item.address?.toLowerCase().includes(q);
        const matchesItemName = item.items?.some((i: any) => 
          i.name?.toLowerCase().includes(q) || 
          i.brand?.toLowerCase().includes(q) || 
          i.category?.toLowerCase().includes(q)
        );

        if (!matchesRef && !matchesTitle && !matchesCarrier && !matchesTrackingNum && !matchesProvider && !matchesCategory && !matchesShowroom && !matchesAddress && !matchesItemName) {
          return false;
        }
      }

      return true;
    });
  }, [combinedHistory, typeFilter, statusFilter, searchQuery]);

  const totalSpent = useMemo(() => {
    return combinedHistory.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }, [combinedHistory]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-stone-900 via-[#181716] to-stone-900 text-white p-8 rounded-3xl border border-brand-gold/30 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 mb-6 border-b border-brand-gold/15">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold text-brand-dark">
                Client History
              </span>
              <span className="text-xs text-brand-cream/60">
                Verified Records for {user?.email || 'Logged-In Account'}
              </span>
            </div>
            <h3 className="text-3xl font-serif text-white">Your Order & Service History</h3>
            <p className="text-xs text-brand-cream/70 mt-1 max-w-xl">
              Inspect past luxury services, carrier deliveries, and showroom pickup passes in one place — with instant live tracking for every record without needing to re-enter IDs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onSeedSampleOrders && (
              <button
                type="button"
                onClick={onSeedSampleOrders}
                disabled={isSeedingOrders}
                className="px-4 py-2.5 bg-brand-gold hover:bg-yellow-500 text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                title="Add sample luxury orders (FedEx delivery & Boutique Pickup) to test order history features"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isSeedingOrders ? 'Adding Orders...' : '+ Sample Orders'}
              </button>
            )}

            {onSwitchToClientView && (
              <button
                type="button"
                onClick={onSwitchToClientView}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 border border-white/15 cursor-pointer shadow-sm"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-brand-gold" />
                Shop More Articles
              </button>
            )}
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-brand-gold/15">
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/60 block mb-1">
              Total History Items
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif text-white font-bold">{combinedHistory.length}</span>
              <span className="text-[11px] text-brand-gold font-medium">Orders & Bookings</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-brand-gold/15">
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/60 block mb-1">
              Retail Product Orders
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif text-white font-bold">{orders.length}</span>
              <span className="text-[11px] text-emerald-400 font-medium">Delivered / Pickup</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-brand-gold/15">
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/60 block mb-1">
              Service Appointments
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif text-white font-bold">{bookings.length}</span>
              <span className="text-[11px] text-brand-gold font-medium">Vetted Specialists</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-brand-gold/15">
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/60 block mb-1">
              Feedback & Ratings
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif text-amber-400 font-bold flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 inline" />
                {reviews.length}
              </span>
              <span className="text-[11px] text-amber-300 font-medium">Verified Reviews</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-black/40 border border-brand-gold/15 col-span-2 md:col-span-1">
            <span className="text-[10px] uppercase tracking-wider font-bold text-brand-cream/60 block mb-1">
              Total Spend
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono text-brand-gold font-bold">${totalSpent.toLocaleString()}</span>
              <span className="text-[11px] text-brand-cream/60 font-medium">USD</span>
            </div>
          </div>
        </div>

        {(reviewNotification || cancelNotification) && (
          <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl flex items-center justify-between text-xs font-medium animate-fadeIn">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{cancelNotification || reviewNotification}</span>
            </span>
            <button 
              type="button"
              onClick={() => { setReviewNotification(null); setCancelNotification(null); }} 
              className="text-emerald-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-5 rounded-2xl border border-brand-gold/20 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-brand-cream/60 p-1 rounded-xl border border-brand-gold/20">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                typeFilter === 'all' ? "bg-brand-dark text-white shadow-xs" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              All ({combinedHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('retail')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                typeFilter === 'retail' ? "bg-brand-dark text-white shadow-xs" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-brand-gold" />
              <span>Retail Orders ({orders.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('services')}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                typeFilter === 'services' ? "bg-brand-dark text-white shadow-xs" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              <Calendar className="w-3.5 h-3.5 text-brand-gold" />
              <span>Service Bookings ({bookings.length})</span>
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex bg-brand-cream/60 p-1 rounded-xl border border-brand-gold/20 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                statusFilter === 'all' ? "bg-white text-brand-dark shadow-xs" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              All Statuses
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                statusFilter === 'active' ? "bg-white text-emerald-800 shadow-xs" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              Active / In Transit
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                statusFilter === 'completed' ? "bg-white text-brand-dark shadow-xs" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('cancelled')}
              className={cn(
                "px-2.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer",
                statusFilter === 'cancelled' ? "bg-white text-red-700 shadow-xs" : "text-brand-muted hover:text-brand-dark"
              )}
            >
              Cancelled
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items, carrier, or ID..."
            className="w-full pl-10 pr-8 py-2 bg-brand-cream/40 border border-brand-gold/25 focus:border-brand-gold rounded-xl text-xs text-brand-dark focus:outline-none focus:ring-1 focus:ring-brand-gold"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Orders List / Cards */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-brand-gold/20 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center mx-auto text-brand-gold">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-xl font-serif text-brand-dark">No Orders Found</h4>
            <p className="text-xs text-brand-muted mt-1 leading-relaxed">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'No past orders matched your active filter criteria. Try adjusting filters or search keywords.'
                : 'You have not placed any service bookings or retail orders yet under this account.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {onSeedSampleOrders && (
              <button
                type="button"
                onClick={onSeedSampleOrders}
                disabled={isSeedingOrders}
                className="px-5 py-2.5 bg-brand-gold text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-yellow-500 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                {isSeedingOrders ? 'Generating Orders...' : 'Add Sample Orders for Testing'}
              </button>
            )}
            {onSwitchToClientView && (
              <button
                type="button"
                onClick={onSwitchToClientView}
                className="px-5 py-2.5 bg-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-brand-dark transition-all shadow-sm cursor-pointer"
              >
                Browse Services & Retail Storefront
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredHistory.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-brand-gold/25 p-6 md:p-7 shadow-md hover:border-brand-gold/50 transition-all flex flex-col justify-between"
            >
              {/* Card Top Row: ID, Badges, Date */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-brand-gold/15">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1",
                    item.entryType === 'retail_order' 
                      ? "bg-amber-100 text-amber-900 border border-amber-300" 
                      : "bg-blue-100 text-blue-900 border border-blue-300"
                  )}>
                    {item.entryType === 'retail_order' ? (
                      <>
                        <ShoppingBag className="w-3 h-3 text-amber-700" />
                        <span>Retail Order</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3 h-3 text-blue-700" />
                        <span>Service Booking</span>
                      </>
                    )}
                  </span>

                  {item.entryType === 'retail_order' ? (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-cream/80 text-brand-dark border border-brand-gold/20 flex items-center gap-1">
                      {item.fulfillmentType === 'pickup' ? (
                        <>
                          <MapPin className="w-3 h-3 text-brand-gold" />
                          <span>Boutique Showroom Pickup</span>
                        </>
                      ) : (
                        <>
                          <Truck className="w-3 h-3 text-brand-gold" />
                          <span>{item.serviceName || `${item.carrier} Express`}</span>
                        </>
                      )}
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-cream/80 text-brand-dark border border-brand-gold/20">
                      {item.category}
                    </span>
                  )}

                  {/* Status Indicator Badge */}
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
                    item.status === 'in_transit' ? "bg-amber-100 text-amber-800 border border-amber-300" :
                    item.status === 'ready_for_pickup' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                    item.status === 'delivered' || item.status === 'done' ? "bg-green-100 text-green-800 border border-green-300" :
                    item.status === 'cancelled' ? "bg-red-100 text-red-800 border border-red-300" :
                    "bg-blue-50 text-blue-800 border border-blue-200"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      item.status === 'in_transit' || item.status === 'ready_for_pickup' ? "bg-emerald-500 animate-pulse" : "bg-current"
                    )} />
                    {item.status?.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Reference ID with Copy Button & Date */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-brand-cream/60 px-3 py-1 rounded-xl border border-brand-gold/20">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Ref:</span>
                    <span className="font-mono font-bold text-xs text-brand-dark">{item.refId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(item.refId, item.id)}
                      className="p-0.5 rounded text-brand-muted hover:text-brand-dark transition-colors"
                      title="Copy Reference ID"
                    >
                      {copiedKey === item.id ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <span className="text-xs text-brand-muted font-medium">{item.dateStr}</span>
                </div>
              </div>

              {/* Card Body: Details Based on Type */}
              {item.entryType === 'retail_order' ? (
                /* RETAIL ORDER SPECIFICS */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-2">
                  {/* Left (Cols 1-2): Articles in Order */}
                  <div className="lg:col-span-2 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      Purchased Articles ({item.items.length || 1})
                    </p>

                    {item.items && item.items.length > 0 ? (
                      <div className="space-y-2.5">
                        {item.items.map((art: OrderItem, idx: number) => (
                          <div 
                            key={idx} 
                            className="flex items-center justify-between p-3 rounded-2xl bg-brand-cream/30 border border-brand-gold/15 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-brand-gold/20 flex items-center justify-center text-brand-gold font-bold shrink-0 shadow-2xs">
                                <Package className="w-5 h-5 text-brand-gold" />
                              </div>
                              <div>
                                <h5 className="font-bold text-brand-dark">{art.name}</h5>
                                <div className="flex items-center gap-2 text-[11px] text-brand-muted mt-0.5">
                                  {art.brand && <span className="font-medium text-brand-gold">{art.brand}</span>}
                                  {art.size && <span>Size: <strong>{art.size}</strong></span>}
                                  {art.color && (
                                    <span className="flex items-center gap-1">
                                      Color: <strong>{art.color}</strong>
                                      {art.colorHex && (
                                        <span 
                                          className="w-2.5 h-2.5 rounded-full inline-block border border-black/20" 
                                          style={{ backgroundColor: art.colorHex }} 
                                        />
                                      )}
                                    </span>
                                  )}
                                  <span>Qty: <strong>{art.quantity}</strong></span>
                                </div>
                              </div>
                            </div>
                            <span className="font-mono font-bold text-sm text-brand-dark">${art.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-brand-cream/30 border border-brand-gold/15 text-xs">
                        <span className="font-bold text-brand-dark">{item.title}</span>
                      </div>
                    )}

                    {/* Milestone Progress Tracker */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                        <span>Fulfillment Milestone</span>
                        <span className="text-brand-gold font-semibold">{item.status?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(item.fulfillmentType === 'pickup' ? [
                          { title: 'Confirmed', done: true },
                          { title: 'Inspected', done: true },
                          { title: 'Ready', done: item.status !== 'cancelled' },
                          { title: 'Picked Up', done: item.status === 'delivered' || item.status === 'picked_up' }
                        ] : [
                          { title: 'Placed', done: true },
                          { title: 'Packed', done: true },
                          { title: 'In Transit', done: item.status === 'in_transit' || item.status === 'delivered' },
                          { title: 'Delivered', done: item.status === 'delivered' }
                        ]).map((stg, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "h-1.5 rounded-full transition-all",
                              stg.done ? "bg-brand-gold shadow-2xs" : "bg-stone-200"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right (Col 3): Delivery or Pickup Coordinates */}
                  <div className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-gold/20 flex flex-col justify-between text-xs space-y-3">
                    {item.fulfillmentType === 'pickup' ? (
                      <>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-brand-gold block mb-1">
                            Showroom Pickup Pass
                          </span>
                          <p className="font-serif font-bold text-sm text-brand-dark">{item.showroomName}</p>
                          <p className="text-brand-muted text-[11px] mt-1 flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                            <span>{item.pickupAddress}</span>
                          </p>
                          <p className="text-emerald-700 text-[11px] mt-1 font-medium flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{item.pickupHours}</span>
                          </p>
                        </div>
                        <div className="pt-2 border-t border-brand-gold/15">
                          <a
                            href={`https://maps.google.com/?q=${encodeURIComponent(item.pickupAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 bg-white hover:bg-brand-gold hover:text-brand-dark text-brand-dark rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-brand-gold/20 shadow-2xs"
                          >
                            <Navigation className="w-3 h-3 text-brand-gold" />
                            <span>Get GPS Directions</span>
                          </a>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-brand-gold block mb-1">
                            Carrier Delivery Manifest
                          </span>
                          <p className="font-bold text-brand-dark">{item.serviceName}</p>
                          <p className="text-emerald-700 font-medium text-[11px] mt-0.5">
                            ETA: {item.estimatedDelivery}
                          </p>
                          <div className="mt-2 text-brand-muted text-[11px] flex items-start gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                            <span className="truncate">{item.shippingAddress}</span>
                          </div>
                          {item.trackingNumber && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[10px] text-brand-muted font-mono">Tracking:</span>
                              <span className="font-mono font-bold text-brand-dark bg-white px-2 py-0.5 rounded border border-brand-gold/20 text-[11px]">
                                {item.trackingNumber}
                              </span>
                            </div>
                          )}
                        </div>
                        {item.trackingUrl && (
                          <div className="pt-2 border-t border-brand-gold/15">
                            <a
                              href={item.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-brand-gold hover:underline flex items-center gap-1"
                            >
                              <span>Official {item.carrier} Tracking Portal</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                /* SERVICE BOOKING SPECIFICS */
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 my-2">
                  <div className="lg:col-span-2 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
                      Reserved Service & Assigned Specialist
                    </p>

                    <div className="p-4 rounded-2xl bg-brand-cream/30 border border-brand-gold/15 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-serif font-bold text-base text-brand-dark">{item.title}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white text-brand-gold border border-brand-gold/20">
                          {item.duration}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-brand-muted text-[11px] pt-1">
                        <span className="flex items-center gap-1 font-medium text-brand-dark">
                          <span className="text-brand-gold">★</span> Provider: <strong className="text-brand-gold">{item.providerName}</strong>
                        </span>
                        {item.providerPhone && (
                          <a href={`tel:${item.providerPhone}`} className="text-brand-dark hover:text-brand-gold flex items-center gap-1">
                            <Phone className="w-3 h-3 text-brand-gold" />
                            <span>{item.providerPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-1.5">
                        <span>Service Status Milestone</span>
                        <span className={cn(
                          "font-semibold",
                          item.status === 'cancelled' ? "text-red-600 font-bold" : "text-brand-gold"
                        )}>
                          {item.status}
                        </span>
                      </div>
                      {item.status === 'cancelled' ? (
                        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex flex-wrap items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-bold">
                            <XCircle className="w-4 h-4 text-red-600" />
                            Appointment Cancelled
                          </span>
                          {item.originalData?.cancellationReason && (
                            <span className="text-[11px] text-red-600/80 italic">
                              "{item.originalData.cancellationReason}"
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-4 gap-1.5">
                          {[
                            { title: 'Requested', done: true },
                            { title: 'Confirmed', done: true },
                            { title: 'En Route', done: item.status === 'done' || item.status === 'confirmed' },
                            { title: 'Completed', done: item.status === 'done' }
                          ].map((stg, i) => (
                            <div 
                              key={i} 
                              className={cn(
                                "h-1.5 rounded-full transition-all",
                                stg.done ? "bg-brand-gold shadow-2xs" : "bg-stone-200"
                              )} 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scheduled Date & Location */}
                  <div className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-gold/20 flex flex-col justify-between text-xs space-y-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-brand-gold block mb-1">
                        Appointment Slot
                      </span>
                      <p className="font-bold text-brand-dark text-sm">{item.date}</p>
                      <p className="text-brand-gold font-medium text-xs mt-0.5">Time: {item.time}</p>
                      <div className="mt-2 text-brand-muted text-[11px] flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                        <span>{item.address}</span>
                      </div>
                    </div>
                    {item.providerPhone && (
                      <div className="pt-2 border-t border-brand-gold/15">
                        <a
                          href={`tel:${item.providerPhone}`}
                          className="w-full py-2 px-3 bg-white hover:bg-brand-gold hover:text-brand-dark text-brand-dark rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-brand-gold/20 shadow-2xs"
                        >
                          <Phone className="w-3 h-3 text-brand-gold" />
                          <span>Contact Specialist</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Existing Review Preview Block */}
              {(() => {
                const existingRev = getReviewForItem(item.refId, item.id);
                if (!existingRev) return null;
                return (
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50/80 via-brand-cream/50 to-amber-50/80 border border-brand-gold/30 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <StarRating rating={existingRev.rating} size="sm" />
                        <span className="font-serif font-bold text-brand-dark text-sm">{existingRev.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {existingRev.recommend && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3 text-emerald-600" />
                            Recommended
                          </span>
                        )}
                        <span className="text-[10px] text-brand-muted font-medium">Verified Client Review</span>
                      </div>
                    </div>
                    <p className="text-brand-dark/90 italic font-serif text-xs">"{existingRev.comment}"</p>
                    {existingRev.tags && existingRev.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {existingRev.tags.map((t: string) => (
                          <span key={t} className="text-[10px] font-medium px-2 py-0.5 bg-white rounded-lg border border-brand-gold/20 text-brand-dark">
                            ✓ {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Card Footer: Total Price & Action Buttons */}
              <div className="mt-4 pt-4 border-t border-brand-gold/15 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-brand-muted uppercase tracking-wider font-bold">Total Paid:</span>
                  <span className="font-mono font-bold text-lg text-brand-dark">${item.totalPrice}</span>
                  <span className="text-[11px] text-emerald-700 font-medium px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200">
                    {item.paymentStatus}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Cancel Booking Option - For upcoming service appointments */}
                  {item.entryType === 'service_booking' && 
                   item.status?.toLowerCase() !== 'cancelled' && 
                   item.status?.toLowerCase() !== 'done' && 
                   item.status?.toLowerCase() !== 'completed' && (
                    <button
                      type="button"
                      onClick={() => handleOpenCancelModal(item)}
                      className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/90 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Cancel this upcoming appointment"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-600" />
                      <span>Cancel Booking</span>
                    </button>
                  )}

                  {/* Cancelled Indicator */}
                  {item.entryType === 'service_booking' && item.status?.toLowerCase() === 'cancelled' && (
                    <span className="px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200/80 flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      <span>Booking Cancelled</span>
                    </span>
                  )}

                  {/* Star Rating & Review Button - only when not cancelled */}
                  {item.status?.toLowerCase() !== 'cancelled' && (() => {
                    const existingRev = getReviewForItem(item.refId, item.id);
                    const isCompleted = ['done', 'completed', 'delivered', 'picked_up'].includes(item.status?.toLowerCase());

                    if (existingRev) {
                      return (
                        <button
                          type="button"
                          onClick={() => handleOpenReview(item)}
                          className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="View or update your submitted review"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Rated {existingRev.rating}★</span>
                          <span className="text-[10px] text-brand-muted font-normal underline ml-0.5">Edit</span>
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => handleOpenReview(item)}
                        className={cn(
                          "px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer",
                          isCompleted
                            ? "bg-brand-gold text-brand-dark hover:bg-white border border-brand-gold"
                            : "bg-white hover:bg-brand-gold/10 text-brand-dark border border-brand-gold/40"
                        )}
                        title="Rate your experience and leave feedback for the provider or seller"
                      >
                        <Star className={cn("w-3.5 h-3.5", isCompleted ? "fill-brand-dark" : "text-brand-gold")} />
                        <span>{isCompleted ? '★ Rate & Review' : 'Feedback'}</span>
                      </button>
                    );
                  })()}

                  {/* Official Commercial Tax Invoice Actions - Only for retail orders (buyers) */}
                  {item.entryType === 'retail_order' && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleViewTaxInvoice(item)}
                        className="px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="View official commercial tax invoice for this purchase"
                      >
                        <span>📄</span>
                        <span>Tax Invoice</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadPdfInvoice(item)}
                        className="px-3 py-2.5 bg-neutral-900 hover:bg-black text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                        title="Directly download official PDF invoice file"
                      >
                        <span>📥</span>
                        <span>PDF</span>
                      </button>
                    </div>
                  )}

                  {onOpenTracking && (
                    <button
                      type="button"
                      onClick={() => onOpenTracking(item.refId)}
                      className="px-5 py-2.5 bg-brand-dark hover:bg-brand-gold text-white hover:text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-brand-gold hover:text-brand-dark" />
                      <span>{item.entryType === 'retail_order' && item.fulfillmentType === 'pickup' ? 'View Digital Pickup Pass' : 'Track Live Milestones'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal Dialog */}
      {reviewModalTarget && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setReviewModalTarget(null);
          }}
          targetType={reviewModalTarget.targetType}
          targetId={reviewModalTarget.targetId}
          targetName={reviewModalTarget.targetName}
          referenceId={reviewModalTarget.referenceId}
          referenceType={reviewModalTarget.referenceType}
          itemTitle={reviewModalTarget.itemTitle}
          existingReview={reviewModalTarget.existingReview}
          currentUser={user}
          onSubmitReview={handleSaveReview}
        />
      )}

      {/* Cancel Booking Confirmation Modal */}
      {bookingToCancel && (
        <CancelBookingModal
          isOpen={isCancelModalOpen}
          onClose={() => {
            setIsCancelModalOpen(false);
            setBookingToCancel(null);
          }}
          booking={bookingToCancel}
          onConfirmCancel={handleConfirmCancelBooking}
        />
      )}

      {/* Official Commercial Tax Invoice Modal (For Buyers Only) */}
      <TaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setActiveInvoiceData(null);
        }}
        invoiceData={activeInvoiceData}
      />
    </div>
  );
};
