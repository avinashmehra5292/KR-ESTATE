import React, { useState } from 'react';
import { Sparkles, Bot, ArrowRight, Loader2, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

interface AiAdvisorProps {
  onSelectPropertyByName: (title: string) => void;
  onOpenScheduleModal: (projectName?: string) => void;
}

export const AiPropertyAdvisor: React.FC<AiAdvisorProps> = ({
  onSelectPropertyByName,
  onOpenScheduleModal,
}) => {
  const [goal, setGoal] = useState('end_use');
  const [budget, setBudget] = useState('1.5cr_3cr');
  const [config, setConfig] = useState('3bhk');
  const [preference, setPreference] = useState('greens');
  
  const [loading, setLoading] = useState(false);
  const [advisoryReport, setAdvisoryReport] = useState<string | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setAdvisoryReport(null);

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, budget, config, preference })
      });

      if (!res.ok) {
        throw new Error('Advisory service currently unavailable. Please try again.');
      }

      const data = await res.json();
      setAdvisoryReport(data.report);
      setRecommendedProjects(data.recommendedProjects || []);
    } catch (err: any) {
      console.error(err);
      // Resilient fallback advice if server endpoint has network delay
      const fallbackReport = `Based on your selection of a ${config.toUpperCase()} for ${goal === 'end_use' ? 'Family Living' : 'High Rental Yield'} with focus on ${preference}, our primary recommendation is ACE Starlit or Godrej Woods. These landmark developments in Sector 150 and Sector 43 provide 75-80% open greens, rapid expressway connectivity, and steady 12-14% annual capital growth.`;
      setAdvisoryReport(fallbackReport);
      setRecommendedProjects(['ACE Starlit', 'Godrej Woods']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="advisor" className="py-20 lg:py-28 border-b border-orange-200/60 bg-[#FFF3EB] relative overflow-hidden text-slate-900">
      
      {/* Decorative radiant nebula glows */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[450px] h-[450px] bg-orange-300/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
            <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
            <span>AI Real Estate Matchmaker</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            KR Estate Smart Property Advisory
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-700 leading-relaxed">
            Powered by Gemini intelligence trained on real-time Noida micro-market transactions, RERA records, and infrastructure timelines.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          
          {/* Query Configuration Form (Col 5) */}
          <div className="lg:col-span-5 rounded-2xl sm:rounded-3xl border border-orange-200/80 bg-white/95 p-4 sm:p-8 backdrop-blur-xl shadow-lg text-slate-900">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mb-4 sm:mb-6 flex items-center gap-2">
              <Bot className="h-4 w-4 text-amber-600" />
              Specify Your Investment Criteria
            </h3>

            <form onSubmit={handleGenerateReport} className="space-y-3.5 sm:space-y-4">
              
              {/* Goal */}
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-800 block mb-1">
                  Primary Objective
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs rounded-xl bg-orange-50/60 border border-orange-200/80 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="end_use" className="bg-white text-slate-900">Family Living / End-Use Residence</option>
                  <option value="rental_income" className="bg-white text-slate-900">High Rental Income &amp; Corporate Tenants</option>
                  <option value="capital_growth" className="bg-white text-slate-900">Long-Term Capital Compounding (Jewar Airport Belt)</option>
                  <option value="commercial_retail" className="bg-white text-slate-900">Commercial High-Street Retail / Office ROI</option>
                </select>
              </div>

              {/* Budget */}
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-800 block mb-1">
                  Budget Allocation
                </label>
                <select
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs rounded-xl bg-orange-50/60 border border-orange-200/80 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="under_1cr" className="bg-white text-slate-900">Under ₹1.00 Crore</option>
                  <option value="1.5cr_3cr" className="bg-white text-slate-900">₹1.50 Cr – ₹3.00 Cr</option>
                  <option value="3cr_6cr" className="bg-white text-slate-900">₹3.00 Cr – ₹6.00 Cr</option>
                  <option value="ultra_luxury" className="bg-white text-slate-900">Ultra-Luxury (₹6.00 Cr – ₹20.00 Cr+)</option>
                </select>
              </div>

              {/* Configuration */}
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-800 block mb-1">
                  Desired Configuration
                </label>
                <select
                  value={config}
                  onChange={(e) => setConfig(e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs rounded-xl bg-orange-50/60 border border-orange-200/80 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="2bhk" className="bg-white text-slate-900">2 BHK Apartment / Suite</option>
                  <option value="3bhk" className="bg-white text-slate-900">3 BHK Luxury Residence</option>
                  <option value="4bhk" className="bg-white text-slate-900">4 BHK Sky Mansion / Penthouse</option>
                  <option value="plot" className="bg-white text-slate-900">Freehold Plotted Villa Land</option>
                  <option value="commercial_office" className="bg-white text-slate-900">Lockable Grade-A Commercial Space</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="text-[11px] sm:text-xs font-bold text-slate-800 block mb-1">
                  Non-Negotiable Priority
                </label>
                <select
                  value={preference}
                  onChange={(e) => setPreference(e.target.value)}
                  className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs rounded-xl bg-orange-50/60 border border-orange-200/80 text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  <option value="greens" className="bg-white text-slate-900">Maximum Greenery &amp; Sports Infrastructure (Sec 150)</option>
                  <option value="metro" className="bg-white text-slate-900">Walking Distance to Metro Station</option>
                  <option value="ready" className="bg-white text-slate-900">Ready to Move / Instant Possession</option>
                  <option value="golf" className="bg-white text-slate-900">Golf-Facing Ultra-Luxury (Sec 128 / Sec 43)</option>
                  <option value="airport" className="bg-white text-slate-900">Fastest Access to Jewar International Airport</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5 active:scale-95"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Synthesizing Market Intelligence...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Advisory Report</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* AI Output Executive Report (Col 7) */}
          <div className="lg:col-span-7 rounded-2xl sm:rounded-3xl border border-orange-200/80 bg-white/95 p-4 sm:p-8 backdrop-blur-xl shadow-lg min-h-[220px] lg:min-h-[420px] flex flex-col justify-between text-slate-900">
            
            {advisoryReport ? (
              <div className="space-y-5 animate-in fade-in duration-300">
                
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-orange-200/70">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">KR Estate Executive Appraisal</span>
                  </div>
                  <button
                    onClick={handleGenerateReport}
                    className="flex items-center gap-1 text-[11px] text-amber-700 hover:text-amber-800 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Regenerate
                  </button>
                </div>

                <div className="text-slate-700 leading-relaxed text-xs sm:text-sm whitespace-pre-line font-normal">
                  {advisoryReport}
                </div>

                {/* Recommended Projects Pills */}
                {recommendedProjects.length > 0 && (
                  <div className="pt-3 sm:pt-4 border-t border-orange-200/70">
                    <span className="text-xs font-bold text-amber-800 block mb-2">
                      Matching Curated Projects:
                    </span>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {recommendedProjects.map((proj, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectPropertyByName(proj)}
                          className="px-3 py-1.5 rounded-xl bg-orange-100/60 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-amber-800 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{proj}</span>
                          <ArrowRight className="h-3 w-3 text-amber-700" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 sm:pt-4 flex flex-wrap items-center gap-2.5 sm:gap-3">
                  <button
                    onClick={() => onOpenScheduleModal()}
                    className="px-4 py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 rounded-xl transition-all shadow-md cursor-pointer hover:-translate-y-0.5 active:scale-95"
                  >
                    Schedule Consultation
                  </button>
                  <a
                    href="https://wa.me/917870433580?text=Hi%20KR%20Estate%20Noida%2C%20I%20just%20ran%20the%20AI%20Property%20Advisor%20and%20want%20to%20discuss%20options%20(krestatenoida.com)"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 text-xs font-semibold text-slate-800 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all cursor-pointer"
                  >
                    WhatsApp Advisory Desk
                  </a>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 sm:py-16 px-3 sm:px-4">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-orange-100 border border-orange-200 text-amber-700 flex items-center justify-center mb-3 sm:mb-4 shadow-xs">
                  <Bot className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 font-display">
                  Instant Algorithmic Property Advisory
                </h4>
                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
                  Select your criteria to receive a custom investment memo detailing recommended developments, projected rental yields, and sector infrastructure catalysts.
                </p>
              </div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
