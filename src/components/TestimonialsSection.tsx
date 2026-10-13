import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const handlePrev = () => {
    setActiveSlide((prev) => (prev > 0 ? prev - 1 : testimonials.length - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev < testimonials.length - 1 ? prev + 1 : 0));
  };

  const minSwipeDistance = 45;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }
  };

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
              onClick={handlePrev}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-orange-200 bg-white hover:bg-orange-50 flex items-center justify-center text-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-orange-200 bg-white hover:bg-orange-50 flex items-center justify-center text-slate-800 transition-all cursor-pointer shadow-xs active:scale-95"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile View: Full-Width Box Card matching reference design with swipe */}
        <div 
          className="block sm:hidden w-full overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div 
            className="flex transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeSlide * 100}%)` }}
          >
            {testimonials.map((t, idx) => (
              <div key={idx} className="w-full min-w-full px-0.5">
                <div className="bg-white rounded-3xl p-5 border border-orange-200/80 shadow-md flex flex-col justify-between">
                  <div>
                    {/* User Avatar & Info */}
                    <div className="flex items-center gap-3.5 mb-3.5">
                      <img
                        src={t.avatar}
                        alt={t.author}
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs shrink-0"
                      />
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-tight">
                          {t.author}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {t.role}
                        </p>
                      </div>
                    </div>

                    {/* Full Quote */}
                    <p className="text-sm text-slate-700 leading-relaxed italic font-normal">
                      {t.quote}
                    </p>
                  </div>

                  {/* Divider and Stars */}
                  <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center gap-1.5">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet & Desktop Grid: All 4 Cards displayed in matching box card style */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl p-6 border border-orange-200/80 shadow-md flex flex-col justify-between hover:-translate-y-1.5 transition-all duration-300"
            >
              <div>
                {/* User Avatar & Info */}
                <div className="flex items-center gap-3.5 mb-3.5">
                  <img
                    src={t.avatar}
                    alt={t.author}
                    className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shadow-xs shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {t.author}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {t.role}
                    </p>
                  </div>
                </div>

                {/* Quote */}
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic font-normal">
                  {t.quote}
                </p>
              </div>

              {/* Divider and Stars */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center gap-1.5">
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
