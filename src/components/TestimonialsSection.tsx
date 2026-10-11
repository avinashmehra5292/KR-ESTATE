import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(1);

  const testimonials = [
    {
      avatar: '/avatar-rahul.jpg',
      quote: '“KR Estate made our dream home a reality. Their team is professional, transparent and truly understands client needs.”',
      author: 'Rahul Sharma',
      role: 'Home Buyer',
      rating: 5,
    },
    {
      avatar: '/avatar-priya.jpg',
      quote: '“Excellent guidance on investment options. Got great returns in just 2 years. Highly recommended!”',
      author: 'Priya Varma',
      role: 'Investor',
      rating: 5,
    },
    {
      avatar: '/avatar-amit.jpg',
      quote: '“Professional, reliable and always available. Best real estate advisory in Noida!”',
      author: 'Amit Gupta',
      role: 'Property Owner',
      rating: 5,
    },
    {
      avatar: '/avatar-neha.jpg',
      quote: '“The team helped me find the perfect commercial space for my business. Very smooth process.”',
      author: 'Neha Singh',
      role: 'Business Owner',
      rating: 5,
    },
  ];

  return (
    <section className="relative py-20 lg:py-24 bg-[#FFF3EB] text-slate-900 overflow-hidden border-b border-orange-200/60">
      
      {/* Ambient Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/testimonials-bg.jpg"
          alt="Ambient Luxury Living Room"
          className="w-full h-full object-cover opacity-15 filter blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF3EB] via-[#FFF3EB]/90 to-[#FFF3EB]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Title and Left/Right Buttons */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 mb-1.5 font-mono">
              CLIENT TESTIMONIALS
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              What Our Clients Say
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : 2))}
              className="w-9 h-9 rounded-full border border-orange-200 bg-white hover:bg-orange-50 flex items-center justify-center text-slate-800 transition-all cursor-pointer shadow-sm"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev < 2 ? prev + 1 : 0))}
              className="w-9 h-9 rounded-full border border-orange-200 bg-white hover:bg-orange-50 flex items-center justify-center text-slate-800 transition-all cursor-pointer shadow-sm"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="interactive-card group bg-white/95 text-slate-900 rounded-2xl p-6 border border-orange-200/80 shadow-md flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300"
            >
              <div className="space-y-4">
                {/* User Avatar */}
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-11 h-11 rounded-full object-cover border-2 border-amber-400/40 shadow-sm group-hover:scale-108 group-hover:border-amber-500 transition-all duration-300"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight group-hover:text-amber-800 transition-colors">
                      {t.author}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.role}
                    </p>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-xs text-slate-600 leading-relaxed italic font-normal">
                  {t.quote}
                </p>
              </div>

              {/* 5 Gold Stars */}
              <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-1 group-hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-all">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 3 Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-10">
          {[0, 1, 2].map((dot) => (
            <button
              key={dot}
              type="button"
              onClick={() => setActiveSlide(dot)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                activeSlide === dot ? 'w-6 bg-amber-500' : 'w-2 bg-orange-200 hover:bg-orange-300'
              }`}
              aria-label={`Go to slide ${dot + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
};
