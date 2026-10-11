import React, { useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface LocalityGuideProps {
  onSelectLocalityFilter?: (sectorName: string) => void;
  onWatchDroneTour?: (video?: any) => void;
}

interface CorridorItem {
  id: string;
  name: string;
  subtitle: string;
  tagline: string;
  filterKey: string;
  image: string;
  videoTour?: {
    title: string;
    youtubeId?: string;
    duration?: string;
    resolution?: string;
  };
}

const CORRIDORS: CorridorItem[] = [
  {
    id: 'expressway',
    name: 'Noida Expressway',
    subtitle: 'The Growth Corridor of Tomorrow',
    tagline: 'IT Parks | Corporate Hubs | Premium Residences',
    filterKey: 'Noida Expressway',
    image: '/corridor-expressway.jpg',
    videoTour: {
      title: 'Noida Expressway Aerial & Infrastructure Showcase',
      duration: '4:15',
      resolution: '4K Ultra HD',
    },
  },
  {
    id: 'sec150',
    name: 'Sector 150 Sports City',
    subtitle: 'World-Class Infrastructure & Sports Hub',
    tagline: 'World Class Infrastructure | Sports City | Residences',
    filterKey: 'Sector 150',
    image: '/prop-godrej.jpg',
    videoTour: {
      title: 'Sector 150 Sports City Luxury Walkthrough',
      duration: '3:45',
      resolution: '4K Ultra HD',
    },
  },
  {
    id: 'jewar',
    name: 'Jewar Airport',
    subtitle: 'International Aviation & Aerocity Corridor',
    tagline: 'International Airport | Aerocity | Investment Zone',
    filterKey: 'Yamuna Expressway',
    image: '/prop-jewar.jpg',
    videoTour: {
      title: 'Jewar Airport Corridor & Yamuna Expressway Aerial Tour',
      duration: '5:20',
      resolution: '4K Ultra HD',
    },
  },
];

export const LocalityGuide: React.FC<LocalityGuideProps> = ({
  onSelectLocalityFilter,
  onWatchDroneTour,
}) => {
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('expressway');

  const activeCorridor =
    CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0];

  const handleCorridorClick = (corridor: CorridorItem) => {
    setSelectedCorridorId(corridor.id);
    if (onSelectLocalityFilter) {
      onSelectLocalityFilter(corridor.filterKey);
    }
  };

  const handlePlayTour = () => {
    if (onWatchDroneTour) {
      onWatchDroneTour(activeCorridor.videoTour);
    }
  };

  return (
    <section
      id="impact"
      className="relative py-14 sm:py-16 lg:py-20 bg-[#FFF3EB] text-slate-900 overflow-hidden border-b border-orange-200/60"
    >
      {/* Subtle ambient lighting mesh */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-amber-400/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-orange-300/10 blur-[130px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 3-Column Luxury Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-6 items-stretch">
          
          {/* ================= LEFT COLUMN: OUR IMPACT ================= */}
          <div className="lg:col-span-4 flex flex-col justify-between py-1 lg:pr-2">
            <div>
              {/* Eyebrow */}
              <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-800 mb-2.5 font-sans">
                OUR IMPACT
              </div>

              {/* Title */}
              <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-[42px] leading-[1.15] text-slate-900 font-normal tracking-[-0.01em]">
                Trusted by 500+ Families
              </h2>

              {/* Subtitle */}
              <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed max-w-[340px] mt-3 font-normal">
                Delivering value through verified properties, expert guidance and long-term relationships.
              </p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 my-7 pt-1">
              {/* Stat 1: Appreciation */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {/* Appreciation Graph Icon */}
                  <svg
                    className="w-5 h-5 text-amber-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 20h18" />
                    <path d="M6 16v4" />
                    <path d="M11 12v8" />
                    <path d="M16 8v12" />
                    <path d="m6 13 5-5 4 4 5-6" />
                    <path d="M16 6h4v4" />
                  </svg>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
                    14.2%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-[1.3] mt-1.5 font-sans">
                  Avg. Appreciation
                  <br />
                  <span className="text-slate-500">(Expressway)</span>
                </div>
              </div>

              {/* Stat 2: Verified Listings */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {/* Verified Shield Icon */}
                  <svg
                    className="w-5 h-5 text-amber-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
                    250+
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-[1.3] mt-1.5 font-sans">
                  Premium Portfolio
                  <br />
                  Listings
                </div>
              </div>

              {/* Stat 3: Client Satisfaction */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  {/* Satisfaction Seal Icon */}
                  <svg
                    className="w-5 h-5 text-amber-600 shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="8.5" />
                    <path d="m9 12 2 2 4-4" />
                    <path d="M12 1.5v2M12 20.5v2M1.5 12h2M20.5 12h2" />
                  </svg>
                  <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-sans">
                    98%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 leading-[1.3] mt-1.5 font-sans">
                  Client
                  <br />
                  Satisfaction
                </div>
              </div>
            </div>

            {/* About Button */}
            <div>
              <a
                href="#services"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-orange-50 border border-amber-600/50 hover:border-amber-600 text-amber-800 text-xs font-semibold tracking-wide transition-all shadow-sm group"
              >
                <span>About KR Estate</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </div>

          {/* ================= CENTER COLUMN: CORRIDOR TWILIGHT SHOWCASE ================= */}
          <div className="lg:col-span-4 relative rounded-[22px] overflow-hidden group min-h-[340px] sm:min-h-[360px] lg:min-h-[380px] border border-amber-500/30 shadow-xl flex flex-col justify-end p-6 sm:p-7">
            {/* Background Corridor Image with smooth transitions */}
            <img
              key={activeCorridor.id}
              src={activeCorridor.image}
              alt={activeCorridor.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 filter brightness-95"
            />

            {/* Gradient Overlays for optimal readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* Bottom Content */}
            <div className="relative z-10 space-y-3">
              <div>
                <h3 className="font-serif-luxury text-2xl sm:text-3xl text-white font-normal tracking-tight leading-tight">
                  {activeCorridor.name}
                </h3>
                <p className="text-xs sm:text-[13px] text-[#E0E8E4]/90 font-normal mt-1 leading-snug">
                  {activeCorridor.subtitle}
                </p>
              </div>

              {/* Watch Drone Tour Button with Radar Halo */}
              <button
                type="button"
                onClick={handlePlayTour}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-md border border-[#C5A059]/75 hover:border-[#C5A059] text-white text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-lg group/btn shine-sweep"
              >
                <div className="relative flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-[#C5A059]/40 animate-radar-halo" />
                  <div className="w-6 h-6 rounded-full bg-black/60 border border-[#C5A059]/60 flex items-center justify-center text-white shrink-0 group-hover/btn:bg-[#C5A059] group-hover/btn:text-black group-hover/btn:border-[#C5A059] transition-all relative z-10">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                </div>
                <span>Watch Drone Tour</span>
              </button>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: KEY GROWTH CORRIDORS CARD ================= */}
          <div className="lg:col-span-4 bg-white/95 backdrop-blur-xl border border-orange-200/80 rounded-[22px] p-6 sm:p-7 flex flex-col justify-between shadow-xl relative overflow-hidden">
            {/* Top gold glow hairline */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent pointer-events-none" />

            <div>
              {/* Header */}
              <div className="text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.22em] text-amber-800 font-sans">
                KEY GROWTH CORRIDORS
              </div>

              {/* Hairline subtle line under header */}
              <div className="h-[1px] bg-orange-200/80 mt-3.5 mb-4" />

              {/* 3 Corridor Items */}
              <div className="space-y-3.5">
                {/* Item 1: Noida Expressway */}
                <div
                  onClick={() => handleCorridorClick(CORRIDORS[0])}
                  className={`flex items-start gap-3.5 p-2 rounded-xl transition-all cursor-pointer group ${
                    selectedCorridorId === 'expressway'
                      ? 'bg-orange-100/60'
                      : 'hover:bg-orange-50/70'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      selectedCorridorId === 'expressway'
                        ? 'border-amber-600 bg-amber-500/20 text-amber-800'
                        : 'border-orange-200 bg-orange-50 text-amber-700 group-hover:border-amber-500 group-hover:bg-amber-100/50'
                    }`}
                  >
                    {/* Expressway Roads SVG */}
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m4 19 4-14h8l4 14" />
                      <line x1="12" y1="5" x2="12" y2="8" />
                      <line x1="12" y1="11" x2="12" y2="14" />
                      <line x1="12" y1="17" x2="12" y2="20" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
                      Noida Expressway
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug truncate sm:whitespace-normal">
                      IT Parks | Corporate Hubs | Premium Residences
                    </p>
                  </div>
                </div>

                {/* Subtle Divider 1 */}
                <div className="h-[1px] bg-orange-200/60" />

                {/* Item 2: Sector 150 Sports City */}
                <div
                  onClick={() => handleCorridorClick(CORRIDORS[1])}
                  className={`flex items-start gap-3.5 p-2 rounded-xl transition-all cursor-pointer group ${
                    selectedCorridorId === 'sec150'
                      ? 'bg-orange-100/60'
                      : 'hover:bg-orange-50/70'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      selectedCorridorId === 'sec150'
                        ? 'border-amber-600 bg-amber-500/20 text-amber-800'
                        : 'border-orange-200 bg-orange-50 text-amber-700 group-hover:border-amber-500 group-hover:bg-amber-100/50'
                    }`}
                  >
                    {/* Sports City Shield SVG */}
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <circle cx="12" cy="11" r="3.2" />
                      <path d="M12 7.8v6.4M8.8 11h6.4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
                      Sector 150 Sports City
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug truncate sm:whitespace-normal">
                      World Class Infrastructure | Sports City | Residences
                    </p>
                  </div>
                </div>

                {/* Subtle Divider 2 */}
                <div className="h-[1px] bg-orange-200/60" />

                {/* Item 3: Jewar Airport */}
                <div
                  onClick={() => handleCorridorClick(CORRIDORS[2])}
                  className={`flex items-start gap-3.5 p-2 rounded-xl transition-all cursor-pointer group ${
                    selectedCorridorId === 'jewar'
                      ? 'bg-orange-100/60'
                      : 'hover:bg-orange-50/70'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      selectedCorridorId === 'jewar'
                        ? 'border-amber-600 bg-amber-500/20 text-amber-800'
                        : 'border-orange-200 bg-orange-50 text-amber-700 group-hover:border-amber-500 group-hover:bg-amber-100/50'
                    }`}
                  >
                    {/* Airplane SVG */}
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 20.5 3c-1-1-3-.5-4.5 1L12.5 7.5 4.3 5.7c-.7-.1-1.3.2-1.6.8l-.2.4c-.3.7 0 1.5.6 1.9l6.5 4.2-3.4 3.4-2.4-.6c-.5-.1-1 .1-1.3.5l-.2.3c-.3.4-.2 1 .2 1.3l2.8 2.3 2.3 2.8c.3.4.9.5 1.3.2l.3-.2c.4-.3.6-.8.5-1.3l-.6-2.4 3.4-3.4 4.2 6.5c.4.6 1.2.9 1.9.6l.4-.2c.6-.3.9-.9.8-1.6z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
                      Jewar Airport
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-snug truncate sm:whitespace-normal">
                      International Airport | Aerocity | Investment Zone
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Link: Explore All Corridors */}
            <div className="pt-4 border-t border-white/[0.08] mt-4">
              <a
                href="#properties"
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#C5A059] hover:text-[#F3D98A] transition-colors group/link"
              >
                <span>Explore All Corridors</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C5A059] group-hover/link:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
