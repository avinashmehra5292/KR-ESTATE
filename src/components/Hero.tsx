import React, { useState } from 'react';
import { MapPin, Play, ArrowRight, ArrowUpRight, Compass, Calculator, Sparkles, Scale } from 'lucide-react';

interface HeroProps {
  onSearch: (params: { sector: string; type: string; budget: string }) => void;
  onOpenScheduleModal: () => void;
  onWatchVideo?: (category?: 'drone' | 'property') => void;
  onOpenClientVideoModal?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, onOpenScheduleModal, onWatchVideo }) => {
  const [sector, setSector] = useState('all');
  const [type, setType] = useState('all');
  const [budget, setBudget] = useState('all');
  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch({ sector, type, budget });
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
  };
  return (
    <section id="home" className="estate-hero" aria-labelledby="hero-title">
      <div className="hero-scene">
        <picture className="hero-image">
          <source media="(max-width: 1023px)" srcSet="/hero-mobile-balcony.webp" type="image/webp" />
          <source srcSet="/hero-sunset-balcony.webp" type="image/webp" />
          <img src="/hero-sunset-balcony.jpg" alt="A spacious penthouse terrace overlooking the Noida skyline at sunset" fetchPriority="high" />
        </picture>
        <div className="hero-shade" />
        <div className="estate-container hero-editorial">
          <p className="estate-eyebrow"><span /> NOIDA &amp; BEYOND</p>
          <h1 id="hero-title">An exceptional address.<br /><em>A place to call yours.</em></h1>
          <p className="hero-description">Discover remarkable homes and considered investments across Noida, the Expressway and Jewar. Guided by local expertise, chosen around you.</p>
          <div className="hero-actions">
            <a href="#properties" className="estate-button estate-button-gold">Explore properties <ArrowUpRight size={18} /></a>
            {onWatchVideo && <button type="button" onClick={() => onWatchVideo('drone')} className="hero-film"><span><Play size={15} fill="currentColor" /></span> Watch the aerial tour</button>}
          </div>
          <div className="hero-location"><MapPin size={15} /><span>Noida · Greater Noida · Jewar</span></div>
        </div>
        <div className="hero-caption"><span>THE ART OF FINDING HOME</span><span>Spaces for your next chapter.</span></div>
      </div>
      <div className="estate-container hero-discovery">
        <form className="estate-search" onSubmit={handleSearch} aria-label="Find your property">
          <div className="search-intro"><Compass size={22} /><span>Find your<br /><strong>next address</strong></span></div>
          <label className="search-field" htmlFor="hero-location"><span>01 / Location</span>
            <select id="hero-location" value={sector} onChange={e => setSector(e.target.value)}>
              <option value="all">All Noida locations</option>
              <option value="Sector 43">Sector 43 · Central Noida</option>
              <option value="Sector 124">Sector 124 · Expressway</option>
              <option value="Sector 144">Sector 144 · Expressway</option>
              <option value="Yamuna Expressway">Jewar Corridor</option>
            </select>
          </label>
          <label className="search-field" htmlFor="hero-type"><span>02 / Property type</span>
            <select id="hero-type" value={type} onChange={e => setType(e.target.value)}>
              <option value="all">All property types</option>
              <option value="luxury_apartment">Luxury residences</option>
              <option value="penthouse">Penthouses</option>
              <option value="commercial">Commercial &amp; retail</option>
              <option value="plots">Freehold plots</option>
            </select>
          </label>
          <label className="search-field" htmlFor="hero-budget"><span>03 / Budget</span>
            <select id="hero-budget" value={budget} onChange={e => setBudget(e.target.value)}>
              <option value="all">Any budget</option>
              <option value="under_1cr">Under ₹1 Cr</option>
              <option value="1cr_3cr">₹1 Cr – ₹3 Cr</option>
              <option value="3cr_6cr">₹3 Cr – ₹6 Cr</option>
              <option value="above_6cr">₹6 Cr and above</option>
            </select>
          </label>
          <button type="submit" className="estate-button estate-button-dark">Find properties <ArrowRight size={18} /></button>
        </form>
        <div className="hero-resources"><span>A little guidance, every step.</span><div>
          <a href="#calculator"><Calculator size={15} /> EMI calculator</a>
          <a href="#advisor"><Sparkles size={15} /> AI property match</a>
          <a href="#valuation"><Scale size={15} /> Property valuation</a>
          <button type="button" onClick={onOpenScheduleModal}>Plan a private visit <ArrowUpRight size={15} /></button>
        </div></div>
      </div>
    </section>
  );
};
