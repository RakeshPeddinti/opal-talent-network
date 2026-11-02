import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  AlertTriangle, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  ShieldAlert, 
  CheckCircle2, 
  Loader2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { cn } from '../utils';

export interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string; // Firestore document ID
    refId: string;
    title: string;
    category?: string;
    providerName: string;
    providerPhone?: string;
    date: string;
    time: string;
    duration?: string;
    address?: string;
    totalPrice?: number;
    paymentStatus?: string;
  } | null;
  onConfirmCancel: (bookingId: string, reason: string, notes?: string) => Promise<void>;
}

const CANCELLATION_REASONS = [
  "Schedule conflict / need to reschedule",
  "Booked by mistake or duplicate reservation",
  "Selected an alternative specialist or timing",
  "Personal emergency / unexpected change of plans",
  "Service no longer required"
];

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirmCancel
}) => {
  const [selectedReason, setSelectedReason] = useState<string>(CANCELLATION_REASONS[0]);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      await onConfirmCancel(booking.id, selectedReason, additionalNotes.trim() || undefined);
      onClose();
    } catch (err: any) {
      console.error("Cancellation error:", err);
      setErrorMessage(err.message || "Failed to cancel this appointment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        className="relative w-full max-w-xl bg-[#141312] border border-red-500/30 rounded-3xl shadow-2xl text-white overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-red-500/20 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <span>Cancel Appointment</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-sans font-bold uppercase tracking-wider border border-red-500/30">
                  Confirmation Required
                </span>
              </h2>
              <p className="text-xs text-brand-cream/60">
                Please confirm that you want to release this scheduled booking
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all border border-white/10 disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-red-500/15 border border-red-500/40 rounded-2xl text-xs text-red-300 flex items-start gap-2">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Appointment Summary Card */}
          <div className="p-4 rounded-2xl bg-stone-900/90 border border-brand-gold/20 space-y-3">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold block">
                  {booking.category || 'Service Appointment'}
                </span>
                <h4 className="font-serif font-bold text-base text-white mt-0.5">
                  {booking.title}
                </h4>
                <p className="text-xs text-white/70 mt-0.5">
                  Specialist: <strong className="text-white">{booking.providerName}</strong>
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-mono font-bold text-brand-gold bg-brand-gold/10 px-2 py-0.5 rounded border border-brand-gold/20">
                  {booking.refId}
                </span>
                {typeof booking.totalPrice === 'number' && booking.totalPrice > 0 && (
                  <p className="font-mono font-bold text-sm text-white mt-1">
                    ${booking.totalPrice}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span>{booking.date}</span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                <span>{booking.time} {booking.duration ? `(${booking.duration})` : ''}</span>
              </div>
              {booking.address && (
                <div className="col-span-2 flex items-start gap-2 text-white/70 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{booking.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Reason for Cancellation */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-brand-gold flex items-center justify-between">
              <span>Reason for Cancellation</span>
              <span className="text-[10px] text-white/40 normal-case font-normal">Select one</span>
            </label>
            <div className="space-y-1.5">
              {CANCELLATION_REASONS.map((reason) => (
                <button
                  type="button"
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={cn(
                    "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between border cursor-pointer",
                    selectedReason === reason
                      ? "bg-red-500/15 border-red-500/50 text-white font-semibold"
                      : "bg-stone-900/50 border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <span>{reason}</span>
                  <span className={cn(
                    "w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2",
                    selectedReason === reason 
                      ? "border-red-400 bg-red-500/30" 
                      : "border-white/30"
                  )}>
                    {selectedReason === reason && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Message for Provider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="cancel-notes" className="text-xs font-bold uppercase tracking-wider text-white/70">
                Message for Specialist (Optional)
              </label>
              <span className="text-[10px] text-white/40">{additionalNotes.length}/200</span>
            </div>
            <textarea
              id="cancel-notes"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value.slice(0, 200))}
              placeholder="Add any details or preferred rescheduling timeframe..."
              rows={2}
              className="w-full bg-stone-900/80 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 focus:outline-hidden focus:border-brand-gold transition-colors resize-none"
            />
          </div>

          {/* Policy Notice */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200/90 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Once cancelled, this appointment slot will be released immediately and your specialist will be notified. You can re-book anytime in the storefront.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-stone-950/90 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
          >
            Keep Appointment
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md shadow-red-900/40 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Cancelling...</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5" />
                <span>Yes, Cancel Booking</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
