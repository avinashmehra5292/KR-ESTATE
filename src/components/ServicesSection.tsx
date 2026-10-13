import React from 'react';
import { Shield, Calculator, Sparkles, Tag, ArrowRight } from 'lucide-react';

interface ServicesSectionProps {
  onOpenEmiModal?: () => void;
  onOpenAiAdvisor?: () => void;
  onOpenValuation?: () => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  onOpenEmiModal,
  onOpenAiAdvisor,
  onOpenValuation,
}) => {
  const services = [
    {
      icon: Shield,
      title: 'Property Advisory',
      description: 'Personalized recommendations based on your goals & budget.',
      onClick: () => {
        const el = document.getElementById('properties');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      icon: Calculator,
      title: 'Loan & EMI Calculator',
      description: 'Plan your investment with smart EMI options.',
      onClick: () => {
        if (onOpenEmiModal) onOpenEmiModal();
        const el = document.getElementById('calculator');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      icon: Sparkles,
      title: 'AI Property Match',
      description: 'Let AI find the best properties for you.',
      onClick: () => {
        if (onOpenAiAdvisor) onOpenAiAdvisor();
        const el = document.getElementById('advisor');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      icon: Tag,
      title: 'Sell / Valuation',
      description: 'Get the right value for your property.',
      onClick: () => {
        if (onOpenValuation) onOpenValuation();
        const el = document.getElementById('valuation');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
  ];

  return (
    <section id="services" className="py-12 sm:py-16 lg:py-24 bg-[#FFF3EB] text-slate-900 border-b border-orange-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10 items-center">
          
          {/* Left Column: Heading & Paragraph */}
          <div className="lg:col-span-4 space-y-3 sm:space-y-4">
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 font-sans">
              OUR SERVICES
            </div>
            <h2 className="font-serif-luxury text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight uppercase">
              End-to-End Real Estate Advisory
            </h2>
            <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-normal">
              From property search to final transaction, we provide personalized guidance at every step.
            </p>
            <div className="pt-1 sm:pt-2">
              <a
                href="#properties"
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer hover:brightness-105 active:scale-95 shine-sweep group"
              >
                <span>Explore Our Services</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Right Column: 4 Cards in 2-col on Mobile & Tablet, 4-col on Desktop */}
          <div className="lg:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {services.map((srv, idx) => (
              <div
                key={idx}
                onClick={srv.onClick}
                className="interactive-card bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-orange-100/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1 min-h-[165px] sm:min-h-[220px]"
              >
                <div className="space-y-2 sm:space-y-3">
                  {/* Pale Orange Icon Circle */}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FFF0E5] border border-orange-200/60 flex items-center justify-center text-amber-700 group-hover:scale-105 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all duration-300">
                    <srv.icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>

                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-amber-800 transition-colors leading-snug">
                    {srv.title}
                  </h3>

                  <p className="text-[11px] sm:text-xs text-slate-500 leading-snug sm:leading-relaxed font-normal line-clamp-3 sm:line-clamp-none">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-2 sm:pt-3">
                  <span className="text-slate-400 group-hover:text-amber-700 group-hover:translate-x-1.5 transition-all text-xs sm:text-sm font-semibold inline-flex items-center">
                    &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};
