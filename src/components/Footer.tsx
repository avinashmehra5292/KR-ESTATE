import React from 'react';
import { Phone, Mail, MapPin, MessageSquare, Facebook, Instagram, Linkedin, Youtube } from 'lucide-react';

interface FooterProps {
  onOpenScheduleModal: () => void;
  onOpenDomainModal?: () => void;
  onOpenAdminLogin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdminLogin }) => {
  const phone = '+91 78704 33580';
  const email = 'info@krestate.in';

  return (
    <footer id="contact" className="bg-[#F3DDD0] text-slate-800 text-xs border-t border-orange-300/60">
      
      {/* Main Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-12 gap-y-8 gap-x-6 sm:gap-6 lg:gap-8">
          
          {/* Col 1: Brand & Monogram */}
          <div className="col-span-2 sm:col-span-12 lg:col-span-3 space-y-3">
            <div className="flex items-center gap-3">
              <img 
                src="/kr-logo.png" 
                alt="KR Estate" 
                className="h-9 w-auto object-contain filter drop-shadow-[0_0_10px_rgba(217,119,6,0.3)]"
              />
              <div className="flex flex-col">
                <span className="font-serif text-lg font-bold tracking-tight text-slate-950 leading-tight">
                  KR Estate
                </span>
                <span className="text-[11px] font-semibold tracking-wider text-amber-800">
                  Noida
                </span>
              </div>
            </div>
            <p className="text-slate-600 text-xs font-medium">
              Your Vision. Our Expertise.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-950 tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-slate-700 text-xs font-medium">
              <li><a href="#home" className="hover:text-amber-800 transition-colors">Home</a></li>
              <li><a href="#properties" className="hover:text-amber-800 transition-colors">Properties</a></li>
              <li><a href="#services" className="hover:text-amber-800 transition-colors">Services</a></li>
              <li><a href="#impact" className="hover:text-amber-800 transition-colors">About</a></li>
              <li><a href="#contact" className="hover:text-amber-800 transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Col 3: Our Locations */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-950 tracking-wider">
              Our Locations
            </h4>
            <ul className="space-y-2 text-slate-700 text-xs font-medium">
              <li><span className="hover:text-amber-800 cursor-pointer">Noida</span></li>
              <li><span className="hover:text-amber-800 cursor-pointer">Greater Noida</span></li>
              <li><span className="hover:text-amber-800 cursor-pointer">Jewar</span></li>
            </ul>
          </div>

          {/* Col 4: Contact */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-950 tracking-wider">
              Contact
            </h4>
            <ul className="space-y-2 text-slate-700 text-xs font-medium">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="hover:text-amber-800 transition-colors">
                  {phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-amber-800 transition-colors">
                  {email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>Noida, Uttar Pradesh</span>
              </li>
            </ul>
          </div>

          {/* Col 5: Follow Us & WhatsApp */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold text-slate-950 tracking-wider">
              Follow Us
            </h4>
            
            {/* Social Icons */}
            <div className="flex items-center gap-3 text-slate-700">
              <a href="#" aria-label="WhatsApp Channel" className="hover:text-emerald-700 transition-colors"><MessageSquare className="w-4 h-4" /></a>
              <a href="#" aria-label="Facebook Profile" className="hover:text-amber-800 transition-colors"><Facebook className="w-4 h-4" /></a>
              <a href="#" aria-label="Instagram Profile" className="hover:text-amber-800 transition-colors"><Instagram className="w-4 h-4" /></a>
              <a href="#" aria-label="LinkedIn Profile" className="hover:text-amber-800 transition-colors"><Linkedin className="w-4 h-4" /></a>
              <a href="#" aria-label="YouTube Channel" className="hover:text-rose-700 transition-colors"><Youtube className="w-4 h-4" /></a>
            </div>

            {/* Chat on WhatsApp Button */}
            <div className="pt-0.5">
              <a
                href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello%20KR%20Estate,%20I%20am%20interested%20in%20properties.`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white font-semibold text-xs shadow-md transition-all cursor-pointer whitespace-nowrap"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Legal Strip */}
        <div className="mt-12 pt-6 pb-14 sm:pb-8 lg:pb-2 border-t border-orange-200/80 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-600">
          <div className="text-center md:text-left">
            &copy; 2026 KR Estate. All rights reserved. &nbsp;|&nbsp; UP RERA Verified &nbsp;|&nbsp; No Brokerage on New Bookings
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center sm:pr-44 lg:pr-48">
            <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
            <span>|</span>
            <a href="#" className="hover:text-slate-900 transition-colors">Terms &amp; Conditions</a>
            {onOpenAdminLogin && (
              <>
                <span>|</span>
                <button
                  onClick={onOpenAdminLogin}
                  className="hover:text-amber-800 transition-colors cursor-pointer font-semibold text-slate-700"
                >
                  Admin Portal
                </button>
              </>
            )}
          </div>
        </div>

      </div>

    </footer>
  );
};
