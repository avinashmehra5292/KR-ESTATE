import React, { useState } from 'react';
import { Building, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { ValuationSubmission } from '../types';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const ValuationForm: React.FC = () => {
  const { settings } = useSiteSettings();
  const [formData, setFormData] = useState<ValuationSubmission>({
    ownerName: '',
    phoneNumber: '',
    email: '',
    sector: '',
    societyName: '',
    propertyType: 'apartment',
    configuration: '3 BHK',
    superAreaSqFt: 1650,
    expectedPrice: '',
    intent: 'sell',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const message = `*New Resale / Valuation Request*
• *Owner Name:* ${formData.ownerName}
• *Phone:* ${formData.phoneNumber}
• *Email:* ${formData.email}
• *Intent:* ${formData.intent === 'sell' ? 'Sell Property' : 'Rent Out Property'}
• *Property Type:* ${formData.propertyType} (${formData.configuration})
• *Society / Sector:* ${formData.societyName || 'Noida'}, ${formData.sector}
• *Area:* ${formData.superAreaSqFt} sq.ft
• *Expected Price:* ${formData.expectedPrice || 'Open for valuation appraisal'}`;

    const cleanPhone = (settings.agency.phone || '+91 78704 33580').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    try {
      await fetch('/api/valuation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      // Ensure positive user experience even if offline
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="valuation" className="py-10 sm:py-20 lg:py-28 border-b border-orange-200/60 bg-[#FBE8DC] w-full max-w-full overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full max-w-full">
        
        <div className="rounded-2xl sm:rounded-3xl border border-orange-200/80 bg-gradient-to-br from-white via-[#FFF8F2] to-[#FCEEE3] p-4 sm:p-8 lg:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-[140px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center relative">
            
            {/* Left Narrative (Col 5) */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-4">
              <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-700">
                Owners &amp; Investors Desk
              </div>
              <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Selling or Renting Your Property in Noida?
              </h2>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                Connect with KR Estate’s dedicated resale and leasing desk. We provide institutional valuation grounded in actual circle rates, active transaction velocity, and verified NRI &amp; domestic buyer pools.
              </p>

              <div className="space-y-2.5 sm:space-y-3 pt-3 sm:pt-4 border-t border-orange-200/80 text-xs text-slate-700 font-medium">
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.5)] shrink-0" />
                  <span>Free certified market valuation within 24 hours</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.5)] shrink-0" />
                  <span>Pre-qualified corporate tenant matching &amp; legal documentation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full bg-amber-600 shadow-[0_0_8px_rgba(217,119,6,0.5)] shrink-0" />
                  <span>Direct escrow &amp; bank loan assistance for prospective buyers</span>
                </div>
              </div>

              <div className="pt-2 text-xs text-slate-600">
                Inquiries routed directly to: <span className="text-amber-800 font-mono font-semibold break-all">{settings.agency.email || 'avinashmehra5292@gmail.com'}</span>
              </div>
            </div>

            {/* Right Form (Col 7) */}
            <div className="lg:col-span-7 rounded-xl sm:rounded-2xl bg-white/95 border border-orange-200/90 p-4 sm:p-8 shadow-md sm:shadow-xl">
              {submitted ? (
                <div className="text-center py-10 space-y-4 animate-in fade-in duration-300">
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 font-display">Valuation Request Received</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.ownerName}. Our senior valuation analyst has received your details for {formData.societyName || formData.sector} and will contact you at {formData.phoneNumber} with a comprehensive valuation report.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        ownerName: '',
                        phoneNumber: '',
                        email: '',
                        sector: '',
                        societyName: '',
                        propertyType: 'apartment',
                        configuration: '3 BHK',
                        superAreaSqFt: 1650,
                        expectedPrice: '',
                        intent: 'sell',
                      });
                    }}
                    className="mt-4 px-5 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl hover:from-amber-300 hover:to-amber-400 transition-all shadow-md cursor-pointer"
                  >
                    Submit Another Property
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vikram Sharma"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Phone Number (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="+91 98765 43210"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        I Want To *
                      </label>
                      <select
                        value={formData.intent}
                        onChange={(e) => setFormData({ ...formData, intent: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="sell" className="bg-white text-slate-900">Sell Property</option>
                        <option value="rent" className="bg-white text-slate-900">Rent Out Property</option>
                        <option value="valuation_only" className="bg-white text-slate-900">Get Market Valuation Only</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Sector / Location *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sector 137"
                        value={formData.sector}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Society / Project Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Purvanchal Royal Park"
                        value={formData.societyName}
                        onChange={(e) => setFormData({ ...formData, societyName: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Configuration
                      </label>
                      <select
                        value={formData.configuration}
                        onChange={(e) => setFormData({ ...formData, configuration: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="2 BHK" className="bg-white text-slate-900">2 BHK</option>
                        <option value="3 BHK" className="bg-white text-slate-900">3 BHK</option>
                        <option value="4 BHK" className="bg-white text-slate-900">4 BHK</option>
                        <option value="Penthouse" className="bg-white text-slate-900">Penthouse</option>
                        <option value="Plot / Villa" className="bg-white text-slate-900">Plot / Villa</option>
                        <option value="Commercial" className="bg-white text-slate-900">Commercial</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Super Area (Sq.Ft)
                      </label>
                      <input
                        type="number"
                        placeholder="1650"
                        value={formData.superAreaSqFt || ''}
                        onChange={(e) => setFormData({ ...formData, superAreaSqFt: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-800 block mb-1.5">
                        Expected Price (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ₹1.85 Cr"
                        value={formData.expectedPrice}
                        onChange={(e) => setFormData({ ...formData, expectedPrice: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FFF6F0] border border-orange-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 disabled:opacity-50 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.45)] cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Free Certified Valuation</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                </form>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
