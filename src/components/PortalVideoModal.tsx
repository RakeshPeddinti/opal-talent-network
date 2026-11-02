import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Pause, RotateCcw, Download, FileText, Volume2, VolumeX, Maximize, Sparkles, CheckCircle2 } from 'lucide-react';

interface PortalVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface VideoStep {
  id: number;
  label: string;
  shortLabel: string;
  startTime: number;
  endTime: number;
  headline: string;
  caption: string;
  details: string[];
}

const VIDEO_STEPS: VideoStep[] = [
  {
    id: 1,
    label: "1. All Services (4 Trades)",
    shortLabel: "All Services",
    startTime: 0,
    endTime: 14.0,
    headline: "Four Dedicated Local Trades with Verified Attribution",
    caption: 'Step 1 [All Services]: Explore 4 dedicated trades—Beauty, Handyman, Cloud Kitchen, and Party Planning—with locked provider attribution, distance calculations, and instant slot reservations.',
    details: [
      "Salon Beauty & Wellness (Hair, nails, 24K gold facials, hot stone massage)",
      "Handyman & Home Repairs (Drywall, TV mount brackets, electrical & plumbing)",
      "Cloud Kitchen Dining (Gourmet chef meal tasting boxes, flexible dispatch, no rigid time slot)",
      "Luxury Party Planning (Bespoke gala design, venue styling, on-site staging)",
      "Locked Provider Identity (Permanent company name locking prevents cross-tenant impersonation)"
    ]
  },
  {
    id: 2,
    label: "2. Shopping by Department",
    shortLabel: "Department Shopping",
    startTime: 14.0,
    endTime: 28.0,
    headline: "Pure Retail Catalog Studio & Dual-Dropdown Navigation",
    caption: 'Step 2 [Department Shopping]: Browse pure retail merchandise with interactive color swatches, department-specific sizing, live stock control, and instant boutique bag cart.',
    details: [
      "Dual-Dropdown Architecture (Services vs. SHOP BY DEPARTMENT mutually exclusive switcher)",
      "Pure Retail Merchandise (Zero service duration rules or arbitrary calendar appointments)",
      "Interactive Hex Color Swatches (Onyx Black, Camel Tan, Burgundy Wine, Emerald)",
      "Department-Specific Size Chips (S–XL for Clothing, US 8–11 for Footwear, Chef Set for Kitchen)",
      "Real-Time SKU Stock Control & Instant Boutique Bag Cart Drawer"
    ]
  },
  {
    id: 3,
    label: "3. Carrier Shipment & Pickup",
    shortLabel: "Shipment & Pickup",
    startTime: 28.0,
    endTime: 43.0,
    headline: "Live Express Carrier Tariffs & Boutique Showroom Pickup",
    caption: 'Step 3 [Fulfillment & Delivery]: Choose between live-tariff Express Carrier Delivery (FedEx/USPS/UPS) with tracking milestones, or Boutique Showroom Pickup with Google Maps directions.',
    details: [
      "Real-Time Commercial Carrier Tariffs (FedEx 2Day Express $19.95, USPS Priority Express $21.50, UPS Air $20.75, Ground Free)",
      "Authentic Carrier Barcode Formats (FedEx: 7946 XXXX, USPS: 9400 1118, UPS: 1Z XXXXXX)",
      "Live Milestone Tracking Timeline (Electronic Manifest → Courier Pickup → In Transit → Delivered)",
      "Boutique Showroom Pickup (Collect directly from seller storefront at 450 N Rodeo Dr, Beverly Hills)",
      "Google Maps GPS Driving Directions & Digital Mobile Barcode Pass Issued"
    ]
  },
  {
    id: 4,
    label: "4. Payment Methods (4 Options)",
    shortLabel: "Payment Methods",
    startTime: 43.0,
    endTime: 57.0,
    headline: "Transparent, Zero-Trust-Risk Payment Settlement Architecture",
    caption: 'Step 4 [Payment Methods]: Complete flexibility with Cash on completion, instant fee-free Zelle, encrypted cards, and in-store pickup payment.',
    details: [
      "Option 1: Cash on Completion (Inspect handyman work or salon styling first, settle in person with zero risk)",
      "Option 2: Instant Direct Zelle (Direct bank-to-bank electronic transfer, zero intermediary fees, automated SMS alert)",
      "Option 3: Encrypted Credit / Debit Cards (256-bit AES SSL gateway, PCI-DSS Level 1 compliant, Apple & Google Pay)",
      "Option 4: In-Store Showroom Pay (Inspect clothing, shoes, or retail goods in person and pay at boutique register upon pickup)",
      "Provider Dashboard Settlement (Dedicated Cash + Zelle tracking with individual appointment settlement buttons)"
    ]
  }
];

export const PortalVideoModal: React.FC<PortalVideoModalProps> = ({ isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(57);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Determine active step
    const currentStep = VIDEO_STEPS.findIndex(
      (s) => time >= s.startTime && time < s.endTime
    );
    if (currentStep !== -1 && currentStep !== activeStepIndex) {
      setActiveStepIndex(currentStep);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 57);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const jumpToStep = (index: number) => {
    if (!videoRef.current) return;
    const target = VIDEO_STEPS[index];
    videoRef.current.currentTime = target.startTime;
    setCurrentTime(target.startTime);
    setActiveStepIndex(index);
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const cycleSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [1.0, 1.25, 1.5, 0.85];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const replayVideo = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
    setActiveStepIndex(0);
  };

  const activeStep = VIDEO_STEPS[activeStepIndex] || VIDEO_STEPS[0];
  const progressPercent = Math.min(100, (currentTime / (duration || 57)) * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="bg-[#141312] border border-brand-gold/40 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 bg-[#1A1918] border-b border-white/10 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base md:text-lg font-bold text-white tracking-wide flex items-center gap-2">
                    OPAL PORTAL • VIDEO WALKTHROUGH GUIDE
                    <span className="text-[10px] uppercase font-sans font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      HD 1080p
                    </span>
                  </h3>
                  <p className="text-xs text-white/50">
                    Comprehensive overview defining services, department shopping, shipment &amp; payment options
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/assets/aistudio/opal-portal-walkthrough-guide.mp4"
                  download="opal-portal-walkthrough-guide.mp4"
                  className="px-3 py-1.5 rounded-full bg-brand-gold text-brand-dark hover:bg-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-md"
                  title="Download full video file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Video</span> (.mp4)
                </a>

                <a
                  href="/assets/aistudio/opal-portal-guide-script.txt"
                  download="opal-portal-guide-script.txt"
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all text-xs text-white/80 flex items-center gap-1 border border-white/15"
                  title="Download narration transcript"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Script</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Step Tabs Navigation */}
            <div className="px-4 py-2.5 bg-[#161514] border-b border-white/5 flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold shrink-0 mr-1 hidden sm:inline">
                Jump to Step:
              </span>
              {VIDEO_STEPS.map((step, idx) => {
                const isActive = idx === activeStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => jumpToStep(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-brand-gold text-brand-dark shadow-md scale-102 border border-brand-cream/40'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-brand-dark text-brand-gold' : 'bg-white/10 text-white/60'
                    }`}>
                      {step.id}
                    </span>
                    <span>{step.shortLabel}</span>
                  </button>
                );
              })}
            </div>

            {/* Main Video Viewport */}
            <div className="relative bg-black flex items-center justify-center overflow-hidden aspect-video max-h-[52vh] w-full group">
              <video
                ref={videoRef}
                src="/assets/aistudio/opal-portal-walkthrough-guide.mp4"
                className="w-full h-full object-contain cursor-pointer"
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onClick={togglePlay}
                playsInline
                preload="auto"
              />

              {/* Center Play Overlay when Paused */}
              {!isPlaying && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-brand-gold/90 text-brand-dark flex items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play className="w-8 h-8 ml-1 fill-current" />
                </button>
              )}

              {/* Progress Scrub Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/20 cursor-pointer">
                <div
                  className="h-full bg-gradient-to-r from-brand-gold via-amber-300 to-brand-gold transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Video Controls Bar */}
            <div className="px-4 py-2.5 bg-[#171615] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-lg bg-brand-gold text-brand-dark font-bold hover:bg-white transition-colors cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={replayVideo}
                  className="p-1.5 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors cursor-pointer"
                  title="Replay from start"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <div className="text-white/70 font-mono text-[11px] ml-2">
                  <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                  <span className="text-white/30"> / </span>
                  <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                </div>
              </div>

              {/* Active Step Indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-brand-gold font-bold">Step {activeStep.id}/4:</span>
                <span className="text-white/90 font-medium truncate max-w-[200px] sm:max-w-xs">{activeStep.headline}</span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={cycleSpeed}
                  className="px-2 py-1 rounded bg-white/10 text-white/80 hover:bg-white/20 transition-colors text-[11px] font-bold cursor-pointer"
                  title="Playback speed"
                >
                  {playbackRate}x
                </button>

                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20 transition-colors cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      if (videoRef.current.requestFullscreen) {
                        videoRef.current.requestFullscreen();
                      }
                    }
                  }}
                  className="p-1.5 rounded bg-white/10 text-white/80 hover:bg-white/20 transition-colors cursor-pointer"
                  title="Fullscreen"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bottom Teleprompter & Step Breakdown Drawer */}
            <div className="p-4 bg-[#121110] border-t border-white/5 overflow-y-auto max-h-[22vh]">
              {/* Teleprompter Subtitle Box */}
              <div className="p-3 rounded-xl bg-[#1A1917] border border-brand-gold/30 mb-3 shadow-inner">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">
                    LIVE SPOKEN NARRATION • {activeStep.label}
                  </span>
                  <span className="text-[10px] text-white/40">Synchronized Voiceover</span>
                </div>
                <p className="text-xs sm:text-sm text-brand-cream/90 leading-relaxed font-serif italic">
                  "{activeStep.caption.replace(/📌\s*"?/, '').replace(/"?$/, '')}"
                </p>
              </div>

              {/* Step Bullet Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-white/70">
                {activeStep.details.map((detail, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
