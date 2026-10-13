import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Video, Clock, Building, MapPin, Calendar, FileText, Phone } from 'lucide-react';
import { Property } from '../types';
import { NOIDA_PROPERTIES } from '../data/properties';

interface PropertyVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  video?: {
    title: string;
    videoUrl: string;
    thumbnailUrl?: string;
    duration?: string;
    description?: string;
  } | null;
  properties?: Property[];
  onOpenScheduleModal: (projectName?: string) => void;
  onSelectProperty?: (property: Property) => void;
}

export const PropertyVideoModal: React.FC<PropertyVideoModalProps> = ({
  isOpen,
  onClose,
  property,
  video,
  properties,
  onOpenScheduleModal,
  onSelectProperty,
}) => {
  const [allProperties, setAllProperties] = useState<Property[]>(properties || NOIDA_PROPERTIES);

  useEffect(() => {
    if (properties && properties.length > 0) {
      setAllProperties(properties);
    } else {
      fetch('/api/properties')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            setAllProperties(data);
          }
        })
        .catch(() => {});
    }
  }, [properties]);

  // Properties that have a property walkthrough video
  const propertiesWithVideos = allProperties.filter(
    (p) => p.videoTour && p.videoTour.videoUrl && p.videoTour.videoUrl.trim()
  );

  const initialProperty = property || propertiesWithVideos[0] || null;
  const [currentProperty, setCurrentProperty] = useState<Property | null>(initialProperty);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (property) {
      setCurrentProperty(property);
    } else if (!currentProperty && propertiesWithVideos.length > 0) {
      setCurrentProperty(propertiesWithVideos[0]);
    }
  }, [property]);

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(true);
    }
  }, [isOpen, currentProperty]);

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

  if (!isOpen || !currentProperty) return null;

  // Resolve active video object
  const activeVideo = (currentProperty === property && video) ? video : currentProperty.videoTour;

  if (!activeVideo || !activeVideo.videoUrl) return null;

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

  const isYoutube = activeVideo.videoUrl?.includes('youtube.com') || activeVideo.videoUrl?.includes('youtu.be');
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
            <span className="p-1 rounded-md bg-amber-400/20 text-amber-400 border border-amber-400/30">
              <Video className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white leading-tight">
                {currentProperty.title} &bull; Property Video Walkthrough
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentProperty.sector} &bull; {currentProperty.developer || 'Featured Development'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Close modal"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display */}
        <div className={`relative ${isPortrait ? 'w-full aspect-[9/16] max-h-[60vh] sm:max-h-[66vh] mx-auto' : 'aspect-video w-full'} bg-black group overflow-hidden flex items-center justify-center transition-all duration-300`}>
          {isPortrait && !isYoutube && (
            <video
              src={activeVideo.videoUrl}
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
              src={getYoutubeEmbedUrl(activeVideo.videoUrl)}
              className="w-full h-full relative z-10"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              key={activeVideo.videoUrl}
              ref={videoRef}
              src={activeVideo.videoUrl}
              autoPlay
              playsInline
              controls
              muted={isMuted}
              onLoadedMetadata={(e) => checkVideoOrientation(e.currentTarget)}
              onCanPlay={(e) => checkVideoOrientation(e.currentTarget)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain relative z-10"
            />
          )}

          {/* Property Overlay HUD */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1 text-[11px] font-mono text-slate-200 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-amber-500/30 shadow-lg">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold">
              <Building className="h-3.5 w-3.5 text-amber-400" />
              <span>PROJECT WALKTHROUGH &bull; 4K</span>
            </div>
            <span className="text-slate-300 truncate max-w-[200px] sm:max-w-[340px]">
              {currentProperty.title.toUpperCase()}
            </span>
          </div>

          {/* Custom Overlay Controls (for HTML5 video) */}
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
                  <span className="font-semibold block truncate max-w-[150px] sm:max-w-[280px]">{activeVideo.title || currentProperty.title}</span>
                  <span className="text-[10px] sm:text-[11px] text-amber-300 font-mono font-medium">{activeVideo.duration || 'Walkthrough'}</span>
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

        {/* Property Details & CTAs */}
        <div className="p-4 sm:p-5 bg-gradient-to-b from-[#0D121F] to-[#070A12] border-t border-slate-800/80 overflow-y-auto max-h-[35vh]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                  {currentProperty.sector}
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {currentProperty.priceDisplay || 'Price on Request'}
                </span>
                {currentProperty.reraNumber && (
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                    RERA: {currentProperty.reraNumber}
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {activeVideo.title || `${currentProperty.title} Video Tour`}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
                {activeVideo.description || currentProperty.shortDescription || `Take a virtual tour of ${currentProperty.title}.`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenScheduleModal(currentProperty.title);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Schedule Visit</span>
              </button>
              {onSelectProperty && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectProperty(currentProperty);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Full Property Details</span>
                </button>
              )}
            </div>
          </div>

          {/* More Property Walkthroughs (Strictly Property Videos Only) */}
          {propertiesWithVideos.length > 1 && (
            <div className="mt-4 pt-3.5 border-t border-slate-800/70">
              <div className="flex items-center gap-2 mb-2.5">
                <Video className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  More Property Videos ({propertiesWithVideos.length})
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {propertiesWithVideos.map((prop) => {
                  const isCurrent = prop.id === currentProperty.id;
                  return (
                    <button
                      key={prop.id}
                      type="button"
                      onClick={() => {
                        setCurrentProperty(prop);
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
                          src={prop.videoTour?.thumbnailUrl || prop.coverImage || '/corridor-expressway.jpg'}
                          alt={prop.title}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.currentTarget.src = prop.coverImage || '/corridor-expressway.jpg'; }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className={`w-3.5 h-3.5 ${isCurrent ? 'fill-amber-400 text-amber-400' : 'fill-white text-white'}`} />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-white truncate line-clamp-1">
                          {prop.title}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                          <span>{prop.sector}</span>
                          <span>&bull;</span>
                          <span className="text-amber-400 font-semibold">{prop.priceDisplay || 'Luxury'}</span>
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
