
import React, { useState } from 'react';
import { FashionDNA } from '../types';
import { Clock, Crown, Gem, Layers, Ruler, Shirt, Sparkles, TrendingUp, User, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

interface FashionDNACardProps {
  fashionDNA: FashionDNA;
  itemName: string;
}

const FashionDNACard: React.FC<FashionDNACardProps> = ({ fashionDNA, itemName }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('editorial');

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  const investmentBadgeColors: Record<string, string> = {
    'Heritage Piece': 'bg-amber-50 text-amber-800 border-amber-200',
    'Contemporary Classic': 'bg-slate-50 text-slate-800 border-slate-200',
    'Trend-Forward': 'bg-rose-50 text-rose-800 border-rose-200',
    'Timeless Essential': 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Luxury Header with Editorial Notes */}
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-black p-10 text-white overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Gem size={18} className="text-white/80" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-white/50 font-medium">Fashion DNA</p>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/30">Iconographic Analysis</p>
            </div>
          </div>

          <h2 className="font-serif text-3xl md:text-4xl leading-tight mb-6 tracking-tight">
            {itemName}
          </h2>

          <p className="text-white/70 font-light leading-relaxed text-sm md:text-base italic max-w-2xl">
            "{fashionDNA.editorialNotes}"
          </p>

          <div className="flex flex-wrap items-center gap-4 mt-8">
            <span className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border ${investmentBadgeColors[fashionDNA.investmentPotential] || 'bg-zinc-50 text-zinc-800 border-zinc-200'}`}>
              {fashionDNA.investmentPotential}
            </span>
            <span className="px-4 py-2 rounded-full text-[10px] font-medium uppercase tracking-[0.15em] bg-white/10 backdrop-blur-sm text-white/80 border border-white/10">
              {fashionDNA.styleArchetype}
            </span>
          </div>
        </div>
      </div>

      {/* Era & Timeline */}
      <div className="p-8 border-b border-zinc-100 bg-gradient-to-r from-zinc-50/50 to-white">
        <div className="flex items-start gap-6">
          <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center shrink-0">
            <Clock size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-400 font-bold mb-2">Primary Era</p>
            <h3 className="font-serif text-2xl text-zinc-900 mb-1">{fashionDNA.primaryEra}</h3>
            <p className="text-sm text-zinc-500 font-light">{fashionDNA.eraYearRange}</p>
          </div>
        </div>
      </div>

      {/* Expandable Sections */}
      <div className="divide-y divide-zinc-100">

        {/* Designer Influences */}
        <div className="overflow-hidden">
          <button
            onClick={() => toggleSection('designers')}
            className="w-full p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <Crown size={18} className="text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Designer Influences</p>
                <p className="text-sm text-zinc-600">{fashionDNA.designerInfluences.length} iconic references</p>
              </div>
            </div>
            {expandedSection === 'designers' ? (
              <ChevronUp size={20} className="text-zinc-400" />
            ) : (
              <ChevronDown size={20} className="text-zinc-400" />
            )}
          </button>

          {expandedSection === 'designers' && (
            <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
              {fashionDNA.designerInfluences.map((designer, idx) => (
                <div key={idx} className="p-5 bg-gradient-to-r from-zinc-50 to-white rounded-2xl border border-zinc-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-zinc-900">{designer.name}</h4>
                      <p className="text-xs text-zinc-400">{designer.era}</p>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full">
                      Influence #{idx + 1}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 mb-2"><span className="font-medium text-zinc-700">Signature:</span> {designer.signature}</p>
                  <p className="text-sm text-zinc-500 font-light italic">{designer.relevance}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Style Movements */}
        <div className="overflow-hidden">
          <button
            onClick={() => toggleSection('movements')}
            className="w-full p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={18} className="text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Style Movements</p>
                <p className="text-sm text-zinc-600">{fashionDNA.styleMovements.length} defining movements</p>
              </div>
            </div>
            {expandedSection === 'movements' ? (
              <ChevronUp size={20} className="text-zinc-400" />
            ) : (
              <ChevronDown size={20} className="text-zinc-400" />
            )}
          </button>

          {expandedSection === 'movements' && (
            <div className="px-6 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-300">
              {fashionDNA.styleMovements.map((movement, idx) => (
                <div key={idx} className="p-5 bg-gradient-to-r from-zinc-50 to-white rounded-2xl border border-zinc-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-zinc-900">{movement.name}</h4>
                      <p className="text-xs text-zinc-400">{movement.period}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {movement.characteristics.map((char, charIdx) => (
                      <span key={charIdx} className="text-xs px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-zinc-600">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Silhouette Analysis */}
        <div className="overflow-hidden">
          <button
            onClick={() => toggleSection('silhouette')}
            className="w-full p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <Ruler size={18} className="text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Silhouette Analysis</p>
                <p className="text-sm text-zinc-600">Construction & proportions</p>
              </div>
            </div>
            {expandedSection === 'silhouette' ? (
              <ChevronUp size={20} className="text-zinc-400" />
            ) : (
              <ChevronDown size={20} className="text-zinc-400" />
            )}
          </button>

          {expandedSection === 'silhouette' && (
            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="p-6 bg-gradient-to-br from-zinc-50 to-white rounded-2xl border border-zinc-100">
                <p className="text-zinc-700 leading-relaxed">{fashionDNA.silhouetteAnalysis}</p>
              </div>
            </div>
          )}
        </div>

        {/* Fabric Intelligence */}
        <div className="overflow-hidden">
          <button
            onClick={() => toggleSection('fabric')}
            className="w-full p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <Layers size={18} className="text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Fabric Intelligence</p>
                <p className="text-sm text-zinc-600">Textile composition & character</p>
              </div>
            </div>
            {expandedSection === 'fabric' ? (
              <ChevronUp size={20} className="text-zinc-400" />
            ) : (
              <ChevronDown size={20} className="text-zinc-400" />
            )}
          </button>

          {expandedSection === 'fabric' && (
            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="p-6 bg-gradient-to-br from-zinc-50 to-white rounded-2xl border border-zinc-100">
                <p className="text-zinc-700 leading-relaxed">{fashionDNA.fabricIntelligence}</p>
              </div>
            </div>
          )}
        </div>

        {/* Cultural Context */}
        <div className="overflow-hidden">
          <button
            onClick={() => toggleSection('cultural')}
            className="w-full p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <BookOpen size={18} className="text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Cultural Context</p>
                <p className="text-sm text-zinc-600">Social & artistic significance</p>
              </div>
            </div>
            {expandedSection === 'cultural' ? (
              <ChevronUp size={20} className="text-zinc-400" />
            ) : (
              <ChevronDown size={20} className="text-zinc-400" />
            )}
          </button>

          {expandedSection === 'cultural' && (
            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="p-6 bg-gradient-to-br from-zinc-50 to-white rounded-2xl border border-zinc-100">
                <p className="text-zinc-700 leading-relaxed">{fashionDNA.culturalContext}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modern Interpretation */}
        <div className="overflow-hidden">
          <button
            onClick={() => toggleSection('modern')}
            className="w-full p-6 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                <Sparkles size={18} className="text-zinc-600" />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400 font-bold">Modern Interpretation</p>
                <p className="text-sm text-zinc-600">Contemporary relevance</p>
              </div>
            </div>
            {expandedSection === 'modern' ? (
              <ChevronUp size={20} className="text-zinc-400" />
            ) : (
              <ChevronDown size={20} className="text-zinc-400" />
            )}
          </button>

          {expandedSection === 'modern' && (
            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
              <div className="p-6 bg-gradient-to-br from-zinc-50 to-white rounded-2xl border border-zinc-100">
                <p className="text-zinc-700 leading-relaxed">{fashionDNA.modernInterpretation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Luxury Footer */}
      <div className="p-6 bg-gradient-to-r from-zinc-50 to-white border-t border-zinc-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <Sparkles className="text-white w-4 h-4" />
            </div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-medium">Aura Stylist</p>
          </div>
          <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-300">Fashion Intelligence</p>
        </div>
      </div>
    </div>
  );
};

export default FashionDNACard;
