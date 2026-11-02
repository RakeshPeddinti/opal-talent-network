import React from 'react';
import { TalentNetworkApp } from './portals/TalentNetworkApp';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6 font-sans">
          <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-red-500/30 max-w-md w-full text-center">
            <h2 className="text-2xl font-serif text-red-400 mb-4">Talent Network Notice</h2>
            <p className="text-slate-300 text-sm mb-6">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all cursor-pointer"
            >
              Reload Talent Network
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * OPAL TALENT NETWORK - Dedicated Standalone Application
 * Independent technical talent network with candidate directory (.talent-directory-container),
 * Indian & international metropolitan city selector, dynamic skills search, requirement publishing,
 * applicant tracking with real-time SMS outreach, and walkthrough video guide.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <TalentNetworkApp />
    </ErrorBoundary>
  );
}
