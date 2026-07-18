import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, RefreshCw, Layers, ShieldCheck, Heart, AlertTriangle, Database, ShieldAlert } from "lucide-react";
import { Influencer, normalizeCategory } from "./types";
import FilterPanel from "./components/FilterPanel";
import InfluencerCard from "./components/InfluencerCard";
import DetailModal from "./components/DetailModal";
import AdminPanel from "./components/AdminPanel";
import LoginScreen from "./components/LoginScreen";

export default function App() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [activeTab, setActiveTab] = useState<"catalogo" | "casting" | "favoritos">("catalogo");
  const [showCompetitors, setShowCompetitors] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);
  const [selectedSocials, setSelectedSocials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number>(20000);
  const [minFollowers, setMinFollowers] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("followers_desc");

  // Selection & UI views state
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhoto, setAdminPhoto] = useState("");

  // Syncing States
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const [dbConnected, setDbConnected] = useState(true);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStep, setSyncStep] = useState("idle");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncElapsed, setSyncElapsed] = useState(0);
  const [syncUpdatedCount, setSyncUpdatedCount] = useState(0);

  // Load state for Admin status on startup
  useEffect(() => {
    const auth = localStorage.getItem("supernova_admin_auth") === "true";
    setIsAdminLoggedIn(auth);
    setAdminEmail(auth ? (localStorage.getItem("supernova_admin_email") || "") : "");
    setAdminPhoto(auth ? (localStorage.getItem("supernova_admin_photo") || "") : "");
  }, [isAdminOpen]);

  const handleAdminLogout = () => {
    // Note: supernova_admin_photo is intentionally kept — it's tied to the account, not
    // the session, and there's no per-email fetch endpoint to re-load it on next login yet.
    localStorage.removeItem("supernova_admin_auth");
    localStorage.removeItem("supernova_admin_email");
    setIsAdminLoggedIn(false);
    setAdminEmail("");
    setAdminPhoto("");
  };

  // Reset sorting if showing competitors and price-sorting is selected
  useEffect(() => {
    if (showCompetitors && sortBy.startsWith("price_")) {
      setSortBy("followers_desc");
    }
  }, [showCompetitors, sortBy]);

  // Load Influencers list on Mount
  const fetchInfluencers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/influencers");
      const result = await response.json();
      if (response.ok && result.success) {
        const normalizedData = (result.data || []).map((inf: Influencer) => ({
          ...inf,
          categoria_sobre: normalizeCategory(inf.categoria_sobre)
        }));
        setInfluencers(normalizedData);
        setDbConnected(true);
      } else {
        setError(result.error || "Falha ao ler influenciadores do banco.");
        setDbConnected(false);
      }
    } catch (e) {
      setError("Falha ao comunicar com o servidor de banco de dados.");
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInfluencers();
  }, []);

  // -----------------------------------------------------
  // CRITICAL OPTIMISTIC UI: FAVORITE TOGGLING
  // -----------------------------------------------------
  const handleToggleFavorite = async (id: string) => {
    // 1. Locate current value
    const index = influencers.findIndex(inf => inf.id === id);
    if (index === -1) return;

    const originalInfluencer = { ...influencers[index] };
    const originalState = originalInfluencer.is_favorito;

    // 2. Perform Optimistic update in client state
    const updatedInfluencers = [...influencers];
    updatedInfluencers[index] = {
      ...originalInfluencer,
      is_favorito: !originalState
    };
    setInfluencers(updatedInfluencers);

    // If selected influencer is currently open, sync detail view
    if (selectedInfluencer && selectedInfluencer.id === id) {
      setSelectedInfluencer({
        ...selectedInfluencer,
        is_favorito: !originalState
      });
    }

    try {
      // 3. Dispatch backend call
      const response = await fetch(`/api/influencers/toggle-favorite/${id}`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Erro de processamento backend");
      }
    } catch (err) {
      // 4. Revert state on error (Tolerância a falha)
      console.error("[OPTIMISTIC UI] Favorite toggle failed. Reverting...", err);
      const reverted = [...influencers];
      reverted[index] = originalInfluencer;
      setInfluencers(reverted);

      if (selectedInfluencer && selectedInfluencer.id === id) {
        setSelectedInfluencer(originalInfluencer);
      }
    }
  };

  // -----------------------------------------------------
  // DYNAMIC STATS EXTRACTION
  // -----------------------------------------------------
  const categories = useMemo(() => {
    return [
      "Humor",
      "Gastronomia",
      "Moda",
      "Maquiagem",
      "Decoração",
      "Entrevistador",
      "Viagem",
      "Academia"
    ];
  }, []);

  const absoluteMaxPrice = useMemo(() => {
    if (influencers.length === 0) return 20000;
    const maxVal = Math.max(...influencers.map(inf => inf.preco_estimado || 0));
    return maxVal > 0 ? Math.ceil(maxVal / 1000) * 1000 : 20000;
  }, [influencers]);

  const absoluteMaxFollowers = useMemo(() => {
    if (influencers.length === 0) return 2000000;
    const maxFol = Math.max(...influencers.map(inf => inf.seguidores || 0));
    return maxFol > 0 ? Math.ceil(maxFol / 100000) * 100000 : 2000000;
  }, [influencers]);

  // Sync maximum ranges when items load
  useEffect(() => {
    if (influencers.length > 0) {
      setMaxPrice(absoluteMaxPrice);
    }
  }, [absoluteMaxPrice, influencers]);

  // -----------------------------------------------------
  // MANAGE FORCE APIFY SYNC (REAL-TIME POLLING & TIMEOUT)
  // -----------------------------------------------------
  const handleResetSync = async () => {
    try {
      await fetch("/api/sync-reset", { method: "POST" });
    } catch (e) {}
    setSyncProgress(0);
    setSyncStep("idle");
    setSyncError(null);
    setSyncElapsed(0);
    setSyncUpdatedCount(0);
    setIsSyncing(false);
  };

  const handleForceApifySync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(5);
    setSyncStep("extracting");
    setSyncError(null);
    setSyncElapsed(0);
    setSyncUpdatedCount(0);
    setSyncMessage("Sincronização iniciada...");

    try {
      // 1. Post to start sync background job on server
      const initRes = await fetch("/api/apify-sync", { method: "POST" });
      const initResult = await initRes.json();
      if (!initRes.ok || !initResult.success) {
        throw new Error(initResult.error || "Falha ao iniciar sincronização.");
      }

      // 2. Poll progress status every 2 seconds
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch("/api/sync-status");
          if (statusRes.ok) {
            const status = await statusRes.json();
            
            // Sync React states
            setSyncProgress(status.progress);
            setSyncStep(status.step);
            setSyncElapsed(status.elapsed);
            setSyncUpdatedCount(status.updatedCount);

            if (status.step === "success") {
              clearInterval(pollInterval);
              setIsSyncing(false);
              setSyncMessage(`Sincronização concluída! ${status.updatedCount} registros atualizados.`);
              await fetchInfluencers(); // Revalidate catalog state immediately
            } else if (status.step === "error") {
              clearInterval(pollInterval);
              setIsSyncing(false);
              setSyncError(status.error || "Erro durante a sincronização.");
              setSyncMessage("Erro na sincronização.");
            }
          }
        } catch (pollErr: any) {
          console.error("Erro ao consultar progresso da sincronização:", pollErr);
        }
      }, 2000);

    } catch (err: any) {
      setIsSyncing(false);
      setSyncStep("error");
      setSyncError(err.message || "Erro de rede ao iniciar sincronização.");
      setSyncMessage("Falha ao iniciar sincronização.");
    }
  };

  // -----------------------------------------------------
  // HIGH-PERFORMANCE REACTIVE FILTERS GRID
  // -----------------------------------------------------
  const filteredInfluencers = useMemo(() => {
    return influencers.filter(inf => {
      // 0. Filter by active tab group
      const currentGroup = inf.grupo || "catalogo";

      if (activeTab === "favoritos") {
        if (!inf.is_favorito) return false;
      } else if (activeTab === "catalogo") {
        if (showCompetitors) {
          if (currentGroup !== "concorrentes") return false;
        } else {
          if (currentGroup !== "catalogo") return false;
        }
      } else {
        // casting tab
        if (currentGroup !== "casting") return false;
      }

      // 1. Text Search query (Niche or Name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = inf.nome?.toLowerCase().includes(query);
        const matchesNiche = inf.categoria_sobre?.toLowerCase().includes(query);
        if (!matchesName && !matchesNiche) return false;
      }

      // 2. Categories checkbox
      if (selectedCategories.length > 0) {
        if (!selectedCategories.includes(inf.categoria_sobre)) return false;
      }

      // 3. Tiers checkbox
      if (selectedTiers.length > 0) {
        if (!selectedTiers.includes(inf.classificacao)) return false;
      }

      // 3b. Social networks checkbox filter
      if (selectedSocials.length > 0) {
        if (!selectedSocials.includes(inf.rede_social || "instagram")) return false;
      }

      // 4. Followers range
      if (inf.seguidores < minFollowers) return false;

      // 5. Price range
      if (inf.preco_estimado > maxPrice) return false;

      return true;
    }).sort((a, b) => {
      // 6. Sorting dropdown
      if (sortBy === "followers_desc") return b.seguidores - a.seguidores;
      if (sortBy === "followers_asc") return a.seguidores - b.seguidores;
      if (sortBy === "price_asc") return a.preco_estimado - b.preco_estimado;
      if (sortBy === "price_desc") return b.preco_estimado - a.preco_estimado;
      if (sortBy === "engagement_desc") return b.engajamento - a.engajamento;
      return 0;
    });
  }, [influencers, searchQuery, selectedCategories, selectedTiers, selectedSocials, minFollowers, maxPrice, sortBy, activeTab, showCompetitors]);

  // Gate the entire platform behind login — there's no more open/public access.
  if (!isAdminLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={(loggedInEmail) => {
          setIsAdminLoggedIn(true);
          setAdminEmail(loggedInEmail);
          setAdminPhoto(localStorage.getItem("supernova_admin_photo") || "");
        }}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-canvas-subtle font-sans text-ink overflow-hidden select-none">
      
      {/* 2-Column Layout */}
      <div className="flex w-full h-full overflow-hidden flex-col md:flex-row">
        
        {/* Left column: Filter sidebar */}
        <FilterPanel
          categories={categories}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedTiers={selectedTiers}
          setSelectedTiers={setSelectedTiers}
          selectedSocials={selectedSocials}
          setSelectedSocials={setSelectedSocials}
          minFollowers={minFollowers}
          setMinFollowers={setMinFollowers}
          absoluteMaxFollowers={absoluteMaxFollowers}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAdmin={() => setIsAdminOpen(true)}
          isAdminLoggedIn={isAdminLoggedIn}
          adminEmail={adminEmail}
          adminPhoto={adminPhoto}
          onLogout={handleAdminLogout}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showCompetitors={showCompetitors}
          setShowCompetitors={setShowCompetitors}
        />

        {/* Right column: Main Catalog Grid */}
        <main className="flex-1 flex flex-col h-full bg-canvas-subtle overflow-hidden border-t md:border-t-0 border-line">

          {/* Header Bar */}
          <header className="h-16 border-b border-line flex items-center justify-between px-8 bg-canvas shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-semibold tracking-wider font-sans text-ink">
                {activeTab === "favoritos" ? "FAVORITOS" : "CATÁLOGO DINÂMICO"}
              </span>

              {/* Force APIFY Triggering feedback message */}
              {syncMessage && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-canvas border border-line rounded-lg shadow-soft text-[10px] font-sans font-semibold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span>{syncMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              {isAdminLoggedIn && (
                <button
                  onClick={handleForceApifySync}
                  disabled={isSyncing}
                  className="px-3.5 py-2 rounded-lg bg-accent text-white hover:bg-accent-ink text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none transition-colors duration-200"
                  title="Sincronizar dados do Instagram via Apify"
                >
                  <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Sincronizando..." : "Sincronizar Dados do Instagram"}</span>
                </button>
              )}

              <div className="text-[11px] font-sans font-medium text-ink-soft">
                MOSTRANDO <span className="font-semibold text-ink">{filteredInfluencers.length}</span> DE{" "}
                <span className="opacity-70">
                  {influencers.filter(inf => {
                    if (activeTab === "favoritos") return !!inf.is_favorito;
                    const currentGroup = inf.grupo || "catalogo";
                    if (activeTab === "catalogo") {
                      return showCompetitors ? currentGroup === "concorrentes" : currentGroup === "catalogo";
                    }
                    return currentGroup === activeTab;
                  }).length}
                </span>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent border-none text-[11px] font-sans font-medium uppercase focus:ring-0 cursor-pointer text-ink pr-4"
              >
                <option value="followers_desc">Seguidores (Maior p/ Menor)</option>
                <option value="followers_asc">Seguidores (Menor p/ Maior)</option>
                {!showCompetitors && <option value="price_asc">Menor Preço Post</option>}
                {!showCompetitors && <option value="price_desc">Maior Preço Post</option>}
                <option value="engagement_desc">Maior Engajamento</option>
              </select>
            </div>
          </header>
 
          {/* Sub-Header Tabs Selector */}
          <div className="flex border-b border-line bg-canvas shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("catalogo")}
              className={`px-8 py-3.5 border-r border-line text-xs font-semibold uppercase tracking-widest transition-colors duration-200 focus:outline-none ${
                activeTab === "catalogo"
                  ? "bg-accent text-white"
                  : "bg-transparent text-ink-soft hover:bg-canvas-muted hover:text-ink"
              }`}
            >
              Influenciadores
            </button>
            <button
              onClick={() => setActiveTab("casting")}
              className={`px-8 py-3.5 border-r border-line text-xs font-semibold uppercase tracking-widest transition-colors duration-200 focus:outline-none ${
                activeTab === "casting"
                  ? "bg-accent text-white"
                  : "bg-transparent text-ink-soft hover:bg-canvas-muted hover:text-ink"
              }`}
            >
              Modelos
            </button>
          </div>

          {/* Catalog grid viewport */}
          <div className="flex-1 p-8 overflow-y-auto bg-canvas-subtle">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-ink" />
                <span className="text-xs font-sans uppercase font-medium tracking-widest text-ink-soft">
                  Carregando Portfólio Supernova...
                </span>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
                <AlertTriangle className="w-12 h-12 text-danger" />
                <h4 className="text-sm font-semibold uppercase tracking-wider text-ink">Erro de Conexão Crítico</h4>
                <p className="text-xs text-ink-soft">{error}</p>
                <button
                  onClick={fetchInfluencers}
                  className="px-4 py-2 rounded-lg bg-ink text-white text-xs font-semibold uppercase tracking-wider hover:bg-accent-ink transition-colors duration-200 cursor-pointer"
                >
                  Tentar Reconectar Banco
                </button>
              </div>
            ) : filteredInfluencers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-line rounded-xl p-6">
                <Layers className="w-10 h-10 opacity-40 text-ink" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-widest text-ink-soft">
                    {activeTab === "favoritos" ? "Nenhum Favorito Ainda" : "Nenhum Influenciador Encontrado"}
                  </p>
                  <p className="text-[11px] text-ink-soft max-w-sm mx-auto">
                    {activeTab === "favoritos"
                      ? "Clique no coração de um perfil para salvá-lo aqui."
                      : "Tente ajustar os sliders ou termos da busca lateral."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredInfluencers.map((influencer) => (
                  <InfluencerCard
                    key={influencer.id}
                    influencer={influencer}
                    onToggleFavorite={handleToggleFavorite}
                    onViewDetails={setSelectedInfluencer}
                  />
                ))}

                {/* Empty Slot Demo Placeholder matching requested theme layout */}
                <div className="border-2 border-dashed border-line rounded-xl flex flex-col items-center justify-center p-8 text-center bg-canvas/60 relative min-h-[300px]">
                  <span className="text-[10px] uppercase font-semibold text-ink-soft tracking-widest font-sans">
                    Slot Disponível
                  </span>
                  <span className="text-[9px] text-ink-soft font-sans uppercase mt-1">
                    Filtro Dinâmico Ativo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Status Footer */}
          <footer className="h-10 bg-canvas border-t border-line text-ink-soft flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-6 text-[10px] font-sans">
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span>DB STATUS: {dbConnected ? "CONECTADO (SUPABASE)" : "ERRO"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-500 animate-spin' : 'bg-green-500 animate-pulse'}`}></div>
                <span>APIFY ENGINE: {isSyncing ? "SYNC EM ANDAMENTO" : "PRONTO"}</span>
              </span>
            </div>
          </footer>

        </main>
      </div>

      {/* Detail Slide-Over Modal */}
      <DetailModal
        influencer={selectedInfluencer}
        onClose={() => setSelectedInfluencer(null)}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Admin Panel Overlay */}
      {isAdminOpen && (
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
          onLogout={handleAdminLogout}
          influencers={influencers}
          onRefreshData={fetchInfluencers}
          onForceApifySync={handleForceApifySync}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
          syncStep={syncStep}
          syncError={syncError}
          syncElapsed={syncElapsed}
          syncUpdatedCount={syncUpdatedCount}
          onResetSync={handleResetSync}
        />
      )}

      {/* Global Sync Blocking Loading Overlay */}
      {isSyncing && (
        <div className="fixed inset-0 z-[70] bg-ink/60 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none">
          <div className="w-full max-w-md bg-canvas rounded-2xl border border-line p-8 space-y-6 relative shadow-soft">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-accent animate-pulse" />
                <h3 className="text-sm font-semibold uppercase tracking-wider font-sans text-ink">Sincronização em Tempo Real</h3>
              </div>
              <span className="text-xs font-sans font-semibold text-accent bg-accent/10 px-2 py-0.5 border border-accent/30 rounded-lg animate-pulse">
                {syncElapsed}s
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline text-xs font-sans">
                <span className="uppercase text-ink-soft">Etapa Atual</span>
                <span className="text-ink font-semibold">{syncProgress}%</span>
              </div>

              {/* Real-time progress bar */}
              <div className="w-full h-3 bg-canvas-muted border border-line rounded-lg overflow-hidden">
                <div
                  className="h-full bg-accent transition-all duration-300 ease-in-out"
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>

              <div className="bg-canvas-subtle border border-line rounded-lg p-4 min-h-[70px] flex items-center justify-center text-center">
                <p className="text-xs text-ink-soft font-sans leading-relaxed">
                  {syncStep === "extracting" && "Etapa 1: Selecionando perfis do Instagram pendentes de sincronização..."}
                  {syncStep === "syncing" && "Etapa 2: Executando o Instagram Profile Scraper na Apify..."}
                  {syncStep === "saving" && "Etapa 3: Salvando seguidores e fotos atualizados no Supabase..."}
                  {syncStep === "success" && "Sincronização realizada com total sucesso!"}
                  {syncStep === "error" && "Erro durante a execução do robô."}
                </p>
              </div>
            </div>

            <div className="border-t border-line pt-4 text-center text-[10px] font-sans text-ink-soft uppercase tracking-widest">
              Não feche esta janela. O bloqueio evita inconsistências concorrentes de dados.
            </div>
          </div>
        </div>
      )}

      {/* Explanatory Sync Error Modal */}
      {syncError && (
        <div className="fixed inset-0 z-[80] bg-ink/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-canvas rounded-2xl border border-line shadow-soft p-6 space-y-4 relative">
            <div className="w-12 h-12 bg-red-100 rounded-full border border-red-600 flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h4 className="text-base font-semibold font-sans text-center text-ink uppercase tracking-wide">
              Falha de Sincronização Apify
            </h4>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-left">
              <p className="text-xs font-sans text-red-800 leading-relaxed break-words">
                <span className="font-semibold block uppercase mb-1">Causa Raiz do Erro:</span>
                {syncError}
              </p>
            </div>

            <p className="text-xs text-ink-soft leading-relaxed text-center">
              Os dados existentes no catálogo continuam protegidos e intactos. O robô foi interrompido com segurança para evitar consumo desnecessário de seus créditos.
            </p>

            <button
              onClick={handleResetSync}
              className="w-full py-2.5 rounded-lg bg-ink text-white hover:bg-accent-ink transition-colors duration-200 text-xs font-sans font-semibold uppercase tracking-wider cursor-pointer"
            >
              Entendido & Dispensar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
