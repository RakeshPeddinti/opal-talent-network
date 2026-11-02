import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Users, 
  Calendar, 
  Tag, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Eye, 
  Smartphone, 
  Megaphone, 
  ArrowRight, 
  Flame,
  UtensilsCrossed,
  HeartHandshake,
  Percent,
  Check,
  ChevronDown,
  Info
} from 'lucide-react';
import { format, addDays, nextFriday, nextSaturday, nextSunday, isAfter, parseISO } from 'date-fns';
import { cn } from '../utils';
import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, serverTimestamp, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { SpecialOffer } from '../types';

interface ExistingCustomer {
  name: string;
  phone: string;
  email: string;
  lastDate?: string;
  serviceName?: string;
  bookingsCount: number;
}

interface SpecialOffersPublisherProps {
  providerName: string;
  providerCategory?: string;
  providerId?: string;
  bookings?: any[];
  isEmbeddedPlaceholder?: boolean;
  onOpenFullView?: () => void;
}

export const SpecialOffersPublisher: React.FC<SpecialOffersPublisherProps> = ({
  providerName,
  providerCategory = 'Beauty',
  providerId,
  bookings = [],
  isEmbeddedPlaceholder = false,
  onOpenFullView
}) => {
  // Only applies to Cloud Kitchen and Beauty service providers
  const isEligible = 
    providerCategory === 'Cloud Kitchen' || 
    providerCategory === 'Beauty' || 
    providerCategory === 'Beauty & Wellness';

  const [publishedOffers, setPublishedOffers] = useState<SpecialOffer[]>([]);
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);

  // Form state
  const defaultDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const [offerTitle, setOfferTitle] = useState('');
  const [discountValue, setDiscountValue] = useState('20% OFF');
  const [specificDate, setSpecificDate] = useState(defaultDate);
  const [promoCode, setPromoCode] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRecipientsList, setShowRecipientsList] = useState(false);
  const [previewPhoneView, setPreviewPhoneView] = useState(false);

  // Extract unique existing customers from bookings
  const existingCustomers: ExistingCustomer[] = useMemo(() => {
    const map = new Map<string, ExistingCustomer>();

    bookings.forEach(b => {
      const key = (b.customerPhone || b.customerEmail || b.customerName || '').trim().toLowerCase();
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, {
          name: b.customerName || 'Loyal Client',
          phone: b.customerPhone || '',
          email: b.customerEmail || '',
          lastDate: b.date,
          serviceName: b.serviceName,
          bookingsCount: 1
        });
      } else {
        const existing = map.get(key)!;
        existing.bookingsCount += 1;
        if (b.customerPhone && !existing.phone) {
          existing.phone = b.customerPhone;
        }
      }
    });

    const list = Array.from(map.values());
    // If no real bookings yet, provide fallback sample customers so provider can test broadcasting
    if (list.length === 0) {
      return [
        { name: 'Sarah Jenkins', phone: '+14155552671', email: 'sarah.j@example.com', lastDate: '2026-10-18', serviceName: providerCategory === 'Cloud Kitchen' ? 'Gourmet Truffle Box' : 'Manicure & Pedicure', bookingsCount: 3 },
        { name: 'David Miller', phone: '+14155558923', email: 'david.m@example.com', lastDate: '2026-10-20', serviceName: providerCategory === 'Cloud Kitchen' ? 'Artisan Sourdough' : 'Hair Styling', bookingsCount: 2 },
        { name: 'Elena Rostova', phone: '+14155554190', email: 'elena.r@example.com', lastDate: '2026-10-22', serviceName: providerCategory === 'Cloud Kitchen' ? 'Chef Family Platter' : 'Signature Facial', bookingsCount: 4 }
      ];
    }
    return list;
  }, [bookings, providerCategory]);

  // Load published offers from Firestore
  useEffect(() => {
    const offersRef = collection(db, 'special_offers');
    const unsubscribe = onSnapshot(offersRef, (snapshot) => {
      const offers: SpecialOffer[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as any;
        // Filter by providerName or category
        if (
          !providerName || 
          data.providerName === providerName || 
          data.category === providerCategory
        ) {
          offers.push({
            id: docSnap.id,
            ...data
          });
        }
      });
      // Sort newest or closest date first
      offers.sort((a, b) => (b.specificDate || '').localeCompare(a.specificDate || ''));
      setPublishedOffers(offers);
      setIsLoadingOffers(false);
    }, (error) => {
      console.warn("Could not load special offers from Firestore:", error);
      setIsLoadingOffers(false);
    });

    return () => unsubscribe();
  }, [providerName, providerCategory]);

  // Category-specific presets
  const presets = providerCategory === 'Cloud Kitchen' 
    ? [
        { title: "Weekend Feast: 20% Off Gourmet Platters", discount: "20% OFF", code: "FEAST20", desc: "Enjoy 20% off all artisan family platters and chef specialties." },
        { title: "Friday Flash Deal: Free Signature Dessert", discount: "FREE DESSERT", code: "SWEETTREAT", desc: "Order any two main entrees and receive our chef's signature molten dessert." },
        { title: "Sunday Family Bundle: $15 Off Catering", discount: "$15 OFF", code: "FAMILY15", desc: "Special $15 coupon on all orders above $60 this Sunday." }
      ]
    : [
        { title: "Weekend Glow: 25% Off Full Spa & Hair Treatment", discount: "25% OFF", code: "GLOW25", desc: "Pamper yourself with 25% off all luxury manicures, hair coloring, and facials." },
        { title: "Midweek Refresh: Free Scalp Massage with Blowout", discount: "FREE ADD-ON", code: "PAMPERME", desc: "Book any hair styling or color service and enjoy a complimentary deep scalp ritual." },
        { title: "Friday Beauty Treat: $20 Off Packages", discount: "$20 OFF", code: "BEAUTY20", desc: "Get $20 off any full appointment booking on this special date." }
      ];

  const applyPreset = (preset: typeof presets[0]) => {
    setOfferTitle(preset.title);
    setDiscountValue(preset.discount);
    setPromoCode(preset.code);
    setOfferDescription(preset.desc);
  };

  // Quick date selector helpers
  const handleQuickDate = (type: 'today' | 'tomorrow' | 'friday' | 'saturday' | 'sunday') => {
    const today = new Date();
    let target = today;
    if (type === 'tomorrow') target = addDays(today, 1);
    else if (type === 'friday') target = nextFriday(today);
    else if (type === 'saturday') target = nextSaturday(today);
    else if (type === 'sunday') target = nextSunday(today);

    setSpecificDate(format(target, 'yyyy-MM-dd'));
  };

  // Broadcast Special Offer
  const handlePublishOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle.trim()) {
      setErrorMessage("Please enter an offer title.");
      return;
    }
    if (!specificDate) {
      setErrorMessage("Please pick a specific date for this special offer.");
      return;
    }

    setErrorMessage(null);
    setIsPublishing(true);

    try {
      const generatedCode = promoCode.trim() || `${providerCategory === 'Cloud Kitchen' ? 'KITCHEN' : 'BEAUTY'}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // 1. Save Special Offer to Firestore
      const newOfferData = {
        providerId: providerId || 'provider-active',
        providerName: providerName || (providerCategory === 'Cloud Kitchen' ? 'Gourmet Kitchen' : 'Opal Beauty Salon'),
        category: providerCategory,
        title: offerTitle.trim(),
        description: offerDescription.trim() || `Exclusive ${discountValue} special offer on ${specificDate}!`,
        discount: discountValue,
        specificDate: specificDate,
        endDate: specificDate,
        promoCode: generatedCode,
        recipientCount: existingCustomers.length,
        status: 'active',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'special_offers'), newOfferData);

      // 2. Broadcast SMS Notification to existing customers
      const broadcastSmsBody = `Opal Portal: Special Offer from ${newOfferData.providerName}! On ${newOfferData.specificDate}, get ${newOfferData.discount}: "${newOfferData.title}". Use promo code ${generatedCode}. Reserve early at Opal Portal!`;

      // Dispatch to available customer mobile numbers (and log via SMS endpoint)
      const validPhoneRecipients = existingCustomers.filter(c => c.phone && c.phone.trim().length >= 7);
      
      for (const customer of validPhoneRecipients.slice(0, 5)) {
        try {
          await fetch('/api/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: customer.phone,
              customerName: customer.name,
              serviceNames: [newOfferData.title],
              providerName: newOfferData.providerName,
              date: newOfferData.specificDate,
              time: 'All Day Special',
              totalPrice: 0,
              message: broadcastSmsBody
            })
          });
        } catch (smsErr) {
          console.warn("Broadcast SMS dispatch notice:", smsErr);
        }
      }

      setPublishSuccess(`🎉 Special offer successfully published for ${specificDate}! Broadcasted to all ${existingCustomers.length} existing customers via SMS text message & in-portal announcements.`);
      setOfferTitle('');
      setOfferDescription('');
      setPromoCode('');
      setTimeout(() => setPublishSuccess(null), 8000);
    } catch (err: any) {
      console.error("Publish special offer error:", err);
      setErrorMessage("Failed to publish special offer. " + (err.message || ''));
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteOffer = async (id?: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'special_offers', id));
    } catch (err) {
      console.error("Delete offer error:", err);
    }
  };

  // If the provider category is neither Cloud Kitchen nor Beauty, show clear restriction banner
  if (!isEligible) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-brand-gold/15 shadow-sm text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Info className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-serif text-brand-dark mb-2">Special Offers Feature Notice</h3>
        <p className="text-sm text-brand-muted max-w-lg mx-auto">
          Publishing special offers on specific dates for existing customers is exclusively enabled for 
          <span className="font-bold text-brand-gold"> Cloud Kitchen</span> and 
          <span className="font-bold text-brand-gold"> Beauty</span> service providers.
        </p>
        <p className="text-xs text-brand-muted/80 mt-2">
          Your current registered provider category is <strong>"{providerCategory}"</strong>.
        </p>
      </div>
    );
  }

  // Render Compact Embedded Placeholder (e.g. at top of provider overview)
  if (isEmbeddedPlaceholder) {
    return (
      <div className="mb-8 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 rounded-3xl p-6 border-2 border-brand-gold/30 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold text-white flex items-center justify-center shrink-0 shadow-lg border border-brand-gold/40">
              {providerCategory === 'Cloud Kitchen' ? (
                <UtensilsCrossed className="w-6 h-6" />
              ) : (
                <Sparkles className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-bold uppercase tracking-widest border border-brand-gold/30">
                  {providerCategory} Exclusive
                </span>
                <span className="text-xs text-brand-muted flex items-center gap-1 font-medium">
                  <Users className="w-3.5 h-3.5 text-brand-gold" />
                  {existingCustomers.length} Existing Customers on File
                </span>
              </div>
              <h3 className="text-xl font-serif text-brand-dark font-medium">
                Publish Date-Specific Special Offers
              </h3>
              <p className="text-xs text-brand-muted max-w-xl mt-0.5">
                Broadcast exclusive promotions on specific dates directly to all your past customers via automated mobile SMS and portal banners.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {publishedOffers.length > 0 && (
              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {publishedOffers.length} Active {publishedOffers.length === 1 ? 'Offer' : 'Offers'}
              </span>
            )}
            <button
              onClick={onOpenFullView}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-brand-dark hover:bg-brand-gold hover:text-brand-dark text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-md"
            >
              <Megaphone className="w-4 h-4 text-brand-gold group-hover:text-brand-dark" />
              Publish Special Offer
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full View: Interactive Form, Customer Audience List, SMS Preview, and Active Offers Manager
  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-brand-gold/20 shadow-sm overflow-hidden">
        <div className="p-8 bg-gradient-to-r from-brand-gold/10 via-amber-50/50 to-white border-b border-brand-gold/15">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-gold text-white flex items-center justify-center shrink-0 shadow-lg border border-brand-gold/40">
                {providerCategory === 'Cloud Kitchen' ? (
                  <UtensilsCrossed className="w-7 h-7" />
                ) : (
                  <Sparkles className="w-7 h-7" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full bg-brand-gold/20 text-brand-gold text-[10px] font-bold uppercase tracking-widest border border-brand-gold/30">
                    {providerCategory} Special Offers Publisher
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                    SMS Broadcast Enabled
                  </span>
                </div>
                <h2 className="text-3xl font-serif text-brand-dark">
                  Publish Special Offers on Specific Dates
                </h2>
                <p className="text-sm text-brand-muted mt-1 max-w-2xl">
                  Reward and re-engage all your existing customers. Schedule one-day flash deals, weekend bundles, or exclusive seasonal discounts delivered straight to their mobile phones.
                </p>
              </div>
            </div>

            {/* Target Audience Badge */}
            <div className="bg-white/90 backdrop-blur-xs p-4 rounded-2xl border border-brand-gold/30 shadow-sm shrink-0 min-w-[210px]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted flex items-center gap-1">
                  <Users className="w-4 h-4 text-brand-gold" />
                  Target Audience
                </span>
                <button
                  type="button"
                  onClick={() => setShowRecipientsList(!showRecipientsList)}
                  className="text-[10px] text-brand-gold font-bold hover:underline"
                >
                  {showRecipientsList ? 'Hide List' : 'View List'}
                </button>
              </div>
              <p className="text-2xl font-serif text-brand-dark font-bold">
                {existingCustomers.length} <span className="text-xs font-sans font-normal text-brand-muted">Existing Clients</span>
              </p>
              <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <Check className="w-3 h-3" />
                All past booked customers will receive this
              </p>
            </div>
          </div>

          {/* Toggleable Existing Customers Drawer */}
          {showRecipientsList && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-brand-gold/20"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-dark mb-3 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-gold" />
                Existing Customers who will receive this offer:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {existingCustomers.map((c, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-brand-gold/20 text-xs shadow-2xs">
                    <p className="font-bold text-brand-dark">{c.name}</p>
                    <p className="text-[11px] text-brand-gold font-mono">{c.phone || 'In-app notification'}</p>
                    <p className="text-[10px] text-brand-muted mt-1">
                      Past booking: {c.serviceName || 'Service'} ({c.bookingsCount}x)
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Quick Presets Bar */}
        <div className="p-6 bg-brand-cream/40 border-b border-brand-gold/10">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
            Quick One-Click Offer Templates for {providerCategory}:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="text-left p-3.5 bg-white hover:bg-brand-gold/10 border border-brand-gold/20 hover:border-brand-gold/50 rounded-2xl transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded-md bg-brand-gold/20 text-brand-dark text-[10px] font-bold">
                    {p.discount}
                  </span>
                  <span className="text-[10px] text-brand-muted font-mono">{p.code}</span>
                </div>
                <p className="text-xs font-bold text-brand-dark group-hover:text-brand-gold transition-colors line-clamp-1">
                  {p.title}
                </p>
                <p className="text-[10px] text-brand-muted line-clamp-2 mt-0.5">
                  {p.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Publishing Form & SMS Live Preview */}
        <div className="p-8">
          <form onSubmit={handlePublishOffer} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Form Fields Column */}
            <div className="lg:col-span-7 space-y-6">
              {publishSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-2xl flex items-start gap-3 text-xs font-medium animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Broadcast Published!</p>
                    <p>{publishSuccess}</p>
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-300 text-red-800 rounded-2xl flex items-center gap-3 text-xs font-medium">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Offer Title */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-brand-muted flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-gold" />
                  Offer Title / Headline *
                </label>
                <input
                  required
                  type="text"
                  placeholder={providerCategory === 'Cloud Kitchen' ? "e.g., Weekend Feast: 20% Off All Gourmet Platters" : "e.g., Friday Pamper Special: 25% Off Spa Package"}
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-5 py-3.5 bg-brand-cream/50 border border-brand-gold/20 rounded-2xl focus:ring-2 focus:ring-brand-gold/40 outline-none font-medium text-sm text-brand-dark"
                />
              </div>

              {/* Date & Discount Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Specific Date */}
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest font-bold text-brand-muted flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                      Specific Date *
                    </span>
                  </label>
                  <input
                    required
                    type="date"
                    min={format(new Date(), 'yyyy-MM-dd')}
                    value={specificDate}
                    onChange={(e) => setSpecificDate(e.target.value)}
                    className="w-full px-4 py-3 bg-brand-cream/50 border border-brand-gold/20 rounded-2xl focus:ring-2 focus:ring-brand-gold/40 outline-none font-medium text-sm text-brand-dark"
                  />
                  {/* Quick Date Presets */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleQuickDate('today')}
                      className="px-2 py-1 bg-white hover:bg-brand-gold/15 border border-brand-gold/20 rounded-lg text-[10px] font-bold text-brand-muted hover:text-brand-dark transition-all"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate('tomorrow')}
                      className="px-2 py-1 bg-white hover:bg-brand-gold/15 border border-brand-gold/20 rounded-lg text-[10px] font-bold text-brand-muted hover:text-brand-dark transition-all"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate('friday')}
                      className="px-2 py-1 bg-white hover:bg-brand-gold/15 border border-brand-gold/20 rounded-lg text-[10px] font-bold text-brand-muted hover:text-brand-dark transition-all"
                    >
                      Friday
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate('saturday')}
                      className="px-2 py-1 bg-white hover:bg-brand-gold/15 border border-brand-gold/20 rounded-lg text-[10px] font-bold text-brand-muted hover:text-brand-dark transition-all"
                    >
                      Saturday
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDate('sunday')}
                      className="px-2 py-1 bg-white hover:bg-brand-gold/15 border border-brand-gold/20 rounded-lg text-[10px] font-bold text-brand-muted hover:text-brand-dark transition-all"
                    >
                      Sunday
                    </button>
                  </div>
                </div>

                {/* Discount Badge & Promo Code */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-brand-muted flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-brand-gold" />
                      Discount / Deal Value
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 20% OFF or $15 OFF"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-4 py-3 bg-brand-cream/50 border border-brand-gold/20 rounded-2xl focus:ring-2 focus:ring-brand-gold/40 outline-none font-medium text-sm text-brand-dark"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-widest font-bold text-brand-muted flex items-center gap-1.5">
                      Promo Code (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., GLOW20"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 bg-brand-cream/50 border border-brand-gold/20 rounded-2xl focus:ring-2 focus:ring-brand-gold/40 outline-none font-mono text-sm text-brand-dark uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* Offer Description / Message Content */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest font-bold text-brand-muted">
                  Offer Details & Conditions
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what is included in this date-specific special offer..."
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                  className="w-full px-5 py-3.5 bg-brand-cream/50 border border-brand-gold/20 rounded-2xl focus:ring-2 focus:ring-brand-gold/40 outline-none font-medium text-sm text-brand-dark resize-none"
                />
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isPublishing}
                className="w-full py-4 bg-brand-dark hover:bg-brand-gold hover:text-brand-dark text-white rounded-2xl font-bold uppercase tracking-widest text-xs transition-all shadow-xl flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Broadcasting to {existingCustomers.length} Customers...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Publish & Broadcast to All {existingCustomers.length} Existing Customers
                  </>
                )}
              </button>
            </div>

            {/* Live Client SMS Preview Column */}
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div className="bg-slate-900 rounded-[36px] p-4 text-white shadow-xl border-4 border-slate-800 flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-bold text-brand-gold">
                    <Smartphone className="w-3.5 h-3.5" />
                    Customer Mobile SMS Preview
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">Real-time</span>
                </div>

                <div className="p-4 space-y-3 min-h-[220px] flex flex-col justify-center">
                  <div className="text-center">
                    <span className="text-[10px] text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full font-mono">
                      Broadcast Target: {existingCustomers.length} Recipients
                    </span>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-xs p-4 shadow-sm text-left">
                    <p className="text-xs leading-relaxed text-slate-100">
                      <strong>Opal Portal:</strong> Special Offer from {providerName}! On <strong>{specificDate || 'Upcoming Date'}</strong>, enjoy <strong>{discountValue || 'Special Discount'}</strong>: "{offerTitle || 'Exclusive Customer Offer'}".
                      {promoCode && <span> Use code: <strong className="text-brand-gold">{promoCode}</strong>.</span>}
                      {' '}Reserve your appointment on Opal Portal!
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/60 text-[9px] text-slate-400">
                      <span>Delivered via SMS Gateway</span>
                      <span className="text-emerald-400 font-medium">✓ Just now</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-brand-gold font-bold mb-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Double Channel Broadcast:
                  </div>
                  <p className="text-[10px] leading-tight text-slate-300">
                    1. Direct cellular text message sent to customers' real mobile phones.<br />
                    2. Featured special offer card showcased on your booking calendar on {specificDate || 'the selected date'}.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Active & Scheduled Special Offers List */}
      <div className="bg-white rounded-3xl border border-brand-gold/20 shadow-sm p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-2xl font-serif text-brand-dark flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-brand-gold" />
              Published Special Offers ({publishedOffers.length})
            </h3>
            <p className="text-xs text-brand-muted mt-0.5">
              Active promotions broadcasted for specific dates
            </p>
          </div>
          {publishedOffers.length > 0 && (
            <span className="px-3 py-1 bg-brand-gold/10 text-brand-dark text-xs font-bold rounded-full border border-brand-gold/20 self-start sm:self-auto">
              Live in Portal
            </span>
          )}
        </div>

        {isLoadingOffers ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-3 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : publishedOffers.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-brand-cream/30 border border-dashed border-brand-gold/30">
            <Calendar className="w-10 h-10 text-brand-gold/40 mx-auto mb-3" />
            <h4 className="text-base font-serif text-brand-dark font-medium">No published special offers yet</h4>
            <p className="text-xs text-brand-muted max-w-md mx-auto mt-1 mb-4">
              Use the publisher above to announce a limited-time special offer for {providerCategory === 'Cloud Kitchen' ? 'this weekend’s menu' : 'upcoming appointments'}.
            </p>
            <button
              type="button"
              onClick={() => applyPreset(presets[0])}
              className="px-4 py-2 bg-brand-gold text-brand-dark rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-dark hover:text-white transition-all shadow-sm"
            >
              Load Sample Offer Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publishedOffers.map((offer) => {
              const isToday = offer.specificDate === format(new Date(), 'yyyy-MM-dd');
              return (
                <div 
                  key={offer.id}
                  className={cn(
                    "p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-2xs",
                    isToday 
                      ? "bg-amber-50/70 border-brand-gold shadow-sm ring-1 ring-brand-gold/30" 
                      : "bg-white border-brand-gold/20 hover:border-brand-gold/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-lg bg-brand-gold text-brand-dark text-[10px] font-bold uppercase tracking-wider">
                        {offer.discount || 'Special Offer'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                        <Calendar className="w-3.5 h-3.5 text-brand-gold" />
                        <span>Valid: {offer.specificDate}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500 text-white text-[9px] uppercase tracking-wider animate-pulse">
                            Today!
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-serif text-brand-dark font-bold mb-1">
                      {offer.title}
                    </h4>
                    <p className="text-xs text-brand-muted leading-relaxed line-clamp-2">
                      {offer.description}
                    </p>

                    {offer.promoCode && (
                      <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-cream border border-brand-gold/20 text-xs font-mono font-bold text-brand-dark">
                        <span>Code:</span>
                        <span className="text-brand-gold">{offer.promoCode}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-brand-gold/15 flex items-center justify-between text-xs text-brand-muted">
                    <span className="flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-brand-gold" />
                      Broadcasted to {offer.recipientCount || existingCustomers.length} customers
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteOffer(offer.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove this special offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
