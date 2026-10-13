import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Calendar,
  Compass,
  Share2,
  Printer,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Sliders,
  Send,
  Building,
  TreePine,
  ShieldCheck,
  ChevronRight,
  Headphones,
  RotateCcw
} from 'lucide-react';
import { NOIDA_PROPERTIES } from '../data/properties';

interface VideoChapter {
  id: string;
  title: string;
  sector: string;
  duration: string;
  videoUrl: string;
  telemetry: string;
  coordinates: string;
  keyProjects: string[];
  keyHighlights: string[];
  narration: string;
}

const DEFAULT_CHAPTERS: VideoChapter[] = [
  {
    id: 'ch1',
    title: 'The Aristocratic Gateway: Golf & Sky Mansions',
    sector: 'Sector 124 - Sector 128 (Jaypee Wish Town)',
    duration: '00:45',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    telemetry: 'ALT: 180M AGL · SECTOR 128 GOLF CORRIDOR · 10 MIN TO SOUTH DELHI DND',
    coordinates: '28.5355° N, 77.3910° E · 4K 60FPS',
    keyProjects: ['ATS Knightsbridge (Sec 124)', 'Mahagun Manorialle (Sec 128)'],
    keyHighlights: ['18-Hole Graham Cooke Golf Course', '0 km Kalindi Kunj & Delhi Border', 'Ultra-exclusive 1 residence per floor'],
    narration: 'Entering the Noida Expressway gateway just 10 minutes from South Delhi. Sector 124 and 128 host ultra-luxury landmarks ATS Knightsbridge and Mahagun Manorialle, overlooking the 18-hole championship golf course.'
  },
  {
    id: 'ch2',
    title: 'Commercial Powerhouse & IT Corridors',
    sector: 'Sector 140A & Sector 142/144',
    duration: '00:45',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    telemetry: 'ALT: 165M AGL · SECTOR 140A COMMERCIAL HUB · 200,000+ TECH WORKFORCE',
    coordinates: '28.5020° N, 77.4290° E · 4K 60FPS',
    keyProjects: ['Bhutani Cyberthum (Sec 140A)', 'Advant Navis Business Park', 'Gulshan Dynasty (Sec 144)'],
    keyHighlights: ['North India tallest twin 50-storey commercial towers', 'Aqua Line Metro direct interchange', '10-12% expected lease yields'],
    narration: 'Proceeding along the 8-lane corridor into Sector 140A and 144, the primary economic engine of Noida. Featuring Bhutani Cyberthum and Fortune 500 corporate campuses with rapid capital returns.'
  },
  {
    id: 'ch3',
    title: 'The Green Lung: Sector 150 Sports City',
    sector: 'Sector 150 (Sports City Masterplan)',
    duration: '00:45',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    telemetry: 'ALT: 210M AGL · SECTOR 150 GREEN SANCTUARY · 80% RECREATIONAL RESERVES',
    coordinates: '28.4682° N, 77.5147° E · 4K 60FPS',
    keyProjects: ['ACE Starlit', 'Godrej Palm Retreat', 'Tata Eureka Park'],
    keyHighlights: ['42-Acre Shaheed Bhagat Singh Park', 'Zero overhead electrical cables', 'Half-Olympic sports facilities'],
    narration: 'Sector 150 Sports City is NCR’s lowest-density residential sanctuary. 80% dedicated open greens with glass-facade residences at ACE Starlit, providing clean air and unmatched recreational infrastructure.'
  },
  {
    id: 'ch4',
    title: 'Global Future: Jewar International Airport Link',
    sector: 'Yamuna Expressway Cloverleaf & Aero-City',
    duration: '00:45',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    telemetry: 'ALT: 250M AGL · SIGNAL-FREE TO JEWAR AIRPORT · 25 MIN TRANSIT',
    coordinates: '28.3800° N, 77.5500° E · 4K 60FPS',
    keyProjects: ['Jewar Aerocity Freehold Plots', 'Proposed Film City Zone', 'Olympic City Hub'],
    keyHighlights: ['25 Mins to Noida International Airport (Jewar)', 'Projected 35-40% 3-year capital appreciation', 'Freehold registry plots with immediate development'],
    narration: 'The Noida Expressway connects seamlessly to Yamuna Expressway, reaching the upcoming Noida International Airport at Jewar in 25 minutes. A golden growth corridor ensuring long-term generational wealth.'
  }
];

interface NoidaExpresswayClientVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScheduleModal: (projectName?: string) => void;
  initialClientName?: string;
}

export const NoidaExpresswayClientVideoModal: React.FC<NoidaExpresswayClientVideoModalProps> = ({
  isOpen,
  onClose,
  onOpenScheduleModal,
  initialClientName = 'Mr. & Mrs. R. Kapoor'
}) => {
  if (!isOpen) return null;

  // Active view tab
  const [activeTab, setActiveTab] = useState<'video' | 'customize' | 'share'>('video');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Client customization fields
  const [clientName, setClientName] = useState(initialClientName);
  const [clientFocus, setClientFocus] = useState('Luxury Living & High Capital Growth');
  const [clientBudget, setClientBudget] = useState('₹2.50 Cr – ₹6.00 Cr');
  const [selectedHighlights, setSelectedHighlights] = useState<string[]>([
    '15 Mins to South Delhi DND',
    '25 Mins to Jewar International Airport',
    '80% Dedicated Green Reserves',
    'Championship 18-Hole Golf Views'
  ]);
  const [advisorNote, setAdvisorNote] = useState(
    'Private client presentation curated by KR Estate Noida Advisory Desk for premium acquisitions along the Expressway corridor.'
  );

  // Video State
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVoiceoverEnabled, setIsVoiceoverEnabled] = useState(false);
  const [isAmbientAudioOn, setIsAmbientAudioOn] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingAiScript, setIsGeneratingAiScript] = useState(false);
  const [scriptData, setScriptData] = useState<any>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const activeChapter = DEFAULT_CHAPTERS[activeChapterIndex] || DEFAULT_CHAPTERS[0];

  // Load client from URL if present
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlClient = urlParams.get('client');
      if (urlClient) {
        setClientName(urlClient);
      }
    } catch {
      // safe fallback
    }
  }, []);

  // Web Audio Synthesizer for Ambient Architectural Score
  const toggleAmbientAudio = () => {
    if (!isAmbientAudioOn) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Soothing warm harmonic chords (A minor 9th feel: A2, E3, C4, G4)
        const freqs = [110, 164.81, 261.63, 392.0];
        freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          // Very quiet, gentle ambient drone
          gain.gain.setValueAtTime(0.015, ctx.currentTime);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
        });

        setIsAmbientAudioOn(true);
      } catch (err) {
        console.error('Ambient audio not supported or blocked:', err);
      }
    } else {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsAmbientAudioOn(false);
    }
  };

  // Web SpeechSynthesis for Live Voiceover
  const speakCurrentChapter = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    if (!isVoiceoverEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (isVoiceoverEnabled) {
      speakCurrentChapter(
        scriptData?.scenes?.[activeChapterIndex]?.narrationText || activeChapter.narration
      );
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [activeChapterIndex, isVoiceoverEnabled]);

  // Keep video playback rate in sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, activeChapterIndex]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleNextChapter = () => {
    const nextIdx = (activeChapterIndex + 1) % DEFAULT_CHAPTERS.length;
    setActiveChapterIndex(nextIdx);
    if (videoRef.current) {
      videoRef.current.src = DEFAULT_CHAPTERS[nextIdx].videoUrl;
      videoRef.current.play();
    }
  };

  const handlePrevChapter = () => {
    const prevIdx = (activeChapterIndex - 1 + DEFAULT_CHAPTERS.length) % DEFAULT_CHAPTERS.length;
    setActiveChapterIndex(prevIdx);
    if (videoRef.current) {
      videoRef.current.src = DEFAULT_CHAPTERS[prevIdx].videoUrl;
      videoRef.current.play();
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        if ('speechSynthesis' in window) window.speechSynthesis.pause();
      } else {
        videoRef.current.play();
        if ('speechSynthesis' in window) window.speechSynthesis.resume();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current && videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  // AI Script Generation
  const handleGenerateAiScript = async () => {
    setIsGeneratingAiScript(true);
    try {
      const res = await fetch('/api/generate-client-video-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          focus: clientFocus,
          budget: clientBudget,
          highlights: selectedHighlights,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setScriptData(data);
        if (data.executiveSummary) {
          setAdvisorNote(data.executiveSummary);
        }
      }
    } catch (err) {
      console.error('Failed to generate AI script:', err);
    } finally {
      setIsGeneratingAiScript(false);
      setActiveTab('video');
    }
  };

  // Copy shareable link
  const getShareUrl = () => {
    const origin = window.location.origin;
    const cleanClient = encodeURIComponent(clientName.trim());
    return `${origin}?client=${cleanClient}&expresswayTour=true`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // WhatsApp client message
  const handleShareWhatsApp = () => {
    const url = getShareUrl();
    const text = `*Private Real Estate Video Inspection: Noida Expressway Corridor*\n\nDear ${clientName},\n\nWe have prepared an exclusive 4K aerial drone walkthrough and micro-market analysis of the Noida Expressway tailored to your preference (*${clientFocus}*, budget: *${clientBudget}*).\n\nKey highlights featured in your presentation:\n• Sector 124-128 Golf Residences (ATS Knightsbridge & Mahagun Manorialle)\n• Sector 140A Commercial Hub (Bhutani Cyberthum)\n• Sector 150 Sports City 80% Green Corridor (ACE Starlit)\n• 25 Mins to Jewar International Airport\n\nWatch your personalized video presentation here:\n${url}\n\nWarm regards,\n*KR Estate Noida Advisory Desk*\nPhone: +91 78704 33580\nEmail: avinashmehra5292@gmail.com\nWebsite: krestatenoida.com`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Print client dossier
  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-6xl rounded-3xl border border-amber-500/30 bg-[#0A0E18] shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20 overflow-hidden flex flex-col text-slate-100 max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Top Bar Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-[#0D121F]/90">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gold-gradient-btn text-slate-950 font-black text-xs shadow-md shadow-amber-500/20">
              KR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 drop-shadow-sm">
                  Noida Expressway Client Video Presentation
                </span>
              </div>
              <span className="text-[11px] text-slate-300 block truncate max-w-md">
                Exclusively Prepared for: <strong className="text-white font-semibold">{clientName}</strong> · KR Estate Noida
              </span>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="hidden sm:flex items-center gap-1 p-1 bg-[#080B14] rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'video'
                  ? 'gold-gradient-btn text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              4K Video Reel
            </button>
            <button
              onClick={() => setActiveTab('customize')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'customize'
                  ? 'gold-gradient-btn text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="h-3 w-3" />
              <span>Personalize for Client</span>
            </button>
            <button
              onClick={() => setActiveTab('share')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'share'
                  ? 'gold-gradient-btn text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="h-3 w-3" />
              <span>Share & Export</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'video' && (
            <div className="flex flex-col">
              
              {/* Cinematic Video Player Viewport */}
              <div className="relative aspect-[16/9] w-full bg-black group overflow-hidden">
                <video
                  ref={videoRef}
                  src={activeChapter.videoUrl}
                  autoPlay
                  playsInline
                  muted={isMuted}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={handleNextChapter}
                  className="w-full h-full object-cover"
                />

                {/* Dynamic Client Watermark & VIP Badge */}
                <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-200 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-400/40 shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                    <span className="uppercase tracking-wider">
                      PRIVATE DOSSIER: <span className="text-amber-300 font-bold">{clientName}</span>
                    </span>
                  </div>

                  {/* Flight Telemetry HUD */}
                  <div className="text-[10px] font-mono text-slate-300 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700 flex items-center gap-2">
                    <Compass className="h-3 w-3 text-amber-400" />
                    <span>{activeChapter.telemetry}</span>
                  </div>
                </div>

                {/* Right Top HUD: Sector GPS Coordinates */}
                <div className="absolute top-4 right-4 z-20 pointer-events-none hidden sm:flex items-center gap-2 text-[10px] font-mono text-amber-300 bg-black/75 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-700">
                  <span>{activeChapter.coordinates}</span>
                </div>

                {/* Karaoke Subtitle / Narration Bar */}
                <div className="absolute bottom-16 inset-x-4 sm:inset-x-8 z-20 pointer-events-none">
                  <div className="max-w-3xl mx-auto p-3 rounded-xl bg-black/85 backdrop-blur-md border border-amber-500/30 text-center shadow-2xl">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 block mb-0.5 font-bold">
                      Chapter {activeChapterIndex + 1}: {activeChapter.title}
                    </span>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                      "{scriptData?.scenes?.[activeChapterIndex]?.narrationText || activeChapter.narration}"
                    </p>
                  </div>
                </div>

                {/* Overlay Player Controls */}
                <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-between gap-3 z-30">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Play/Pause */}
                    <button
                      onClick={togglePlay}
                      className="p-2 sm:p-2.5 rounded-full gold-gradient-btn text-slate-950 font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                    </button>

                    {/* Mute/Unmute */}
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>

                    {/* Voiceover Speech Toggle */}
                    <button
                      onClick={() => setIsVoiceoverEnabled(!isVoiceoverEnabled)}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isVoiceoverEnabled
                          ? 'bg-amber-400/25 text-amber-300 border-amber-400/60 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                          : 'bg-white/10 text-slate-300 border-slate-700 hover:bg-white/20'
                      }`}
                      title="Read script with audio voiceover"
                    >
                      <Headphones className="h-3 w-3" />
                      <span className="hidden sm:inline">Voice Narration</span>
                      <span className="font-bold">{isVoiceoverEnabled ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Ambient Architectural Score Toggle */}
                    <button
                      onClick={toggleAmbientAudio}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1.5 border ${
                        isAmbientAudioOn
                          ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                          : 'bg-white/10 text-slate-300 border-slate-700 hover:bg-white/20'
                      }`}
                      title="Play ambient architectural soundtrack"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span className="hidden sm:inline">Ambient Music</span>
                      <span className="font-bold">{isAmbientAudioOn ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* Speed Selector */}
                    <button
                      onClick={() => {
                        const newSpeed = playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1;
                        setPlaybackSpeed(newSpeed);
                        if (videoRef.current) videoRef.current.playbackRate = newSpeed;
                      }}
                      className="px-2 py-1 rounded bg-white/10 text-[10px] font-mono text-slate-300 hover:text-white"
                      title="Playback Speed"
                    >
                      {playbackSpeed}x
                    </button>
                  </div>

                  {/* Chapter Navigation & Fullscreen */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevChapter}
                      className="px-2.5 py-1 text-xs text-slate-300 bg-white/10 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
                    >
                      Prev Chapter
                    </button>
                    <span className="text-[11px] font-mono text-amber-400 font-bold">
                      {activeChapterIndex + 1}/{DEFAULT_CHAPTERS.length}
                    </span>
                    <button
                      onClick={handleNextChapter}
                      className="px-2.5 py-1 text-xs text-slate-950 gold-gradient-btn rounded-md font-bold transition-all cursor-pointer shadow-sm"
                    >
                      Next Chapter
                    </button>

                    <button
                      onClick={handleFullscreen}
                      className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
                      title="Fullscreen"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Chapter Timeline & Project Details Below Player */}
              <div className="p-4 sm:p-6 bg-[#0D121F]/95 border-t border-slate-800 space-y-6">
                
                {/* 4 Interactive Chapter Segments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Noida Expressway Inspection Chapters:
                    </span>
                    <span className="text-xs text-amber-300 font-mono">
                      Current: {activeChapter.sector}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {DEFAULT_CHAPTERS.map((ch, idx) => (
                      <div
                        key={ch.id}
                        onClick={() => {
                          setActiveChapterIndex(idx);
                          if (videoRef.current) {
                            videoRef.current.src = ch.videoUrl;
                            videoRef.current.play();
                          }
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          activeChapterIndex === idx
                            ? 'bg-amber-500/15 border-amber-400/60 shadow-lg shadow-amber-500/10'
                            : 'bg-[#13192B]/80 border-slate-800/80 hover:border-amber-400/30 hover:bg-[#161F36]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className={`font-mono font-bold ${activeChapterIndex === idx ? 'text-amber-400' : 'text-slate-400'}`}>
                            0{idx + 1}. CHAPTER
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">{ch.duration}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-white line-clamp-1">
                          {ch.title}
                        </h4>
                        <span className="text-[11px] text-slate-300 block line-clamp-1 mt-0.5">
                          {ch.sector}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chapter Deep Dive: Key Projects & Investment Highlights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2 border-t border-slate-800">
                  
                  {/* Column 1: Projects Inspected */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Building className="h-3.5 w-3.5" />
                      Key Projects Featured in this Scene
                    </span>
                    <div className="space-y-1.5">
                      {activeChapter.keyProjects.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-200 bg-[#13192B]/80 px-3 py-2 rounded-xl border border-slate-800">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
                          <span className="font-medium">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 2: Infrastructure Catalysts */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <TreePine className="h-3.5 w-3.5" />
                      Corridor Advantage
                    </span>
                    <div className="space-y-1.5">
                      {activeChapter.keyHighlights.map((h, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-200 bg-[#13192B]/80 px-3 py-2 rounded-xl border border-slate-800">
                          <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Client Action Box */}
                  <div className="flex flex-col justify-between p-4 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0A0E18] border border-amber-500/30 space-y-3 shadow-lg">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Interested in {activeChapter.sector}?
                      </span>
                      <p className="text-[11px] text-slate-300 mt-1">
                        Book a chauffeur-driven private site inspection for {clientName} with KR Estate Senior Advisory Desk.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenScheduleModal(activeChapter.keyProjects[0] || 'Noida Expressway');
                        }}
                        className="flex-1 py-2.5 px-3 text-xs font-bold text-slate-950 gold-gradient-btn rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Book Site Visit</span>
                      </button>

                      <button
                        onClick={handleShareWhatsApp}
                        className="py-2.5 px-3 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                        title="Send this video to client on WhatsApp"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Personalize for Client Tab */}
          {activeTab === 'customize' && (
            <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Client Video Personalization Studio
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  Customize Presentation for Your Buyer / Investor
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  Adjust client details, investment objective, and generate an AI-tailored 60-second video voiceover narrative.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Client Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Client / Investor Name:
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Mr. & Mrs. R. Kapoor"
                    className="w-full rounded-xl border border-slate-700 bg-[#080B14] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-400">
                    Displayed dynamically on the video watermark and WhatsApp proposal.
                  </span>
                </div>

                {/* Investment Objective */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Primary Investment Focus:
                  </label>
                  <select
                    value={clientFocus}
                    onChange={(e) => setClientFocus(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#080B14] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="Luxury Living & High Capital Growth">Luxury Living & High Capital Growth</option>
                    <option value="Sector 150 Sports City 80% Green Sanctuary">Sector 150 Sports City (Low-Density Green Living)</option>
                    <option value="Golf-Facing Sky Mansions (Sector 124/128)">Golf-Facing Sky Mansions (Sector 124/128)</option>
                    <option value="Commercial Retail & High-Yield IT Office (Sector 140A)">Commercial High-Yield IT & Retail (Sector 140A)</option>
                    <option value="Yamuna Expressway Jewar Airport Plotted Appreciation">Yamuna Expressway & Jewar Airport Plotted Land</option>
                  </select>
                </div>

                {/* Budget Bracket */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Client Budget Bracket:
                  </label>
                  <select
                    value={clientBudget}
                    onChange={(e) => setClientBudget(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-[#080B14] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="₹1.50 Cr – ₹3.00 Cr">₹1.50 Cr – ₹3.00 Cr (2 & 3 BHK Premium)</option>
                    <option value="₹2.50 Cr – ₹6.00 Cr">₹2.50 Cr – ₹6.00 Cr (3 & 4 BHK Luxury)</option>
                    <option value="₹6.00 Cr – ₹15.00 Cr">₹6.00 Cr – ₹15.00 Cr (Sky Mansions & Penthouses)</option>
                    <option value="₹50 Lakh – ₹3.00 Cr Commercial">₹50 Lakh – ₹3.00 Cr (Commercial Retail / Lockable Office)</option>
                    <option value="₹65 Lakh – ₹2.50 Cr Freehold Plots">₹65 Lakh – ₹2.50 Cr (Jewar Aerocity Freehold Plots)</option>
                  </select>
                </div>

                {/* Key Selling Points to Emphasize */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Selling Points Highlighted in Video:
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      '15 Mins to South Delhi DND',
                      '25 Mins to Jewar International Airport',
                      '80% Dedicated Green Reserves',
                      'Championship 18-Hole Golf Views',
                      'Direct Aqua Line Metro Access',
                      'Zero Overhead Wiring Infrastructure'
                    ].map((point) => {
                      const isChecked = selectedHighlights.includes(point);
                      return (
                        <button
                          key={point}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedHighlights(selectedHighlights.filter((h) => h !== point));
                            } else {
                              setSelectedHighlights([...selectedHighlights, point]);
                            }
                          }}
                          className={`p-2 rounded-lg text-left border transition-all text-[11px] cursor-pointer ${
                            isChecked
                              ? 'bg-amber-400/20 border-amber-400/60 text-amber-200 font-semibold'
                              : 'bg-[#13192B] border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          {point}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Advisor Executive Brief / Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Advisor Executive Note for Client:
                </label>
                <textarea
                  rows={3}
                  value={advisorNote}
                  onChange={(e) => setAdvisorNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-[#080B14] px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* AI Script Re-generation Action */}
              <div className="p-4 rounded-2xl bg-[#13192B]/90 border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      AI Script Engine (Gemini 3.8 Flash)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Generates a tailored 4-scene video script synchronized with drone footage.
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAiScript}
                  disabled={isGeneratingAiScript}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl gold-gradient-btn text-slate-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingAiScript ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                      <span>Writing Bespoke Script...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Script & Update Video</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* Share & Export Tab */}
          {activeTab === 'share' && (
            <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                  Deliver to Client
                </span>
                <h3 className="font-display text-2xl font-bold text-white">
                  Send Video & Investment Dossier to {clientName}
                </h3>
                <p className="text-sm text-slate-300 mt-1">
                  Share via direct WhatsApp link, copy a private personalized URL, or print the executive PDF briefing.
                </p>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Send via WhatsApp */}
                <div className="p-5 rounded-2xl bg-[#13192B]/90 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
                      <Send className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">Send on WhatsApp</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Directly opens WhatsApp with pre-composed executive message and personalized video link.
                    </p>
                  </div>
                  <button
                    onClick={handleShareWhatsApp}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-500/20"
                  >
                    <span>Launch WhatsApp Message</span>
                  </button>
                </div>

                {/* 2. Copy Shareable Video Link */}
                <div className="p-5 rounded-2xl bg-[#13192B]/90 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                      <Copy className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">Copy Client Video Link</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      URL includes client name parameter so the video opens in personalized VIP mode.
                    </p>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    {copiedLink ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedLink ? 'Link Copied to Clipboard!' : 'Copy Private URL'}</span>
                  </button>
                </div>

                {/* 3. Print / PDF Investment Dossier */}
                <div className="p-5 rounded-2xl bg-[#13192B]/90 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                      <Printer className="h-5 w-5" />
                    </div>
                    <h4 className="text-sm font-semibold text-white">Print Dossier / PDF</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Formatted 1-page printable summary with KR Estate advisory credentials and key project matrices.
                    </p>
                  </div>
                  <button
                    onClick={handlePrintDossier}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer border border-slate-700"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Print Dossier Brief</span>
                  </button>
                </div>

              </div>

              {/* Printable Dossier Preview Container */}
              <div className="p-6 rounded-2xl bg-[#0D121F] border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="font-display text-lg font-bold text-white">
                      KR ESTATE NOIDA · CLIENT VIDEO DOSSIER
                    </span>
                    <span className="text-xs text-slate-400 block">
                      Target Corridor: Noida-Greater Noida Expressway, UP
                    </span>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-400">
                    <span>DATE: {new Date().toLocaleDateString('en-GB')}</span>
                    <span className="block text-amber-400 font-bold">RERA AUTHORIZED ADVISORY</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-[#13192B] border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Prepared For:</span>
                    <span className="text-white font-bold text-sm">{clientName}</span>
                    <span className="text-slate-300 block mt-1">Requirement: {clientFocus}</span>
                    <span className="text-amber-400 font-mono font-bold block">Budget: {clientBudget}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#13192B] border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">Advisory Office:</span>
                    <span className="text-white font-bold">KR Estate Property Consultants</span>
                    <span className="text-slate-300 block mt-1">Sector 150 & Expressway, Noida</span>
                    <span className="text-slate-400 font-mono block">Call: +91 78704 33580 · avinashmehra5292@gmail.com</span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-300 leading-relaxed italic bg-[#13192B]/60 p-3 rounded-xl border border-slate-800">
                  "{advisorNote}"
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-[#080B13]/95 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Verified Drone Footage & Survey by KR Estate Survey Desk</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onOpenScheduleModal('Noida Expressway');
              }}
              className="px-4 py-2 rounded-xl gold-gradient-btn text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Book Chauffeur Site Inspection for {clientName.split(' ')[0]}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
