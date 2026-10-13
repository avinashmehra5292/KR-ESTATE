import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Compass, Clock, Sparkles, Layers, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { DroneTour } from '../types';
import { INITIAL_DRONE_TOURS } from '../data/droneTours';

interface DroneShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTourId?: string;
  onOpenScheduleModal: (corridorName?: string) => void;
}

export const DroneShowcaseModal: React.FC<DroneShowcaseModalProps> = ({
  isOpen,
  onClose,
  initialTourId,
  onOpenScheduleModal,
}) => {
  const [droneTours, setDroneTours] = useState<DroneTour[]>(INITIAL_DRONE_TOURS);
  const [activeTour, setActiveTour] = useState<DroneTour>(INITIAL_DRONE_TOURS[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Fetch live drone tours from API if available
  useEffect(() => {
    let isMounted = true;
    fetch('/api/drone-tours')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setDroneTours(data);
          if (initialTourId) {
            const match = data.find((t: DroneTour) => t.id === initialTourId);
            if (match) setActiveTour(match);
          }
        }
      })
      .catch(() => {
        // Fallback to INITIAL_DRONE_TOURS
      });
    return () => { isMounted = false; };
  }, [initialTourId]);

  // Set active tour when initialTourId or modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialTourId) {
        const found = droneTours.find(t => t.id === initialTourId);
        if (found) {
          setActiveTour(found);
        } else {
          setActiveTour(droneTours[0] || INITIAL_DRONE_TOURS[0]);
        }
      } else {
        // Default to featured tour or first tour (Noida Expressway & Sector 150)
        const featured = droneTours.find(t => t.isFeatured) || droneTours[0] || INITIAL_DRONE_TOURS[0];
        setActiveTour(featured);
      }
      setIsPlaying(true);
    }
  }, [isOpen, initialTourId, droneTours]);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const checkVideoOrientation = (videoEl: HTMLVideoElement) => {
    if (videoEl && videoEl.videoHeight && videoEl.videoWidth) {
      setIsPortrait(videoEl.videoHeight > videoEl.videoWidth);
    }
  };

  const isYoutube = activeTour.videoUrl?.includes('youtube.com') || activeTour.videoUrl?.includes('youtu.be');
  const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=1&rel=0&modestbranding=1`
      : url;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`relative w-full ${isPortrait ? 'max-w-md sm:max-w-lg' : 'max-w-5xl'} rounded-3xl border border-amber-500/30 bg-[#0A0E18] shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20 overflow-hidden flex flex-col text-slate-100 max-h-[95vh] transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-[#0D121F]/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
              <Compass className="h-3.5 w-3.5 text-amber-400 animate-spin-slow" />
              <span>Drone Tours &amp; Aerial Showcase</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-[10px] font-bold text-amber-300 font-mono">
              4K UHD 60FPS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display */}
        <div className={`relative ${isPortrait ? 'w-full aspect-[9/16] max-h-[60vh] sm:max-h-[66vh] mx-auto' : 'aspect-video w-full'} bg-black group overflow-hidden flex items-center justify-center transition-all duration-300`}>
          {isPortrait && !isYoutube && (
            <video
              src={activeTour.videoUrl}
              muted
              playsInline
              autoPlay
              loop
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none"
            />
          )}

          {isYoutube ? (
            <iframe
              src={getYoutubeEmbedUrl(activeTour.videoUrl)}
              className="w-full h-full relative z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              key={activeTour.videoUrl}
              ref={videoRef}
              src={activeTour.videoUrl}
              autoPlay
              playsInline
              controls
              muted={isMuted}
              onError={(e) => {
                if (activeTour.fallbackUrl && e.currentTarget.src !== activeTour.fallbackUrl) {
                  e.currentTarget.src = activeTour.fallbackUrl;
                  e.currentTarget.play().catch(() => {});
                }
              }}
              onLoadedMetadata={(e) => checkVideoOrientation(e.currentTarget)}
              onCanPlay={(e) => checkVideoOrientation(e.currentTarget)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain relative z-10"
            />
          )}

          {/* Aerial Corridor Badge */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none flex items-center gap-1.5 text-[11px] font-mono text-slate-200 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-lg">
            <Compass className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-amber-300 font-bold truncate max-w-[200px] sm:max-w-[340px]">
              {activeTour.sector.toUpperCase()} &bull; KR ESTATE AERIAL
            </span>
          </div>

          {/* Custom Overlay Player Controls (for HTML5 video) */}
          {!isYoutube && (
            <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex items-center justify-between gap-3 sm:gap-4 z-20 pointer-events-auto">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button
                  onClick={togglePlay}
                  className="p-2 sm:p-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition-all cursor-pointer shadow-lg shadow-amber-500/20 shrink-0"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={toggleMute}
                  className="p-1.5 sm:p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                </button>

                <div className="text-xs text-white min-w-0">
                  <span className="font-semibold block truncate max-w-[150px] sm:max-w-[280px]">{activeTour.title}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFullscreen}
                  className="p-1.5 sm:p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer shrink-0"
                  title="Fullscreen"
                >
                  <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Overview & Corridors Selector */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#0D121F] to-[#070A12] border-t border-slate-800/80 overflow-y-auto max-h-[35vh]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  {activeTour.sector}
                </span>
                {activeTour.badge && (
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {activeTour.badge}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {activeTour.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {activeTour.description}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenScheduleModal(activeTour.sector);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Site Inspection Visit</span>
            </button>
          </div>

          {/* Switch Between Aerial Corridor Drone Tours (Dedicated only to Drone Surveys) */}
          {droneTours.length > 1 && (
            <div className="mt-4 pt-3.5 border-t border-slate-800/70">
              <div className="flex items-center gap-2 mb-2.5">
                <Compass className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  More 4K Drone Aerial Surveys ({droneTours.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {droneTours.map((tour) => {
                  const isCurrent = tour.id === activeTour.id;
                  return (
                    <button
                      key={tour.id}
                      type="button"
                      onClick={() => {
                        setActiveTour(tour);
                        setIsPlaying(true);
                      }}
                      className={`text-left p-2.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                        isCurrent
                          ? 'border-amber-400/80 bg-amber-400/10 shadow-sm'
                          : 'border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900'
                      }`}
                    >
                      <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-800">
                        <img
                          src={tour.thumbnailUrl}
                          alt={tour.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = '/corridor-expressway.jpg'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className={`w-3.5 h-3.5 ${isCurrent ? 'fill-amber-400 text-amber-400' : 'fill-white text-white'}`} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate line-clamp-1">
                          {tour.title}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                          {tour.sector}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
