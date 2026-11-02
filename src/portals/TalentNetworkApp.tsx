import React, { useState, useEffect } from 'react';
import { TalentNetwork } from '../components/TalentNetwork';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';
import { X, User, Briefcase, Mail, Phone, Lock, Building2 } from 'lucide-react';
import { cn } from '../utils';

export const DEMO_TALENT_SEEKER_USER = {
  uid: 'vendor-apex-solutions',
  name: 'Apex Precision Contracting India',
  displayName: 'Apex Precision Contracting India',
  companyName: 'Apex Precision Contracting India',
  businessName: 'Apex Precision Contracting India',
  email: 'careers@apexprecision.in',
  phone: '+91 98450 48190',
  role: 'talent_seeker',
  city: 'Bengaluru'
};

// Independent Login / Registration Modal for Opal Talent Network
const TalentAuthModal = ({
  isOpen,
  onClose,
  initialRole = 'talent',
  onSuccess
}: {
  isOpen: boolean;
  onClose: () => void;
  initialRole?: 'talent' | 'talent_seeker';
  onSuccess: (user: any) => void;
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'talent' | 'talent_seeker'>(initialRole);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [headline, setHeadline] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRole) setRole(initialRole);
  }, [initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const userData = snap.docs[0].data();
          const signedUser = { ...userData, uid: snap.docs[0].id };
          localStorage.setItem('opal_talent_user', JSON.stringify(signedUser));
          onSuccess(signedUser);
          onClose();
        } else {
          // If user doesn't exist, switch to register with email pre-filled
          setMode('register');
          setError('No account found with this email. Please complete your registration below.');
        }
      } else {
        // Register new Talent or Talent Seeker
        const newUid = `user-${Date.now()}`;
        const userData: any = {
          uid: newUid,
          email: email.trim().toLowerCase(),
          name: name.trim(),
          displayName: name.trim(),
          phone: phone.trim() || '+91 98450 19201',
          role: role,
          city: city.trim(),
          createdAt: serverTimestamp()
        };

        if (role === 'talent_seeker') {
          userData.companyName = companyName.trim() || name.trim();
          userData.businessName = userData.companyName;
        } else {
          userData.headline = headline.trim() || 'Technical Specialist Lead';
          // Initialize talent profile document
          try {
            await setDoc(doc(db, 'talent_profiles', `talent-${newUid}`), {
              id: `talent-${newUid}`,
              uid: newUid,
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim() || '+91 98450 19201',
              headline: headline.trim() || 'Technical Specialist Lead',
              city: city.trim(),
              bio: `Verified specialist registered on Opal Talent Network.`,
              skills: ['Technical Diagnostics', 'Safety Compliance', 'Blueprint Reading'],
              experiences: [],
              availabilityStatus: 'available',
              registeredAt: serverTimestamp()
            });
          } catch (e) {
            console.warn('Talent profile creation notice:', e);
          }
        }

        await setDoc(doc(db, 'users', newUid), userData);
        localStorage.setItem('opal_talent_user', JSON.stringify(userData));
        onSuccess(userData);
        onClose();
      }
    } catch (err: any) {
      console.error('Talent Auth Error:', err);
      setError(err.message || 'Authentication error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Briefcase className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-white tracking-tight">
            OPAL TALENT NETWORK
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' ? 'Sign in to your candidate or recruiter account' : 'Create your verified account'}
          </p>
        </div>

        {/* Role toggle */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-5 border border-slate-700/60">
          <button
            type="button"
            onClick={() => setRole('talent')}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
              role === 'talent' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            )}
          >
            <User className="w-3.5 h-3.5" />
            Candidate (Talent)
          </button>
          <button
            type="button"
            onClick={() => setRole('talent_seeker')}
            className={cn(
              "flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
              role === 'talent_seeker' ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            Talent Seeker (Vendor)
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/60 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none text-sm"
              placeholder="candidate@example.com"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none text-sm"
                  placeholder="e.g. Julian Vance"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Mobile Phone (for SMS notifications)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none text-sm"
                  placeholder="+91 98450 19201"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Metropolitan City</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none text-sm"
                  placeholder="e.g. Bengaluru, Mumbai, Delhi NCR"
                />
              </div>

              {role === 'talent_seeker' ? (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Company / Contracting Firm Name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none text-sm"
                    placeholder="e.g. Apex Precision Contracting India"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">Professional Headline</label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 rounded-xl border border-slate-700 text-white focus:border-indigo-500 focus:outline-none text-sm"
                    placeholder="e.g. Master Electrician | Commercial Lead"
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-md disabled:opacity-50 mt-2"
          >
            {isLoading ? 'Processing...' : mode === 'login' ? 'Sign In to Talent Network' : 'Complete Registration'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
          >
            {mode === 'login' ? "Don't have an account? Register here →" : "Already registered? Sign In →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TalentNetworkApp: React.FC = () => {
  // Sync document title for Opal Talent Network
  useEffect(() => {
    document.title = 'Opal Talent Network | Verified Candidates & Technical Hiring Portal';
  }, []);

  // Initialize user session
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('opal_talent_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    // Default to talent seeker view so requirements & candidate directory can be managed immediately
    return DEMO_TALENT_SEEKER_USER;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalPreselectedRole, setLoginModalPreselectedRole] = useState<'talent' | 'talent_seeker' | undefined>('talent');

  const userRole = user?.role || 'talent_seeker';

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    localStorage.removeItem('opal_talent_user');
    setUser(null);
  };

  const handleFastLogin = (targetRole: 'talent' | 'talent_seeker', customEmail?: string) => {
    if (targetRole === 'talent') {
      const talentUser = {
        uid: 'talent-uid-julian-vance',
        name: 'Julian Vance',
        displayName: 'Julian Vance',
        email: customEmail || 'julian.vance@example.com',
        phone: '+91 98450 19201',
        role: 'talent',
        city: 'Bengaluru',
        headline: 'Certified Master Electrician | Commercial Power & Substation Automation Lead'
      };
      setUser(talentUser);
      localStorage.setItem('opal_talent_user', JSON.stringify(talentUser));
    } else {
      const seekerUser = {
        uid: 'vendor-apex-solutions',
        name: 'Apex Precision Contracting India',
        displayName: 'Apex Precision Contracting India',
        companyName: 'Apex Precision Contracting India',
        businessName: 'Apex Precision Contracting India',
        email: customEmail || 'careers@apexprecision.in',
        phone: '+91 98450 48190',
        role: 'talent_seeker',
        city: 'Bengaluru'
      };
      setUser(seekerUser);
      localStorage.setItem('opal_talent_user', JSON.stringify(seekerUser));
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <main className="flex-1 w-full">
        <TalentNetwork
          user={user}
          userRole={userRole}
          onOpenLogin={(role) => {
            setLoginModalPreselectedRole(role);
            setIsLoginModalOpen(true);
          }}
          onFastLogin={handleFastLogin}
          onLogout={handleLogout}
          isEmbedded={false}
          initialTab={userRole === 'talent' ? 'profile' : 'publish'}
        />
      </main>

      <TalentAuthModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={loginModalPreselectedRole}
        onSuccess={(loggedUser) => setUser(loggedUser)}
      />
    </div>
  );
};
