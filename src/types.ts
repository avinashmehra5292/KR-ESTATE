export type PropertyType = 'luxury_apartment' | 'penthouse' | 'villa' | 'commercial' | 'plots';

export type PropertyStatus = 'ready_to_move' | 'under_construction' | 'new_launch';

export interface FloorPlan {
  name: string;
  bedrooms: number;
  bathrooms: number;
  carpetAreaSqFt: number;
  superAreaSqFt: number;
  priceEstimate: string;
}

export interface Property {
  id: string;
  title: string;
  developer?: string;
  tagline?: string;
  sector?: string;
  locality?: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  possessionDate?: string;
  priceDisplay?: string;
  priceNumInCrores?: number;
  pricePerSqFt?: number;
  bhkConfigurations?: string[];
  reraNumber?: string;
  totalAcres?: number;
  openGreensPercentage?: number;
  shortDescription?: string;
  fullDescription?: string;
  amenities?: string[];
  highlights?: string[];
  locationAdvantages?: { label: string; value: string }[];
  floorPlans?: FloorPlan[];
  distanceToMetro?: string;
  distanceToAirport?: string;
  distanceToExpressway?: string;
  coverImage?: string;
  galleryImages?: { url: string; caption: string }[];
  videoTour?: {
    title: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: string;
    description: string;
  } | null;
  architecturalTheme?: {
    gradient: string;
    accentColor: string;
    iconType: 'tower' | 'villa' | 'commercial' | 'tree' | 'sparkle';
  };
}

export interface DroneTour {
  id: string;
  title: string;
  sector: string;
  locality?: string;
  duration: string;
  videoUrl: string;
  fallbackUrl?: string;
  thumbnailUrl: string;
  description: string;
  altitude?: string;
  badge?: string;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface LocalityInfo {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  avgPricePerSqFt: string;
  projectedGrowth3Yr: string;
  highlights: string[];
  metroConnectivity: string;
  landmarkAttractions: string[];
  topProjects: string[];
}

export interface LeadSubmission {
  fullName: string;
  phoneNumber: string;
  email: string;
  interestedProject?: string;
  propertyType?: string;
  budgetRange?: string;
  preferredDate?: string;
  message?: string;
  source: 'site_visit' | 'brochure_download' | 'valuation' | 'general_inquiry';
}

export interface ValuationSubmission {
  ownerName: string;
  phoneNumber: string;
  email: string;
  sector: string;
  societyName: string;
  propertyType: string;
  configuration: string;
  superAreaSqFt: number;
  expectedPrice?: string;
  intent: 'sell' | 'rent' | 'valuation_only';
}

export interface SiteSettings {
  agency: {
    name: string;
    tagline: string;
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    reraNumber: string;
    experienceYears: string;
    domain: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    announcementText: string;
    siteVisitButtonText: string;
    droneTourButtonText: string;
  };
  stats: { value: string; label: string }[];
  seo: {
    title: string;
    metaDescription: string;
    footerCopyright: string;
  };
}

