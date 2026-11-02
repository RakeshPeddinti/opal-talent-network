import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  ThumbsUp, 
  ThumbsDown, 
  CheckCircle2, 
  AlertCircle,
  Tag,
  Building2,
  Package,
  Calendar,
  Send
} from 'lucide-react';
import { StarRating } from './StarRating';
import { ReviewRecord } from '../types';
import { cn } from '../utils';

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'provider' | 'seller';
  targetId?: string;
  targetName: string;
  referenceId: string;
  referenceType: 'booking' | 'order';
  itemTitle: string;
  existingReview?: ReviewRecord | null;
  currentUser?: any;
  onSubmitReview: (reviewData: Omit<ReviewRecord, 'id' | 'createdAt'>) => Promise<void>;
}

const PROVIDER_QUICK_TAGS = [
  'Master Craftsmanship',
  'Punctual & Respectful',
  'Impeccable Cleanliness',
  'Luxurious Environment',
  'Clear Communication',
  'Exceeded Expectations'
];

const SELLER_QUICK_TAGS = [
  'Pristine Luxury Packaging',
  'Authentic Premium Material',
  'Fast & Secure Shipping',
  'Flawless Fit & Tailoring',
  'True to Online Description',
  'Five-Star Concierge Service'
];

const RATING_FEEDBACK_TEXTS: Record<number, { title: string; desc: string }> = {
  5: { title: 'Exceptional Luxury Experience', desc: 'Flawless service and supreme attention to every detail.' },
  4: { title: 'Very Good Quality', desc: 'High standard of execution with minor room for improvement.' },
  3: { title: 'Satisfactory', desc: 'Met baseline expectations; standard execution.' },
  2: { title: 'Fair / Below Expectations', desc: 'Noticeable shortcomings in timing or craftsmanship.' },
  1: { title: 'Disappointing', desc: 'Did not meet luxury quality commitments.' }
};

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  referenceId,
  referenceType,
  itemTitle,
  existingReview,
  currentUser,
  onSubmitReview
}) => {
  const [rating, setRating] = useState<number>(existingReview?.rating || 5);
  const [title, setTitle] = useState<string>(existingReview?.title || '');
  const [comment, setComment] = useState<string>(existingReview?.comment || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(existingReview?.tags || []);
  const [recommend, setRecommend] = useState<boolean>(existingReview?.recommend ?? true);
  const [customerName, setCustomerName] = useState<string>(
    existingReview?.customerName || currentUser?.displayName || currentUser?.name || 'Valued Client'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingReview) {
        setRating(existingReview.rating || 5);
        setTitle(existingReview.title || '');
        setComment(existingReview.comment || '');
        setSelectedTags(existingReview.tags || []);
        setRecommend(existingReview.recommend ?? true);
        setCustomerName(existingReview.customerName || currentUser?.displayName || currentUser?.name || 'Valued Client');
      } else {
        setRating(5);
        setTitle('');
        setComment('');
        setSelectedTags([]);
        setRecommend(true);
        setCustomerName(currentUser?.displayName || currentUser?.name || 'Valued Client');
      }
      setIsSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, existingReview, currentUser]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const availableTags = targetType === 'provider' ? PROVIDER_QUICK_TAGS : SELLER_QUICK_TAGS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setErrorMessage('Please select a star rating from 1 to 5.');
      return;
    }
    if (!comment.trim()) {
      setErrorMessage('Please provide a few words of feedback describing your experience.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onSubmitReview({
        targetType,
        targetId: targetId || '',
        targetName,
        referenceId,
        referenceType,
        itemTitle,
        rating,
        title: title.trim() || RATING_FEEDBACK_TEXTS[rating]?.title || 'Client Review',
        comment: comment.trim(),
        tags: selectedTags,
        recommend,
        customerUid: currentUser?.uid || '',
        customerName: customerName.trim() || 'Valued Client',
        customerEmail: currentUser?.email || '',
        verified: true
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setErrorMessage(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-stone-950/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-gradient-to-b from-stone-900 via-[#151413] to-stone-950 text-white rounded-3xl border border-brand-gold/30 shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-stone-900/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-gold/15 border border-brand-gold/30 flex items-center justify-center text-brand-gold">
                <Star className="w-5 h-5 fill-brand-gold" />
              </div>
              <div>
                <h3 className="text-lg font-serif text-white">
                  {existingReview ? 'Update Your Review' : 'Rate & Leave Feedback'}
                </h3>
                <p className="text-xs text-brand-gold/90 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Verified Transaction: {referenceId}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              aria-label="Close review modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Target Attribution Card */}
          <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              {targetType === 'provider' ? (
                <div className="p-2 bg-brand-gold/20 rounded-xl text-brand-gold">
                  <Building2 className="w-4 h-4" />
                </div>
              ) : (
                <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                  <Package className="w-4 h-4" />
                </div>
              )}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold block">
                  {targetType === 'provider' ? 'Service Specialist' : 'Product Merchant'}
                </span>
                <span className="font-serif text-sm font-medium text-white">{targetName}</span>
                <span className="text-white/60 block text-[11px] truncate max-w-xs">{itemTitle}</span>
              </div>
            </div>

            <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Completed
            </span>
          </div>

          {/* Form Content */}
          {isSuccess ? (
            <div className="p-10 text-center space-y-4 animate-fadeIn">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-serif text-white">Thank You for Your Review!</h4>
              <p className="text-sm text-white/70 max-w-sm mx-auto">
                Your feedback has been verified and attributed to <strong className="text-brand-gold">{targetName}</strong>. It helps maintain the highest standards across Opal Portal.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {errorMessage && (
                <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-200 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Star Rating Interactive Selector */}
              <div className="text-center space-y-3 bg-white/5 p-5 rounded-2xl border border-white/5">
                <label className="text-xs uppercase font-bold tracking-widest text-brand-gold block">
                  Select Your Star Rating
                </label>
                <div className="flex justify-center">
                  <StarRating
                    rating={rating}
                    maxStars={5}
                    size="xl"
                    interactive={true}
                    onChange={(newScore) => setRating(newScore)}
                  />
                </div>
                {RATING_FEEDBACK_TEXTS[rating] && (
                  <div className="animate-fadeIn">
                    <p className="text-sm font-serif font-bold text-white">
                      {RATING_FEEDBACK_TEXTS[rating].title}
                    </p>
                    <p className="text-xs text-white/60">
                      {RATING_FEEDBACK_TEXTS[rating].desc}
                    </p>
                  </div>
                )}
              </div>

              {/* Compliment / Experience Tags */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-white/70 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-gold" />
                  What stood out most? (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium",
                          isSelected
                            ? "bg-brand-gold text-brand-dark border-brand-gold shadow-md font-bold"
                            : "bg-white/5 text-white/80 border-white/10 hover:border-brand-gold/40 hover:bg-white/10"
                        )}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Headline Title */}
              <div className="space-y-2">
                <label className="text-xs uppercase font-bold tracking-widest text-white/70 block">
                  Review Headline (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Masterful precision, pristine boutique packaging"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-gold transition-colors"
                />
              </div>

              {/* Detailed Feedback Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase font-bold tracking-widest text-white/70 block">
                    Detailed Experience & Feedback <span className="text-brand-gold">*</span>
                  </label>
                  <span className="text-[10px] text-white/40">
                    {comment.length} / 600 characters
                  </span>
                </div>
                <textarea
                  required
                  rows={3}
                  placeholder="Share details on the quality of work, specialist demeanor, punctuality, or product authenticity..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 600))}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-gold transition-colors resize-none"
                />
              </div>

              {/* Recommendation Choice & Customer Name */}
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-white/70 block">
                    Would you recommend?
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecommend(true)}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                        recommend
                          ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Yes, Highly
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecommend(false)}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                        !recommend
                          ? "bg-red-500/20 border-red-500/60 text-red-300"
                          : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      No
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold tracking-widest text-white/70 block">
                    Public Signature
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Elena V."
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-brand-gold"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-white/5 text-white/70 hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-brand-gold text-brand-dark hover:bg-white transition-all font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Submitting...' : existingReview ? 'Update Feedback' : 'Publish Review'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
