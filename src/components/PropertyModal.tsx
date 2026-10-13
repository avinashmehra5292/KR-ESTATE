import React, { useState, useEffect } from 'react';
import { Property, FloorPlan } from '../types';
import { SafeImage } from './SafeImage';
import { X, Check, FileDown, Calendar, Play, ChevronLeft, ChevronRight, Maximize2, Camera } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

interface PropertyModalProps {
  property: Property | null;
  onClose: () => void;
  onOpenScheduleModal: (projectName: string) => void;
  onWatchVideo?: (video: any) => void;
}

export const PropertyModal: React.FC<PropertyModalProps> = ({
  property,
  onClose,
  onOpenScheduleModal,
  onWatchVideo
}) => {
  const { settings } = useSiteSettings();
  const [selectedPlanTab, setSelectedPlanTab] = useState<number>(0);
  const [activePhotoIdx, setActivePhotoIdx] = useState<number>(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [brochureRequested, setBrochureRequested] = useState(false);
  const [brochureName, setBrochureName] = useState('');
  const [brochureEmail, setBrochureEmail] = useState('');
  const [brochurePhone, setBrochurePhone] = useState('');
  const [brochureComment, setBrochureComment] = useState('');
  const [brochureLoading, setBrochureLoading] = useState(false);
  const [brochureSuccess, setBrochureSuccess] = useState(false);

  const fallbackLuxuryImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';
  const gallery = property?.galleryImages && property.galleryImages.length > 0 
    ? property.galleryImages 
    : property ? [{ url: property.coverImage || fallbackLuxuryImage, caption: property.title }] : [];

  const currentPhoto = gallery[activePhotoIdx] || gallery[0] || { url: fallbackLuxuryImage, caption: property?.title || 'Property Elevation' };

  // Keyboard navigation for carousel & lightbox
  useEffect(() => {
    if (!property) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
      } else if (e.key === 'ArrowRight') {
        setActivePhotoIdx((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'Escape') {
        if (isLightboxOpen) {
          setIsLightboxOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gallery.length, isLightboxOpen, onClose, property]);

  if (!property) return null;

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIdx((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
  };

  const handleBrochureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brochureName.trim() || !brochurePhone.trim() || !brochureEmail.trim()) return;

    setBrochureLoading(true);

    const message = `*New PDF Brochure & Cost Sheet Request*

*Property:* ${property.title}
*Location:* ${property.sector || 'Noida'}${property.locality ? `, ${property.locality}` : ''}
*Developer:* ${property.developer || 'Direct Builder'}
*Price Range:* ${property.priceDisplay || 'Price on Request'}

*Customer Information:*
• *Name:* ${brochureName.trim()}
• *Mobile Number:* ${brochurePhone.trim()}
• *Email:* ${brochureEmail.trim()}
• *Comment / Requirement:* ${brochureComment.trim() || 'Please share complete digital brochure, payment schedule, and cost sheet.'}

_Source: ${settings.agency.name || 'KR Estate Noida'} (${settings.agency.domain || 'krestatenoida.com'})_`;

    const cleanPhone = (settings.agency.phone || '+91 78704 33580').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    try {
      await fetch('/api/request-brochure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: brochureName.trim(),
          email: brochureEmail.trim(),
          phone: brochurePhone.trim(),
          comment: brochureComment.trim(),
          propertyId: property.id,
          propertyTitle: property.title,
          sector: property.sector,
          developer: property.developer,
          priceDisplay: property.priceDisplay,
        })
      });
    } catch (err) {
      console.error('Failed to log brochure request on server:', err);
    }

    setBrochureLoading(false);
    setBrochureSuccess(true);
  };

  const activePlan: FloorPlan | undefined = property.floorPlans 
    ? (property.floorPlans[selectedPlanTab] || property.floorPlans[0]) 
    : undefined;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
        <div 
          className="relative w-full max-w-7xl h-[92vh] sm:h-[95vh] max-h-[96vh] flex flex-col lg:flex-row rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-[#0A0E18] shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-amber-500/20 overflow-hidden text-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ======================================================== */}
          {/* LEFT COLUMN: Property Details & Specifications           */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[50%] xl:w-[52%] flex flex-col h-full bg-[#0A0E18] order-2 lg:order-1 overflow-hidden border-t lg:border-t-0 lg:border-r border-slate-800">
            
            {/* Scrollable Details Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-7 lg:p-8 space-y-5 sm:space-y-7">
              
              {/* Property Title & Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <span className="text-amber-400 text-xs font-bold uppercase tracking-wider block mb-2 drop-shadow-sm">
                    {[property.developer, property.sector || property.locality].filter(Boolean).join(' · ') || 'Exclusive Noida Listing'}
                  </span>
                  <h1 className="font-serif-luxury text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-tight uppercase">
                    {property.title}
                  </h1>
                </div>
                <div className="bg-[#111728]/90 px-4 py-3 sm:px-5 sm:py-4 rounded-2xl border border-amber-500/30 shadow-lg shadow-amber-500/5 shrink-0 self-start sm:self-auto">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5 font-semibold">Investment</span>
                  <span className="font-mono text-xl sm:text-2xl font-bold text-amber-400 tabular-nums drop-shadow-sm">
                    {property.priceDisplay || (property.priceNumInCrores ? `₹${property.priceNumInCrores} Cr` : 'Price on Request')}
                  </span>
                </div>
              </div>

              {/* 01. Executive Overview */}
              {property.fullDescription && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                    01. Project Architecture & Overview
                  </h3>
                  <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                    {property.fullDescription}
                  </p>
                </div>
              )}

              {/* 02. Key Specifications Bento */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2.5">
                  02. Project Invariants & Metrics
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#111728]/80 border border-slate-800/80 shadow-xs hover:border-amber-400/30 transition-colors">
                    <span className="text-xs text-slate-400 block mb-1">Total Campus</span>
                    <span className="font-mono text-base sm:text-lg font-bold text-white">{property.totalAcres ? `${property.totalAcres} Acres` : 'Bespoke Plot'}</span>
                  </div>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#111728]/80 border border-slate-800/80 shadow-xs hover:border-emerald-500/30 transition-colors">
                    <span className="text-xs text-slate-400 block mb-1">Open Greens</span>
                    <span className="font-mono text-base sm:text-lg font-bold text-emerald-400">{property.openGreensPercentage ? `${property.openGreensPercentage}% Green` : 'Landscaped'}</span>
                  </div>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#111728]/80 border border-slate-800/80 shadow-xs hover:border-amber-400/30 transition-colors">
                    <span className="text-xs text-slate-400 block mb-1">Rate / Sq.Ft</span>
                    <span className="font-mono text-base sm:text-lg font-bold text-amber-400">{property.pricePerSqFt ? `₹${property.pricePerSqFt.toLocaleString('en-IN')}` : 'On Request'}</span>
                  </div>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#111728]/80 border border-slate-800/80 shadow-xs hover:border-emerald-500/30 transition-colors">
                    <span className="text-xs text-slate-400 block mb-1">RERA Number</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 truncate block mt-0.5">{property.reraNumber || 'Verified Registration'}</span>
                  </div>
                </div>
              </div>

              {/* Video Walkthrough Callout Banner */}
              {property.videoTour && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#111728] to-[#111728] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                      <Play className="h-5 w-5 fill-current translate-x-0.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">
                        {property.videoTour.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {property.videoTour.description}
                      </p>
                    </div>
                  </div>

                  {onWatchVideo && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onWatchVideo(property.videoTour);
                      }}
                      className="px-4 py-2 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto shadow-md"
                    >
                      Play Drone Flythrough
                    </button>
                  )}
                </div>
              )}

              {/* 03. Floor Plans Interactive Section */}
              {property.floorPlans && property.floorPlans.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      03. Floor Plans & Layout Dimensions
                    </h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 p-1.5 bg-[#111728] rounded-full border border-slate-800 mb-3 shadow-xs">
                    {property.floorPlans.map((plan, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPlanTab(index)}
                        className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer whitespace-nowrap ${
                          selectedPlanTab === index
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {plan.name}
                      </button>
                    ))}
                  </div>

                  {activePlan && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-[#111728]/80 border border-slate-800 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div>
                        <span className="text-xs text-slate-400 block mb-1">Configuration</span>
                        <span className="font-medium text-white text-sm sm:text-base">
                          {activePlan.bedrooms > 0 ? `${activePlan.bedrooms} BHK (${activePlan.bathrooms} Baths)` : 'Commercial Suite'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block mb-1">Area Breakdown</span>
                        <span className="font-mono text-white text-sm sm:text-base">
                          {activePlan.carpetAreaSqFt} Carpet / {activePlan.superAreaSqFt} Super Sq.Ft
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block mb-1">Estimated Investment</span>
                        <span className="font-mono text-amber-400 text-base sm:text-lg font-bold">
                          {activePlan.priceEstimate}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 04. Location Advantage & Strategic Transit */}
              {((property.locationAdvantages && property.locationAdvantages.length > 0) ||
                (property.distanceToMetro || property.distanceToAirport || property.distanceToExpressway) ||
                (property.highlights && property.highlights.length > 0)) && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-2.5">
                    04. Location Advantage & Strategic Transit
                  </h3>

                  {property.locationAdvantages && property.locationAdvantages.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {property.locationAdvantages.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-[#111728]/80 border border-slate-800 shadow-xs hover:border-amber-400/40 transition-colors">
                          {item.label && (
                            <span className="text-xs font-semibold text-amber-400/90 uppercase tracking-wider block mb-1">
                              {item.label}
                            </span>
                          )}
                          <span className="text-xs sm:text-sm font-medium text-slate-200 leading-snug break-words">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {(property.distanceToMetro || property.distanceToAirport || property.distanceToExpressway) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                          {property.distanceToMetro && (
                            <div className="p-3.5 rounded-xl bg-[#111728]/80 border border-slate-800 shadow-xs">
                              <span className="text-xs text-slate-400 block mb-0.5">Metro Network</span>
                              <span className="text-xs sm:text-sm font-medium text-slate-200">{property.distanceToMetro}</span>
                            </div>
                          )}
                          {property.distanceToAirport && (
                            <div className="p-3.5 rounded-xl bg-[#111728]/80 border border-slate-800 shadow-xs">
                              <span className="text-xs text-slate-400 block mb-0.5">Jewar International Airport</span>
                              <span className="text-xs sm:text-sm font-medium text-slate-200">{property.distanceToAirport}</span>
                            </div>
                          )}
                          {property.distanceToExpressway && (
                            <div className="p-3.5 rounded-xl bg-[#111728]/80 border border-slate-800 shadow-xs">
                              <span className="text-xs text-slate-400 block mb-0.5">Expressway Access</span>
                              <span className="text-xs sm:text-sm font-medium text-slate-200">{property.distanceToExpressway}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {property.highlights && property.highlights.length > 0 && (
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-300 bg-[#111728]/80 p-3.5 rounded-xl border border-slate-800 shadow-xs">
                          {property.highlights.map((highlight, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                              <span className="leading-snug break-words">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 05. Curated Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-400 mb-2.5">
                    05. Lifestyle Amenities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {property.amenities.map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-[#111728]/80 border border-slate-800 shadow-xs text-xs text-slate-200">
                        <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                        <span className="leading-snug break-words">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instant Brochure Download */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#12192c] to-[#0A0E18] border border-amber-500/30 shadow-lg">
                {!brochureRequested ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-semibold text-white text-base flex items-center gap-2">
                        <FileDown className="h-5 w-5 text-amber-400" />
                        Complete Digital Brochure & Cost Sheet
                      </h4>
                      <p className="text-xs text-slate-300 mt-1">
                        Download official payment schedule, high-resolution layout catalogue, and developer approvals.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrochureRequested(true)}
                      className="px-4 py-2.5 rounded-xl gold-gradient-btn text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all whitespace-nowrap self-start sm:self-auto shadow-md"
                    >
                      <FileDown className="h-4 w-4" />
                      <span>Request PDF Brochure</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div>
                        <h4 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2">
                          <FileDown className="h-5 w-5 text-amber-400" />
                          Request Complete Digital Brochure & Cost Sheet
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Instant WhatsApp alert will be sent to the KR Estate advisor desk for <strong>{property.title}</strong>.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBrochureRequested(false);
                          setBrochureSuccess(false);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        title="Close form"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {brochureSuccess ? (
                      <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-2.5">
                        <div className="flex items-start gap-2.5">
                          <Check className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-emerald-300">
                              Brochure Request Sent Successfully!
                            </p>
                            <p className="text-[11px] text-emerald-200 mt-0.5 leading-relaxed">
                              Your request for <strong>{property.title}</strong> has been forwarded to the owner's WhatsApp desk (<strong>{settings.agency.phone || '+91 78704 33580'}</strong>). The owner/advisory team will contact you directly via phone at <strong>{brochurePhone}</strong> or email at <strong>{brochureEmail}</strong>.
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-emerald-500/30">
                          <a
                            href={`https://wa.me/${(settings.agency.phone || '+91 78704 33580').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`*Brochure Request Follow-up*\nProperty: ${property.title}\nName: ${brochureName}\nMobile: ${brochurePhone}\nEmail: ${brochureEmail}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                          >
                            <span>Open WhatsApp Chat</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setBrochureRequested(false);
                              setBrochureSuccess(false);
                              setBrochureName('');
                              setBrochureEmail('');
                              setBrochurePhone('');
                              setBrochureComment('');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-medium hover:bg-slate-800 cursor-pointer"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleBrochureSubmit} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Name */}
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Your Name <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Rahul Sharma"
                              value={brochureName}
                              onChange={(e) => setBrochureName(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0A0E18] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                            />
                          </div>

                          {/* Email */}
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Email Address <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. rahul@example.com"
                              value={brochureEmail}
                              onChange={(e) => setBrochureEmail(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0A0E18] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                            />
                          </div>

                          {/* Contact Number */}
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                              Contact Number <span className="text-rose-400">*</span>
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. +91 98765 43210"
                              value={brochurePhone}
                              onChange={(e) => setBrochurePhone(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-[#0A0E18] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                            />
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                            Comment / Specific Requirements (Optional)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Looking for high floor unit with payment plan details..."
                            value={brochureComment}
                            onChange={(e) => setBrochureComment(e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-[#0A0E18] border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 transition-all"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800">
                          <p className="text-[11px] text-slate-400">
                            Instant WhatsApp message to owner · Direct callback on mobile & email
                          </p>
                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setBrochureRequested(false)}
                              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={brochureLoading}
                              className="px-4 py-2 text-xs font-bold text-slate-950 gold-gradient-btn disabled:opacity-50 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                            >
                              <FileDown className="h-4 w-4" />
                              <span>{brochureLoading ? 'Sending...' : 'Send Request via WhatsApp'}</span>
                            </button>
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Sticky Bottom Action Footer (inside details column) */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-800 bg-[#080B13]/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] z-10">
              <div>
                <span className="text-[11px] text-slate-400 block font-medium">KR Estate Exclusive Pricing</span>
                <span className="font-mono font-bold text-amber-400 text-base sm:text-lg tabular-nums drop-shadow-sm">
                  {property.priceDisplay || (property.priceNumInCrores ? `₹${property.priceNumInCrores} Cr` : 'Price on Request')}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <a
                  href={`https://wa.me/917870433580?text=Hi%20KR%20Estate%20Noida%2C%20I%20am%20interested%20in%20${encodeURIComponent(property.title)}%20at%20${encodeURIComponent(property.sector || 'Noida')}%20(krestatenoida.com)`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 text-xs font-bold bg-[#00A884] hover:bg-[#008f6f] text-white rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  <span>WhatsApp Advisor</span>
                </a>
                
                <button
                  onClick={() => {
                    onClose();
                    onOpenScheduleModal(property.title);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-full shadow-lg shadow-amber-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Site Visit</span>
                </button>
              </div>
            </div>

          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Interactive High-Res Gallery Showcase      */}
          {/* ======================================================== */}
          <div className="w-full lg:w-[50%] xl:w-[48%] flex flex-col h-[220px] sm:h-[360px] lg:h-full bg-slate-950 relative order-1 lg:order-2 overflow-hidden select-none shrink-0 lg:shrink">
            
            {/* Atmospheric Ambient Glow Layer */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <img
                src={currentPhoto.url}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover filter blur-3xl scale-125 opacity-35 brightness-75 transition-all duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/80" />
            </div>

            {/* Floating Top Control Toolbar */}
            <div className="absolute top-2.5 sm:top-4 inset-x-2.5 sm:inset-x-5 z-30 flex items-center justify-between pointer-events-none">
              {/* Left Tags */}
              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                <span className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-white bg-black/75 backdrop-blur-md px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full border border-white/20 shadow-lg">
                  <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                  <span>{activePhotoIdx + 1} / {gallery.length}</span>
                </span>

                {property.videoTour && onWatchVideo && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onWatchVideo(property.videoTour);
                    }}
                    className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full transition-all shadow-lg hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
                    <span className="hidden sm:inline">Watch 4K Tour</span>
                    <span className="sm:hidden">Video</span>
                  </button>
                )}
              </div>

              {/* Right Controls (Expand + Close) */}
              <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/75 hover:bg-black/90 text-white hover:text-amber-300 backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                  title="Fullscreen Lightbox"
                  aria-label="Fullscreen Lightbox"
                >
                  <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/75 hover:bg-black/90 text-white hover:text-rose-400 backdrop-blur-md border border-white/20 shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                  title="Close modal"
                  aria-label="Close modal"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Central High-Resolution Display Stage */}
            <div 
              className="relative flex-1 flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-pointer"
              onClick={() => setIsLightboxOpen(true)}
              title="Click to view full-screen lightbox"
            >
              <div className="relative max-h-full max-w-full flex items-center justify-center rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group-hover:border-amber-400/40 transition-all duration-300">
                <img
                  key={activePhotoIdx}
                  src={currentPhoto.url}
                  alt={currentPhoto.caption || property.title}
                  className="max-h-[160px] sm:max-h-[280px] lg:max-h-[52vh] xl:max-h-[58vh] w-auto max-w-full object-contain rounded-xl sm:rounded-2xl animate-in fade-in zoom-in-95 duration-300"
                />

                {/* Subtle Hover Action Pill */}
                <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-semibold border border-white/25 shadow-xl">
                    <Maximize2 className="h-4 w-4 text-amber-400" />
                    <span>Expand High-Res Gallery</span>
                  </span>
                </div>
              </div>

              {/* Sliding Arrows (Left & Right) */}
              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/75 hover:bg-amber-400 text-white hover:text-neutral-950 backdrop-blur-md border border-white/25 hover:border-amber-400 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer group/btn"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 group-hover/btn:-translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/75 hover:bg-amber-400 text-white hover:text-neutral-950 backdrop-blur-md border border-white/25 hover:border-amber-400 flex items-center justify-center shadow-2xl transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer group/btn"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 group-hover/btn:translate-x-0.5 transition-transform" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Caption Bar & Sliding Indicator Dots */}
            <div className="shrink-0 px-4 py-2.5 bg-slate-950/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-2 z-20">
              {currentPhoto.caption ? (
                <div className="bg-black/70 border border-white/15 px-3 py-1 rounded-full text-white text-xs font-medium max-w-[70%] truncate">
                  <span className="text-amber-400 mr-1.5 font-mono font-bold">0{activePhotoIdx + 1}</span>
                  <span>{currentPhoto.caption}</span>
                </div>
              ) : <div />}

              {/* Indicator Dots */}
              {gallery.length > 1 && (
                <div className="flex items-center gap-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-white/15">
                  {gallery.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePhotoIdx(idx);
                      }}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        activePhotoIdx === idx
                          ? 'w-5 h-2 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                          : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/80'
                      }`}
                      aria-label={`Jump to photo ${idx + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Luxury Thumbnail Filmstrip */}
            {gallery.length > 1 && (
              <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-black/95 border-t border-slate-800/80 overflow-x-auto no-scrollbar z-20">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
                  Reel:
                </span>
                {gallery.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative group/thumb h-12 w-20 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200 cursor-pointer ${
                      activePhotoIdx === idx
                        ? 'border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : 'border-white/10 opacity-60 hover:opacity-100 hover:border-white/40'
                    }`}
                    title={img.caption || `Photo ${idx + 1}`}
                  >
                    <img
                      src={img.url}
                      alt={img.caption || `Thumbnail ${idx + 1}`}
                      className="h-full w-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/75 text-[9px] font-mono text-white/90">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>

    {/* Fullscreen Lightbox Theater Overlay */}
    {isLightboxOpen && (
      <div 
        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col justify-between animate-in fade-in duration-200 select-none"
        onClick={() => setIsLightboxOpen(false)}
      >
        {/* Lightbox Top Header */}
        <div 
          className="p-4 sm:p-6 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-xs font-mono uppercase tracking-widest font-bold">
                {[property.developer, property.sector || property.locality].filter(Boolean).join(' · ') || 'KR Estate Portfolio'}
              </span>
              <span className="text-white/30 text-xs">|</span>
              <span className="text-white/70 text-xs font-mono">
                {activePhotoIdx + 1} of {gallery.length} Photos
              </span>
            </div>
            <h2 className="text-white font-display text-lg sm:text-2xl font-bold tracking-tight mt-0.5">
              {property.title}
            </h2>
            {currentPhoto.caption && (
              <p className="text-amber-200/90 text-xs sm:text-sm mt-0.5 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
                {currentPhoto.caption}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/20 hover:scale-105 active:scale-95"
              aria-label="Exit fullscreen view"
              title="Close fullscreen (Esc)"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Center High-Res Stage */}
        <div 
          className="relative flex-1 flex items-center justify-center p-3 sm:p-8 overflow-hidden select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            key={`lightbox-${activePhotoIdx}`}
            src={currentPhoto.url}
            alt={currentPhoto.caption || property.title}
            className="max-h-[72vh] max-w-[92vw] w-auto h-auto object-contain rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] border border-white/15 animate-in fade-in zoom-in-95 duration-200"
          />

          {gallery.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-3 sm:left-8 top-1/2 -translate-y-1/2 p-3.5 sm:p-4 rounded-full bg-black/60 hover:bg-amber-400 text-white hover:text-neutral-950 border border-white/20 hover:border-amber-400 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 cursor-pointer z-30"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-3 sm:right-8 top-1/2 -translate-y-1/2 p-3.5 sm:p-4 rounded-full bg-black/60 hover:bg-amber-400 text-white hover:text-neutral-950 border border-white/20 hover:border-amber-400 backdrop-blur-md transition-all shadow-2xl hover:scale-110 active:scale-95 cursor-pointer z-30"
                aria-label="Next photo"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Filmstrip Rail & Keyboard Helper */}
        <div 
          className="p-3 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/70 backdrop-blur-xl border-t border-white/10 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-xs text-slate-400 hidden md:flex">
            <span>Keyboard shortcuts:</span>
            <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-[11px] text-white border border-white/10">← Prev</kbd>
            <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-[11px] text-white border border-white/10">→ Next</kbd>
            <kbd className="px-2 py-1 rounded bg-white/10 font-mono text-[11px] text-white border border-white/10">ESC Close</kbd>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full py-1 no-scrollbar">
            {gallery.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative h-13 w-22 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  activePhotoIdx === idx
                    ? 'border-amber-400 scale-105 ring-2 ring-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.5)]'
                    : 'border-white/10 opacity-50 hover:opacity-100 hover:border-white/40'
                }`}
                title={img.caption || `Photo ${idx + 1}`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 font-mono text-[9px] text-white">
                  {idx + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )}
  </>
  );
};

