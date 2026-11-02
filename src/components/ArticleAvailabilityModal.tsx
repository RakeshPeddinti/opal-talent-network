import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Store, 
  Home, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Phone, 
  User, 
  Mail, 
  Package, 
  Sparkles, 
  ShieldCheck, 
  Navigation, 
  Loader2,
  AlertCircle
} from 'lucide-react';
import { ProductArticle, ProductArticleColor } from '../types';
import { cn } from '../utils';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface ArticleAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ProductArticle | null;
  selectedSize?: string;
  selectedColor?: ProductArticleColor;
  currentUser?: any;
  user?: any;
  onVisitConfirmed?: (visitId: string) => void;
}

const VISIT_TIME_SLOTS = [
  '10:00 AM – 11:00 AM',
  '11:30 AM – 12:30 PM',
  '2:00 PM – 3:00 PM',
  '3:30 PM – 4:30 PM',
  '5:00 PM – 6:00 PM',
  '6:30 PM – 7:30 PM'
];

export const ArticleAvailabilityModal: React.FC<ArticleAvailabilityModalProps> = ({
  isOpen,
  onClose,
  article,
  selectedSize,
  selectedColor,
  currentUser,
  onVisitConfirmed
}) => {
  const [visitType, setVisitType] = useState<'store_visit' | 'home_visit'>('store_visit');
  const [activeSize, setActiveSize] = useState<string>(selectedSize || article?.sizes[0] || 'Standard');
  const [activeColor, setActiveColor] = useState<ProductArticleColor>(
    selectedColor || article?.colors[0] || { name: 'Default', hex: '#111827' }
  );
  
  // Date selection (default tomorrow)
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [visitDate, setVisitDate] = useState<string>(tomorrowStr);
  const [timeSlot, setTimeSlot] = useState<string>(VISIT_TIME_SLOTS[1]);
  
  // Contact details
  const [customerName, setCustomerName] = useState<string>(currentUser?.displayName || currentUser?.name || '');
  const [customerEmail, setCustomerEmail] = useState<string>(currentUser?.email || '');
  const [customerPhone, setCustomerPhone] = useState<string>(currentUser?.phone || '+1 (310) 555-0199');
  const [customerAddress, setCustomerAddress] = useState<string>('9405 Wilshire Blvd, Beverly Hills, CA 90212');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedVisitId, setConfirmedVisitId] = useState<string | null>(null);

  if (!isOpen || !article) return null;

  const sellerName = article.sellerCompanyName || `${article.brand} Home Atelier`;
  const sellerAddress = article.sellerAddress || '450 N Rodeo Dr Suite 300, Beverly Hills, CA 90210';
  const availableStock = article.stockCount || 5;

  const handleConfirmVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage("Please enter your name and contact phone number.");
      return;
    }
    if (visitType === 'home_visit' && !customerAddress.trim()) {
      setErrorMessage("Please specify your home address for the specialist visit.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const visitRefId = `OPAL-VST-${Math.floor(10000 + Math.random() * 90000)}`;

    try {
      // 1. Record Visit in Firestore
      const visitData = {
        visitId: visitRefId,
        visitType,
        articleId: article.id,
        articleName: article.name,
        articleBrand: article.brand,
        articlePrice: article.price,
        articleImage: article.image,
        articleSku: article.sku,
        selectedSize: activeSize,
        selectedColor: activeColor,
        sellerCompanyName: sellerName,
        sellerStudioAddress: sellerAddress,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: visitType === 'home_visit' ? customerAddress.trim() : sellerAddress,
        customerUid: currentUser?.uid || null,
        visitDate,
        timeSlot,
        notes: specialNotes.trim() || null,
        status: 'confirmed',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'visits'), visitData);

      // Also create a synced booking record so it appears seamlessly in the Customer's Order History tab
      await addDoc(collection(db, 'bookings'), {
        bookingRefId: visitRefId,
        serviceId: `article-visit-${article.id}`,
        serviceName: `${visitType === 'home_visit' ? 'Home Trial Visit' : 'Home Studio Visit'}: ${article.name}`,
        category: 'Article In-Person Visit',
        duration: '45 min',
        providerId: article.sellerUid || 'home-business-seller',
        providerName: sellerName,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        customerUid: currentUser?.uid || null,
        date: visitDate,
        time: timeSlot,
        price: 0, // Free consultation/preview
        status: 'confirmed',
        paymentStatus: 'free_trial_visit',
        location: {
          address: visitType === 'home_visit' ? customerAddress.trim() : sellerAddress
        },
        createdAt: serverTimestamp()
      });

      // 2. Dispatch Confirmation SMS via Server API
      try {
        const visitTypeLabel = visitType === 'home_visit' ? 'Home Specialist Visit' : 'Home Studio Visit';
        const locationText = visitType === 'home_visit' ? `at your home address: ${customerAddress}` : `at ${sellerName} Studio: ${sellerAddress}`;
        await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: customerPhone,
            message: `Opal Portal: Hi ${customerName}! Your ${visitTypeLabel} for "${article.name}" (${activeSize}, ${activeColor.name}) is CONFIRMED (Ref #${visitRefId}) on ${visitDate} at ${timeSlot} ${locationText}. Zero obligation free trial!`
          })
        });
      } catch (smsErr) {
        console.warn("SMS dispatch notice:", smsErr);
      }

      setConfirmedVisitId(visitRefId);
      if (onVisitConfirmed) {
        onVisitConfirmed(visitRefId);
      }
    } catch (err: any) {
      console.error("Visit confirmation error:", err);
      setErrorMessage(err.message || "Failed to confirm visit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 14 }}
        className="relative w-full max-w-2xl bg-[#141312] border border-brand-gold/30 rounded-3xl shadow-2xl text-white overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-gold/20 bg-stone-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 border border-brand-gold/40 flex items-center justify-center text-brand-gold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold text-white">Check Article & Confirm Visit</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold font-sans font-bold uppercase tracking-wider border border-brand-gold/30">
                  Home Business Model
                </span>
              </div>
              <p className="text-xs text-brand-cream/60">
                Check real-time stock availability and book an in-person home or studio preview
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {confirmedVisitId ? (
            /* Confirmation Success State */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-white">Visit Confirmed!</h3>
                <p className="text-xs text-brand-cream/70 mt-1 max-w-md mx-auto">
                  Your appointment to inspect <strong className="text-brand-gold">{article.name}</strong> in-person is locked in. A confirmation text was dispatched to <strong className="text-white">{customerPhone}</strong>.
                </p>
              </div>

              {/* Reference Card */}
              <div className="p-4 bg-stone-900 border border-brand-gold/30 rounded-2xl max-w-md mx-auto text-left space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">
                    Visit Reference ID
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {confirmedVisitId}
                  </span>
                </div>
                <div className="text-xs space-y-1.5 text-white/80">
                  <div className="flex justify-between">
                    <span className="text-white/50">Visit Type:</span>
                    <span className="font-bold text-white capitalize">{visitType.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Date & Time:</span>
                    <span className="font-bold text-brand-gold">{visitDate} at {timeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Article Selected:</span>
                    <span className="font-medium text-white">{article.name} ({activeSize}, {activeColor.name})</span>
                  </div>
                  <div className="flex justify-between items-start pt-1 border-t border-white/10">
                    <span className="text-white/50 shrink-0">Location:</span>
                    <span className="text-right font-medium text-white line-clamp-2">
                      {visitType === 'home_visit' ? customerAddress : sellerAddress}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-brand-gold/10 border border-brand-gold/25 rounded-xl text-xs text-brand-cream/80 max-w-md mx-auto">
                <p className="flex items-center justify-center gap-1.5 text-brand-gold font-bold mb-0.5">
                  <ShieldCheck className="w-4 h-4" /> Zero-Risk Free Trial
                </p>
                <p className="text-[11px] text-white/70">
                  No payment or deposit required for visits. If you decide to purchase after viewing, the seller will issue an official commercial Tax Invoice on the spot.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-brand-gold text-brand-dark rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white transition-all shadow-md cursor-pointer"
                >
                  Done & Back to Portal
                </button>
              </div>
            </div>
          ) : (
            /* Booking & Availability Form */
            <form onSubmit={handleConfirmVisit} className="space-y-5">
              {errorMessage && (
                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Article Availability Status Card */}
              <div className="p-4 rounded-2xl bg-stone-900 border border-brand-gold/20 flex flex-col sm:flex-row items-center gap-4">
                <img
                  src={article.image}
                  alt={article.name}
                  className="w-20 h-20 rounded-xl object-cover border border-brand-gold/30 shrink-0"
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                      {article.brand}
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                      ✓ Available Now ({availableStock} units in studio)
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-base text-white truncate">
                    {article.name}
                  </h4>
                  <p className="text-xs text-brand-cream/70 mt-0.5 flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-gold text-sm">${article.price}</span>
                    <span>•</span>
                    <span className="text-white/50">Seller: <strong className="text-white">{sellerName}</strong></span>
                  </p>
                  <p className="text-[11px] text-white/50 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-brand-gold shrink-0" />
                    <span>Home Studio: {sellerAddress}</span>
                  </p>
                </div>
              </div>

              {/* Size & Color Availability Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-stone-900/60 rounded-2xl border border-white/10 text-xs">
                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-brand-gold block mb-1">
                    Select Size to Inspect
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {article.sizes.map((sz) => (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => setActiveSize(sz)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg border font-semibold transition-all cursor-pointer",
                          activeSize === sz
                            ? "bg-brand-gold text-brand-dark border-brand-gold shadow-xs"
                            : "bg-white/5 text-white/70 border-white/10 hover:border-brand-gold/50"
                        )}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold uppercase tracking-wider text-[10px] text-brand-gold block mb-1">
                    Select Color Swatch
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {article.colors.map((col) => (
                      <button
                        type="button"
                        key={col.name}
                        onClick={() => setActiveColor(col)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all cursor-pointer",
                          activeColor.name === col.name
                            ? "bg-brand-gold text-brand-dark border-brand-gold font-bold shadow-xs"
                            : "bg-white/5 text-white/70 border-white/10 hover:border-brand-gold/40"
                        )}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-[11px]">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Choose Visit Preference (Store/Studio vs Home Visit) */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-wider text-brand-gold block">
                  Select Visit Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisitType('store_visit')}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5",
                      visitType === 'store_visit'
                        ? "bg-brand-gold/15 border-brand-gold text-white shadow-md ring-1 ring-brand-gold/40"
                        : "bg-stone-900/60 border-white/10 text-white/70 hover:border-white/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-bold text-sm text-white">
                        <Store className="w-4 h-4 text-brand-gold" />
                        Home Studio / Store Visit
                      </span>
                      {visitType === 'store_visit' && (
                        <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                      )}
                    </div>
                    <p className="text-[11px] text-brand-cream/60 leading-relaxed">
                      Visit the artisan's registered home showroom at {sellerAddress.split(',')[0]} for personal fitting & inspection.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisitType('home_visit')}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1.5",
                      visitType === 'home_visit'
                        ? "bg-brand-gold/15 border-brand-gold text-white shadow-md ring-1 ring-brand-gold/40"
                        : "bg-stone-900/60 border-white/10 text-white/70 hover:border-white/30"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-bold text-sm text-white">
                        <Home className="w-4 h-4 text-brand-gold" />
                        Home Visit by Specialist
                      </span>
                      {visitType === 'home_visit' && (
                        <CheckCircle2 className="w-4 h-4 text-brand-gold" />
                      )}
                    </div>
                    <p className="text-[11px] text-brand-cream/60 leading-relaxed">
                      Specialist artisan brings the selected articles directly to your home address for private trial and tailoring.
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Schedule Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-white/70 block mb-1">
                    Preferred Visit Date
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-brand-gold absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-white/70 block mb-1">
                    Preferred Time Slot
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-brand-gold absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-900 border border-white/15 rounded-xl text-xs text-white focus:outline-none focus:border-brand-gold cursor-pointer"
                    >
                      {VISIT_TIME_SLOTS.map((slot) => (
                        <option key={slot} value={slot} className="bg-stone-900 text-white">
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Contact & Address Details */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-white/70 block mb-1">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-brand-gold absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Full name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-white/15 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-white/70 block mb-1">
                      Mobile Phone (for SMS dispatch)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-brand-gold absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="Mobile number"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-white/15 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>
                </div>

                {visitType === 'home_visit' && (
                  <div>
                    <label className="text-xs uppercase font-bold tracking-wider text-white/70 block mb-1">
                      Your Home Visit Address
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-brand-gold absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="Street, Suite/Apt, City, State, ZIP"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-white/15 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs uppercase font-bold tracking-wider text-white/70 block mb-1">
                    Special Trial Instructions / Sizing Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Please bring an alternative size or swatch to compare"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-900 border border-white/15 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              {/* Informational Policy Banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Designed for Home-Based Businesses:</strong> This visit allows you to preview, inspect, and try on handcrafted & boutique articles in-person with zero purchase commitment. If you choose to buy, official commercial Tax & Invoicing will be processed.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-brand-gold hover:bg-yellow-500 text-brand-dark text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-brand-gold/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Confirming Visit...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirm {visitType === 'home_visit' ? 'Home' : 'Studio'} Visit ($0 Free)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
