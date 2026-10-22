import React, { useState, useMemo } from 'react';
import { Property } from '../types';
import { PropertyCard } from './PropertyCard';
import { Search, SlidersHorizontal, ChevronDown, RotateCcw } from 'lucide-react';

interface PropertyGridProps {
  properties: Property[];
  onSelectProperty: (property: Property) => void;
  onScheduleVisit: (propertyName: string) => void;
  onWatchVideo?: (property: Property, video?: any) => void;
  searchFilterParams?: { sector: string; type: string; budget: string };
  onResetFilters?: () => void;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'All Listings' },
  { id: 'luxury_condos', label: 'Luxury Condos' },
  { id: 'expressway_hub', label: 'Expressway Hub' },
  { id: 'commercial_retail', label: 'Commercial Retail' },
  { id: 'airport_plots', label: 'Airport Plots & Villas' },
];

export const PropertyGrid: React.FC<PropertyGridProps> = ({
  properties,
  onSelectProperty,
  onScheduleVisit,
  onWatchVideo,
  searchFilterParams,
  onResetFilters,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('featured');

  // Filter properties by category, search query, and external props
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    // Category Tab filtering
    if (activeTab === 'luxury_condos') {
      result = result.filter(
        (p) => p.propertyType === 'luxury_apartment' || p.propertyType === 'penthouse'
      );
    } else if (activeTab === 'expressway_hub') {
      result = result.filter(
        (p) =>
          p.locality?.toLowerCase().includes('expressway') ||
          p.sector?.toLowerCase().includes('150') ||
          p.sector?.toLowerCase().includes('128') ||
          p.sector?.toLowerCase().includes('124')
      );
    } else if (activeTab === 'commercial_retail') {
      result = result.filter((p) => p.propertyType === 'commercial');
    } else if (activeTab === 'airport_plots') {
      result = result.filter(
        (p) =>
          p.propertyType === 'plots' ||
          p.propertyType === 'villa' ||
          p.locality?.toLowerCase().includes('yamuna') ||
          p.title?.toLowerCase().includes('jewar')
      );
    }

    // Hero search parameters (if applied)
    if (searchFilterParams) {
      if (searchFilterParams.sector && searchFilterParams.sector !== 'all') {
        const sec = searchFilterParams.sector.toLowerCase();
        result = result.filter(
          (p) =>
            p.sector?.toLowerCase().includes(sec) ||
            p.locality?.toLowerCase().includes(sec) ||
            p.title?.toLowerCase().includes(sec)
        );
      }
      if (searchFilterParams.budget && searchFilterParams.budget !== 'all') {
        result = result.filter(p => {
          const price = p.priceNumInCrores;
          if (price == null || price <= 0) return false;
          switch (searchFilterParams.budget) {
            case 'under_1cr': return price < 1;
            case '1cr_3cr': return price >= 1 && price < 3;
            case '3cr_6cr': return price >= 3 && price < 6;
            case 'above_6cr': return price >= 6;
            default: return true;
          }
        });
      }
      if (searchFilterParams.type && searchFilterParams.type !== 'all') {
        result = result.filter((p) => p.propertyType === searchFilterParams.type);
      }
    }

    // Free-form Search Input
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.developer?.toLowerCase().includes(q) ||
          p.sector?.toLowerCase().includes(q) ||
          p.locality?.toLowerCase().includes(q) ||
          p.tagline?.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.priceNumInCrores || 0) - (b.priceNumInCrores || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.priceNumInCrores || 0) - (a.priceNumInCrores || 0));
    } else if (sortBy === 'greens') {
      result.sort((a, b) => (b.openGreensPercentage || 0) - (a.openGreensPercentage || 0));
    }

    return result;
  }, [properties, activeTab, searchQuery, sortBy, searchFilterParams]);

  const handleReset = () => {
    setActiveTab('all');
    setSearchQuery('');
    setSortBy('featured');
    if (onResetFilters) onResetFilters();
  };

  return (
    <section 
      id="properties" 
      className="estate-portfolio py-12 sm:py-16 lg:py-24 bg-[#FBE8DC] text-slate-900 border-b border-orange-200/60 relative overflow-hidden w-full max-w-full"
    >
      {/* Subtle ambient lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[600px] h-[350px] bg-amber-400/10 blur-[140px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] bg-orange-300/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        
        {/* ================= SECTION HEADER ================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 mb-1.5 sm:mb-2 font-mono">
              THE PROPERTY COLLECTION
            </div>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]">
              Distinctive homes. Exceptional possibilities.
            </h2>
            <p className="text-slate-700 text-xs sm:text-sm mt-1.5 sm:mt-2 max-w-3xl leading-relaxed">
              Explore residences, commercial spaces and plots across Noida and the Jewar corridor. Find the space that fits your next chapter.
            </p>
          </div>

          {/* Listings Counter Badge */}
          <div className="text-xs text-slate-600 font-medium shrink-0 self-start md:self-end">
            Showing{' '}
            <span className="text-amber-800 font-bold font-mono text-sm">
              {filteredProperties.length}
            </span>{' '}
            of {properties.length} listings
          </div>
        </div>

        {/* ================= FILTER & SEARCH TOOLBAR ================= */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-10 pb-2 w-full max-w-full">
          
          {/* Left Category Tabs (Pills) */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 w-full max-w-full">
            {CATEGORY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={isActive}
                  className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-white/85 hover:bg-white text-slate-700 hover:text-slate-950 border border-orange-200/80 shadow-sm'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Search Input & Sorters */}
          <div className="flex items-center gap-2.5 estate-listing-controls self-start xl:self-auto shrink-0 w-full sm:w-auto">
            {/* Search Input Box */}
            <div className="relative flex-1 sm:flex-initial">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search builder, sector..."
                aria-label="Search properties"
                className="w-full sm:w-60 pl-3.5 pr-8 py-2 text-xs rounded-full bg-white border border-orange-200/80 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter icon reset */}
            {(searchQuery || activeTab !== 'all' || (searchFilterParams && Object.values(searchFilterParams).some(value => value !== 'all'))) && (
              <button
                type="button"
                onClick={handleReset}
                title="Reset all filters"
                className="p-2 rounded-full bg-white hover:bg-orange-50 border border-orange-200/80 text-amber-700 hover:text-amber-800 transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Filter Slider icon */}
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              title="Show all filters"
              className="p-2 rounded-full bg-white hover:bg-orange-50 border border-orange-200/80 text-amber-700 hover:text-amber-800 transition-colors cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                aria-label="Sort properties"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3.5 pr-8 py-2 text-xs font-semibold rounded-full bg-white border border-orange-200/80 text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-sm"
              >
                <option value="featured">Featured Curations</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="greens">Highest Greens %</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* ================= 3-COLUMN PROPERTY CARDS GRID ================= */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {filteredProperties.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onSelectProperty={onSelectProperty}
                onScheduleVisit={onScheduleVisit}
                onWatchVideo={onWatchVideo}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white/95 rounded-3xl border border-orange-200/80 space-y-4 max-w-xl mx-auto shadow-xl">
            <h3 className="font-serif-luxury text-xl font-bold text-slate-900">No properties match your filter</h3>
            <p className="text-xs text-slate-600">
              Try adjusting your search criteria or resetting filters to see all available properties.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
