import React from 'react';
import { motion } from 'motion/react';
import { Shield, TrendingUp, Calendar, Users, ArrowRight } from 'lucide-react';

interface ProviderLandingProps {
  onLogin: () => void;
}

export const ProviderLanding: React.FC<ProviderLandingProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-brand-dark text-white pt-32 pb-20">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <span className="text-brand-gold uppercase tracking-[0.4em] text-xs mb-6 block">Partner with Opal Portal</span>
            <h1 className="text-6xl md:text-7xl mb-8 font-serif leading-tight">Grow Your Business with Professional Tools</h1>
            <p className="text-xl text-white/60 mb-10 leading-relaxed">
              Join the elite network of service providers. Manage your schedule, track revenue, 
              and connect with premium clients—all in one place.
            </p>
            <button 
              onClick={onLogin}
              className="px-10 py-5 bg-brand-gold text-white rounded-full font-medium uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all shadow-2xl flex items-center gap-3 mx-auto"
            >
              Access Provider Portal <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-brand-gold/20 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="w-8 h-8 text-brand-gold" />
              </div>
              <h3 className="text-2xl mb-4 font-serif">Smart Scheduling</h3>
              <p className="text-white/50 leading-relaxed">
                Visual calendar management with real-time booking updates. Never miss an appointment again.
              </p>
            </div>

            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-brand-gold/20 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="w-8 h-8 text-brand-gold" />
              </div>
              <h3 className="text-2xl mb-4 font-serif">Revenue Tracking</h3>
              <p className="text-white/50 leading-relaxed">
                Detailed financial insights and payment tracking to help you understand your business growth.
              </p>
            </div>

            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-brand-gold/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-brand-gold" />
              </div>
              <h3 className="text-2xl mb-4 font-serif">Client Management</h3>
              <p className="text-white/50 leading-relaxed">
                Maintain a professional client database with booking history and contact information.
              </p>
            </div>

            <div className="p-10 rounded-[40px] bg-white/5 border border-white/10">
              <div className="w-14 h-14 bg-brand-gold/20 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-brand-gold" />
              </div>
              <h3 className="text-2xl mb-4 font-serif">Secure Platform</h3>
              <p className="text-white/50 leading-relaxed">
                Enterprise-grade security for your data and your clients' information.
              </p>
            </div>
          </div>

          <div className="mt-24 p-12 rounded-[50px] bg-brand-gold text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl mb-6 font-serif">Ready to get started?</h2>
              <p className="text-white/80 mb-10 max-w-xl mx-auto">
                Login to your existing account or contact our support team to register as a new service provider.
              </p>
              <button 
                onClick={onLogin}
                className="px-10 py-4 bg-brand-dark text-white rounded-full font-medium uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all"
              >
                Login Now
              </button>
            </div>
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-brand-dark/10 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
};
