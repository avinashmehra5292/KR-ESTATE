import React from 'react';
import { Property } from '../types';
import { SafeImage } from './SafeImage';
import { Camera, Play, ArrowUpRight } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onSelectProperty: (property: Property) => void;
  onScheduleVisit: (propertyName: string) => void;
  onWatchVideo?: (property: Property, video?: any) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onSelectProperty,
  onScheduleVisit,
  onWatchVideo,
}) => {
  const photoCount = property.galleryImages?.length || (property.coverImage ? 1 : 5);

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onWatchVideo && property.videoTour) {
      onWatchVideo(property, property.videoTour);
    } else {
      onSelectProperty(property);
    }
  };

  const handleSpecsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectProperty(property);
  };

  const handleVisitClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onScheduleVisit(property.title);
  };

  return (
    <article 
      onClick={() => onSelectProperty(property)}
      className="estate-property-card group interactive-card flex flex-col rounded-2xl sm:rounded-3xl border border-orange-200/70 bg-white/95 backdrop-blur-xl hover:border-amber-500/60 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-2 cursor-pointer relative"
    >
      {/* ================= TOP PHOTO BANNER ================= */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
        <SafeImage
          src={property.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'}
          alt={property.title}
          aspectRatioClass="h-full w-full"
          fallbackGradient={property.architecturalTheme?.gradient}
          iconType={property.architecturalTheme?.iconType}
          title={property.title}
          className="group-hover:scale-108 transition-transform duration-700 ease-out object-cover w-full h-full"
        />

        {/* Contrast Scrim Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* Top Badges (Developer & Possession) */}
        <div className="absolute top-3 inset-x-3 z-10 flex items-center justify-between text-xs pointer-events-none">
          <span className="font-bold text-amber-300 tracking-wider uppercase text-[10px] sm:text-[11px] bg-black/65 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30 shadow-md">
            {property.developer || 'Curated Landmark'}
          </span>
          {property.possessionDate && (
            <span className="text-slate-100 font-medium text-[10px] sm:text-[11px] bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-md">
              {property.possessionDate}
            </span>
          )}
        </div>

        {/* Bottom Media Badges (Photos, Video Tour & Gallery link) */}
        <div className="absolute bottom-3 inset-x-3 z-10 flex items-end justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-white bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 shadow-sm">
              <Camera className="h-3 w-3 text-white" />
              <span>{photoCount} Photos</span>
            </span>

            {property.videoTour && (
              <button
                type="button"
                onClick={handleVideoClick}
                className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 px-3 py-1 rounded-full transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95 group/btn"
              >
                <Play className="h-3 w-3 fill-current group-hover/btn:scale-115 transition-transform" />
                <span>Video Tour</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleSpecsClick}
            className="text-xs text-amber-300 font-semibold flex items-center gap-1 hover:text-amber-200 transition-colors cursor-pointer drop-shadow group/gallery"
          >
            <span>Gallery</span>
            <ArrowUpRight className="h-3.5 w-3.5 group-hover/gallery:translate-x-0.5 group-hover/gallery:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* ================= CARD BODY ================= */}
      <div className="flex flex-1 flex-col p-4 sm:p-6 justify-between space-y-3.5 sm:space-y-4">
        
        <div>
          {/* Sector & BHK Subtitle */}
          <div className="flex items-center gap-2 text-xs mb-1.5 font-medium">
            <span className="text-amber-800 font-bold">{property.sector || property.locality || 'Noida'}</span>
            {property.bhkConfigurations && property.bhkConfigurations.length > 0 && (
              <>
                <span aria-hidden="true" className="text-slate-400">·</span>
                <span className="text-slate-600">{property.bhkConfigurations.join(' / ')}</span>
              </>
            )}
          </div>

          {/* Primary Title */}
          <h3 className="font-serif-luxury text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-amber-800 transition-colors tracking-tight">
            <button type="button" onClick={handleSpecsClick} className="text-left cursor-pointer">{property.title}</button>
          </h3>

          {/* Short Description */}
          <p className="mt-2 text-xs sm:text-[13px] text-slate-600 line-clamp-2 leading-relaxed">
            {property.shortDescription || property.tagline || (property.fullDescription ? property.fullDescription.slice(0, 120) + '...' : 'Premium curated landmark on the Noida corridor with luxury architecture and lifestyle amenities.')}
          </p>
        </div>

        {/* 3-Row Invariant Specs Table */}
        <div className="estate-property-specs space-y-2 py-3 border-y border-orange-200/60 text-xs">
          {/* Row 1: Metro */}
          <div className="flex items-center justify-between text-slate-600">
            <span>Metro Transit</span>
            <span className="font-semibold text-slate-900">{property.distanceToMetro || '900 Meters (Botanical Garden Metro)'}</span>
          </div>

          {/* Row 2: Airport */}
          <div className="flex items-center justify-between text-slate-600">
            <span>Jewar Airport</span>
            <span className="font-semibold text-slate-900">{property.distanceToAirport || '42 Mins (Jewar International Airport)'}</span>
          </div>

          {/* Row 3: RERA */}
          <div className="flex items-center justify-between text-slate-600">
            <span>RERA Registered</span>
            <span className="font-mono text-emerald-800 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
              {property.reraNumber || 'UPRERAPRJ704730'}
            </span>
          </div>
        </div>

        {/* Pricing & CTA Zone */}
        <div className="estate-property-pricing pt-1 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
              STARTING FROM
            </span>
            <span className="font-mono font-bold text-base sm:text-lg text-amber-800 tabular-nums">
              {property.priceDisplay || (property.priceNumInCrores ? `₹${property.priceNumInCrores} Cr` : 'Price on Request')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVisitClick}
              className="px-4 py-2 rounded-full estate-nav-cta hover:brightness-105 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap hover:scale-105 active:scale-95 shine-sweep"
            >
              Book Visit
            </button>
            <button
              type="button"
              onClick={handleSpecsClick}
              className="px-4 py-2 rounded-full bg-orange-50 hover:bg-orange-100 text-slate-800 font-semibold text-xs border border-orange-200/80 transition-all cursor-pointer whitespace-nowrap shadow-xs hover:scale-102"
            >
              Specs
            </button>
          </div>
        </div>

      </div>
    </article>
  );
};
