import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal, Lock, LogOut, Check, ChevronLeft, ChevronRight, ChevronDown, Heart } from "lucide-react";

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
  adminEmail: string;
  adminPhoto: string;
  onLogout: () => void;

  activeTab: "catalogo" | "casting" | "favoritos";
  setActiveTab: (tab: "catalogo" | "casting" | "favoritos") => void;
  showCompetitors: boolean;
  setShowCompetitors: (show: boolean) => void;
}

function getDisplayName(email: string): string {
  if (!email) return "Administrador";
  const localPart = email.split("@")[0];
  return localPart
    .split(/[._]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getUserInitials(name: string): string {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Cropped versions — the originals ship on a huge mostly-transparent canvas (1921x1080)
// with the actual wordmark occupying a thin band in the middle, so they render tiny/thin
// no matter how large the <img> height is set. These are the same art, trimmed to content.
const LOGO_FULL = "https://aesudwzpjegszprgasez.supabase.co/storage/v1/object/public/Logos/Horizontal%20Preto%20Recortado.png";
const LOGO_REDUCED = "https://aesudwzpjegszprgasez.supabase.co/storage/v1/object/public/Logos/Reduzido%20Preto%20Recortado.png";

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
  adminEmail,
  adminPhoto,
  onLogout,
  activeTab,
  setActiveTab,
  showCompetitors,
  setShowCompetitors
}: FilterPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [collapsed, setCollapsed] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const displayName = getDisplayName(adminEmail);
  const initials = getUserInitials(displayName);

  // Close the user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  const handleUserButtonClick = () => {
    if (isAdminLoggedIn) {
      setUserMenuOpen(prev => !prev);
    } else {
      onOpenAdmin();
    }
  };

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

  const toggleFavoritesView = () => {
    setActiveTab(activeTab === "favoritos" ? "catalogo" : "favoritos");
  };

  // Helper to format large numbers
  const formatFollowers = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const classifications = ["Nanoinfluenciador", "Microinfluenciador", "Macro influencidor", "Mega influenciador"];

  // Collapsed rail: icons + reduced logo only
  if (collapsed) {
    return (
      <aside className="w-20 border-r border-line flex flex-col items-center h-full bg-canvas shrink-0 py-6 gap-6 transition-all duration-200 ease-in-out">
        <button
          onClick={() => setCollapsed(false)}
          className="w-9 h-9 rounded-lg border border-line flex items-center justify-center hover:bg-canvas-muted transition-colors duration-150 cursor-pointer"
          title="Expandir menu"
        >
          <ChevronRight className="w-4 h-4 text-ink" />
        </button>

        <img src={LOGO_REDUCED} alt="Supernova" className="h-9 w-auto object-contain" />

        <div className="flex-1 flex flex-col items-center gap-3 mt-2">
          <button
            onClick={toggleFavoritesView}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors duration-150 cursor-pointer ${
              activeTab === "favoritos" ? "bg-accent border-accent" : "border-line hover:bg-canvas-muted"
            }`}
            title="Favoritos"
          >
            <Heart
              className="w-4 h-4"
              fill={activeTab === "favoritos" ? "white" : "transparent"}
              stroke={activeTab === "favoritos" ? "white" : "#E30613"}
            />
          </button>
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={handleUserButtonClick}
            className="w-9 h-9 rounded-full bg-accent/10 border border-line overflow-hidden flex items-center justify-center hover:bg-canvas-muted transition-colors duration-150 cursor-pointer relative text-[10px] font-semibold text-accent"
            title={isAdminLoggedIn ? displayName : "Sistema administrativo"}
          >
            {isAdminLoggedIn ? (
              adminPhoto ? <img src={adminPhoto} alt={displayName} className="w-full h-full object-cover" /> : initials
            ) : (
              <Lock className="w-4 h-4 text-accent" />
            )}
            {isAdminLoggedIn && (
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 border border-canvas" title="Autenticado"></span>
            )}
          </button>

          {userMenuOpen && isAdminLoggedIn && (
            <div className="absolute bottom-0 left-full ml-2 w-56 bg-canvas border border-line rounded-lg shadow-soft p-3 z-20">
              <div className="flex items-center gap-2.5 pb-3 border-b border-line mb-2">
                <div className="w-9 h-9 rounded-full bg-accent/10 border border-line overflow-hidden flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                  {adminPhoto ? <img src={adminPhoto} alt={displayName} className="w-full h-full object-cover" /> : initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{displayName}</p>
                  <p className="text-[10px] text-ink-soft truncate">{adminEmail}</p>
                </div>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); onOpenAdmin(); }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium text-ink hover:bg-canvas-muted transition-colors duration-150 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-accent" />
                <span>Sistema administrativo</span>
              </button>
              <button
                onClick={() => { setUserMenuOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium text-ink hover:bg-canvas-muted transition-colors duration-150 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-ink-soft" />
                <span>Sair</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-full md:w-72 border-r border-line flex flex-col h-full bg-canvas text-ink shrink-0 transition-all duration-200 ease-in-out">
      {/* Header Panel */}
      <div className="p-6 bg-canvas border-b border-line flex items-start justify-between gap-2">
        <div>
          <img src={LOGO_FULL} alt="Supernova" className="h-9 w-auto" />
          <p className="text-[9px] uppercase tracking-widest text-ink-soft mt-2 font-sans font-medium flex items-center gap-1">
            <span>POWERED BY SUPERS</span> <span className="text-accent font-sans italic text-xs animate-pulse">*</span>
          </p>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="w-8 h-8 shrink-0 rounded-lg border border-line flex items-center justify-center hover:bg-canvas-muted transition-colors duration-150 cursor-pointer"
          title="Recolher menu"
        >
          <ChevronLeft className="w-4 h-4 text-ink" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
        {/* Favoritos nav */}
        <button
          onClick={toggleFavoritesView}
          className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors duration-150 text-xs font-semibold uppercase tracking-wider cursor-pointer ${
            activeTab === "favoritos"
              ? "bg-accent text-white border-accent shadow-soft"
              : "bg-transparent text-ink border-line hover:bg-canvas-muted"
          }`}
        >
          <Heart
            className="w-4 h-4 shrink-0"
            fill={activeTab === "favoritos" ? "white" : "transparent"}
            stroke={activeTab === "favoritos" ? "white" : "#E30613"}
          />
          <span>Favoritos</span>
        </button>

        {/* Refinar busca accordion */}
        <section className="border border-line rounded-lg overflow-hidden">
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-canvas-subtle hover:bg-canvas-muted transition-colors duration-150 cursor-pointer"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-accent" />
              Refinar busca
            </span>
            <ChevronDown className={`w-4 h-4 text-ink-soft transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`} />
          </button>

          <div className={`grid transition-all duration-200 ease-in-out ${filtersOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div className="p-4 space-y-6 border-t border-line">
                {/* Search with Pulse Loader */}
                <section>
                  <label className="text-[11px] font-semibold uppercase mb-2 block text-accent italic font-sans tracking-wider">
                    01. Busca Inteligente
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={localSearch}
                      onChange={(e) => setLocalSearch(e.target.value)}
                      placeholder="Nome ou nicho..."
                      className="w-full bg-canvas-subtle border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent transition-all duration-150 placeholder:italic text-ink font-medium"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                      <div className={`w-1.5 h-1.5 bg-ink rounded-full ${localSearch !== searchQuery ? 'animate-pulse' : 'opacity-40'}`}></div>
                      <div className={`w-1.5 h-1.5 bg-ink rounded-full delay-75 ${localSearch !== searchQuery ? 'animate-pulse' : 'opacity-40'}`}></div>
                    </div>
                  </div>
                </section>

                {/* Ramo de Atuação (Categorias) */}
                <section>
                  <label className="text-[11px] font-semibold uppercase mb-3 block text-accent italic font-sans tracking-wider">
                    02. Ramo de Atuação
                  </label>
                  {categories.length === 0 ? (
                    <p className="text-xs text-ink-soft italic">Carregando categorias...</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {categories.map((cat) => {
                        const isChecked = selectedCategories.includes(cat);
                        return (
                          <label key={cat} className="flex items-center text-xs gap-2 cursor-pointer font-medium hover:opacity-75 text-ink">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCategory(cat)}
                              className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
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
                  <label className="text-[11px] font-semibold uppercase mb-3 block text-accent italic font-sans tracking-wider">
                    03. Classificação
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {classifications.map((tier) => {
                      const isSelected = selectedTiers.includes(tier);
                      return (
                        <button
                          key={tier}
                          onClick={() => toggleTier(tier)}
                          className={`border rounded-lg py-2 px-2 text-[10px] font-semibold uppercase transition-colors duration-150 tracking-wider cursor-pointer ${
                            isSelected
                              ? "bg-accent text-white border-accent shadow-soft"
                              : "bg-transparent text-ink-soft border-line hover:bg-canvas-muted"
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
                  <label className="text-[11px] font-semibold uppercase mb-3 block text-accent italic font-sans tracking-wider">
                    04. Redes Sociais
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {["instagram", "tiktok"].map((social) => {
                      const isChecked = selectedSocials.includes(social);
                      return (
                        <label key={social} className="flex items-center text-xs gap-2 cursor-pointer font-medium hover:opacity-75 capitalize text-ink">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSocial(social)}
                            className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
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
                    <label className="text-[11px] font-semibold uppercase text-accent italic font-sans tracking-wider">
                      05. Seguidores Mínimos
                    </label>
                    <span className="text-[10px] font-sans font-semibold text-ink-soft">
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
                    className="w-full h-1 bg-canvas-muted appearance-none rounded-full accent-accent cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] font-sans text-ink-soft opacity-70">
                    <span>0</span>
                    <span>{formatFollowers(absoluteMaxFollowers)}</span>
                  </div>
                </section>

                {/* 06. Influenciadores de concorrentes */}
                {activeTab === "catalogo" && (
                  <section className="space-y-3">
                    <label className="text-[11px] font-semibold uppercase block text-accent italic font-sans tracking-wider">
                      06. Grupo de Influenciadores
                    </label>
                    <label className="flex items-center text-xs gap-2.5 cursor-pointer font-medium hover:opacity-75 text-ink py-1">
                      <input
                        type="checkbox"
                        id="competitors-filter-checkbox"
                        checked={showCompetitors}
                        onChange={(e) => {
                          setShowCompetitors(e.target.checked);
                        }}
                        className="w-4 h-4 rounded border-line accent-accent cursor-pointer"
                      />
                      <span className="font-semibold uppercase tracking-wider text-[10px]">Influenciadores de concorrentes</span>
                    </label>
                  </section>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer: User menu */}
      <div className="p-4 border-t border-line bg-canvas relative" ref={userMenuRef}>
        <button
          onClick={handleUserButtonClick}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-canvas-muted transition-colors duration-150 cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-full bg-accent/10 border border-line overflow-hidden flex items-center justify-center text-[10px] font-semibold text-accent shrink-0 relative">
            {isAdminLoggedIn ? (
              adminPhoto ? <img src={adminPhoto} alt={displayName} className="w-full h-full object-cover" /> : initials
            ) : (
              <Lock className="w-3.5 h-3.5 text-accent" />
            )}
            {isAdminLoggedIn && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-canvas" title="Autenticado"></span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-ink truncate">
              {isAdminLoggedIn ? displayName : "Sistema administrativo"}
            </p>
            {isAdminLoggedIn && <p className="text-[9px] text-ink-soft truncate">Ver opções</p>}
          </div>
        </button>

        {userMenuOpen && isAdminLoggedIn && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-canvas border border-line rounded-lg shadow-soft p-3 z-20">
            <div className="flex items-center gap-2.5 pb-3 border-b border-line mb-2">
              <div className="w-9 h-9 rounded-full bg-accent/10 border border-line overflow-hidden flex items-center justify-center text-xs font-semibold text-accent shrink-0">
                {adminPhoto ? <img src={adminPhoto} alt={displayName} className="w-full h-full object-cover" /> : initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ink truncate">{displayName}</p>
                <p className="text-[10px] text-ink-soft truncate">{adminEmail}</p>
              </div>
            </div>
            <button
              onClick={() => { setUserMenuOpen(false); onOpenAdmin(); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium text-ink hover:bg-canvas-muted transition-colors duration-150 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-accent" />
              <span>Sistema administrativo</span>
            </button>
            <button
              onClick={() => { setUserMenuOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-xs font-medium text-ink hover:bg-canvas-muted transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-ink-soft" />
              <span>Sair</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
