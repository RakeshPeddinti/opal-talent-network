import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  FileText, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Sparkles, 
  CheckCircle2, 
  Image as ImageIcon, 
  Film, 
  Users, 
  Building2, 
  Briefcase, 
  MapPin, 
  Send, 
  ExternalLink,
  ChevronRight,
  ZoomIn,
  Mic,
  Headphones,
  Radio
} from 'lucide-react';

interface TalentVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'video' | 'screenshots' | 'script';
}

interface VideoChapter {
  id: number;
  label: string;
  shortLabel: string;
  startTime: number;
  endTime: number;
  headline: string;
  targetAudience: 'Both' | 'Talents' | 'Talent Seekers';
  caption: string;
  screenshotUrl: string;
  screenshotName: string;
  audioUrl: string;
  details: string[];
}

const CHAPTERS: VideoChapter[] = [
  {
    id: 1,
    label: "1. Who Can Use It?",
    shortLabel: "Who Can Use It?",
    startTime: 0,
    endTime: 15.5,
    headline: "Two-Sided Architecture: Skilled Talents vs. Registered Vendors",
    targetAudience: 'Both',
    caption: "Step 1 [Who Can Use It?]: Discover the two-sided portal connecting verified skilled trades professionals with registered vendor enterprises across Indian Metros.",
    screenshotUrl: "/assets/aistudio/screenshots/talent-step1-who-can-use.png",
    screenshotName: "talent-step1-who-can-use.png",
    audioUrl: "/assets/aistudio/audio/talent-voice-ch1.wav",
    details: [
      "Talents (Skilled Trades): Master Electricians, Architectural Joiners, HVAC Technicians, Low-Voltage Automation Integrators.",
      "Talent Seekers (Registered Vendors): General contractors, engineering firms, facility managers (e.g., Apex Precision Contracting India).",
      "LinkedIn-Style Profile: Career timeline, trade skills matrix, Grade A / CEA supervisory licenses, and PDF resume dossier.",
      "Locked Vendor Attribution: Permanent enterprise identity preventing cross-tenant impersonation or unauthorized headhunters.",
      "Direct SMS Infrastructure: Real mobile alerts delivered directly to candidate and vendor Indian phone numbers."
    ]
  },
  {
    id: 2,
    label: "2. Publish Requirements",
    shortLabel: "Publish Requirements",
    startTime: 15.5,
    endTime: 31.0,
    headline: "Fast Job Creation for Registered Vendors Across Indian Metros",
    targetAudience: 'Talent Seekers',
    caption: "Step 2 [Publish Requirements]: Registered vendors post technical roles with required trade skills, experience depth, INR wage levels, and Indian metro locations.",
    screenshotUrl: "/assets/aistudio/screenshots/talent-step2-publish-requirement.png",
    screenshotName: "talent-step2-publish-requirement.png",
    audioUrl: "/assets/aistudio/audio/talent-voice-ch2.wav",
    details: [
      "Intuitive Terminal: Dedicated 'Publish Requirement' tab for authenticated vendors and contractors.",
      "Granular Specifications: Job title, trade competency tags (e.g. Commercial Wiring, High-Voltage Panels, NEC Compliance).",
      "Experience & Hourly Wage: Set minimum years (e.g. 5+ yrs) and hourly pay bracket in Indian Rupees (e.g. ₹850 – ₹1,100 / hr).",
      "Indian Metro Selection: Pick destination hub (Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai, etc.).",
      "Instant Portal Synchronization: Job immediately goes live for discovery by all verified talents in the network."
    ]
  },
  {
    id: 3,
    label: "3. List of Jobs & 1-Click Apply",
    shortLabel: "List of Jobs & Apply",
    startTime: 31.0,
    endTime: 46.5,
    headline: "High-Efficiency Single-Liner Requirements & Direct SMS Alert",
    targetAudience: 'Talents',
    caption: "Step 3 [List of Jobs & 1-Click Apply]: Talents scan high-density single-liner job listings and apply with one click, triggering an instant mobile SMS confirmation.",
    screenshotUrl: "/assets/aistudio/screenshots/talent-step3-list-of-jobs-apply.png",
    screenshotName: "talent-step3-list-of-jobs-apply.png",
    audioUrl: "/assets/aistudio/audio/talent-voice-ch3.wav",
    details: [
      "Single-Liner Scanning: Compact rows showing hiring vendor, job title, skills required, experience, wage in INR, and metro city.",
      "1-Click Application: Candidate profile, certifications, and uploaded PDF resume attach automatically.",
      "Indian Mobile Integration: Registered mobile (+91 98450 19201) confirmed on application record.",
      "Automated SMS Alert: Candidate immediately receives an SMS confirmation on their mobile phone from the hiring vendor.",
      "Application Tracker: Candidates monitor review status in real-time under their 'My Applications' tab."
    ]
  },
  {
    id: 4,
    label: "4. Candidate Directory & Indian Metro Filters",
    shortLabel: "Candidate Directory",
    startTime: 46.5,
    endTime: 62.0,
    headline: "Indian Metro City Filter, Trade Skills & Direct SMS Outreach",
    targetAudience: 'Talent Seekers',
    caption: "Step 4 [Candidate Directory & Indian Metro Filters]: Search verified talents across Indian hubs (Bengaluru, Mumbai, Delhi NCR) with multi-criteria filters and direct SMS contact.",
    screenshotUrl: "/assets/aistudio/screenshots/talent-step4-candidate-directory-filters.png",
    screenshotName: "talent-step4-candidate-directory-filters.png",
    audioUrl: "/assets/aistudio/audio/talent-voice-ch4.wav",
    details: [
      "Exclusive Access (.talent-directory-container): Accessible solely to authenticated vendors and portal providers.",
      "Indian Metro Hubs Filter: Instant dropdown selector across 11 major Indian metropolitan cities.",
      "Live Metro Counter Chips: Quick-select buttons for Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai, and more.",
      "Multi-Criteria Filtering: Drill down by trade skills, experience depth (1-3, 3-5, 5-8, 8+ yrs), and INR wage expectations.",
      "Direct SMS Outreach: Vendors message candidate mobile phones directly with personalized interview proposals."
    ]
  }
];

export const TalentVideoModal: React.FC<TalentVideoModalProps> = ({ 
  isOpen, 
  onClose,
  initialTab = 'video'
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const chapterAudioRef = useRef<HTMLAudioElement | null>(null);

  const [modalTab, setModalTab] = useState<'video' | 'screenshots' | 'script'>(initialTab);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(62);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [activeAudioChapterId, setActiveAudioChapterId] = useState<number | null>(null);

  useEffect(() => {
    if (initialTab) {
      setModalTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      if (chapterAudioRef.current) {
        chapterAudioRef.current.pause();
        setActiveAudioChapterId(null);
      }
    }
  }, [isOpen]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (chapterAudioRef.current) {
        chapterAudioRef.current.pause();
      }
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const cur = videoRef.current.currentTime;
      setCurrentTime(cur);

      // Determine active chapter
      const idx = CHAPTERS.findIndex(c => cur >= c.startTime && cur < c.endTime);
      if (idx !== -1 && idx !== activeChapterIndex) {
        setActiveChapterIndex(idx);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 62);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Stop any standalone chapter voiceover
        if (chapterAudioRef.current) {
          chapterAudioRef.current.pause();
          setActiveAudioChapterId(null);
        }
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const handleJumpToChapter = (chapter: VideoChapter) => {
    handleSeek(chapter.startTime);
    setActiveChapterIndex(chapter.id - 1);
    setSelectedScreenshotIndex(chapter.id - 1);
  };

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Toggle isolated chapter voiceover playback
  const toggleChapterVoiceover = (chapterId: number) => {
    if (activeAudioChapterId === chapterId) {
      if (chapterAudioRef.current) {
        chapterAudioRef.current.pause();
      }
      setActiveAudioChapterId(null);
    } else {
      if (chapterAudioRef.current) {
        chapterAudioRef.current.pause();
      }
      if (videoRef.current && isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
      const audio = new Audio(`/assets/aistudio/audio/talent-voice-ch${chapterId}.wav`);
      chapterAudioRef.current = audio;
      audio.play().then(() => {
        setActiveAudioChapterId(chapterId);
      }).catch(() => {
        setActiveAudioChapterId(null);
      });
      audio.onended = () => {
        setActiveAudioChapterId(null);
      };
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentChapter = CHAPTERS[activeChapterIndex] || CHAPTERS[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 text-slate-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-white tracking-tight font-serif flex items-center gap-2">
                    TALENT NETWORK VIDEO GUIDE
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-sans">
                    1280x720 HD • MP4
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans flex items-center gap-1">
                    <Mic className="w-3 h-3 text-purple-400" />
                    Professional Voiceover
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-sans">
                    🇮🇳 India Metros
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Who Can Use It? Publishing Requirements, List of Jobs &amp; Indian Candidate Directory
                </p>
              </div>
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center p-1 bg-slate-800/80 rounded-lg border border-slate-700 text-xs font-medium mr-2">
                <button
                  onClick={() => setModalTab('video')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    modalTab === 'video'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>Video Player</span>
                </button>
                <button
                  onClick={() => setModalTab('screenshots')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    modalTab === 'screenshots'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Real Screenshots</span>
                </button>
                <button
                  onClick={() => setModalTab('script')}
                  className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                    modalTab === 'script'
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Transcript &amp; Voice</span>
                </button>
              </div>

              {/* Direct Download Video Button */}
              <a
                href="/assets/aistudio/talent-network-walkthrough.mp4"
                download="opal-talent-network-walkthrough.mp4"
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Download MP4 Video with Professional Voice (1280x720 HD)"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Download Video</span>
                <span className="text-[10px] font-mono opacity-80">(MP4)</span>
              </a>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Tab Selector for Mobile */}
          <div className="sm:hidden flex items-center justify-around border-b border-slate-800 bg-slate-950 p-2 text-xs">
            <button
              onClick={() => setModalTab('video')}
              className={`px-3 py-1 rounded-md ${modalTab === 'video' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'}`}
            >
              Video Player
            </button>
            <button
              onClick={() => setModalTab('screenshots')}
              className={`px-3 py-1 rounded-md ${modalTab === 'screenshots' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'}`}
            >
              Real Screenshots
            </button>
            <button
              onClick={() => setModalTab('script')}
              className={`px-3 py-1 rounded-md ${modalTab === 'script' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400'}`}
            >
              Transcript &amp; Voice
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6">
            
            {/* TAB 1: VIDEO PLAYER */}
            {modalTab === 'video' && (
              <div className="space-y-6">
                
                {/* Voice Status Pill Bar */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                    <span className="font-semibold text-purple-200">
                      Studio Executive Voiceover Active:
                    </span>
                    <span className="text-purple-300 font-mono hidden sm:inline">
                      Gemini TTS (Kore) • Natural Spoken Cadence • Audio Mixed at 128kbps AAC
                    </span>
                  </div>
                  <button
                    onClick={() => toggleChapterVoiceover(currentChapter.id)}
                    className="px-2.5 py-1 rounded-md bg-purple-800/70 hover:bg-purple-700 text-purple-100 font-medium text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{activeAudioChapterId === currentChapter.id ? 'Pause Voice' : 'Listen Isolated Voice'}</span>
                  </button>
                </div>

                {/* Video Player Container */}
                <div className="relative aspect-video w-full bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-800 group">
                  <video
                    ref={videoRef}
                    src="/assets/aistudio/talent-network-walkthrough.mp4"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={togglePlay}
                    playsInline
                  />

                  {/* Big Play Overlay (when paused) */}
                  {!isPlaying && (
                    <div 
                      onClick={togglePlay}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-all cursor-pointer"
                    >
                      <div className="w-20 h-20 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl border border-white/20 hover:scale-105 transition-transform">
                        <Play className="w-9 h-9 ml-1 fill-white" />
                      </div>
                    </div>
                  )}

                  {/* Player Controls Bar */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/80 to-transparent p-4 opacity-95 group-hover:opacity-100 transition-opacity">
                    {/* Scrub Progress Bar */}
                    <div 
                      onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const pos = (e.clientX - rect.left) / rect.width;
                        handleSeek(pos * duration);
                      }}
                      className="relative h-2 w-full bg-slate-700/70 rounded-full cursor-pointer mb-3 group/bar overflow-hidden"
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                      {/* Chapter markers */}
                      {CHAPTERS.map(c => (
                        <div 
                          key={c.id}
                          className="absolute top-0 bottom-0 w-0.5 bg-white/40"
                          style={{ left: `${(c.startTime / duration) * 100}%` }}
                          title={c.label}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-white">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={togglePlay}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                        </button>
                        <button
                          onClick={handleReplay}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                          title="Replay from start"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={toggleMute}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <span className="font-mono text-xs text-slate-300">
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Current Chapter Badge */}
                        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-900/60 border border-indigo-500/30 text-indigo-200 text-xs">
                          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                          <span>{currentChapter.label}</span>
                        </div>

                        {/* Playback speed selector */}
                        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 text-[11px]">
                          {[1, 1.25, 1.5].map(rate => (
                            <button
                              key={rate}
                              onClick={() => handlePlaybackRateChange(rate)}
                              className={`px-1.5 py-0.5 rounded cursor-pointer ${
                                playbackRate === rate ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {rate}x
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={handleFullscreen}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
                          title="Fullscreen"
                        >
                          <Maximize className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chapter Quick-Jump Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {CHAPTERS.map((chapter, idx) => {
                    const isActive = activeChapterIndex === idx;
                    const isAudioPlaying = activeAudioChapterId === chapter.id;

                    return (
                      <div
                        key={chapter.id}
                        className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isActive
                            ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                            : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div 
                          onClick={() => handleJumpToChapter(chapter)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className={isActive ? 'font-bold text-indigo-400' : 'text-slate-400'}>
                              Chapter {chapter.id}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                              chapter.targetAudience === 'Talents'
                                ? 'bg-purple-900/40 text-purple-300'
                                : chapter.targetAudience === 'Talent Seekers'
                                ? 'bg-blue-900/40 text-blue-300'
                                : 'bg-emerald-900/40 text-emerald-300'
                            }`}>
                              {chapter.targetAudience}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">
                            {chapter.shortLabel}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                            {chapter.startTime}s - {chapter.endTime}s
                          </p>
                        </div>

                        {/* Spoken Voice Narration Button for Chapter */}
                        <button
                          onClick={() => toggleChapterVoiceover(chapter.id)}
                          className={`w-full mt-1 px-2 py-1 rounded text-[10px] font-semibold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isAudioPlaying
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-900/80 hover:bg-purple-900/50 text-purple-300 border border-purple-800/30'
                          }`}
                        >
                          <Mic className="w-3 h-3 text-purple-400" />
                          <span>{isAudioPlaying ? 'Stop Voice' : 'Play Voice'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Active Chapter Details & Deep Dive */}
                <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700/80">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wide">
                          Chapter {currentChapter.id} Active
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {currentChapter.startTime}s – {currentChapter.endTime}s
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Mic className="w-3 h-3 text-purple-400" />
                          Voiceover Narrator (Kore)
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white">
                        {currentChapter.headline}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleChapterVoiceover(currentChapter.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          activeAudioChapterId === currentChapter.id
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-800'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5 text-purple-300" />
                        <span>{activeAudioChapterId === currentChapter.id ? 'Pause Voice' : 'Play Voice Narration'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedScreenshotIndex(activeChapterIndex);
                          setModalTab('screenshots');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Inspect Screenshot</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800 italic">
                    "{currentChapter.caption}"
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {currentChapter.details.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Downloads & Resources Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-2">
                      Download Offline Showcase Pack
                      <span className="text-[10px] font-normal px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                        Includes Professional Voiceover
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Export full 1280x720 video with professional voiceover and complete verbatim transcript.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href="/assets/aistudio/talent-network-walkthrough.mp4"
                      download="opal-talent-network-walkthrough.mp4"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Video (.mp4)</span>
                    </a>
                    <a
                      href="/assets/aistudio/talent-network-guide-script.txt"
                      download="opal-talent-network-guide-script.txt"
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Transcript (.txt)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: REAL SCREENSHOTS GALLERY */}
            {modalTab === 'screenshots' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Talent Network Real Screen Captures
                  </h3>
                  <p className="text-xs text-slate-400">
                    High-resolution interface screens illustrating both Talent &amp; Seeker views, job publishing, open requirement listings, and Indian Metro filtering.
                  </p>
                </div>

                {/* Screenshot Thumbnails Navigation */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {CHAPTERS.map((chap, idx) => {
                    const isSelected = selectedScreenshotIndex === idx;
                    return (
                      <button
                        key={chap.id}
                        onClick={() => {
                          setSelectedScreenshotIndex(idx);
                          setIsZoomed(false);
                        }}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                            : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <div className="aspect-video w-full rounded-lg bg-slate-900 overflow-hidden mb-2 border border-slate-700/60 relative">
                          <img
                            src={chap.screenshotUrl}
                            alt={chap.headline}
                            className="w-full h-full object-cover object-top"
                          />
                          <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-black/80 text-white">
                            Screen {chap.id}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">
                          {chap.shortLabel}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {chap.targetAudience}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Full-Resolution Screenshot Viewer */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-600 text-white font-mono">
                          SCREEN 0{CHAPTERS[selectedScreenshotIndex].id}
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          {CHAPTERS[selectedScreenshotIndex].headline}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {CHAPTERS[selectedScreenshotIndex].caption}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        onClick={() => toggleChapterVoiceover(CHAPTERS[selectedScreenshotIndex].id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                          activeAudioChapterId === CHAPTERS[selectedScreenshotIndex].id
                            ? 'bg-purple-600 text-white'
                            : 'bg-purple-950/70 hover:bg-purple-900 text-purple-200 border border-purple-800'
                        }`}
                      >
                        <Mic className="w-3.5 h-3.5 text-purple-400" />
                        <span>{activeAudioChapterId === CHAPTERS[selectedScreenshotIndex].id ? 'Stop Voice' : 'Play Voice'}</span>
                      </button>

                      <button
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{isZoomed ? 'Reset Zoom' : 'Zoom In'}</span>
                      </button>
                      <a
                        href={CHAPTERS[selectedScreenshotIndex].screenshotUrl}
                        download={CHAPTERS[selectedScreenshotIndex].screenshotName}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save PNG</span>
                      </a>
                    </div>
                  </div>

                  {/* Main Display Image */}
                  <div className={`relative w-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900 transition-all ${
                    isZoomed ? 'overflow-x-auto max-h-[85vh]' : 'aspect-video'
                  }`}>
                    <img
                      src={CHAPTERS[selectedScreenshotIndex].screenshotUrl}
                      alt={CHAPTERS[selectedScreenshotIndex].headline}
                      className={isZoomed ? "min-w-[1280px] w-auto h-auto object-contain cursor-zoom-out" : "w-full h-full object-contain cursor-zoom-in"}
                      onClick={() => setIsZoomed(!isZoomed)}
                    />
                  </div>

                  {/* Explanatory Guide for this Screen */}
                  <div className="bg-slate-900/90 rounded-lg p-4 border border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Key Interface Features Shown on this Screen:
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                      {CHAPTERS[selectedScreenshotIndex].details.map((d, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold">•</span>
                          <span>{d}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: COMPLETE SCRIPT & ARCHITECTURE */}
            {modalTab === 'script' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Full Video Script &amp; System Architecture
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 font-sans flex items-center gap-1">
                        <Mic className="w-3 h-3 text-purple-400" />
                        Professional Voice Narration
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">Verbatim voiceover narration script and portal rules.</p>
                  </div>
                  <a
                    href="/assets/aistudio/talent-network-guide-script.txt"
                    download="opal-talent-network-guide-script.txt"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </a>
                </div>

                <div className="space-y-4">
                  {CHAPTERS.map(chap => (
                    <div key={chap.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-400 font-serif">
                          CHAPTER {chap.id}: {chap.headline.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-mono">
                            {chap.startTime}s - {chap.endTime}s
                          </span>
                          <button
                            onClick={() => toggleChapterVoiceover(chap.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                              activeAudioChapterId === chap.id
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-950 text-purple-300 hover:bg-purple-900'
                            }`}
                          >
                            <Mic className="w-3 h-3" />
                            <span>{activeAudioChapterId === chap.id ? 'Stop Voice' : 'Play Voice'}</span>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                        {chap.caption}
                      </p>
                      <div className="pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                          Role Functionality:
                        </span>
                        <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                          {chap.details.map((d, i) => (
                            <li key={i}>{d}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-slate-950/95 border-t border-slate-800 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>© 2026 Opal Portal Ecosystem • India Talent Network Architecture</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-400 font-semibold">● 11 Indian Metro Hubs Supported</span>
              <span className="text-purple-300 font-medium">● Studio Voice Active</span>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
              >
                Close Guide
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
