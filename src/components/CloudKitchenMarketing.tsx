import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Users, Mail, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '../utils';

import { auth, db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface CloudKitchenMarketingProps {
  businessName: string;
}

export const CloudKitchenMarketing: React.FC<CloudKitchenMarketingProps> = ({ businessName }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setIsLoading(true);
    setStatus(null);

    try {
      // Simulate sending notifications by adding to a 'notifications' collection
      await addDoc(collection(db, 'notifications'), {
        providerId: user.uid,
        businessName,
        subject,
        message,
        createdAt: serverTimestamp(),
        type: 'marketing'
      });

      setStatus({ 
        type: 'success', 
        message: `Successfully sent notifications to your registered customers!` 
      });
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error("Notification error:", error);
      setStatus({ 
        type: 'error', 
        message: "Failed to send notifications. Please try again." 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-brand-gold/10 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-brand-gold/5 bg-brand-gold/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold text-white flex items-center justify-center shadow-lg">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-3xl font-serif">Special Dish Notifications</h3>
              <p className="text-brand-muted">Notify your registered customers about today's specials.</p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div className="bg-brand-cream/30 p-6 rounded-2xl border border-brand-gold/10">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-brand-gold" />
                <p className="text-xs uppercase tracking-widest font-bold text-brand-muted">Target Audience</p>
              </div>
              <p className="text-sm font-medium">All customers who have previously booked your services.</p>
            </div>
            <div className="bg-brand-cream/30 p-6 rounded-2xl border border-brand-gold/10">
              <div className="flex items-center gap-3 mb-2">
                <Mail className="w-5 h-5 text-brand-gold" />
                <p className="text-xs uppercase tracking-widest font-bold text-brand-muted">Delivery Method</p>
              </div>
              <p className="text-sm font-medium">Direct Email Notification</p>
            </div>
            <div className="bg-brand-cream/30 p-6 rounded-2xl border border-brand-gold/10">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="w-5 h-5 text-brand-gold" />
                <p className="text-xs uppercase tracking-widest font-bold text-brand-muted">Purpose</p>
              </div>
              <p className="text-sm font-medium">Drive orders for limited-time special dishes.</p>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-6">
            {status && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-xl flex items-center gap-3 text-sm font-medium",
                  status.type === 'success' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                )}
              >
                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {status.message}
              </motion.div>
            )}

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-brand-muted ml-1">Subject Line</label>
              <input 
                required
                type="text"
                placeholder="e.g., Today's Special: Authentic Truffle Pasta is back!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-6 py-4 bg-brand-cream/50 border border-brand-gold/10 rounded-2xl focus:ring-2 focus:ring-brand-gold/30 outline-none transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold text-brand-muted ml-1">Message Content</label>
              <textarea 
                required
                rows={6}
                placeholder="Describe your special dish, pricing, and how they can order..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-6 py-4 bg-brand-cream/50 border border-brand-gold/10 rounded-2xl focus:ring-2 focus:ring-brand-gold/30 outline-none transition-all font-medium resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-brand-dark text-white rounded-2xl font-bold text-lg hover:bg-brand-gold transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Sending Notifications...
                </>
              ) : (
                <>
                  <Send className="w-6 h-6" />
                  Push Notification to Customers
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
