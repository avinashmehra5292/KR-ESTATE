import React, { useState, useEffect } from 'react';
import { Calendar, ShieldCheck, Menu, X, Lock } from 'lucide-react';

interface NavbarProps {
  onOpenScheduleModal: (projectName?: string) => void;
  onOpenDomainModal: () => void;
  onOpenAdminLogin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenScheduleModal,
  onOpenDomainModal: _onOpenDomainModal,
  onOpenAdminLogin,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Home');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      const sections = [
        ['home', 'Home'], ['properties', 'Properties'], ['impact', 'About'],
        ['services', 'Services'], ['contact', 'Contact'],
      ];
      const current = sections.filter(([id]) => {
        const section = document.getElementById(id);
        return section && section.getBoundingClientRect().top <= 140;
      }).at(-1);
      if (current) setActiveTab(current[1]);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`estate-header sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled 
        ? 'bg-[#FFF3EB]/95 backdrop-blur-xl border-b border-orange-200/60 shadow-sm' 
        : 'bg-[#FFF3EB]/90 backdrop-blur-md border-b border-orange-200/40'
    }`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
        
        {/* Left: Brand Monogram & Title */}
        <a href="#home" onClick={() => setActiveTab('Home')} className="flex items-center gap-3 group shrink-0">
          <img 
            src="/kr-logo.png" 
            alt="KR Estate Logo" 
            className="h-11 w-11 object-cover rounded-full"
          />
          <div className="flex flex-col">
            <span className="font-serif text-xl font-bold tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors leading-tight">
              KR Estate
            </span>
            <span className="text-[11px] font-semibold tracking-wider text-amber-700">
              Noida
            </span>
          </div>
        </a>

        {/* Center: Clean Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-[13px] font-medium text-slate-700">
          {[
            { name: 'Home', href: '#home' },
            { name: 'Properties', href: '#properties' },
            { name: 'Services', href: '#services' },
            { name: 'About', href: '#impact' },
            { name: 'Contact', href: '#contact' }
          ].map((item) => (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setActiveTab(item.name)}
              className={`relative py-1.5 transition-colors duration-200 hover:text-amber-700 ${
                activeTab === item.name ? 'text-amber-700 font-bold' : 'text-slate-700'
              }`}
            >
              {item.name}
              {activeTab === item.name && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-full shadow-[0_0_8px_rgba(217,119,6,0.5)]" />
              )}
            </a>
          ))}
        </nav>

        {/* Right: Regulatory Shield and VIP Visit Button */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          
          {/* UP RERA Verified */}
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>UP RERA Verified</span>
          </div>

          {/* Book Visit with Shimmer Sweep */}
          <button
            onClick={() => onOpenScheduleModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl estate-nav-cta text-slate-950 font-bold text-xs shadow-md hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shine-sweep hover:shadow-lg"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Book Visit</span>
          </button>

          {/* Admin Icon button */}
          <button
            onClick={onOpenAdminLogin}
            title="Admin Portal"
            className="p-2 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Mobile Direct Admin Lock Button */}
          <button
            onClick={onOpenAdminLogin}
            title="Admin Portal"
            className="p-1.5 text-slate-500 hover:text-amber-800 transition-colors cursor-pointer"
            aria-label="Admin Portal"
          >
            <Lock className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => onOpenScheduleModal()}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 estate-nav-cta rounded-lg shadow-sm shine-sweep hover:brightness-105 active:scale-95 transition-all"
          >
            Book Visit
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 hover:text-slate-950 rounded-lg focus:outline-none bg-white/80 border border-orange-200"
            aria-label="Toggle menu" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" className="lg:hidden border-b border-orange-200 bg-[#FFF3EB]/98 backdrop-blur-2xl px-6 pt-4 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col space-y-3 text-sm font-semibold text-slate-800">
            {[
              { name: 'Home', href: '#home' },
              { name: 'Properties', href: '#properties' },
              { name: 'Services', href: '#services' },
              { name: 'About', href: '#impact' },
              { name: 'Contact', href: '#contact' }
            ].map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => {
                  setActiveTab(item.name);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 rounded-lg hover:bg-orange-100/50 transition-colors ${
                  activeTab === item.name ? 'text-amber-800 font-bold bg-orange-100/60' : 'text-slate-700'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-orange-200/80 flex flex-col gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-slate-700 px-3 py-1 font-semibold">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>UP RERA Verified</span>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenScheduleModal();
              }}
              className="w-full py-2.5 text-xs font-bold text-slate-950 estate-nav-cta rounded-xl shadow-md"
            >
              Book Visit
            </button>
            {/* Admin Portal Button in Mobile Menu */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAdminLogin();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-slate-800 bg-white/85 hover:bg-white border border-orange-200 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Portal Login</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
