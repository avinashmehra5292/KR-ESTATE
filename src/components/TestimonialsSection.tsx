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
    <section className="relative py-12 sm:py-20 lg:py-24 bg-[#FFF3EB] text-slate-900 overflow-hidden border-b border-orange-200/60 w-full max-w-full">
      
      {/* Ambient Backdrop */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="/testimonials-bg.jpg"
          alt="Ambient Luxury Living Room"
          className="w-full h-full object-cover opacity-15 filter blur-sm"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FFF3EB] via-[#FFF3EB]/90 to-[#FFF3EB]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-full">
        
        {/* Header with Title and Left/Right Buttons */}
        <div className="flex items-center justify-between mb-6 sm:mb-12">
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-amber-800 mb-1 sm:mb-1.5 font-mono">
              CLIENT TESTIMONIALS
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-slate-900">
              What Our Clients Say
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveSlide((prev) => (prev > 0 ? prev - 1 : testimonials.length - 1));
                const container = document.getElementById('testimonials-scroll');
                if (container) container.scrollBy({ left: -300, behavior: 'smooth' });
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-orange-200 bg-white hover:bg-orange-50 flex items-center justify-center text-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveSlide((prev) => (prev < testimonials.length - 1 ? prev + 1 : 0));
                const container = document.getElementById('testimonials-scroll');
                if (container) container.scrollBy({ left: 300, behavior: 'smooth' });
              }}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-orange-200 bg-white hover:bg-orange-50 flex items-center justify-center text-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Responsive Cards: Horizontal touch snap on mobile, Grid on tablet & desktop */}
        <div
          id="testimonials-scroll"
          className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6 pb-2 w-full max-w-full"
        >
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="interactive-card group bg-white/95 text-slate-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-orange-200/80 shadow-sm flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300 min-w-[82vw] xs:min-w-[70vw] sm:min-w-0 snap-center shrink-0 sm:shrink"
            >
              <div className="space-y-3 sm:space-y-4">
                {/* User Avatar */}
                <div className="flex items-center gap-3">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-amber-400/40 shadow-xs group-hover:scale-105 group-hover:border-amber-500 transition-all duration-300"
                  />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight group-hover:text-amber-800 transition-colors">
                      {t.author}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                      {t.role}
                    </p>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-xs text-slate-600 leading-relaxed italic font-normal line-clamp-4 sm:line-clamp-none">
                  {t.quote}
                </p>
              </div>

              {/* 5 Gold Stars */}
              <div className="pt-3 sm:pt-4 mt-2 border-t border-slate-100 flex items-center gap-1 group-hover:drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] transition-all">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-6 sm:mt-10">
          {testimonials.map((_, dot) => (
            <button
              key={dot}
              type="button"
              onClick={() => {
                setActiveSlide(dot);
                const container = document.getElementById('testimonials-scroll');
                if (container) {
                  const cardWidth = container.scrollWidth / testimonials.length;
                  container.scrollTo({ left: dot * cardWidth, behavior: 'smooth' });
                }
              }}
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
