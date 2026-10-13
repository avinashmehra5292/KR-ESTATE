import React from 'react';
import { X, Globe, CheckCircle2, Copy, ShieldCheck, Server, ArrowRight } from 'lucide-react';

interface DomainSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DomainSetupModal: React.FC<DomainSetupModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl rounded-3xl border border-amber-500/30 bg-[#0D121F] shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20 overflow-hidden p-6 sm:p-8 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
          <Globe className="h-4 w-4" />
          <span>Domain Binding Guide</span>
        </div>
        <h3 className="font-display text-2xl font-bold text-white tracking-tight">
          Configuring <span className="text-amber-400">krestatenoida.com</span>
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-300">
          This entire application has been built and configured for <strong className="text-white">krestatenoida.com</strong> with full SEO, OpenGraph cards, and Schema.org metadata. To point your custom domain from your registrar (GoDaddy, Namecheap, Hostinger, Cloudflare):
        </p>

        <div className="mt-6 space-y-4">
          
          {/* Step 1: DNS Records Table */}
          <div className="rounded-2xl bg-[#13192B]/90 border border-slate-800 p-4">
            <span className="text-xs font-bold text-amber-400 block mb-2">
              Step 1: Configure DNS Records at Domain Registrar
            </span>
            <div className="space-y-2 text-xs">
              
              {/* Record 1 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080B14] border border-slate-700">
                <div>
                  <span className="text-slate-400">Type:</span> <span className="font-mono text-white font-bold">CNAME</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-400">Host:</span> <span className="font-mono text-white font-bold">www</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 text-[11px] truncate max-w-[200px]">
                    ghs.googlehosted.com
                  </span>
                  <button
                    onClick={() => copyToClipboard('ghs.googlehosted.com', 'cname')}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Copy value"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Record 2 */}
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#080B14] border border-slate-700">
                <div>
                  <span className="text-slate-400">Type:</span> <span className="font-mono text-white font-bold">A Record</span>
                  <span className="mx-2 text-slate-600">·</span>
                  <span className="text-slate-400">Host:</span> <span className="font-mono text-white font-bold">@ (Root)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 text-[11px]">
                    216.239.32.21 (Google Anycast IP)
                  </span>
                  <button
                    onClick={() => copyToClipboard('216.239.32.21', 'arecord')}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title="Copy value"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
            {copied && (
              <span className="text-[11px] text-emerald-400 block mt-2 font-semibold">
                ✓ Copied to clipboard!
              </span>
            )}
          </div>

          {/* Step 2: Cloud Run / Custom Domain Mapping */}
          <div className="rounded-2xl bg-[#13192B]/90 border border-slate-800 p-4">
            <span className="text-xs font-bold text-amber-400 block mb-1">
              Step 2: Google Cloud Console / Custom Domains Mapping
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              In your Google Cloud Console for this app, navigate to <strong className="text-white">Cloud Run &gt; Manage Custom Domains &gt; Add Mapping</strong>, select <code className="text-amber-300 font-bold">krestatenoida.com</code> and <code className="text-amber-300 font-bold">www.krestatenoida.com</code>. Google will provision managed SSL automatically.
            </p>
          </div>

          {/* Step 3: Verified Status */}
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-200">
              <strong className="text-emerald-300 block mb-0.5">Codebase & SEO Fully Ready</strong>
              All internal references, canonical tags, Schema.org RealEstateAgent JSON-LD, OpenGraph headers, and lead dispatch are targeted to <strong className="text-white">krestatenoida.com</strong> and <strong className="text-white">avinashmehra5292@gmail.com</strong>.
            </div>
          </div>

        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-950 gold-gradient-btn rounded-xl transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            Understood
          </button>
        </div>

      </div>
    </div>
  );
};
