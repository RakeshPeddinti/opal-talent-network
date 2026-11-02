import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Search, 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Navigation, 
  Phone, 
  ShoppingBag, 
  Sparkles, 
  AlertCircle,
  Barcode,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { cn } from '../utils';

export interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingId?: string;
  user?: any;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialTrackingId = '',
  user
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [trackingRecord, setTrackingRecord] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [recentLookups, setRecentLookups] = useState<string[]>([]);

  // Load recent lookups from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('opal_recent_tracking_ids');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentLookups(parsed.slice(0, 4));
        }
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const saveRecentLookup = (id: string) => {
    try {
      const cleaned = id.trim();
      if (!cleaned) return;
      const updated = [cleaned, ...recentLookups.filter(x => x.toLowerCase() !== cleaned.toLowerCase())].slice(0, 4);
      setRecentLookups(updated);
      localStorage.setItem('opal_recent_tracking_ids', JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }
  };

  const handleCopy = (text: string, key: string) => {
    try {
      navigator.clipboard?.writeText(text.replace(/\s/g, ''));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.warn("Clipboard write notice:", e);
    }
  };

  // Perform search by ID across Firestore and Server API
  const handleLookup = async (idToSearch?: string) => {
    const rawId = (idToSearch || searchInput).trim();
    if (!rawId) {
      setErrorMessage("Please enter a Booking Reference ID, Order Number, or Carrier Tracking Number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      let foundRecord: any = null;

      // 1. Try querying Firestore for client-created orders or bookings if db is available
      try {
        // A. Search orders collection by orderId
        const ordersQuery = query(collection(db, 'orders'), where('orderId', '==', rawId));
        const ordersSnap = await getDocs(ordersQuery);
        if (!ordersSnap.empty) {
          const docData = ordersSnap.docs[0].data();
          foundRecord = {
            type: 'product_order',
            fulfillmentType: docData.fulfillmentType || (docData.pickupShowroom ? 'pickup' : 'delivery'),
            id: docData.orderId,
            orderId: docData.orderId,
            department: docData.department || 'Boutique Collection',
            customerName: docData.customerName,
            customerPhone: docData.customerPhone,
            status: docData.status === 'confirmed' ? (docData.fulfillmentType === 'pickup' ? 'ready_for_pickup' : 'in_transit') : docData.status,
            statusMessage: docData.fulfillmentType === 'pickup' 
              ? `Your order is ready for pickup at ${docData.pickupShowroom || 'the Flagship Showroom'}.`
              : `Your package is in transit with ${docData.shippingCarrier || 'FedEx Express'}.`,
            carrier: docData.shippingCarrier || 'FedEx Express',
            serviceName: docData.shippingService || 'FedEx 2Day® Express',
            trackingNumber: docData.trackingNumber || `7946 ${Math.floor(1000 + Math.random()*9000)} ${Math.floor(1000 + Math.random()*9000)}`,
            trackingUrl: docData.trackingUrl || `https://www.fedex.com/fedextrack/?trknbr=${(docData.trackingNumber || '').replace(/\s/g, '')}`,
            estimatedDelivery: docData.estimatedDelivery || 'In 2 Business Days',
            destination: docData.shippingAddress || 'Customer Destination',
            showroomName: docData.pickupShowroom || 'Milano Sartoriale Flagship Showroom',
            pickupAddress: docData.pickupAddress || '450 N Rodeo Dr, Beverly Hills, CA 90210',
            pickupHours: 'Mon – Sun: 10:00 AM – 8:00 PM',
            pickupPassCode: `PASS-BH-${Math.floor(1000 + Math.random()*9000)}`,
            mapUrl: `https://maps.google.com/?q=${encodeURIComponent(docData.pickupAddress || '450 N Rodeo Dr, Beverly Hills, CA 90210')}`,
            items: docData.items || [],
            totalPrice: docData.totalPrice || docData.itemsSubtotal || 0,
            stages: docData.fulfillmentType === 'pickup' ? [
              { title: "Order Confirmed", completed: true, timestamp: "Today, Order Created" },
              { title: "Prepared & Inspected", completed: true, timestamp: "Verified by Tailor" },
              { title: "Ready for Pickup", completed: true, current: true, timestamp: "Waiting at Showroom" },
              { title: "Picked Up", completed: false }
            ] : [
              { title: "Order Placed", completed: true, timestamp: "Online Confirmation" },
              { title: "Manifest & Packed", completed: true, timestamp: "Beverly Hills Hub" },
              { title: "In Transit with Carrier", completed: true, current: true, timestamp: "Courier En Route" },
              { title: "Delivered", completed: false }
            ],
            checkpoints: [
              {
                status: "In Transit",
                location: "Regional Sort Hub, Los Angeles, CA",
                timestamp: new Date().toISOString(),
                description: `Package is en route with ${docData.shippingCarrier || 'FedEx Express'}.`
              },
              {
                status: "Label Created",
                location: "Beverly Hills Fulfillment Center, CA",
                timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
                description: "Electronic shipping manifest transmitted and verified."
              }
            ]
          };
        }
      } catch (e) {
        // Firestore query failed or offline, proceed to backend endpoint
      }

      // B. If not found in orders, check Firestore bookings collection
      if (!foundRecord) {
        try {
          const bookingsQuery = query(collection(db, 'bookings'), where('bookingRefId', '==', rawId));
          let bookingsSnap = await getDocs(bookingsQuery);
          
          if (bookingsSnap.empty) {
            // Also try matching by doc ID
            try {
              const docSnap = await getDoc(doc(db, 'bookings', rawId));
              if (docSnap.exists()) {
                bookingsSnap = { empty: false, docs: [docSnap] } as any;
              }
            } catch (ignore) {}
          }

          if (!bookingsSnap.empty) {
            const bData = bookingsSnap.docs[0].data();
            foundRecord = {
              type: 'service_booking',
              id: bData.bookingRefId || rawId,
              serviceName: bData.serviceName || 'Specialist Reservation',
              category: bData.category || 'Beauty & Personal Care',
              providerName: bData.providerName || 'Certified Opal Specialist',
              providerPhone: '+1 (555) 392-8812',
              customerName: bData.customerName || 'Valued Client',
              customerPhone: bData.customerPhone || 'On File',
              date: bData.date || 'Upcoming Date',
              time: bData.time || 'Scheduled Time',
              status: bData.status || 'confirmed',
              statusCode: bData.status === 'cancelled' ? 'APPOINTMENT_CANCELLED' : 'CONFIRMED_SCHEDULED',
              statusMessage: bData.status === 'cancelled'
                ? `This appointment was cancelled${bData.cancellationReason ? ` (${bData.cancellationReason})` : ''}.`
                : `Appointment confirmed for ${bData.date} at ${bData.time}. Specialist assigned.`,
              address: bData.location?.address || 'Client Address / Provider Studio',
              price: bData.price || 150,
              paymentStatus: bData.paymentStatus || 'unpaid',
              paymentMethod: bData.paymentStatus === 'paid' ? 'Paid Online' : 'Pay on Service Arrival',
              stages: bData.status === 'cancelled' ? [
                { title: "Booking Received", completed: true, timestamp: "Submitted" },
                { title: "Appointment Cancelled", completed: true, current: true, timestamp: "Cancelled", description: bData.cancellationReason || "Cancelled by client" }
              ] : [
                { title: "Booking Received", completed: true, timestamp: "Submitted" },
                { title: "Confirmed by Provider", completed: true, current: true, timestamp: "Specialist Assigned" },
                { title: "Specialist En Route", completed: false, description: "Dispatches 30m prior to slot" },
                { title: "Service Completed", completed: false }
              ]
            };
          }
        } catch (e) {
          // Proceed to backend endpoint
        }
      }

      // 2. If not found in Firestore, query the backend unified tracking endpoint
      if (!foundRecord) {
        const res = await fetch(`/api/tracking/lookup/${encodeURIComponent(rawId)}`);
        if (res.ok) {
          foundRecord = await res.json();
        } else if (res.status === 404) {
          const errData = await res.json().catch(() => ({}));
          setErrorMessage(errData.error || `No order or booking found matching '${rawId}'.`);
        } else {
          setErrorMessage("Unable to connect to the tracking network. Please try again.");
        }
      }

      if (foundRecord) {
        setTrackingRecord(foundRecord);
        saveRecentLookup(rawId);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred while searching for this order.");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger search if initialTrackingId is provided on open
  useEffect(() => {
    if (isOpen && initialTrackingId) {
      setSearchInput(initialTrackingId);
      handleLookup(initialTrackingId);
    } else if (isOpen && !initialTrackingId && !trackingRecord) {
      setSearchInput('');
      setErrorMessage(null);
    }
  }, [isOpen, initialTrackingId]);

  if (!isOpen || (user !== undefined && !user)) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        className="relative w-full max-w-3xl bg-[#141312] border border-brand-gold/30 rounded-3xl shadow-2xl text-white overflow-hidden my-auto"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-gold/15 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-serif tracking-tight text-white flex items-center gap-2">
                <span>Track My Order & Booking</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-sans font-bold uppercase tracking-wider border border-brand-gold/30">
                  Live Status
                </span>
              </h2>
              <p className="text-xs text-brand-cream/60">
                Real-time tracking for services, carrier delivery & boutique pickup
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Demo Quick Filters */}
        <div className="p-6 bg-[#1A1918] border-b border-brand-gold/15">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="flex flex-col sm:flex-row items-stretch gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-brand-gold absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                placeholder="Enter Booking ID, Order #, or Carrier Tracking..."
                className="w-full pl-11 pr-4 py-3.5 bg-black/50 border border-brand-gold/25 focus:border-brand-gold rounded-2xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-brand-gold transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchInput.trim()}
              className="px-6 py-3.5 bg-brand-gold hover:bg-yellow-500 text-brand-dark rounded-2xl font-bold uppercase tracking-wider text-xs transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Status</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Sample Pills */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold/80 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand-gold" />
              Try Demo IDs:
            </span>
            <button
              type="button"
              onClick={() => {
                setSearchInput('OPAL-BK-BEAUTY');
                handleLookup('OPAL-BK-BEAUTY');
              }}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-brand-gold/20 text-white/80 hover:text-brand-gold border border-brand-gold/20 text-[11px] font-mono transition-all cursor-pointer"
            >
              💆 Service Booking (OPAL-BK-BEAUTY)
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('OPAL-ORD-FEDEX');
                handleLookup('OPAL-ORD-FEDEX');
              }}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-brand-gold/20 text-white/80 hover:text-brand-gold border border-brand-gold/20 text-[11px] font-mono transition-all cursor-pointer"
            >
              🚚 FedEx Express (OPAL-ORD-FEDEX)
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchInput('OPAL-ORD-PICKUP');
                handleLookup('OPAL-ORD-PICKUP');
              }}
              className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-brand-gold/20 text-white/80 hover:text-brand-gold border border-brand-gold/20 text-[11px] font-mono transition-all cursor-pointer"
            >
              🛍️ Showroom Pickup (OPAL-ORD-PICKUP)
            </button>
          </div>
        </div>

        {/* Content Area: Status Results OR Empty/Error State */}
        <div className="p-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 mb-6 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-red-100">Tracking Reference Not Found</h4>
                <p className="text-xs text-red-200/80 mt-1 leading-relaxed">
                  {errorMessage}
                </p>
                <p className="text-[11px] text-red-300/70 mt-2">
                  Tip: If you just booked a service or placed an order, check your SMS text confirmation, or click any of the sample demo buttons above to preview live tracking.
                </p>
              </div>
            </motion.div>
          )}

          {trackingRecord ? (
            <motion.div
              key={trackingRecord.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Top Banner with Type & Live Status */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-black to-stone-900 border border-brand-gold/30 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-brand-gold/15">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold text-brand-dark">
                      {trackingRecord.type === 'service_booking' ? 'Service Booking' : (trackingRecord.fulfillmentType === 'pickup' ? 'Boutique Pickup' : 'Carrier Express Delivery')}
                    </span>
                    {trackingRecord.category && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/80 border border-white/10">
                        {trackingRecord.category}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">Reference:</span>
                    <span className="font-mono font-bold text-xs text-brand-gold bg-black/60 px-2.5 py-1 rounded-lg border border-brand-gold/30">
                      {trackingRecord.id || trackingRecord.orderId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(trackingRecord.id || trackingRecord.orderId, 'ref')}
                      className="p-1 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                      title="Copy Reference ID"
                    >
                      {copiedKey === 'ref' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-serif text-white">
                      {trackingRecord.serviceName || trackingRecord.carrier || 'Opal Fulfillment'}
                    </h3>
                    <p className="text-xs text-brand-gold/90 mt-0.5">
                      {trackingRecord.statusMessage || 'Status updated live'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      {trackingRecord.status?.replace(/_/g, ' ') || 'In Progress'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4-Stage Visual Milestone Progress Bar */}
              {Array.isArray(trackingRecord.stages) && (
                <div className="p-5 rounded-2xl bg-[#171615] border border-brand-gold/20">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold/80 mb-4 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-gold" />
                    Progress Timeline
                  </h4>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {trackingRecord.stages.map((stage: any, idx: number) => {
                      const isComplete = stage.completed;
                      const isCurrent = stage.current;
                      return (
                        <div 
                          key={stage.title} 
                          className={cn(
                            "p-3 rounded-xl border transition-all flex flex-col justify-between",
                            isCurrent
                              ? "bg-brand-gold/15 border-brand-gold shadow-md"
                              : isComplete
                                ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                                : "bg-black/30 border-white/5 text-white/40"
                          )}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                isCurrent
                                  ? "bg-brand-gold text-brand-dark"
                                  : isComplete
                                    ? "bg-emerald-500 text-black"
                                    : "bg-white/10 text-white/50"
                              )}>
                                {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.2 rounded-full bg-brand-gold/30 text-brand-gold">
                                  Current
                                </span>
                              )}
                            </div>
                            <h5 className={cn(
                              "text-xs font-bold leading-tight",
                              isCurrent ? "text-white" : isComplete ? "text-emerald-300" : "text-white/60"
                            )}>
                              {stage.title}
                            </h5>
                          </div>
                          {stage.timestamp && (
                            <span className="text-[10px] font-mono mt-2 text-brand-cream/60">
                              {stage.timestamp}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* DETAILS SECTION BASED ON TYPE */}
              {trackingRecord.type === 'service_booking' ? (
                /* SERVICE BOOKING DETAILS */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Schedule & Provider Card */}
                  <div className="p-5 rounded-2xl bg-[#171615] border border-brand-gold/20 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Appointment Schedule
                    </h4>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Date:</span>
                        <span className="font-semibold text-white">{trackingRecord.date}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Time Slot:</span>
                        <span className="font-semibold text-white">{trackingRecord.time}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Duration:</span>
                        <span className="font-semibold text-white">{trackingRecord.duration}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Assigned Provider:</span>
                        <span className="font-semibold text-brand-gold">{trackingRecord.providerName}</span>
                      </div>
                    </div>

                    {trackingRecord.providerPhone && (
                      <div className="pt-2">
                        <a
                          href={`tel:${trackingRecord.providerPhone}`}
                          className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-brand-gold hover:text-brand-dark text-white/90 text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-white/10"
                        >
                          <Phone className="w-3 h-3 text-brand-gold" />
                          <span>Call Provider ({trackingRecord.providerPhone})</span>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right: Client & Location Card */}
                  <div className="p-5 rounded-2xl bg-[#171615] border border-brand-gold/20 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Service Location & Total
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Client:</span>
                        <span className="font-semibold text-white">{trackingRecord.customerName}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Contact Phone:</span>
                        <span className="font-semibold text-white">{trackingRecord.customerPhone}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Payment:</span>
                        <span className="font-semibold text-emerald-400 capitalize">{trackingRecord.paymentStatus}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Total Amount:</span>
                        <span className="font-mono font-bold text-white">${trackingRecord.price}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-black/40 border border-brand-gold/15 text-[11px] text-white/80 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                      <span>{trackingRecord.address || 'Address provided at booking'}</span>
                    </div>
                  </div>
                </div>
              ) : trackingRecord.fulfillmentType === 'pickup' ? (
                /* SHOWROOM BOUTIQUE PICKUP DETAILS */
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/30 via-[#1C1A18] to-stone-900 border border-brand-gold/30">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-brand-gold/15">
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-brand-gold" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                          Digital Showroom Pickup Pass
                        </h4>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-500/40">
                        Ready for Pickup
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-white/50 text-[10px] uppercase tracking-wider block">Boutique Location:</span>
                          <span className="font-serif text-base text-white font-bold">{trackingRecord.showroomName}</span>
                        </div>
                        <div className="flex items-start gap-2 text-white/80">
                          <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                          <span>{trackingRecord.pickupAddress}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                          <span>{trackingRecord.pickupHours}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-black/60 rounded-xl border border-brand-gold/20 flex flex-col items-center justify-center text-center">
                        <span className="text-[9px] uppercase tracking-widest text-brand-gold font-bold mb-1">
                          Pickup Authorization Passcode
                        </span>
                        <span className="font-mono font-bold text-lg text-white tracking-widest bg-white/5 px-3 py-1 rounded-lg border border-white/10 mb-2">
                          {trackingRecord.pickupPassCode || 'PASS-RODEO-01'}
                        </span>
                        {/* Barcode Graphic */}
                        <div className="flex items-center gap-0.5 h-7 opacity-80">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div 
                              key={i} 
                              className="bg-brand-gold" 
                              style={{ width: i % 3 === 0 ? '3px' : '1.5px', height: '100%' }} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-brand-gold/15 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-[11px] text-white/60">
                        Show this pass and your order ID (<span className="text-brand-gold font-mono">{trackingRecord.id}</span>) to the showroom concierge.
                      </p>
                      {trackingRecord.mapUrl && (
                        <a
                          href={trackingRecord.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-brand-gold text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-yellow-400 transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Get Directions (Google Maps)
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Order Items Breakdown */}
                  {Array.isArray(trackingRecord.items) && trackingRecord.items.length > 0 && (
                    <div className="p-5 rounded-2xl bg-[#171615] border border-brand-gold/20">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3">
                        Articles in Order ({trackingRecord.items.length})
                      </h4>
                      <div className="space-y-2">
                        {trackingRecord.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between py-2 border-b border-white/5 text-xs">
                            <div>
                              <p className="font-bold text-white">{item.name}</p>
                              <p className="text-white/50 text-[11px]">
                                {item.brand && <span className="text-brand-gold font-medium">{item.brand} • </span>}
                                Size: {item.size || 'Standard'} • Color: {item.color || 'Standard'} • Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="font-mono font-bold text-brand-gold">${item.price}</span>
                          </div>
                        ))}
                        <div className="flex justify-between pt-2 text-sm font-bold text-white">
                          <span>Total Paid:</span>
                          <span className="font-mono text-brand-gold">${trackingRecord.totalPrice}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* CARRIER COURIER DELIVERY DETAILS (FEDEX / USPS / UPS / STANDARD) */
                <div className="space-y-4">
                  {/* Tracking Number & Carrier Link */}
                  <div className="p-5 rounded-2xl bg-[#171615] border border-brand-gold/20">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-brand-gold/15">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-brand-gold" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white">
                          {trackingRecord.serviceName || `${trackingRecord.carrier} Express`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/60">Carrier Tracking #:</span>
                        <span className="font-mono font-bold text-xs text-brand-gold bg-black/60 px-2 py-0.5 rounded border border-brand-gold/25">
                          {trackingRecord.trackingNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(trackingRecord.trackingNumber, 'carrierTrk')}
                          className="p-1 rounded text-white/60 hover:text-white"
                          title="Copy tracking number"
                        >
                          {copiedKey === 'carrierTrk' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-white/50 text-[10px] uppercase tracking-wider block">Guaranteed Arrival:</span>
                        <span className="font-bold text-emerald-400 text-sm">{trackingRecord.estimatedDelivery}</span>
                      </div>
                      <div>
                        <span className="text-white/50 text-[10px] uppercase tracking-wider block">Destination:</span>
                        <span className="text-white font-medium truncate block">{trackingRecord.destination || 'Customer Address'}</span>
                      </div>
                    </div>

                    {trackingRecord.trackingUrl && trackingRecord.trackingUrl !== '#' && (
                      <div className="mt-4 pt-3 border-t border-brand-gold/15 flex justify-end">
                        <a
                          href={trackingRecord.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-brand-gold hover:underline flex items-center gap-1.5"
                        >
                          <span>Open on {trackingRecord.carrier} Official Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Real Carrier Checkpoint Scan History */}
                  {Array.isArray(trackingRecord.checkpoints) && trackingRecord.checkpoints.length > 0 && (
                    <div className="p-5 rounded-2xl bg-[#171615] border border-brand-gold/20">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-3 flex items-center gap-1.5">
                        <Barcode className="w-3.5 h-3.5" />
                        Carrier Scan History
                      </h4>
                      <div className="space-y-3">
                        {trackingRecord.checkpoints.map((cp: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 text-xs">
                            <div className="w-2 h-2 rounded-full bg-brand-gold mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-white">{cp.status}</span>
                                <span className="text-[10px] font-mono text-white/50">{cp.location}</span>
                              </div>
                              <p className="text-white/70 text-[11px] mt-0.5">{cp.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Items in Parcel */}
                  {Array.isArray(trackingRecord.items) && trackingRecord.items.length > 0 && (
                    <div className="p-5 rounded-2xl bg-[#171615] border border-brand-gold/20">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-2">
                        Items in this Shipment
                      </h4>
                      <div className="space-y-2 text-xs">
                        {trackingRecord.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-white/5">
                            <span className="text-white/80">{item.name} {item.size ? `(${item.size}, ${item.color || ''})` : ''} x{item.quantity}</span>
                            <span className="font-mono text-brand-gold font-bold">${item.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            /* Initial Guide when no record searched yet */
            !errorMessage && (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center mx-auto text-brand-gold">
                  <Package className="w-8 h-8" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-serif text-white">Track Any Booking or Order</h3>
                  <p className="text-xs text-brand-cream/60 mt-1 leading-relaxed">
                    Enter your unique reservation reference or delivery tracking number in the search bar above to see real-time updates and milestone status.
                  </p>
                </div>

                {recentLookups.length > 0 && (
                  <div className="pt-4 max-w-sm mx-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-2">
                      Recent Lookups on this device:
                    </span>
                    <div className="flex flex-wrap justify-center gap-1.5">
                      {recentLookups.map(id => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            setSearchInput(id);
                            handleLookup(id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-brand-gold text-xs font-mono transition-all border border-brand-gold/20 cursor-pointer"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-stone-950/80 border-t border-brand-gold/15 flex items-center justify-between text-xs text-brand-cream/60">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Encrypted Opal Portal Logistics & Booking Network</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold uppercase tracking-wider text-[11px] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
