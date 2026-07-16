import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, Lock, Check } from "lucide-react";

interface FilterPanelProps {
  categories: string[];
  selectedCategories: string[];
  setSelectedCategories: (cats: string[]) => void;
  
  selectedTiers: string[];
  setSelectedTiers: (tiers: string[]) => void;

  selectedSocials: string[];
  setSelectedSocials: (socials: string[]) => void;

  minFollowers: number;
  setMinFollowers: (f: number) => void;
  absoluteMaxFollowers: number;

  searchQuery: string;
  setSearchQuery: (q: string) => void;

  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;

  activeTab: "catalogo" | "casting";
  showCompetitors: boolean;
  setShowCompetitors: (show: boolean) => void;
}

export default function FilterPanel({
  categories,
  selectedCategories,
  setSelectedCategories,
  selectedTiers,
  setSelectedTiers,
  selectedSocials,
  setSelectedSocials,
  minFollowers,
  setMinFollowers,
  absoluteMaxFollowers,
  searchQuery,
  setSearchQuery,
  onOpenAdmin,
  isAdminLoggedIn,
  activeTab,
  showCompetitors,
  setShowCompetitors
}: FilterPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Client-side 300ms Debounce for text search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [localSearch, setSearchQuery]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleTier = (tier: string) => {
    if (selectedTiers.includes(tier)) {
      setSelectedTiers(selectedTiers.filter(t => t !== tier));
    } else {
      setSelectedTiers([...selectedTiers, tier]);
    }
  };

  const toggleSocial = (social: string) => {
    if (selectedSocials.includes(social)) {
      setSelectedSocials(selectedSocials.filter(s => s !== social));
    } else {
      setSelectedSocials([...selectedSocials, social]);
    }
  };

  // Helper to format large numbers
  const formatFollowers = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const classifications = ["Nanoinfluenciador", "Microinfluenciador", "Macro influencidor", "Mega influenciador"];

  return (
    <aside className="w-full md:w-72 border-r border-[#141414] flex flex-col h-full bg-[#0c0c0c] text-white shrink-0">
      {/* Header Panel */}
      <div className="p-6 bg-[#E30613] border-b border-[#141414] text-black">
        <div className="flex items-center gap-1.5">
          <span className="font-serif italic text-3xl font-extrabold tracking-tighter leading-none">supernova</span>
        </div>
        <p className="text-[9px] uppercase tracking-widest text-black/75 mt-1 font-mono font-bold flex items-center gap-1">
          <span>POWERED BY SUPERS</span> <span className="text-black font-serif italic text-xs animate-pulse">*</span>
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 select-none">
        {/* Search with Pulse Loader */}
        <section>
          <label className="text-[11px] font-bold uppercase mb-2 block text-[#E30613] italic font-serif tracking-wider">
            01. Busca Inteligente
          </label>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Nome ou nicho..."
              className="w-full bg-white border border-[#141414] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#E30613] transition-all placeholder:italic text-black font-medium"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
              <div className={`w-1.5 h-1.5 bg-black rounded-full ${localSearch !== searchQuery ? 'animate-pulse' : 'opacity-40'}`}></div>
              <div className={`w-1.5 h-1.5 bg-black rounded-full delay-75 ${localSearch !== searchQuery ? 'animate-pulse' : 'opacity-40'}`}></div>
            </div>
          </div>
        </section>

        {/* Ramo de Atuação (Categorias) */}
        <section>
          <label className="text-[11px] font-bold uppercase mb-3 block text-[#E30613] italic font-serif tracking-wider">
            02. Ramo de Atuação
          </label>
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Carregando categorias...</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isChecked = selectedCategories.includes(cat);
                return (
                  <label key={cat} className="flex items-center text-xs gap-2 cursor-pointer font-medium hover:opacity-85 text-white/95">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(cat)}
                      className="w-4 h-4 rounded-none border-white/20 text-[#E30613] accent-[#E30613] cursor-pointer"
                    />
                    <span>{cat}</span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Classificação Buttons */}
        <section>
          <label className="text-[11px] font-bold uppercase mb-3 block text-[#E30613] italic font-serif tracking-wider">
            03. Classificação
          </label>
          <div className="grid grid-cols-2 gap-2">
            {classifications.map((tier) => {
              const isSelected = selectedTiers.includes(tier);
              return (
                <button
                  key={tier}
                  onClick={() => toggleTier(tier)}
                  className={`border py-2 px-2 text-[10px] font-bold uppercase transition-all tracking-wider ${
                    isSelected
                      ? "bg-[#E30613] text-white border-[#E30613] shadow-xs"
                      : "bg-transparent text-white border-white/20 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isSelected && <Check className="w-3 h-3 text-white shrink-0" />}
                    <span className="truncate">{tier.replace("influenciador", "").replace("influencidor", "")}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Redes Sociais */}
        <section>
          <label className="text-[11px] font-bold uppercase mb-3 block text-[#E30613] italic font-serif tracking-wider">
            04. Redes Sociais
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {["instagram", "tiktok"].map((social) => {
              const isChecked = selectedSocials.includes(social);
              return (
                <label key={social} className="flex items-center text-xs gap-2 cursor-pointer font-medium hover:opacity-85 capitalize text-white/95">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSocial(social)}
                    className="w-4 h-4 rounded-none border-white/20 text-[#E30613] accent-[#E30613] cursor-pointer"
                  />
                  <span>{social}</span>
                </label>
              );
            })}
          </div>
        </section>

        {/* Followers Range */}
        <section className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="text-[11px] font-bold uppercase text-[#E30613] italic font-serif tracking-wider">
              05. Seguidores Mínimos
            </label>
            <span className="text-[10px] font-mono font-bold text-white/90">
              {minFollowers === 0 ? "Todos" : formatFollowers(minFollowers)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max={absoluteMaxFollowers}
            step="500"
            value={minFollowers}
            onChange={(e) => setMinFollowers(Number(e.target.value))}
            className="w-full h-1 bg-white/20 appearance-none rounded-full accent-[#E30613] cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-mono opacity-50">
            <span>0</span>
            <span>{formatFollowers(absoluteMaxFollowers)}</span>
          </div>
        </section>

        {/* 06. Influenciadores de concorrentes */}
        {activeTab === "catalogo" && (
          <section className="space-y-3">
            <label className="text-[11px] font-bold uppercase block text-[#E30613] italic font-serif tracking-wider">
              06. Grupo de Influenciadores
            </label>
            <label className="flex items-center text-xs gap-2.5 cursor-pointer font-medium hover:opacity-85 text-white/95 py-1">
              <input
                type="checkbox"
                id="competitors-filter-checkbox"
                checked={showCompetitors}
                onChange={(e) => {
                  setShowCompetitors(e.target.checked);
                }}
                className="w-4 h-4 rounded-none border-white/20 text-[#E30613] accent-[#E30613] cursor-pointer"
              />
              <span className="font-bold uppercase tracking-wider text-[10px]">Influenciadores de concorrentes</span>
            </label>
          </section>
        )}
      </div>

      {/* Footer Admin Toggle */}
      <div className="p-6 border-t border-white/10 bg-[#141414] text-white/80">
        <button
          onClick={onOpenAdmin}
          className="text-[11px] font-bold flex items-center gap-2 hover:underline w-full text-left tracking-wider hover:text-white"
        >
          <Lock className="w-4 h-4 text-[#E30613]" />
          <span>SISTEMA ADMINISTRATIVO</span>
          {isAdminLoggedIn && (
            <span className="ml-auto w-2.5 h-2.5 rounded-full bg-green-500 border border-[#0c0c0c]" title="Autenticado"></span>
          )}
        </button>
      </div>
    </aside>
  );
}
