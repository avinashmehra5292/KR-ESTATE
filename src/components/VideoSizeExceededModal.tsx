import React from 'react';
import { X, AlertTriangle, Youtube, Cloud, ExternalLink, ArrowRight, Video, CheckCircle2 } from 'lucide-react';

interface VideoSizeExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileSizeMb?: number;
  fileName?: string;
  onPasteLinkClick?: () => void;
}

export const VideoSizeExceededModal: React.FC<VideoSizeExceededModalProps> = ({
  isOpen,
  onClose,
  fileSizeMb = 0,
  fileName = '',
  onPasteLinkClick
}) => {
  if (!isOpen) return null;

  const handleGoToLink = () => {
    onClose();
    if (onPasteLinkClick) {
      onPasteLinkClick();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl rounded-3xl border border-amber-500/30 bg-[#0E131F] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-400" />

        {/* Modal Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <span>Upload Limit: 50MB</span>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-tight">
                Video File Exceeds 50MB Limit
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* File Size Banner */}
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5 min-w-0">
              <span className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Attempted Upload</span>
              <p className="font-semibold text-slate-200 truncate">{fileName || 'High Resolution Video File'}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                {fileSizeMb > 0 ? `${fileSizeMb.toFixed(1)} MB` : '> 50 MB'}
              </span>
              <span className="text-slate-400">vs</span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                50 MB Max
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Direct video uploads are capped at <strong>50MB</strong> to ensure instantaneous loading and smooth streaming on all visitor devices. For 4K drone reels or large presentations, we strongly recommend hosting your video on <span className="text-rose-400 font-semibold">YouTube</span> or <span className="text-amber-400 font-semibold">Google Drive</span> and pasting the link instead!
          </p>

          {/* Hosting Options Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            
            {/* Option 1: YouTube (Recommended) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/20 to-slate-900/60 border border-rose-500/25 space-y-2 hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <div className="h-6 w-6 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <Youtube className="h-3.5 w-3.5" />
                  </div>
                  <span>YouTube</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Best 4K Quality
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Upload to YouTube as <strong>Unlisted</strong> or <strong>Public</strong>, then copy the watch or embed link.
              </p>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>Supports full 4K 60fps &amp; unlimited duration</span>
              </div>
            </div>

            {/* Option 2: Google Drive */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/20 to-slate-900/60 border border-amber-500/25 space-y-2 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                  <div className="h-6 w-6 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <Cloud className="h-3.5 w-3.5" />
                  </div>
                  <span>Google Drive</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                  Cloud Link
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Upload video to Google Drive, set sharing to <strong>&ldquo;Anyone with the link can view&rdquo;</strong>, and paste the link.
              </p>
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                <span>Plays seamlessly in embedded video players</span>
              </div>
            </div>
          </div>

          {/* Quick Tip Box */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-slate-400 text-xs">
            <Video className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="text-slate-200 font-semibold text-[11px]">Direct MP4 / Vimeo also supported:</span>
              <p className="text-[11px] text-slate-400">
                You can also paste any public Vimeo URL or CDN <code>.mp4</code> streaming link into the video URL field.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-end gap-3 bg-[#0A0E18]">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            Choose Smaller Video (&le;50MB)
          </button>
          <button
            type="button"
            onClick={handleGoToLink}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <span>Paste YouTube / Drive Link</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
