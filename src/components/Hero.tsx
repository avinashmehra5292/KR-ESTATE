import React, { useState } from 'react';
import { 
  MapPin, 
  Play, 
  Building2, 
  Wallet, 
  ArrowRight, 
  ChevronDown, 
  Briefcase, 
  TrendingUp, 
  Calculator, 
  Sparkles, 
  Scale, 
  Compass 
} from 'lucide-react';

interface HeroProps {
  onSearch: (params: { sector: string; type: string; budget: string }) => void;
  onOpenScheduleModal: () => void;
  onWatchVideo?: (category?: 'drone' | 'property') => void;
  onOpenClientVideoModal?: () => void;
}

const DESKTOP_BLUR = 'data:image/webp;base64,UklGRqgAAABXRUJQVlA4IJwAAABwAwCdASoYAA4APxFysFAsJqSisAgBgCIJZACdMoABjBPgMaAA+4c1RNdMZDC6n+gOhmx701koc81CNwAYCPTp49RHvodDu0n0T2E8q/UiVKpt+mtRr2Hcb0lNki4KkE9Bn16TIh6Je37E1LBWE8McR5ld7IROp3/xs90MwCZhc4quSgrEWxvYizTT3SoPMOdER8Q2k7H/QoGWkAA=';
const MOBILE_BLUR = 'data:image/webp;base64,UklGRoAAAABXRUJQVlA4IHQAAACwAwCdASoOABkAPxFysVAsJqSisAgBgCIJZACdABqjDs15a2SwAAD9l/0wih0l/pEdd10jHZIlBcv+siBBNZ1DpsfHjaseqZxM9YKtVODW9pU53fqFPXmTjoEy0LeM1xyTrc76iuzljE/HM4LDckpSc6+wAA==';

export const Hero: React.FC<HeroProps> = ({
  onSearch,
  onOpenScheduleModal,
  onWatchVideo,
  onOpenClientVideoModal,
}) => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      sector: selectedLocation,
      type: selectedType,
      budget: selectedBudget,
    });
    const el = document.getElementById('properties');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-[calc(100dvh-4rem)] lg:min-h-[calc(100vh-5rem)] flex flex-col justify-between overflow-hidden bg-[#FFF3EB]">
      
      {/* Sunset Luxury Penthouse Balcony Skyline Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none w-full max-w-full">
        {/* Instant 0ms Base64 Warm Blur Placeholder */}
        <div
          className="absolute inset-0 bg-cover bg-center filter blur-xl scale-100 block lg:hidden"
          style={{ backgroundImage: `url("${MOBILE_BLUR}")` }}
        />
        <div
          className="absolute inset-0 bg-cover bg-[center_28%] filter blur-xl scale-105 hidden lg:block"
          style={{ backgroundImage: `url("${DESKTOP_BLUR}")` }}
        />

        <picture className="w-full h-full block relative z-1">
          {/* Mobile, Tablet & Non-PC devices (< 1024px) - WebP primary */}
          <source
            media="(max-width: 1023px)"
            type="image/webp"
            srcSet="/hero-mobile-balcony.webp"
          />
          <source
            media="(max-width: 1023px)"
            type="image/jpeg"
            srcSet="/hero-mobile-balcony.jpg"
          />
          {/* Desktop / PC devices (>= 1024px) - WebP primary */}
          <source
            media="(min-width: 1024px)"
            type="image/webp"
            srcSet="/hero-sunset-balcony.webp"
          />
          <source
            media="(min-width: 1024px)"
            type="image/jpeg"
            srcSet="/hero-sunset-balcony.jpg"
          />
          <img
            src="/hero-sunset-balcony.webp"
            alt="Luxury Noida Sunset Penthouse Balcony View"
            fetchPriority="high"
            loading="eager"
            decoding="async"
            className="w-full h-full object-cover object-[center_35%] lg:object-[center_28%] opacity-100 scale-100 filter brightness-100 contrast-105 transition-opacity duration-500"
          />
        </picture>
        {/* Soft, light translucent gradient allowing the full sunset skyline & penthouse balcony image to remain crisp and clearly visible */}
        <div className="absolute inset-0 z-2 bg-gradient-to-b from-white/70 via-white/35 to-transparent lg:bg-gradient-to-r lg:from-white/60 lg:via-white/15 lg:to-transparent" />
        <div className="absolute bottom-0 inset-x-0 z-2 h-20 sm:h-28 bg-gradient-to-t from-[#FFF3EB] to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-2 sm:pt-6 lg:pt-8 pb-2 sm:pb-5 lg:pb-8 w-full max-w-full flex-1 flex flex-col justify-between">
        
        {/* Top Split: Left Editorial & Right Floating Info Badges */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-6 lg:gap-8 items-start pt-1 sm:pt-4 lg:pt-6">
          
          {/* Left Column: Heading, Advisory, Drone Tour */}
          <div className="lg:col-span-7 space-y-2 sm:space-y-4 lg:space-y-5">
            
            {/* Eyebrow Label with Beacon */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-orange-200/80 shadow-xs text-[10px] sm:text-xs font-bold tracking-[0.2em] uppercase text-amber-900 font-mono shine-sweep">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>PREMIER REAL ESTATE ADVISORY</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-2xl sm:text-5xl lg:text-[64px] font-bold text-slate-950 leading-[1.15] sm:leading-[1.12] tracking-tight drop-shadow-xs">
              <span className="block sm:inline">Exceptional Residences &amp; </span>
              <span className="font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800">
                High-Yield Assets
              </span>
            </h1>

            {/* Location Tag & 4K Drone Tour Button in a compact row on mobile */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-0.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-orange-200/70 shadow-xs text-amber-900 font-semibold text-[11px] sm:text-sm">
                <MapPin className="w-3.5 h-3.5 fill-amber-700/20 text-amber-700 shrink-0" />
                <span>Across Noida Corridor</span>
              </div>

              {/* Drone Tours & Aerial Showcase Button with Animated Radar Halo */}
              <button
                type="button"
                onClick={() => onWatchVideo && onWatchVideo('drone')}
                className="inline-flex items-center gap-2 sm:gap-2.5 text-slate-950 hover:text-amber-800 bg-white/90 hover:bg-white backdrop-blur-md px-3 py-1 sm:px-4 sm:py-1.5 rounded-full border border-orange-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer group shine-sweep"
                title="Drone Tours & Aerial Showcase: Noida Expressway & Sector 150 (02:45)"
              >
                <span className="relative flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-radar-halo" />
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-amber-500 bg-amber-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-xs relative z-10">
                    <Compass className="w-3.5 h-3.5 text-amber-600 group-hover:text-slate-950 transition-colors" />
                  </span>
                </span>
                <span className="text-[11px] sm:text-xs font-bold tracking-wide">
                  Drone Tours &amp; Aerial Showcase
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200/80 font-bold hidden xs:inline">
                  02:45
                </span>
              </button>
            </div>

            {/* Subtitle Paragraph */}
            <p className="text-slate-900 text-[11px] sm:text-[13px] leading-snug sm:leading-relaxed max-w-xl font-medium bg-white/70 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-white/80 shadow-xs hidden xs:block">
              Curated portfolios. Direct developer pricing. Zero brokerage.<br className="hidden sm:inline" />
              Your trusted partner in Noida, Expressway &amp; Jewar.
            </p>

          </div>

          {/* Right Column: Floating Badges over Sunset Skyline (shown on tablet & desktop) */}
          <div className="hidden md:flex lg:col-span-5 flex-col items-start lg:items-end justify-start gap-3 sm:gap-4 pt-2 lg:pt-16">
            
            {/* Badge 1: Noida Expressway - Gentle Float */}
            <div className="animate-float bg-white/95 backdrop-blur-md border border-orange-200/80 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg min-w-[220px] sm:min-w-[240px] hover:border-amber-400 hover:shadow-amber-500/10 transition-all cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                  Noida Expressway
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </div>
              <div className="text-[11px] sm:text-xs font-bold text-emerald-700 mt-0.5">
                +14.2% YoY Appreciation
              </div>
            </div>

            {/* Badge 2: Jewar Airport Aerocity - Delayed Float */}
            <div className="animate-float-delayed bg-white/95 backdrop-blur-md border border-orange-200/80 rounded-xl px-4 sm:px-5 py-2.5 sm:py-3 shadow-lg min-w-[220px] sm:min-w-[240px] hover:border-amber-400 hover:shadow-amber-500/10 transition-all cursor-default">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-wide">
                  Jewar Airport Aerocity
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-amber-800 mt-0.5">
                Pre-Launch Allotments Open
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Floating Search Dock & 6 Quick Navigation Categories */}
        <div className="mt-2 sm:mt-6 lg:mt-8 space-y-2 sm:space-y-4 w-full max-w-full overflow-hidden">
          
          {/* Glass Search Bar */}
          <div className="w-full bg-white/95 backdrop-blur-xl border border-orange-200/80 rounded-xl sm:rounded-2xl p-2 sm:p-3.5 shadow-xl shadow-amber-950/5">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 items-center">
              
              {/* Location Select */}
              <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-orange-50/60 border border-orange-200/80 hover:border-orange-300 transition-all relative">
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[9px] uppercase tracking-wider text-slate-600 font-semibold">
                    Location
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-3"
                  >
                    <option value="all" className="bg-white text-slate-900">All Noida Locations</option>
                    <option value="Sector 43" className="bg-white text-slate-900">Sector 43 · Central Noida</option>
                    <option value="Sector 124" className="bg-white text-slate-900">Sector 124 · Expressway</option>
                    <option value="Sector 144" className="bg-white text-slate-900">Sector 144 · Expressway</option>
                    <option value="Jewar Corridor" className="bg-white text-slate-900">Jewar Corridor</option>
                  </select>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
              </div>

              {/* Property Type Select */}
              <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-orange-50/60 border border-orange-200/80 hover:border-orange-300 transition-all relative">
                <Building2 className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[9px] uppercase tracking-wider text-slate-600 font-semibold">
                    Property Type
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-3"
                  >
                    <option value="all" className="bg-white text-slate-900">All Categories</option>
                    <option value="luxury_apartment" className="bg-white text-slate-900">Luxury Residences</option>
                    <option value="penthouse" className="bg-white text-slate-900">Sky Mansions &amp; Penthouses</option>
                    <option value="commercial" className="bg-white text-slate-900">Commercial &amp; Retail</option>
                    <option value="plots" className="bg-white text-slate-900">Freehold Plots</option>
                  </select>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
              </div>

              {/* Budget Range Select */}
              <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-orange-50/60 border border-orange-200/80 hover:border-orange-300 transition-all relative">
                <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label className="block text-[9px] uppercase tracking-wider text-slate-600 font-semibold">
                    Budget Range
                  </label>
                  <select
                    value={selectedBudget}
                    onChange={(e) => setSelectedBudget(e.target.value)}
                    className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-slate-900 focus:outline-none appearance-none cursor-pointer pr-3"
                  >
                    <option value="all" className="bg-white text-slate-900">Any Budget</option>
                    <option value="under_1cr" className="bg-white text-slate-900">Under ₹1.00 Cr</option>
                    <option value="1cr_3cr" className="bg-white text-slate-900">₹1.00 Cr - ₹3.00 Cr</option>
                    <option value="3cr_6cr" className="bg-white text-slate-900">₹3.00 Cr - ₹6.00 Cr</option>
                    <option value="above_6cr" className="bg-white text-slate-900">₹6.00 Cr+</option>
                  </select>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-500 absolute right-2 pointer-events-none" />
              </div>

              {/* CTA Button: Find Properties with Light Beam Shimmer */}
              <button
                type="submit"
                className="w-full min-h-[40px] sm:min-h-[46px] rounded-lg sm:rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shine-sweep group"
              >
                <span>Find Properties</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>

            </form>
          </div>

          {/* Row of 6 Quick Action Round Icons: Sleek horizontal scroll on mobile, responsive grid on desktop */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 sm:grid sm:grid-cols-3 lg:grid-cols-6 pt-0.5 pb-1 w-full max-w-full">
            {[
              {
                icon: Briefcase,
                label: 'Curated Portfolios',
                action: () => scrollToSection('properties'),
              },
              {
                icon: TrendingUp,
                label: 'Growth Corridors',
                action: () => scrollToSection('impact'),
              },
              {
                icon: Calculator,
                label: 'Loan & EMI Calculator',
                action: () => scrollToSection('services'),
              },
              {
                icon: Sparkles,
                label: 'AI Concierge',
                action: () => scrollToSection('services'),
              },
              {
                icon: Scale,
                label: 'Sell / Valuation',
                action: () => scrollToSection('services'),
              },
              {
                icon: Compass,
                label: 'Private Tours',
                action: onOpenScheduleModal,
              },
            ].map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={item.action}
                className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl bg-white/90 hover:bg-white border border-orange-200/80 hover:border-amber-400 transition-all text-left cursor-pointer group shadow-xs shrink-0 whitespace-nowrap hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0 group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                  <item.icon className="w-3 h-3 group-hover:rotate-6 transition-transform" />
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-700 group-hover:text-amber-800 transition-colors leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

        </div>

      </div>

    </section>
  );
};
