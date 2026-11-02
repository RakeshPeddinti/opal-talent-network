import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  User, 
  MapPin, 
  Search, 
  Plus, 
  Send, 
  Smartphone, 
  CheckCircle2, 
  FileText, 
  Building2, 
  Clock, 
  DollarSign, 
  Award, 
  X, 
  ChevronRight, 
  Edit3, 
  Phone, 
  Mail, 
  ArrowUpRight, 
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  Lock,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Film,
  Play,
  Download,
  Globe,
  Sparkles,
  LogOut,
  Image as ImageIcon
} from 'lucide-react';
import { TalentVideoModal } from './TalentVideoModal';
import { 
  TalentProfile, 
  TalentJobRequirement, 
  TalentApplication, 
  TalentExperience 
} from '../types';
import { 
  DEFAULT_TALENT_JOBS, 
  DEFAULT_REGISTERED_TALENTS,
  INDIAN_METROPOLITAN_CITIES,
  COUNTRY_LOCALE_CONFIGS,
  CountryLocaleConfig,
  detectLocaleCountry
} from '../defaultTalentData';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  updateDoc, 
  doc 
} from 'firebase/firestore';

interface TalentNetworkProps {
  user: any;
  userRole?: 'talent' | 'talent_seeker' | 'seeker' | 'provider' | 'seller' | string;
  onOpenLogin: (preselectedRole?: 'talent' | 'talent_seeker') => void;
  onSwitchView?: (view: string) => void;
  onFastLogin?: (role: 'talent' | 'talent_seeker', email?: string) => void;
  onLogout?: () => void;
  isEmbedded?: boolean;
  initialTab?: string;
}

export const TalentNetwork: React.FC<TalentNetworkProps> = ({
  user,
  userRole,
  onOpenLogin,
  onSwitchView,
  onFastLogin,
  onLogout,
  isEmbedded = false,
  initialTab
}) => {
  // Check if current user is a registered vendor with the Talent Network portal
  const isTalent = userRole === 'talent' || user?.role === 'talent';
  const isTalentSeeker = userRole === 'talent_seeker' || user?.role === 'talent_seeker';
  const isPortalProvider = userRole === 'provider' || user?.role === 'provider' || userRole === 'admin' || user?.role === 'admin' || user?.email === 'rakesh2xplore@gmail.com';
  const isRegisteredVendor = Boolean(user && (isTalentSeeker || isPortalProvider));

  // Sub-tabs
  // For Talent: 'profile' | 'requirements' | 'applications'
  // For Registered Vendor (Talent Seeker / Provider): 'directory' | 'publish' | 'my_postings' | 'applicants'
  // For Guest / Non-Vendor: 'browse' | 'directory' (with vendor access gate)
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (initialTab) return initialTab;
    return isTalent ? 'profile' : isRegisteredVendor ? 'directory' : 'browse';
  });

  // Sync default tab if role changes or initialTab updates
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    } else if (isTalent) {
      setActiveTab('profile');
    } else if (isRegisteredVendor) {
      setActiveTab('directory');
    } else {
      setActiveTab('browse');
    }
  }, [isTalent, isRegisteredVendor, initialTab]);

  // Firestore & local state
  const [jobs, setJobs] = useState<TalentJobRequirement[]>(DEFAULT_TALENT_JOBS);
  const [talents, setTalents] = useState<TalentProfile[]>(DEFAULT_REGISTERED_TALENTS);
  const [applications, setApplications] = useState<TalentApplication[]>([]);

  // Current logged in talent profile state
  const [currentProfile, setCurrentProfile] = useState<TalentProfile>(() => {
    const existing = DEFAULT_REGISTERED_TALENTS.find(t => t.email === user?.email || t.uid === user?.uid);
    if (existing) return existing;
    return {
      id: `TALENT-${user?.uid || 'CURRENT'}`,
      uid: user?.uid || 'talent-user',
      name: user?.displayName || user?.name || 'Julian Vance',
      email: user?.email || 'julian.vance@example.com',
      phone: user?.phone || '+91 98450 19201',
      headline: 'Certified Master Electrician | Commercial Power & Substation Automation Lead',
      city: 'Bengaluru',
      state: 'Karnataka',
      bio: '10+ years specializing in commercial electrical distribution, 11kV/33kV substations, CEA code certifications, and three-phase industrial transformer installations across Bengaluru IT corridors.',
      skills: ['Commercial Wiring', 'High-Voltage Panels', 'NEC Compliance', 'PLC Programming', 'OSHA 30'],
      experiences: DEFAULT_REGISTERED_TALENTS[0].experiences,
      education: 'Bachelor of Technology in Electrical Engineering, RV College of Engineering, Bengaluru',
      certifications: ['State Electrical Supervisory License (Grade A)', 'OSHA 30-Hour Construction Safety'],
      wageExpectation: '₹850 – ₹1,200 / hr',
      availabilityStatus: 'available',
      resumeName: 'Julian_Vance_Master_Electrician_Resume.pdf',
      resumeText: 'Julian Vance | Master Electrician | 10+ Years Experience in Commercial Electrical & Power Systems | Bengaluru, Karnataka | Phone: +91 98450 19201 | Core Skills: Commercial Wiring, High-Voltage Panels, CEA Compliance, OSHA 30.',
      registeredAt: new Date().toISOString()
    };
  });

  // Locale & Country Detection State (defaults to user's detected country e.g. IN, US, etc.)
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(() => detectLocaleCountry());
  const currentCountryConfig: CountryLocaleConfig = useMemo(() => {
    return COUNTRY_LOCALE_CONFIGS[selectedCountryCode] || COUNTRY_LOCALE_CONFIGS['IN'];
  }, [selectedCountryCode]);

  // Search & Filter State for Talent Seeker & Talents
  const [cityFilter, setCityFilter] = useState<string>(() => `All ${COUNTRY_LOCALE_CONFIGS[detectLocaleCountry()]?.metroLabel || 'Indian Metros'}`);
  const [skillSearchQuery, setSkillSearchQuery] = useState<string>('');
  const [skillFilter, setSkillFilter] = useState<string>('All Skills');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [experienceFilter, setExperienceFilter] = useState<string>('all'); // 'all' | '1-3' | '3-5' | '5-8' | '8+'
  const [wageFilter, setWageFilter] = useState<string>('all'); // 'all' | 'under-600' | '600-800' | '800-1100' | '1100+'
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedJobToApply, setSelectedJobToApply] = useState<TalentJobRequirement | null>(null);
  const [applyResumeText, setApplyResumeText] = useState<string>('');
  const [applyCoverNote, setApplyCoverNote] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);

  // Vendor Outreach SMS Modal
  const [selectedTalentForSms, setSelectedTalentForSms] = useState<TalentProfile | null>(null);
  const [smsCustomMessage, setSmsCustomMessage] = useState<string>('');
  const [selectedJobToAttach, setSelectedJobToAttach] = useState<string>('');
  const [isSendingSms, setIsSendingSms] = useState<boolean>(false);

  // SMS Live Simulator Toast
  const [smsToast, setSmsToast] = useState<{
    show: boolean;
    to: string;
    recipientName: string;
    senderName: string;
    message: string;
    timestamp: string;
  } | null>(null);

  // Walkthrough Video & Real Screenshots Modal State
  const [isTalentVideoModalOpen, setIsTalentVideoModalOpen] = useState<boolean>(false);
  const [talentVideoInitialTab, setTalentVideoInitialTab] = useState<'video' | 'screenshots' | 'script'>('video');

  // Profile Edit Modals
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showAddExperienceModal, setShowAddExperienceModal] = useState<boolean>(false);
  const [newSkillInput, setNewSkillInput] = useState<string>('');

  // Experience Form State
  const [newExp, setNewExp] = useState<{
    roleTitle: string;
    companyName: string;
    employmentType: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
  }>({
    roleTitle: '',
    companyName: '',
    employmentType: 'Full-time',
    location: currentProfile.city,
    startDate: '',
    endDate: 'Present',
    current: true,
    description: ''
  });

  // Publish Requirement Form State (Talent Seeker - India)
  const [newJobForm, setNewJobForm] = useState({
    title: '',
    companyName: user?.companyName || user?.businessName || 'Apex Precision Contracting India',
    skills: '',
    experienceLevel: '3-5 years',
    wageLevel: '₹850 – ₹1,100 / hr',
    wageType: 'hourly' as 'hourly' | 'annual' | 'contract',
    city: 'Bengaluru',
    state: 'Karnataka',
    description: '',
    employmentType: 'Full-time',
    contactPhone: user?.phone || '+91 98450 48190',
    contactEmail: user?.email || 'careers@apexprecision.in'
  });
  const [isPublishingJob, setIsPublishingJob] = useState<boolean>(false);
  const [publishSuccessBanner, setPublishSuccessBanner] = useState<string | null>(null);

  // Real-time Firestore subscriptions with offline fallbacks
  useEffect(() => {
    let unsubscribeJobs = () => {};
    let unsubscribeTalents = () => {};
    let unsubscribeApps = () => {};

    try {
      const jobsQuery = query(collection(db, 'talent_jobs'), orderBy('createdAt', 'desc'));
      unsubscribeJobs = onSnapshot(jobsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedJobs: TalentJobRequirement[] = [];
          snapshot.forEach((doc) => {
            fetchedJobs.push({ id: doc.id, ...doc.data() } as TalentJobRequirement);
          });
          const existingIds = new Set(fetchedJobs.map(j => j.id));
          const nonDupDefaults = DEFAULT_TALENT_JOBS.filter(d => !existingIds.has(d.id));
          setJobs([...fetchedJobs, ...nonDupDefaults]);
        }
      }, (err) => {
        console.warn('Firestore talent_jobs subscription notice:', err.message);
      });
    } catch (e) {
      console.warn('Jobs collection listener note:', e);
    }

    try {
      const talentsQuery = query(collection(db, 'talent_profiles'), orderBy('registeredAt', 'desc'));
      unsubscribeTalents = onSnapshot(talentsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedTalents: TalentProfile[] = [];
          snapshot.forEach((doc) => {
            fetchedTalents.push({ id: doc.id, ...doc.data() } as TalentProfile);
          });
          const existingIds = new Set(fetchedTalents.map(t => t.id));
          const nonDupDefaults = DEFAULT_REGISTERED_TALENTS.filter(d => !existingIds.has(d.id));
          setTalents([...fetchedTalents, ...nonDupDefaults]);
        }
      }, (err) => {
        console.warn('Firestore talent_profiles subscription notice:', err.message);
      });
    } catch (e) {
      console.warn('Talents collection listener note:', e);
    }

    try {
      const appsQuery = query(collection(db, 'talent_applications'), orderBy('appliedAt', 'desc'));
      unsubscribeApps = onSnapshot(appsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const fetchedApps: TalentApplication[] = [];
          snapshot.forEach((doc) => {
            fetchedApps.push({ id: doc.id, ...doc.data() } as TalentApplication);
          });
          setApplications(fetchedApps);
        }
      }, (err) => {
        console.warn('Firestore talent_applications note:', err.message);
      });
    } catch (e) {
      console.warn('Apps collection listener note:', e);
    }

    return () => {
      unsubscribeJobs();
      unsubscribeTalents();
      unsubscribeApps();
    };
  }, []);

  // Set initial resume text when opening apply modal
  useEffect(() => {
    if (selectedJobToApply) {
      setApplyResumeText(
        currentProfile.resumeText || 
        `${currentProfile.name} | ${currentProfile.headline} | Contact: ${currentProfile.phone} • ${currentProfile.email}\n\nKey Skills: ${currentProfile.skills.join(', ')}\n\nExperience:\n${currentProfile.experiences.map(e => `• ${e.roleTitle} at ${e.companyName} (${e.startDate} - ${e.endDate || 'Present'}): ${e.description}`).join('\n')}`
      );
      setApplyCoverNote(`Hi ${selectedJobToApply.vendorName}, I am very interested in this ${selectedJobToApply.title} opportunity in ${selectedJobToApply.city}. My skills and certifications align directly with your requirements.`);
    }
  }, [selectedJobToApply, currentProfile]);

  // Set default SMS outreach text when vendor opens contact modal
  useEffect(() => {
    if (selectedTalentForSms) {
      const vendorBiz = user?.companyName || user?.businessName || 'Opal Partner Vendor';
      setSmsCustomMessage(
        `Hi ${selectedTalentForSms.name}! ${vendorBiz} reviewed your profile on Opal Talent Network. We have an open opportunity in ${selectedTalentForSms.city} that matches your skillset. When are you available for a brief conversation?`
      );
      if (jobs.length > 0) {
        setSelectedJobToAttach(jobs[0].id);
      }
    }
  }, [selectedTalentForSms, user, jobs]);

  // Handle Country Locale Switch (e.g. from India to US, UK, etc.)
  const handleCountryChange = (countryCode: string) => {
    setSelectedCountryCode(countryCode);
    const config = COUNTRY_LOCALE_CONFIGS[countryCode] || COUNTRY_LOCALE_CONFIGS['IN'];
    setCityFilter(`All ${config.metroLabel}`);
  };

  // Helper to check if "All Cities" or "All Metros" is selected
  const isAllCities = (c: string) => 
    !c || 
    c === 'All Cities' || 
    c === 'All Indian Metros' || 
    c.startsWith('All ') || 
    c === `All ${currentCountryConfig.metroLabel}`;

  // Distinct cities list across registered talents and jobs
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    (currentCountryConfig?.cities || INDIAN_METROPOLITAN_CITIES).forEach(c => set.add(c));
    talents.forEach(t => { if (t.city) set.add(t.city); });
    jobs.forEach(j => { if (j.city) set.add(j.city); });
    return [`All ${currentCountryConfig.metroLabel}`, ...Array.from(set)];
  }, [talents, jobs, currentCountryConfig]);

  // Locale-specific metropolitan cities with candidate counts for quick buttons & filter badges
  const currentCountryCitiesWithCount = useMemo(() => {
    const list = currentCountryConfig?.cities || INDIAN_METROPOLITAN_CITIES;
    return list.map(city => {
      const count = talents.filter(t => 
        t.city.toLowerCase().includes(city.toLowerCase()) || 
        city.toLowerCase().includes(t.city.toLowerCase())
      ).length;
      return { city, count };
    });
  }, [currentCountryConfig, talents]);

  // Backward-compatible alias for residual references
  const indianMetroCitiesWithCount = currentCountryCitiesWithCount;

  // Filtered requirements list for Talents (Single liners)
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (!isAllCities(cityFilter)) {
        const cNorm = cityFilter.toLowerCase().replace(/\s*\(.*\)/, '').trim();
        const jobCityNorm = job.city.toLowerCase().trim();
        if (!jobCityNorm.includes(cNorm) && !cNorm.includes(jobCityNorm)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesVendor = job.vendorName.toLowerCase().includes(q);
        const matchesSkills = job.skillsRequired.some(s => s.toLowerCase().includes(q));
        const matchesCity = job.city.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVendor && !matchesSkills && !matchesCity) {
          return false;
        }
      }
      return true;
    });
  }, [jobs, cityFilter, searchQuery]);

  // Unique skills across all registered talents with candidate count
  const allAvailableSkills = useMemo(() => {
    const counts = new Map<string, number>();
    talents.forEach(t => {
      (t.skills || []).forEach(skill => {
        counts.set(skill, (counts.get(skill) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
  }, [talents]);

  // Extract years of experience safely
  const getTalentExperienceYears = (t: TalentProfile): number => {
    if (typeof t.yearsOfExperience === 'number') return t.yearsOfExperience;
    const text = `${t.headline} ${t.bio || ''} ${t.resumeText || ''}`;
    const match = text.match(/(\d+)\+?\s*years?/i);
    if (match) return parseInt(match[1], 10);
    if (t.experiences && t.experiences.length > 0) return t.experiences.length * 2.5;
    return 3;
  };

  // Extract minimum and maximum hourly wage expectation (handles INR ₹ and $)
  const getTalentHourlyWage = (t: TalentProfile): { min: number; max: number } => {
    const wageStr = t.wageExpectation || '';
    const matches = wageStr.match(/\d+(?:[,\.]\d+)?/g);
    if (matches && matches.length >= 2) {
      const v1 = parseFloat(matches[0].replace(/,/g, ''));
      const v2 = parseFloat(matches[1].replace(/,/g, ''));
      return { min: Math.min(v1, v2), max: Math.max(v1, v2) };
    } else if (matches && matches.length === 1) {
      const v = parseFloat(matches[0].replace(/,/g, ''));
      return { min: v, max: v };
    }
    return { min: 700, max: 1000 };
  };

  // Filtered Talents list for Talent Seekers (Strict rule: registered with Talent Network only)
  // Supports filtering by: Metropolitan City (Locale-specific), 'Search by Skill' Text Input, Specific Skills, Experience Level, Wage Range, and Keyword Search
  const filteredTalents = useMemo(() => {
    return talents.filter(talent => {
      // 1. Metropolitan City Filter (Locale-specific)
      if (!isAllCities(cityFilter)) {
        const cNorm = cityFilter.toLowerCase().replace(/\s*\(.*\)/, '').trim();
        const talentCityNorm = talent.city.toLowerCase().trim();
        const matchesCity = talentCityNorm.includes(cNorm) || 
                            cNorm.includes(talentCityNorm) ||
                            (talent.state && talent.state.toLowerCase().includes(cNorm));
        if (!matchesCity) {
          return false;
        }
      }

      // 2. 'Search by Skill' Text Input Filter (dynamically filters by candidate skills)
      if (skillSearchQuery.trim()) {
        const qSkill = skillSearchQuery.trim().toLowerCase();
        const matchesTalentSkills = (talent.skills || []).some(s => s.toLowerCase().includes(qSkill));
        if (!matchesTalentSkills) return false;
      }

      // 3. Specific Skill Dropdown Filter
      if (skillFilter !== 'All Skills') {
        const hasSkill = talent.skills.some(s => s.toLowerCase() === skillFilter.toLowerCase());
        if (!hasSkill) return false;
      }

      // 4. Multi-Select Skill Chips Filter
      if (selectedSkills.length > 0) {
        const hasAllSelected = selectedSkills.every(reqSkill =>
          talent.skills.some(s => s.toLowerCase() === reqSkill.toLowerCase())
        );
        if (!hasAllSelected) return false;
      }

      // 5. Experience Level Filter ('1-3' | '3-5' | '5-8' | '8+')
      if (experienceFilter !== 'all') {
        const exp = getTalentExperienceYears(talent);
        if (experienceFilter === '1-3' && (exp < 1 || exp > 3)) return false;
        if (experienceFilter === '3-5' && (exp < 3 || exp > 5)) return false;
        if (experienceFilter === '5-8' && (exp < 5 || exp > 8)) return false;
        if (experienceFilter === '8+' && exp < 8) return false;
      }

      // 6. Wage Range Filter (supports Indian ₹ rates & benchmarks)
      if (wageFilter !== 'all') {
        const wage = getTalentHourlyWage(talent);
        // Indian Rupee (INR) brackets
        if (wageFilter === 'under-600' && wage.min >= 600) return false;
        if (wageFilter === '600-800' && (wage.max < 600 || wage.min > 800)) return false;
        if (wageFilter === '800-1100' && (wage.max < 800 || wage.min > 1100)) return false;
        if (wageFilter === '1100+' && wage.max < 1100) return false;

        // Legacy / USD compatibility brackets
        if (wageFilter === 'under-45' && wage.min >= 45 && wage.min < 200) return false;
        if (wageFilter === '45-55' && (wage.max < 45 || wage.min > 55) && wage.min < 200) return false;
        if (wageFilter === '55-65' && (wage.max < 55 || wage.min > 65) && wage.min < 200) return false;
        if (wageFilter === '65+' && wage.max < 65 && wage.max < 200) return false;
      }

      // 7. Text Search Query (Searches candidate name, headline, skills, city, state, bio, certifications)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = talent.name.toLowerCase().includes(q);
        const matchesHeadline = talent.headline.toLowerCase().includes(q);
        const matchesSkills = talent.skills.some(s => s.toLowerCase().includes(q));
        const matchesCity = talent.city.toLowerCase().includes(q);
        const matchesState = (talent.state || '').toLowerCase().includes(q);
        const matchesBio = (talent.bio || '').toLowerCase().includes(q);
        const matchesCerts = (talent.certifications || []).some(c => c.toLowerCase().includes(q));
        if (!matchesName && !matchesHeadline && !matchesSkills && !matchesCity && !matchesState && !matchesBio && !matchesCerts) {
          return false;
        }
      }

      return true;
    });
  }, [talents, cityFilter, skillSearchQuery, skillFilter, selectedSkills, experienceFilter, wageFilter, searchQuery, isAllCities]);

  // Active filters count for quick reset indicator
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (!isAllCities(cityFilter)) count++;
    if (skillSearchQuery.trim()) count++;
    if (skillFilter !== 'All Skills') count++;
    if (selectedSkills.length > 0) count += selectedSkills.length;
    if (experienceFilter !== 'all') count++;
    if (wageFilter !== 'all') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [cityFilter, skillSearchQuery, skillFilter, selectedSkills, experienceFilter, wageFilter, searchQuery, isAllCities]);

  // Reset all talent search filters
  const handleResetFilters = () => {
    setCityFilter(`All ${currentCountryConfig.metroLabel}`);
    setSkillSearchQuery('');
    setSkillFilter('All Skills');
    setSelectedSkills([]);
    setExperienceFilter('all');
    setWageFilter('all');
    setSearchQuery('');
  };

  // Toggle specific skill chip filter
  const handleToggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  // Talent: Apply for open requirement
  const handleConfirmApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobToApply) return;
    setIsApplying(true);

    try {
      const appRecord: TalentApplication = {
        id: `APP-OPAL-${Math.floor(100000 + Math.random() * 900000)}`,
        jobId: selectedJobToApply.id,
        jobTitle: selectedJobToApply.title,
        vendorName: selectedJobToApply.vendorName,
        vendorPhone: selectedJobToApply.vendorPhone,
        vendorEmail: selectedJobToApply.vendorEmail,
        talentUid: currentProfile.uid,
        talentName: currentProfile.name,
        talentEmail: currentProfile.email,
        talentPhone: currentProfile.phone,
        resumeText: applyResumeText,
        resumeName: currentProfile.resumeName || 'Profile_Resume.pdf',
        coverNote: applyCoverNote,
        status: 'applied',
        appliedAt: new Date().toISOString(),
        smsNotificationSent: true,
        smsTimestamp: new Date().toISOString()
      };

      try {
        await addDoc(collection(db, 'talent_applications'), {
          ...appRecord,
          createdAt: serverTimestamp()
        });
      } catch (dbErr) {
        console.warn('Firestore app write fallback to local state:', dbErr);
      }

      setApplications(prev => [appRecord, ...prev]);

      // Real SMS notification to talent registered phone from vendor
      const smsMessage = `Opal Talent Network: Hi ${currentProfile.name}! ${selectedJobToApply.vendorName} has received your application for "${selectedJobToApply.title}". Ref: ${appRecord.id}. Wage: ${selectedJobToApply.wageLevel}. We will contact you at ${currentProfile.phone}.`;

      try {
        const smsRes = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: currentProfile.phone,
            customerName: currentProfile.name,
            providerName: selectedJobToApply.vendorName,
            message: smsMessage
          })
        });

        if (smsRes.ok) {
          setSmsToast({
            show: true,
            to: currentProfile.phone,
            recipientName: currentProfile.name,
            senderName: selectedJobToApply.vendorName,
            message: smsMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setTimeout(() => setSmsToast(null), 8500);
        }
      } catch (smsErr) {
        console.warn('SMS dispatch notification note:', smsErr);
        setSmsToast({
          show: true,
          to: currentProfile.phone,
          recipientName: currentProfile.name,
          senderName: selectedJobToApply.vendorName,
          message: smsMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setTimeout(() => setSmsToast(null), 8500);
      }

      setSelectedJobToApply(null);
    } catch (err: any) {
      console.error('Error applying for requirement:', err);
    } finally {
      setIsApplying(false);
    }
  };

  // Talent Seeker: Send SMS Notification to Talent
  const handleSendTalentSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTalentForSms) return;
    setIsSendingSms(true);

    try {
      const vendorName = user?.companyName || user?.businessName || 'Apex Precision Systems';
      const attachedJob = jobs.find(j => j.id === selectedJobToAttach);
      const finalMessage = smsCustomMessage || 
        `Opal Talent Network: Hi ${selectedTalentForSms.name}, ${vendorName} is interested in your profile for our ${attachedJob ? attachedJob.title : 'open technical role'} in ${selectedTalentForSms.city}. Please reply or call ${user?.phone || '+1 555-481-9022'} to discuss.`;

      try {
        const res = await fetch('/api/send-sms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedTalentForSms.phone,
            customerName: selectedTalentForSms.name,
            providerName: vendorName,
            message: finalMessage
          })
        });

        if (res.ok) {
          setSmsToast({
            show: true,
            to: selectedTalentForSms.phone,
            recipientName: selectedTalentForSms.name,
            senderName: vendorName,
            message: finalMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          setTimeout(() => setSmsToast(null), 8500);
        }
      } catch (smsErr) {
        console.warn('Outreach SMS dispatch note:', smsErr);
        setSmsToast({
          show: true,
          to: selectedTalentForSms.phone,
          recipientName: selectedTalentForSms.name,
          senderName: vendorName,
          message: finalMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
        setTimeout(() => setSmsToast(null), 8500);
      }

      setSelectedTalentForSms(null);
      setSmsCustomMessage('');
    } catch (err) {
      console.error('Error sending outreach SMS:', err);
    } finally {
      setIsSendingSms(false);
    }
  };

  // Talent Seeker: Publish new Job Requirement
  const handlePublishJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobForm.title || !newJobForm.skills) return;
    setIsPublishingJob(true);

    try {
      const skillsArray = newJobForm.skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const jobRecord: TalentJobRequirement = {
        id: `JOB-OPAL-${Math.floor(100 + Math.random() * 900)}`,
        vendorUid: user?.uid || 'vendor-session',
        vendorName: newJobForm.companyName,
        vendorEmail: newJobForm.contactEmail,
        vendorPhone: newJobForm.contactPhone,
        title: newJobForm.title,
        skillsRequired: skillsArray,
        experienceLevel: newJobForm.experienceLevel,
        wageLevel: newJobForm.wageLevel,
        wageType: newJobForm.wageType,
        city: newJobForm.city,
        state: newJobForm.state,
        description: newJobForm.description || `Seeking an experienced ${newJobForm.title} for ongoing commercial projects.`,
        employmentType: newJobForm.employmentType,
        status: 'open',
        createdAt: new Date().toISOString(),
        applicationsCount: 0
      };

      try {
        await addDoc(collection(db, 'talent_jobs'), {
          ...jobRecord,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn('Firestore job write note:', err);
      }

      setJobs(prev => [jobRecord, ...prev]);
      setPublishSuccessBanner(`Requirement "${jobRecord.title}" successfully published to the Talent Network!`);
      setTimeout(() => setPublishSuccessBanner(null), 6000);

      setNewJobForm(prev => ({
        ...prev,
        title: '',
        skills: '',
        description: ''
      }));
      setActiveTab('my_postings');
    } catch (err) {
      console.error('Error publishing requirement:', err);
    } finally {
      setIsPublishingJob(false);
    }
  };

  // Profile Skills update
  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !currentProfile.skills.includes(trimmed)) {
      const updated = [...currentProfile.skills, trimmed];
      setCurrentProfile(prev => ({ ...prev, skills: updated }));
      setNewSkillInput('');
      try {
        updateDoc(doc(db, 'talent_profiles', currentProfile.id), { skills: updated });
      } catch (e) {}
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const updated = currentProfile.skills.filter(s => s !== skillToRemove);
    setCurrentProfile(prev => ({ ...prev, skills: updated }));
    try {
      updateDoc(doc(db, 'talent_profiles', currentProfile.id), { skills: updated });
    } catch (e) {}
  };

  // Add Experience
  const handleAddExperienceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExp.roleTitle || !newExp.companyName) return;

    const createdExp: TalentExperience = {
      id: `exp-${Date.now()}`,
      roleTitle: newExp.roleTitle,
      companyName: newExp.companyName,
      employmentType: newExp.employmentType,
      location: newExp.location,
      startDate: newExp.startDate || '2022',
      endDate: newExp.current ? 'Present' : newExp.endDate || '2023',
      current: newExp.current,
      description: newExp.description
    };

    const updated = [createdExp, ...currentProfile.experiences];
    setCurrentProfile(prev => ({ ...prev, experiences: updated }));
    setShowAddExperienceModal(false);
    setNewExp({
      roleTitle: '',
      companyName: '',
      employmentType: 'Full-time',
      location: currentProfile.city,
      startDate: '',
      endDate: 'Present',
      current: true,
      description: ''
    });

    try {
      updateDoc(doc(db, 'talent_profiles', currentProfile.id), { experiences: updated });
    } catch (e) {}
  };

  return (
    <div className={isEmbedded ? "w-full text-slate-900 font-sans selection:bg-slate-900 selection:text-white" : "min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-900 selection:text-white pt-24 pb-20"}>
      
      {/* Sober Executive Professional Header */}
      <header className={isEmbedded ? "border border-slate-200 bg-white rounded-3xl p-6 shadow-xs mb-6" : "border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs"}>
        <div className={isEmbedded ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4"}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
                  <Briefcase className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 font-serif">
                    OPAL TALENT NETWORK
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase font-sans font-semibold tracking-wider">
                      Independent Portal
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">
                    Create Your Profile. Get Discovered. Connect with Opportunities.
                  </p>
                </div>
              </div>
            </div>

            {/* Role indicator & Quick Actions */}
            <div className="flex items-center gap-2.5 flex-wrap justify-end">
              {isTalent ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-600">Signed in as</span>
                    <strong className="text-slate-900">{currentProfile.name}</strong>
                    <span className="text-indigo-700 font-mono text-[11px] font-semibold">(Talent)</span>
                  </div>
                  {onFastLogin && (
                    <button
                      onClick={() => {
                        onFastLogin('talent_seeker');
                        setActiveTab('publish');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-700 hover:text-white hover:bg-blue-600 bg-blue-50 border border-blue-200 shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                      title="Switch to Talent Seeker View (Publish Jobs)"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Talent Seeker (Publish Jobs)</span>
                    </button>
                  )}
                </div>
              ) : isTalentSeeker ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-slate-600">Signed in as</span>
                    <strong className="text-slate-900">{user?.companyName || user?.businessName || user?.displayName || 'Apex Precision Contracting'}</strong>
                    <span className="text-blue-700 font-mono text-[11px] font-semibold">(Talent Seeker)</span>
                  </div>
                  {onFastLogin && (
                    <button
                      onClick={() => {
                        onFastLogin('talent');
                        setActiveTab('profile');
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-indigo-700 hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Switch to Candidate Profile (Julian Vance)"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden sm:inline">Candidate View</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onFastLogin) onFastLogin('talent');
                      else onOpenLogin('talent');
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    Talent (Julian Vance)
                  </button>
                  <button
                    onClick={() => {
                      if (onFastLogin) {
                        onFastLogin('talent_seeker');
                        setActiveTab('publish');
                      } else {
                        onOpenLogin('talent_seeker');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Talent Seeker (Publish Jobs)
                  </button>
                </div>
              )}

              {/* Watch Video Guide & Download MP4 Header Buttons */}
              <button
                onClick={() => {
                  setTalentVideoInitialTab('video');
                  setIsTalentVideoModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                title="Watch Talent Network Walkthrough Video with Real Screenshots"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Video Guide</span>
                <span className="hidden sm:inline text-[10px] font-mono opacity-85">(MP4)</span>
              </button>
              <a
                href="/assets/aistudio/talent-network-walkthrough.mp4"
                download="opal-talent-network-walkthrough.mp4"
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
                title="Download 1280x720 Walkthrough Video (.mp4)"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Download MP4</span>
              </a>

              {user && onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Log out of Talent Network"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex items-center gap-1 mt-5 border-b border-slate-200 pt-1 overflow-x-auto custom-scrollbar">
            {isTalent ? (
              <>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'profile'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  My Professional Profile
                </button>
                <button
                  onClick={() => setActiveTab('requirements')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'requirements'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Open Requirements (Vendors)
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {jobs.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'applications'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  My Applications
                  {applications.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-mono">
                      {applications.length}
                    </span>
                  )}
                </button>
              </>
            ) : isRegisteredVendor ? (
              <>
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'directory'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  Registered Candidate Directory
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {talents.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('publish')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'publish'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-600" />
                  Publish Requirement
                </button>
                <button
                  onClick={() => setActiveTab('my_postings')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'my_postings'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Our Open Postings
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {jobs.filter(j => j.vendorUid === user?.uid || j.vendorName === user?.companyName).length || jobs.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('applicants')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'applicants'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Received Applications
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-mono">
                    {applications.length}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('browse')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'browse'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Explore Open Requirements
                </button>
                <button
                  onClick={() => setActiveTab('directory')}
                  className={`px-4 py-2.5 text-xs font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'directory'
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  Registered Talents Directory
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold tracking-wide font-mono">
                    Vendors Only
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={isEmbedded ? "w-full pt-2" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6"}>

        {/* Interactive Video Showcase & Real Screenshots Banner */}
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 border border-indigo-900/50 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Film className="w-3 h-3 text-indigo-400" />
                  60s Video Guide
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  1280x720 HD MP4
                </span>
                <span className="text-[11px] text-slate-300">
                  • 11 Indian Metro Hubs
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight font-serif">
                New to Talent Network? Watch How Talents &amp; Seekers Connect Across India
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Explore our downloadable walkthrough video with real screen captures: Learn who can use the network, how hiring vendors publish technical jobs with locked attribution, how talents apply with 1-click &amp; auto-attached resumes, and how to filter candidates across Indian Metros (Bengaluru, Mumbai, Delhi NCR, and more).
              </p>
              
              {/* Chapter preview tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-300">
                <span className="text-indigo-300 font-semibold text-[10px] uppercase tracking-wider">Chapters:</span>
                <button 
                  onClick={() => { setTalentVideoInitialTab('video'); setIsTalentVideoModalOpen(true); }}
                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  1. Who Can Use It?
                </button>
                <button 
                  onClick={() => { setTalentVideoInitialTab('video'); setIsTalentVideoModalOpen(true); }}
                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  2. Publish Requirements
                </button>
                <button 
                  onClick={() => { setTalentVideoInitialTab('video'); setIsTalentVideoModalOpen(true); }}
                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  3. List of Jobs &amp; Apply
                </button>
                <button 
                  onClick={() => { setTalentVideoInitialTab('video'); setIsTalentVideoModalOpen(true); }}
                  className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  4. Indian Candidate Directory
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  setTalentVideoInitialTab('video');
                  setIsTalentVideoModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Watch Video Guide</span>
              </button>

              <button
                onClick={() => {
                  setTalentVideoInitialTab('screenshots');
                  setIsTalentVideoModalOpen(true);
                }}
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>Real Screenshots</span>
              </button>

              <a
                href="/assets/aistudio/talent-network-walkthrough.mp4"
                download="opal-talent-network-walkthrough.mp4"
                className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Download Full HD Walkthrough Video (MP4)"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4</span>
              </a>
            </div>
          </div>
        </div>

        {/* Global Notification Banner */}
        {publishSuccessBanner && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{publishSuccessBanner}</span>
            </div>
            <button onClick={() => setPublishSuccessBanner(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================================
            VIEW 1: TALENT VIEW - MY PROFESSIONAL PROFILE (LinkedIn-Style)
            ========================================================================= */}
        {isTalent && activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Columns: LinkedIn Style Profile Header, About, Experience, Education */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Profile Card Header */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Sober Header Banner */}
                <div className="h-28 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 border-b border-slate-200 relative">
                  <span className="absolute top-3 right-4 text-[11px] font-mono text-slate-600 tracking-wider font-semibold">
                    OPAL TALENT PROFILE
                  </span>
                </div>

                <div className="px-6 pb-6 pt-0 relative">
                  {/* Avatar & Availability Badge */}
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 mb-4 gap-4">
                    <div className="w-22 h-22 rounded-2xl bg-slate-900 border-4 border-white flex items-center justify-center text-white text-3xl font-bold font-serif shadow-md">
                      {currentProfile.name.charAt(0)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Open to Opportunities
                      </span>
                      <button
                        onClick={() => setShowEditProfileModal(true)}
                        className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                        Edit Profile
                      </button>
                    </div>
                  </div>

                  {/* Title & Core Details */}
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 font-serif">{currentProfile.name}</h2>
                    <p className="text-sm text-indigo-700 font-medium mt-1">{currentProfile.headline}</p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {currentProfile.city}{currentProfile.state ? `, ${currentProfile.state}` : ''}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {currentProfile.phone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {currentProfile.email}
                      </span>
                      <span className="flex items-center gap-1.5 font-mono text-slate-700 font-semibold">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        Wage Target: {currentProfile.wageExpectation || '$55 / hr'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* About Section */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase font-mono">
                    Professional Summary
                  </h3>
                  <button 
                    onClick={() => setShowEditProfileModal(true)} 
                    className="text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed font-sans">
                  {currentProfile.bio || 'Seasoned specialist delivering enterprise-grade craft and technical execution.'}
                </p>
              </div>

              {/* Experience Timeline (LinkedIn Style) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-700" />
                    <h3 className="text-base font-bold text-slate-900 tracking-wide font-serif">
                      Work Experience
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowAddExperienceModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Position
                  </button>
                </div>

                <div className="space-y-6">
                  {currentProfile.experiences.map((exp, idx) => (
                    <div key={exp.id || idx} className="relative pl-6 border-l-2 border-slate-200 group pb-2">
                      {/* Timeline dot */}
                      <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-white ring-2 ring-slate-200" />
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1 mb-1">
                        <h4 className="text-base font-bold text-slate-900">{exp.roleTitle}</h4>
                        <span className="text-xs font-mono text-slate-500 font-medium">
                          {exp.startDate} – {exp.endDate || 'Present'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-indigo-700 font-semibold mb-2">
                        <span>{exp.companyName}</span>
                        {exp.employmentType && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-600 font-normal">{exp.employmentType}</span>
                          </>
                        )}
                        {exp.location && (
                          <>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 font-normal">{exp.location}</span>
                          </>
                        )}
                      </div>

                      {exp.description && (
                        <p className="text-xs text-slate-600 leading-relaxed mt-2 font-sans">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Education & Certifications */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                  <GraduationCap className="w-4 h-4 text-slate-700" />
                  <h3 className="text-base font-bold text-slate-900 tracking-wide font-serif">
                    Education & Licenses
                  </h3>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase font-mono tracking-wider block text-[10px] mb-1">Formal Education</span>
                    <p className="text-sm font-semibold text-slate-900">{currentProfile.education || 'Trade Technical Degree'}</p>
                  </div>

                  {currentProfile.certifications && currentProfile.certifications.length > 0 && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-slate-500 uppercase font-mono tracking-wider block text-[10px] mb-2">Verified Certifications & Licenses</span>
                      <div className="flex flex-wrap gap-2">
                        {currentProfile.certifications.map(cert => (
                          <span key={cert} className="px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-800 text-xs flex items-center gap-1.5 font-medium">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Skills Management, Resume Card, and Quick Requirements widget */}
            <div className="space-y-6">
              
              {/* Skills Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase">
                      Core Skills ({currentProfile.skills.length})
                    </h3>
                  </div>
                </div>

                {/* Add new skill inline */}
                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add skill (e.g. OSHA 30)..."
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddSkill(); }}
                  />
                  <button
                    onClick={handleAddSkill}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {currentProfile.skills.map(skill => (
                    <span 
                      key={skill} 
                      className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs flex items-center gap-2 font-medium group hover:border-slate-300 transition-colors"
                    >
                      <span>{skill}</span>
                      <button 
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-slate-400 hover:text-red-600 opacity-60 group-hover:opacity-100 transition-opacity"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Resume Document Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-700" />
                    <h3 className="text-xs font-bold text-slate-600 font-mono tracking-wider uppercase">
                      Attached Resume
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
                    Active
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0 font-bold text-xs font-mono">
                      PDF
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {currentProfile.resumeName || 'Master_Profile_Resume.pdf'}
                      </p>
                      <p className="text-[10px] text-slate-500">Ready for 1-Click Apply</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 text-[11px] text-slate-500 leading-relaxed font-sans">
                  * When you apply for vendor requirements, this resume document and your registered contact number are automatically forwarded.
                </div>
              </div>

              {/* Quick Jump to Open Vendor Requirements */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-6 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-1 font-serif">Ready to Connect?</h4>
                <p className="text-xs text-slate-600 mb-4">
                  Explore {jobs.length} open technical requirements recently posted by verified commercial vendors.
                </p>
                <button
                  onClick={() => setActiveTab('requirements')}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>View All Open Requirements</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: OPEN REQUIREMENTS (VENDORS) - SINGLE LINERS
            ========================================================================= */}
        {((isTalent && activeTab === 'requirements') || (!isTalent && !isTalentSeeker && activeTab === 'browse')) && (
          <div className="space-y-6">
            
            {/* Header & Search / City Filter Toolbar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                  <span>Open Vendor Requirements</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-indigo-700 font-mono font-semibold border border-slate-200">
                    {filteredJobs.length} Live Positions
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Single-liner breakdown of recently posted skills, experience, and wage benchmarks.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* City Dropdown */}
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="bg-transparent text-slate-800 outline-none text-xs cursor-pointer font-medium"
                  >
                    {availableCities.map(c => (
                      <option key={c} value={c} className="bg-white text-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Keyword Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, skills, or vendor..."
                    className="pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 w-48 sm:w-64"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Single-Liners Table / List of Open Requirements */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-3 bg-slate-50 border-b border-slate-200 text-[11px] font-mono uppercase tracking-wider text-slate-600 font-semibold">
                <span className="col-span-3">Vendor / Company</span>
                <span className="col-span-3">Role & Required Skills</span>
                <span className="col-span-2">Experience</span>
                <span className="col-span-2">Wage Level</span>
                <span className="col-span-1">City</span>
                <span className="col-span-1 text-right">Action</span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredJobs.length === 0 ? (
                  <div className="p-12 text-center">
                    <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No open requirements found</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting your city or keyword search filter.</p>
                  </div>
                ) : (
                  filteredJobs.map((job) => {
                    const isAlreadyApplied = applications.some(a => a.jobId === job.id);
                    return (
                      <div 
                        key={job.id} 
                        className="px-6 py-4 hover:bg-slate-50/70 transition-colors flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:items-center"
                      >
                        {/* Vendor Name & Verification */}
                        <div className="col-span-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                              {job.vendorName.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                                {job.vendorName}
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              </p>
                              <p className="text-[10px] text-slate-500 truncate font-mono">
                                Ref: {job.id}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Title & Skills Required (Single Line) */}
                        <div className="col-span-3">
                          <p className="text-xs font-semibold text-slate-900 font-sans truncate" title={job.title}>
                            {job.title}
                          </p>
                          <p className="text-[11px] text-indigo-700 font-medium truncate mt-0.5">
                            {job.skillsRequired.join(' · ')}
                          </p>
                        </div>

                        {/* Experience */}
                        <div className="col-span-2">
                          <span className="text-xs text-slate-700 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {job.experienceLevel}
                          </span>
                        </div>

                        {/* Wage Level */}
                        <div className="col-span-2">
                          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            {job.wageLevel}
                          </span>
                        </div>

                        {/* City */}
                        <div className="col-span-1">
                          <span className="text-xs text-slate-600 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            {job.city}
                          </span>
                        </div>

                        {/* Action: Quick Apply */}
                        <div className="col-span-1 text-right mt-2 lg:mt-0">
                          {isAlreadyApplied ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 px-2 py-1 rounded bg-emerald-50 border border-emerald-200 font-semibold">
                              <CheckCircle2 className="w-3 h-3" /> Applied
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (!isTalent) {
                                  onOpenLogin('talent');
                                } else {
                                  setSelectedJobToApply(job);
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1 w-full lg:w-auto"
                            >
                              <span>Quick Apply</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        )}

        {/* =========================================================================
            VIEW 3: TALENT APPLICATIONS TRACKER
            ========================================================================= */}
        {isTalent && activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <span>My Submitted Applications</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-indigo-700 font-mono font-semibold border border-slate-200">
                  {applications.length} Submitted
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every application automatically dispatches an SMS confirmation to your registered phone number.
              </p>
            </div>

            {applications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No applications submitted yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Browse the Open Requirements tab to discover high-wage positions and 1-Click apply with your profile.
                </p>
                <button
                  onClick={() => setActiveTab('requirements')}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  Browse Open Requirements →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map(app => (
                  <div key={app.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900">{app.jobTitle}</h4>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs font-medium text-indigo-700">{app.vendorName}</span>
                        <span className="text-[10px] font-mono text-slate-500">Ref: {app.id}</span>
                      </div>
                      <p className="text-xs text-slate-600 font-sans">
                        Applied with resume: <strong className="text-slate-800">{app.resumeName || 'Profile_Resume.pdf'}</strong> • Mobile: <span className="font-mono text-slate-700">{app.talentPhone}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SMS Notification Delivered</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500 font-medium">
                        {new Date(app.appliedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 4: REGISTERED TALENTS DIRECTORY
            (STRICTLY VISIBLE ONLY TO REGISTERED VENDORS WITH TALENT NETWORK PORTAL)
            ========================================================================= */}
        {activeTab === 'directory' && (
          isRegisteredVendor ? (
            <div className="talent-directory-container space-y-6">
            
            {/* Search, Filter Console & Multi-Criteria Controls */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-serif flex items-center gap-2.5">
                    <span>Registered Candidate Directory</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-mono font-semibold border border-indigo-200">
                      {filteredTalents.length} Matching
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono border border-slate-200">
                      {talents.length} Total Registered
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <span className="text-sm">{currentCountryConfig.flag}</span>
                    <span>Search verified trade professionals and engineers across {currentCountryConfig.metroLabel.toLowerCase()} by specific skills, experience levels, and wage benchmarks.</span>
                  </p>
                </div>

                {/* Search & Reset */}
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search keyword, candidate name, or trade..."
                      className="pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 w-52 sm:w-72"
                    />
                    {searchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setSearchQuery('')} 
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      title="Reset all active filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset ({activeFiltersCount})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Skills 1-Click Quick Filter Bar (Satisfies: Search by Skill text input dynamically filtered by profile skills) */}
              {currentProfile?.skills && currentProfile.skills.length > 0 && (
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50/90 via-slate-50 to-indigo-50/50 border border-indigo-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Skills Defined in Your Profile:
                        </span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {currentProfile.skills.length} skills
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Click any profile skill to instantly populate 'Search by Skill' and filter directory talent cards.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentProfile.skills.map(profileSkill => {
                      const isCurrentSearch = skillSearchQuery.toLowerCase() === profileSkill.toLowerCase();
                      return (
                        <button
                          key={profileSkill}
                          type="button"
                          onClick={() => {
                            if (isCurrentSearch) {
                              setSkillSearchQuery('');
                            } else {
                              setSkillSearchQuery(profileSkill);
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isCurrentSearch
                              ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300'
                              : 'bg-white hover:bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs'
                          }`}
                          title={`Filter directory cards by profile skill: ${profileSkill}`}
                        >
                          {isCurrentSearch && <Check className="w-3 h-3 text-indigo-100" />}
                          <span>{profileSkill}</span>
                        </button>
                      );
                    })}
                    {skillSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSkillSearchQuery('')}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold px-1.5 py-0.5 cursor-pointer ml-1"
                        title="Clear skill search"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 5-Column Filter Selectors: Metropolitan City (Locale Specific), Search by Skill, Skill Category, Experience, Wage */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
                
                {/* 1. Metropolitan City Filter Dropdown (Locale Specific) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Metropolitan City</span>
                    </label>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-medium" title="Locale-Specific Country Selector">
                      <Globe className="w-2.5 h-2.5 text-slate-500" />
                      <select
                        value={selectedCountryCode}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        className="bg-transparent text-slate-800 font-semibold cursor-pointer focus:outline-none text-[10px]"
                        aria-label="Select Country for City List"
                      >
                        {Object.values(COUNTRY_LOCALE_CONFIGS).map(c => (
                          <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <select
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className={`w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        !isAllCities(cityFilter)
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold'
                          : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <option value={`All ${currentCountryConfig.metroLabel}`}>All {currentCountryConfig.metroLabel} ({talents.length})</option>
                      {currentCountryCitiesWithCount.map(({ city, count }) => (
                        <option key={city} value={city}>
                          {city} ({count} {count === 1 ? 'Talent' : 'Talents'})
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* 2. 'Search by Skill' Text Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="search-by-skill-input" className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Search by Skill</span>
                    </label>
                    {skillSearchQuery && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="search-by-skill-input"
                      type="text"
                      value={skillSearchQuery}
                      onChange={(e) => setSkillSearchQuery(e.target.value)}
                      placeholder="Search by Skill (e.g. PLC, Wiring)..."
                      className={`w-full px-3 py-2.5 pr-7 rounded-xl text-xs border transition-all focus:outline-none focus:ring-1 focus:ring-indigo-600 ${
                        skillSearchQuery.trim()
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-semibold'
                          : 'bg-slate-50 border-slate-300 text-slate-800 placeholder:text-slate-400 hover:border-slate-400 focus:bg-white'
                      }`}
                    />
                    {skillSearchQuery && (
                      <button 
                        type="button" 
                        onClick={() => setSkillSearchQuery('')} 
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Clear skill search"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Specific Skill Category Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Skill Category</span>
                  </label>
                  <div className="relative">
                    <select
                      value={skillFilter}
                      onChange={(e) => setSkillFilter(e.target.value)}
                      className={`w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        skillFilter !== 'All Skills'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold'
                          : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <option value="All Skills">All Skills ({talents.length})</option>
                      {allAvailableSkills.map(item => (
                        <option key={item.skill} value={item.skill}>
                          {item.skill} ({item.count})
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* 4. Experience Level Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-blue-600" />
                    <span>Experience Depth</span>
                  </label>
                  <div className="relative">
                    <select
                      value={experienceFilter}
                      onChange={(e) => setExperienceFilter(e.target.value)}
                      className={`w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        experienceFilter !== 'all'
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                          : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <option value="all">All Experience Levels</option>
                      <option value="1-3">Junior / Entry (1–3 Years)</option>
                      <option value="3-5">Mid-Level (3–5 Years)</option>
                      <option value="5-8">Senior Specialist (5–8 Years)</option>
                      <option value="8+">Master / Lead (8+ Years)</option>
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

                {/* 5. Wage Range Filter */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Wage Range ({currentCountryConfig.currency})</span>
                  </label>
                  <div className="relative">
                    <select
                      value={wageFilter}
                      onChange={(e) => setWageFilter(e.target.value)}
                      className={`w-full appearance-none px-3 py-2.5 pr-8 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        wageFilter !== 'all'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <option value="all">All Wage Expectations</option>
                      <option value="under-600">Under {currentCountryConfig.currencySymbol}600 / hr</option>
                      <option value="600-800">{currentCountryConfig.currencySymbol}600 – {currentCountryConfig.currencySymbol}800 / hr</option>
                      <option value="800-1100">{currentCountryConfig.currencySymbol}800 – {currentCountryConfig.currencySymbol}1,100 / hr</option>
                      <option value="1100+">{currentCountryConfig.currencySymbol}1,100+ / hr</option>
                    </select>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none" />
                  </div>
                </div>

              </div>

              {/* Quick Locale-Specific Metropolitan City Buttons */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <span>{currentCountryConfig.flag}</span>
                  <span>{currentCountryConfig.metroLabel}:</span>
                </span>
                {currentCountryCitiesWithCount.map(({ city, count }) => {
                  const isSelected = !isAllCities(cityFilter) && cityFilter.toLowerCase().includes(city.toLowerCase());
                  return (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setCityFilter(isSelected ? `All ${currentCountryConfig.metroLabel}` : city)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white font-semibold shadow-xs ring-2 ring-indigo-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{city}</span>
                      <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Skill Tags Chips Row */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-400" />
                  <span>Popular Skills:</span>
                </span>
                {allAvailableSkills.slice(0, 10).map(({ skill, count }) => {
                  const isSelected = selectedSkills.includes(skill) || skillFilter === skill || skillSearchQuery.toLowerCase() === skill.toLowerCase();
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleToggleSkill(skill)}
                      className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs ring-2 ring-indigo-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-indigo-100" />}
                      <span>{skill}</span>
                      <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-600'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Filters Badges Indicator Bar */}
              {activeFiltersCount > 0 && (
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-500 font-medium text-[11px]">Active Filters:</span>
                  
                  {!isAllCities(cityFilter) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-900 text-white font-medium">
                      <span>{currentCountryConfig.flag} City: <strong>{cityFilter}</strong></span>
                      <button onClick={() => setCityFilter(`All ${currentCountryConfig.metroLabel}`)} className="hover:text-amber-300 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {skillSearchQuery.trim() && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-medium shadow-xs">
                      <span>Search Skill: <strong>"{skillSearchQuery}"</strong></span>
                      <button onClick={() => setSkillSearchQuery('')} className="hover:text-indigo-200 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {skillFilter !== 'All Skills' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 font-medium">
                      <span>Skill Category: <strong>{skillFilter}</strong></span>
                      <button onClick={() => setSkillFilter('All Skills')} className="hover:text-rose-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {selectedSkills.map(s => (
                    <span key={`active-${s}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100 border border-indigo-300 text-indigo-900 font-medium">
                      <span>{s}</span>
                      <button onClick={() => handleToggleSkill(s)} className="hover:text-rose-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {experienceFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                      <span>Experience: <strong>{
                        experienceFilter === '1-3' ? '1–3 Years' :
                        experienceFilter === '3-5' ? '3–5 Years' :
                        experienceFilter === '5-8' ? '5–8 Years' : '8+ Years'
                      }</strong></span>
                      <button onClick={() => setExperienceFilter('all')} className="hover:text-rose-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {wageFilter !== 'all' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                      <span>Wage: <strong>{
                        wageFilter === 'under-600' ? `Under ${currentCountryConfig.currencySymbol}600/hr` :
                        wageFilter === '600-800' ? `${currentCountryConfig.currencySymbol}600–${currentCountryConfig.currencySymbol}800/hr` :
                        wageFilter === '800-1100' ? `${currentCountryConfig.currencySymbol}800–${currentCountryConfig.currencySymbol}1,100/hr` :
                        `${currentCountryConfig.currencySymbol}1,100+/hr`
                      }</strong></span>
                      <button onClick={() => setWageFilter('all')} className="hover:text-rose-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-medium">
                      <span>Query: "{searchQuery}"</span>
                      <button onClick={() => setSearchQuery('')} className="hover:text-rose-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>

            {/* Candidates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTalents.length === 0 ? (
                <div className="col-span-2 bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                  <User className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900 font-serif">No registered talents matching your criteria</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Try relaxing your skill, experience, wage, or city filters to view other verified technical candidates in the Talent Network.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-4 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs flex items-center gap-2 mx-auto cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </div>
              ) : (
                filteredTalents.map(talent => {
                  const expYears = getTalentExperienceYears(talent);
                  return (
                    <div 
                      key={talent.id} 
                      className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all group"
                    >
                      <div>
                        {/* Top Row: Avatar, Name, Headline, Availability */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold font-serif text-lg shrink-0 shadow-xs">
                              {talent.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-serif">
                                {talent.name}
                                <span title="Verified Talent Network Profile" className="inline-flex">
                                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                </span>
                              </h3>
                              <p className="text-xs text-indigo-700 font-medium line-clamp-1">{talent.headline}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {talent.availabilityStatus === 'actively_interviewing' ? 'Interviewing' : 'Available'}
                          </span>
                        </div>

                        {/* Experience, Wage & City Credentials Badges */}
                        <div className="flex flex-wrap items-center gap-2 text-xs mb-3.5 pt-2.5 border-t border-slate-100">
                          {/* Experience Badge */}
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-1.5 font-mono">
                            <Award className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{expYears}+ Yrs Exp</span>
                          </span>

                          {/* Wage Expectation Badge */}
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 font-mono">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{talent.wageExpectation || '$50.00 / hr'}</span>
                          </span>

                          {/* City Location */}
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{talent.city}{talent.state ? `, ${talent.state}` : ''}</span>
                          </span>
                        </div>

                        {/* Bio summary */}
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4 font-sans">
                          {talent.bio}
                        </p>

                        {/* Skills Tags (Interactive: Click to filter) */}
                        <div className="flex flex-wrap gap-1.5 mb-5">
                          {talent.skills.map(skill => {
                            const isSkillActive = skillFilter === skill || selectedSkills.includes(skill);
                            const matchesSearch = searchQuery.trim() && skill.toLowerCase().includes(searchQuery.toLowerCase());
                            return (
                              <button
                                key={skill}
                                type="button"
                                onClick={() => handleToggleSkill(skill)}
                                title={`Click to filter candidates by ${skill}`}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1 cursor-pointer ${
                                  isSkillActive || matchesSearch
                                    ? 'bg-indigo-600 text-white font-semibold ring-2 ring-indigo-300'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {(isSkillActive || matchesSearch) && <Check className="w-3 h-3 text-indigo-100" />}
                                <span>{skill}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom Action: Phone info & Send SMS Notification */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{talent.phone}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!isTalentSeeker) {
                              onOpenLogin('talent_seeker');
                            } else {
                              setSelectedTalentForSms(talent);
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Contact via SMS</span>
                        </button>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

            </div>
          ) : (
            /* Restricted Access Gate for Non-Vendors */
            <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm my-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-5 shadow-sm">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block mb-3 font-mono">
                Registered Vendor Access Only
              </span>
              <h2 className="text-2xl font-bold font-serif text-slate-900 mb-3">
                Registered Talents Directory is Restricted
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto mb-8">
                The Registered Talents Directory contains confidential candidate contact information, verified technical credentials, and resumes. In accordance with platform privacy and talent protection policies, this directory is visible <strong>only to registered vendors</strong> with an active Talent Network portal account.
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-8 max-w-md mx-auto text-left space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Candidate Privacy & Credentials Protected</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal pl-6">
                  Verified candidate phone numbers, full career timelines, and 1-Click SMS outreach tools unlock immediately upon registered vendor sign-in.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => onOpenLogin('talent_seeker')}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-300" />
                  <span>Log In as Registered Vendor</span>
                </button>

                {onFastLogin && (
                  <button
                    type="button"
                    onClick={() => onFastLogin('talent_seeker')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Quick Vendor Demo (Apex Precision)</span>
                  </button>
                )}

                {isTalent ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                  >
                    Return to My Talent Profile
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setActiveTab('browse')}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold tracking-wide transition-all cursor-pointer"
                  >
                    Explore Open Requirements
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {/* =========================================================================
            VIEW 5: TALENT SEEKER - PUBLISH REQUIREMENT
            ========================================================================= */}
        {activeTab === 'publish' && (
          isRegisteredVendor ? (
            <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 font-serif">Publish Technical Requirement</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Broadcast your open skill requirement to verified talents in this market.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePublishJob} className="space-y-5">
                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                    Position Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJobForm.title}
                    onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                    placeholder="e.g. Lead Commercial Electrician, HVAC VRF Specialist"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                      Company / Vendor Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newJobForm.companyName}
                      onChange={(e) => setNewJobForm({ ...newJobForm, companyName: e.target.value })}
                      placeholder="e.g. Apex Precision Systems"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                      Metropolitan City *
                    </label>
                    <input
                      type="text"
                      required
                      value={newJobForm.city}
                      onChange={(e) => setNewJobForm({ ...newJobForm, city: e.target.value })}
                      placeholder="e.g. San Francisco, Beverly Hills, Austin"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                      Experience Level Required *
                    </label>
                    <select
                      value={newJobForm.experienceLevel}
                      onChange={(e) => setNewJobForm({ ...newJobForm, experienceLevel: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="1-3 years">1-3 years (Junior / Apprentice)</option>
                      <option value="3-5 years">3-5 years (Journeyman)</option>
                      <option value="5+ years">5+ years (Senior / Specialist)</option>
                      <option value="8+ years">8+ years (Master Lead)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                      Wage Level Benchmark *
                    </label>
                    <input
                      type="text"
                      required
                      value={newJobForm.wageLevel}
                      onChange={(e) => setNewJobForm({ ...newJobForm, wageLevel: e.target.value })}
                      placeholder="e.g. $52.00 – $65.00 / hr"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                    Required Skills (Comma separated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newJobForm.skills}
                    onChange={(e) => setNewJobForm({ ...newJobForm, skills: e.target.value })}
                    placeholder="e.g. Commercial Wiring, High-Voltage, Blueprint Reading, OSHA 30"
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    These keywords are used to auto-match registered talents in your target city.
                  </p>
                </div>

                <div>
                  <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                    Requirement Scope / Overview
                  </label>
                  <textarea
                    rows={3}
                    value={newJobForm.description}
                    onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                    placeholder="Provide details regarding project duration, shift timings, certifications, or tools required..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-sans"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                      Contact Mobile (For Candidate SMS)
                    </label>
                    <input
                      type="tel"
                      value={newJobForm.contactPhone}
                      onChange={(e) => setNewJobForm({ ...newJobForm, contactPhone: e.target.value })}
                      placeholder="+1 555-481-9022"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-mono tracking-wider text-slate-600 mb-1.5 font-semibold">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={newJobForm.contactEmail}
                      onChange={(e) => setNewJobForm({ ...newJobForm, contactEmail: e.target.value })}
                      placeholder="careers@vendor.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('directory')}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishingJob}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs disabled:opacity-50"
                  >
                    {isPublishingJob ? 'Publishing...' : 'Publish Requirement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-8 sm:p-14 text-center max-w-2xl mx-auto shadow-sm my-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Plus className="w-8 h-8" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 inline-block mb-3 font-mono">
              Vendor Requirement Publishing
            </span>
            <h2 className="text-2xl font-bold font-serif text-slate-900 mb-3">
              Publishing Requirements Restricted to Registered Vendors
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto mb-8">
              To broadcast open technical positions, skills, experience benchmarks, and wage levels to verified candidates, please sign in or activate your registered Talent Seeker vendor account.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => onOpenLogin('talent_seeker')}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-slate-300" />
                <span>Log In as Registered Vendor</span>
              </button>
              {onFastLogin && (
                <button
                  type="button"
                  onClick={() => {
                    onFastLogin('talent_seeker');
                    setActiveTab('publish');
                  }}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold tracking-wide transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Quick Vendor Demo (Apex Precision)</span>
                </button>
              )}
            </div>
          </div>
        )
      )}

        {/* =========================================================================
            VIEW 6: TALENT SEEKER - OUR POSTINGS
            ========================================================================= */}
        {isRegisteredVendor && activeTab === 'my_postings' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                  <span>Vendor Published Requirements</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-indigo-700 font-mono font-semibold border border-slate-200">
                    {jobs.length} Active
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Requirements live on the Talent Network, visible as single-liners to verified technical candidates.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('publish')}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Publish New
              </button>
            </div>

            <div className="space-y-3">
              {jobs.map(job => (
                <div key={job.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-900 font-serif">{job.title}</h4>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-600">{job.city}</span>
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {job.wageLevel}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-700 font-medium">
                      Skills: {job.skillsRequired.join(', ')}
                    </p>
                    <p className="text-xs text-slate-500 font-sans line-clamp-1">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveTab('directory')}
                      className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-600" />
                      Find Talents for this Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 7: TALENT SEEKER - RECEIVED APPLICATIONS
            ========================================================================= */}
        {isRegisteredVendor && activeTab === 'applicants' && (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
              <h2 className="text-lg font-bold text-slate-900 font-serif flex items-center gap-2">
                <span>Received Candidate Applications</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-indigo-700 font-mono font-semibold border border-slate-200">
                  {applications.length} Candidates
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full resume documents and verified contact credentials submitted by Talents.
              </p>
            </div>

            {applications.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
                <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-900">No applications received yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You can proactively reach out to candidates in the Talent Directory tab to invite them via SMS.
                </p>
                <button
                  onClick={() => setActiveTab('directory')}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  Search Talent Directory →
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 font-serif">{app.talentName}</h4>
                        <p className="text-xs text-indigo-700 font-medium">Applied for: {app.jobTitle}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-600">
                        <span>{app.talentPhone}</span>
                        <span>•</span>
                        <span>{app.talentEmail}</span>
                      </div>
                    </div>

                    {/* Resume Text & Cover Note */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 block font-semibold">
                        Submitted Resume & Credentials:
                      </span>
                      <pre className="text-xs text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">
                        {app.resumeText}
                      </pre>
                      {app.coverNote && (
                        <div className="mt-3 pt-2 border-t border-slate-200 text-xs text-slate-600 italic">
                          "{app.coverNote}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-emerald-800 flex items-center gap-1 font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> SMS Confirmation Acknowledged
                      </span>
                      <button
                        onClick={() => {
                          const candidate = talents.find(t => t.email === app.talentEmail) || {
                            id: app.talentUid,
                            uid: app.talentUid,
                            name: app.talentName,
                            email: app.talentEmail,
                            phone: app.talentPhone,
                            headline: app.jobTitle,
                            city: 'San Francisco',
                            bio: app.resumeText,
                            skills: [],
                            experiences: [],
                            availabilityStatus: 'available' as const,
                            registeredAt: app.appliedAt
                          };
                          setSelectedTalentForSms(candidate);
                        }}
                        className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        Reply via SMS
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL 1: TALENT APPLY FOR OPEN REQUIREMENT (Takes Resume + Contact)
          ========================================================================= */}
      <AnimatePresence>
        {selectedJobToApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">Submit Candidate Application</h3>
                  <p className="text-xs text-indigo-700 font-medium">
                    {selectedJobToApply.title} • {selectedJobToApply.vendorName}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedJobToApply(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Requirement Summary Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Wage Benchmark:</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{selectedJobToApply.wageLevel}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Location:</span>
                  <span className="text-slate-900 font-medium">{selectedJobToApply.city}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Experience:</span>
                  <span className="text-slate-900 font-medium">{selectedJobToApply.experienceLevel}</span>
                </div>
              </div>

              <form onSubmit={handleConfirmApply} className="space-y-4">
                {/* Contact Verification */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                      Applicant Full Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={currentProfile.name}
                      className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                      Registered Mobile (For SMS) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={currentProfile.phone}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Resume Text / Document Submission */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] uppercase font-mono tracking-wider text-slate-600 font-semibold">
                      Resume & Qualifications *
                    </label>
                    <span className="text-[10px] text-emerald-800 font-mono font-semibold">Auto-populated from Profile</span>
                  </div>
                  <textarea
                    rows={5}
                    required
                    value={applyResumeText}
                    onChange={(e) => setApplyResumeText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-mono leading-relaxed"
                    placeholder="Resume summary, technical experiences, and certifications..."
                  />
                </div>

                {/* Cover note */}
                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                    Short Message to Vendor
                  </label>
                  <textarea
                    rows={2}
                    value={applyCoverNote}
                    onChange={(e) => setApplyCoverNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-sans"
                  />
                </div>

                {/* SMS Notice */}
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <span>
                    Upon submission, an official SMS notification from <strong>{selectedJobToApply.vendorName}</strong> will be sent to your registered mobile number: <strong>{currentProfile.phone}</strong>.
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedJobToApply(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs disabled:opacity-50"
                  >
                    {isApplying ? 'Transmitting...' : 'Submit Application & Trigger SMS'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 2: TALENT SEEKER OUTREACH SMS MODAL (Select Talent & Send SMS)
          ========================================================================= */}
      <AnimatePresence>
        {selectedTalentForSms && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 font-serif">Send SMS Notification to Candidate</h3>
                  <p className="text-xs text-indigo-700 font-medium">
                    Candidate: {selectedTalentForSms.name} • {selectedTalentForSms.city}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTalentForSms(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Candidate Quick Profile */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs space-y-1">
                <div className="flex justify-between text-slate-600">
                  <span>Registered Mobile:</span>
                  <span className="font-mono font-bold text-indigo-700">{selectedTalentForSms.phone}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Specialty / Headline:</span>
                  <span className="text-slate-900 font-medium truncate max-w-[240px]">{selectedTalentForSms.headline}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Target Wage:</span>
                  <span className="text-emerald-800 font-mono font-semibold">{selectedTalentForSms.wageExpectation || '$50 / hr'}</span>
                </div>
              </div>

              <form onSubmit={handleSendTalentSms} className="space-y-4">
                {/* Select open job requirement to attach */}
                {jobs.length > 0 && (
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                      Attach Open Requirement (Optional)
                    </label>
                    <select
                      value={selectedJobToAttach}
                      onChange={(e) => setSelectedJobToAttach(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    >
                      {jobs.map(j => (
                        <option key={j.id} value={j.id} className="bg-white text-slate-900">
                          {j.title} ({j.city} • {j.wageLevel})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* SMS Text Content */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] uppercase font-mono tracking-wider text-slate-600 font-semibold">
                      SMS Message Body *
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">Direct Carrier Delivery</span>
                  </div>
                  <textarea
                    rows={4}
                    required
                    value={smsCustomMessage}
                    onChange={(e) => setSmsCustomMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-sans leading-relaxed"
                    placeholder="Enter message for the candidate..."
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Sent via verified Opal Talent SMS Dispatch Network to {selectedTalentForSms.phone}.
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTalentForSms(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingSms}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingSms ? 'Dispatching SMS...' : 'Dispatch SMS Notification'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 3: ADD EXPERIENCE MODAL (LinkedIn-Style)
          ========================================================================= */}
      <AnimatePresence>
        {showAddExperienceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 font-serif">Add Position to Profile</h3>
                <button
                  onClick={() => setShowAddExperienceModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddExperienceSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExp.roleTitle}
                    onChange={(e) => setNewExp({ ...newExp, roleTitle: e.target.value })}
                    placeholder="e.g. Senior HVAC Diagnostic Lead, Electrical Foreman"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                      Company / Organization *
                    </label>
                    <input
                      type="text"
                      required
                      value={newExp.companyName}
                      onChange={(e) => setNewExp({ ...newExp, companyName: e.target.value })}
                      placeholder="e.g. Pacific Electric Partners"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                      Employment Type
                    </label>
                    <select
                      value={newExp.employmentType}
                      onChange={(e) => setNewExp({ ...newExp, employmentType: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Part-time">Part-time</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                      Start Date *
                    </label>
                    <input
                      type="text"
                      required
                      value={newExp.startDate}
                      onChange={(e) => setNewExp({ ...newExp, startDate: e.target.value })}
                      placeholder="e.g. Jan 2021"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                      End Date
                    </label>
                    <input
                      type="text"
                      disabled={newExp.current}
                      value={newExp.current ? 'Present' : newExp.endDate}
                      onChange={(e) => setNewExp({ ...newExp, endDate: e.target.value })}
                      placeholder="e.g. Dec 2023"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="currentPos"
                    checked={newExp.current}
                    onChange={(e) => setNewExp({ ...newExp, current: e.target.checked })}
                    className="rounded border-slate-300 text-slate-900 focus:ring-0"
                  />
                  <label htmlFor="currentPos" className="text-xs text-slate-700 cursor-pointer">
                    I currently work in this position
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">
                    Key Responsibilities & Accomplishments
                  </label>
                  <textarea
                    rows={3}
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                    placeholder="Summarize key projects, crew leadership, metrics, or technologies handled..."
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-sans"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddExperienceModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                  >
                    Save Position
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL 4: EDIT TALENT PROFILE DETAILS
          ========================================================================= */}
      <AnimatePresence>
        {showEditProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-900"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 font-serif">Edit Profile Header</h3>
                <button
                  onClick={() => setShowEditProfileModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">Full Name</label>
                  <input
                    type="text"
                    value={currentProfile.name}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">Headline</label>
                  <input
                    type="text"
                    value={currentProfile.headline}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, headline: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-indigo-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">City</label>
                    <input
                      type="text"
                      value={currentProfile.city}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, city: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">Wage Target</label>
                    <input
                      type="text"
                      value={currentProfile.wageExpectation || ''}
                      onChange={(e) => setCurrentProfile({ ...currentProfile, wageExpectation: e.target.value })}
                      placeholder="$55.00 / hr"
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 font-mono focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase font-mono tracking-wider text-slate-600 mb-1 font-semibold">Summary / Bio</label>
                  <textarea
                    rows={3}
                    value={currentProfile.bio || ''}
                    onChange={(e) => setCurrentProfile({ ...currentProfile, bio: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 font-sans focus:border-indigo-600"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                  <button
                    onClick={() => setShowEditProfileModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          FLOATING INCOMING / OUTGOING SMS SIMULATION TOAST
          ========================================================================= */}
      <AnimatePresence>
        {smsToast?.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border-2 border-indigo-600 rounded-2xl p-4 shadow-2xl text-slate-900 backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 text-white">
                <Smartphone className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    SMS Dispatched to {smsToast.to}
                  </span>
                  <button onClick={() => setSmsToast(null)} className="text-slate-400 hover:text-slate-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 mb-1.5 text-xs text-slate-700 font-sans italic leading-relaxed">
                  "{smsToast.message}"
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>From: {smsToast.senderName}</span>
                  <span className="text-emerald-700 font-semibold">Delivered · {smsToast.timestamp}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Independent Portal Footer for Opal Talent Network */}
      <footer className="mt-20 border-t border-slate-200 bg-white text-slate-800 pt-12 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-slate-100">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                  <Briefcase className="w-4 h-4 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold font-serif text-slate-900 tracking-tight">
                  OPAL TALENT NETWORK
                </h3>
              </div>
              <p className="text-xs text-slate-500 max-w-md leading-relaxed mb-4">
                The independent verified portal for specialized engineering leads, commercial electricians, master masons, solar technicians, and technical talent seekers across Indian and global metropolitan areas.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 font-mono">
                For Candidates & Trades
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><button onClick={() => setActiveTab('profile')} className="hover:text-indigo-600 transition-colors">Candidate Profile Builder</button></li>
                <li><button onClick={() => setActiveTab('requirements')} className="hover:text-indigo-600 transition-colors">Open Vendor Requirements</button></li>
                <li><button onClick={() => setActiveTab('applications')} className="hover:text-indigo-600 transition-colors">My Applications & SMS Alerts</button></li>
                <li><span className="text-slate-400">Verified Technical Licenses</span></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 font-mono">
                For Talent Seekers & Vendors
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li><button onClick={() => setActiveTab('directory')} className="hover:text-indigo-600 transition-colors">Candidate Directory (Metros)</button></li>
                <li><button onClick={() => setActiveTab('publish')} className="hover:text-indigo-600 transition-colors">Publish Technical Job</button></li>
                <li><button onClick={() => setActiveTab('my_postings')} className="hover:text-indigo-600 transition-colors">Manage Active Postings</button></li>
                <li><button onClick={() => { setTalentVideoInitialTab('video'); setIsTalentVideoModalOpen(true); }} className="hover:text-indigo-600 transition-colors">Watch Video Walkthrough</button></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
            <div>
              © 2024 Opal Talent Network. An Independent Technical Hiring & Verified Skills Platform.
            </div>
            <div className="flex items-center gap-4">
              <span>🇮🇳 India & Global Metros</span>
              <span>•</span>
              <span>Real-time SMS Outreach</span>
              <span>•</span>
              <span>ISO & Trade Compliance</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Talent Network Walkthrough Video & Real Screenshots Modal */}
      <TalentVideoModal
        isOpen={isTalentVideoModalOpen}
        onClose={() => setIsTalentVideoModalOpen(false)}
        initialTab={talentVideoInitialTab}
      />

    </div>
  );
};
