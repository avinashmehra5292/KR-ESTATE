import React from 'react';
import { MessageSquareText } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const WhatsAppButton: React.FC = () => {
  const { settings } = useSiteSettings();
  const cleanPhone = (settings.agency.phone || '+91 78704 33580').replace(/[^0-9]/g, '');
  const domain = settings.agency.domain || 'krestatenoida.com';
  const whatsappUrl =
    `https://wa.me/${cleanPhone}?text=` +
    encodeURIComponent(`Hi ${settings.agency.name || 'KR Estate Noida'}, I am interested in properties in Noida & Jewar Corridor (via ${domain})`);

  return (
    <aside
      aria-label="Direct communication channels"
      className="estate-whatsapp fixed bottom-5 right-5 z-40 flex items-center"
    >
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group shine-sweep flex items-center gap-2.5 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold px-4.5 py-3.5 shadow-[0_0_30px_rgba(16,185,129,0.55)] hover:shadow-[0_0_40px_rgba(16,185,129,0.75)] border border-emerald-300/50 hover:scale-108 active:scale-95 transition-all duration-300 cursor-pointer"
        aria-label="Chat with KR Estate Advisory on WhatsApp"
        title="Chat with KR Estate Advisory on WhatsApp"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-200 opacity-80" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
        </span>
        <MessageSquareText className="h-4.5 w-4.5 text-white group-hover:rotate-12 transition-transform duration-300" />
        <span className="text-xs font-bold tracking-wide hidden sm:inline whitespace-nowrap drop-shadow-sm">
          WhatsApp Advisor
        </span>
      </a>
    </aside>
  );
};
