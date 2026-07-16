import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, RefreshCw, Layers, ShieldCheck, Heart, AlertTriangle, Database, ShieldAlert } from "lucide-react";
import { Influencer, normalizeCategory } from "./types";
import FilterPanel from "./components/FilterPanel";
import InfluencerCard from "./components/InfluencerCard";
import DetailModal from "./components/DetailModal";
import AdminPanel from "./components/AdminPanel";

export default function App() {
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [activeTab, setActiveTab] = useState<"catalogo" | "casting">("catalogo");
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
  }, [isAdminOpen]);

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
      
      if (activeTab === "catalogo") {
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

  return (
    <div className="flex h-screen w-full bg-[#F2F1EE] font-sans text-[#141414] overflow-hidden select-none">
      
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
          activeTab={activeTab}
          showCompetitors={showCompetitors}
          setShowCompetitors={setShowCompetitors}
        />

        {/* Right column: Main Catalog Grid */}
        <main className="flex-1 flex flex-col h-full bg-[#F2F1EE] overflow-hidden border-t md:border-t-0 border-[#141414]">
          
          {/* Header Bar */}
          <header className="h-16 border-b border-[#141414] flex items-center justify-between px-8 bg-[#F2F1EE] shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[11px] font-bold tracking-wider font-mono text-[#0c0c0c]">CATÁLOGO DINÂMICO</span>
              
              {/* Force APIFY Triggering feedback message */}
              {syncMessage && (
                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-white border border-[#141414] rounded-sm text-[10px] font-mono font-bold animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  <span>{syncMessage}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-6">
              <button
                onClick={handleForceApifySync}
                disabled={isSyncing}
                className="px-3.5 py-2 border border-[#141414] bg-[#E30613] text-white hover:bg-[#141414] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 select-none transition-colors"
                title="Sincronizar dados do Instagram via Apify"
              >
                <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isSyncing ? "animate-spin" : ""}`} />
                <span>{isSyncing ? "Sincronizando..." : "Sincronizar Dados do Instagram"}</span>
              </button>

              <div className="text-[11px] font-mono font-bold">
                MOSTRANDO <span className="font-bold text-[#141414]">{filteredInfluencers.length}</span> DE{" "}
                <span className="opacity-50">
                  {influencers.filter(inf => {
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
                className="bg-transparent border-none text-[11px] font-mono font-bold uppercase focus:ring-0 cursor-pointer text-[#141414] pr-4"
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
          <div className="flex border-b border-[#141414] bg-[#0c0c0c] shrink-0 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("catalogo")}
              className={`px-8 py-3.5 border-r border-[#141414] text-xs font-bold uppercase tracking-widest transition-all duration-200 focus:outline-none ${
                activeTab === "catalogo"
                  ? "bg-[#E30613] text-white"
                  : "bg-transparent text-[#e4e3e0]/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              Influenciadores
            </button>
            <button
              onClick={() => setActiveTab("casting")}
              className={`px-8 py-3.5 border-r border-[#141414] text-xs font-bold uppercase tracking-widest transition-all duration-200 focus:outline-none ${
                activeTab === "casting"
                  ? "bg-[#E30613] text-white"
                  : "bg-transparent text-[#e4e3e0]/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              Modelos
            </button>
          </div>

          {/* Catalog grid viewport */}
          <div className="flex-1 p-8 overflow-y-auto bg-[#F2F1EE]">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#141414]" />
                <span className="text-xs font-mono uppercase font-bold tracking-widest opacity-60">
                  Carregando Portfólio Supernova...
                </span>
              </div>
            ) : error ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 max-w-md mx-auto text-center">
                <AlertTriangle className="w-12 h-12 text-[#ff3b30]" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#141414]">Erro de Conexão Crítico</h4>
                <p className="text-xs text-gray-600">{error}</p>
                <button
                  onClick={fetchInfluencers}
                  className="px-4 py-2 bg-[#141414] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#333] transition-colors cursor-pointer"
                >
                  Tentar Reconectar Banco
                </button>
              </div>
            ) : filteredInfluencers.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-[#141414]/10 rounded-sm p-6">
                <Layers className="w-10 h-10 opacity-30 text-[#141414]" />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">
                    {activeTab === "concorrentes" ? "Nenhum Influenciador de Concorrentes" : "Nenhum Influenciador Encontrado"}
                  </p>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    {activeTab === "concorrentes"
                      ? "Nenhum influenciador de concorrentes atende aos filtros atuais."
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
                <div className="border-2 border-dashed border-[#141414]/20 flex flex-col items-center justify-center p-8 text-center bg-white/10 relative min-h-[300px]">
                  <span className="text-[10px] uppercase font-bold opacity-30 tracking-widest font-mono">
                    Slot Disponível
                  </span>
                  <span className="text-[9px] text-gray-500 font-mono uppercase mt-1">
                    Filtro Dinâmico Ativo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Status Footer */}
          <footer className="h-10 bg-[#141414] text-[#E4E3E0] flex items-center justify-between px-8 shrink-0">
            <div className="flex items-center gap-6 text-[10px] font-mono">
              <span className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${dbConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span>DB STATUS: {dbConnected ? "CONECTADO (FIRESTORE)" : "ERRO"}</span>
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
        <div className="fixed inset-0 z-[70] bg-[#141414]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white select-none">
          <div className="w-full max-w-md bg-[#1E1E1E] border border-white/20 p-8 space-y-6 relative shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#E30613] animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-white">Sincronização em Tempo Real</h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#E30613] bg-[#E30613]/10 px-2 py-0.5 border border-[#E30613]/30 rounded-xs animate-pulse">
                {syncElapsed}s / 120s
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline text-xs font-mono">
                <span className="uppercase text-gray-400">Etapa Atual</span>
                <span className="text-white font-bold">{syncProgress}%</span>
              </div>
              
              {/* Real-time progress bar */}
              <div className="w-full h-3 bg-white/5 border border-white/10 rounded-none overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#E30613] to-red-500 transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                ></div>
              </div>

              <div className="bg-black/40 border border-white/5 p-4 rounded-none min-h-[70px] flex items-center justify-center text-center">
                <p className="text-xs text-gray-300 font-mono leading-relaxed">
                  {syncStep === "extracting" && "Etapa 1: Sanitizando URLs e extraindo usernames dos influenciadores..."}
                  {syncStep === "triggering" && "Etapa 2: Enviando requisição HTTP POST para iniciar o Scraper na Apify..."}
                  {syncStep === "polling" && "Etapa 3: Robô em execução na nuvem. Consultando status a cada 5 segundos..."}
                  {syncStep === "saving" && "Etapa 4: Coletando resultados finais, atualizando seguidores e rodando trigger de classificação..."}
                  {syncStep === "success" && "Sincronização realizada com total sucesso!"}
                  {syncStep === "error" && "Erro durante a execução do robô."}
                </p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 text-center text-[10px] font-mono text-gray-500 uppercase tracking-widest">
              Não feche esta janela. O bloqueio evita inconsistências concorrentes de dados.
            </div>
          </div>
        </div>
      )}

      {/* Explanatory Sync Error Modal */}
      {syncError && (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border-2 border-[#141414] shadow-2xl p-6 space-y-4 relative">
            <div className="w-12 h-12 bg-red-100 rounded-full border border-red-600 flex items-center justify-center mx-auto text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h4 className="text-base font-bold font-serif text-center text-[#141414] uppercase tracking-wide">
              Falha de Sincronização Apify
            </h4>

            <div className="bg-red-50 border border-red-200 p-4 rounded-none text-left">
              <p className="text-xs font-mono text-red-800 leading-relaxed break-words">
                <span className="font-bold block uppercase mb-1">Causa Raiz do Erro:</span>
                {syncError}
              </p>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed text-center">
              Os dados existentes no catálogo continuam protegidos e intactos. O robô foi interrompido com segurança para evitar consumo desnecessário de seus créditos.
            </p>

            <button
              onClick={handleResetSync}
              className="w-full py-2.5 bg-[#141414] text-white hover:bg-[#333] transition-colors text-xs font-mono font-bold uppercase tracking-wider border border-[#141414] cursor-pointer"
            >
              Entendido & Dispensar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
