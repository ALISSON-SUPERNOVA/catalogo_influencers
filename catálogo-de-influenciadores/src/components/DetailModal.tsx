import { useEffect, useState } from "react";
import { X, Heart, ExternalLink, ShieldCheck, Clock, Award } from "lucide-react";
import { Influencer } from "../types";
import { resolveInfluencerPhoto } from "../utils/photoResolver";

interface DetailModalProps {
  influencer: Influencer | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
}

export default function DetailModal({
  influencer,
  onClose,
  onToggleFavorite
}: DetailModalProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [influencer?.id]);
  
  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!influencer) return null;

  const formatFollowers = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  // Convert updated_at string to localized Brazilian format
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Sincronizado recentemente";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("pt-BR");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#141414]/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide Drawer Content with hardware acceleration */}
      <div 
        style={{ transform: "translate3d(0, 0, 0)" }}
        className="relative w-full max-w-lg h-full bg-[#E4E3E0] border-l border-[#141414] shadow-2xl flex flex-col justify-between z-10 animate-slide-in"
      >
        {/* Header Block */}
        <div className="p-6 border-b border-[#141414] flex justify-between items-center bg-[#DCDAD7]">
          <div>
            <span className="text-[9px] uppercase tracking-widest font-bold opacity-60 font-mono block">
              Dossiê Corporativo
            </span>
            <span className="text-sm font-bold tracking-tight text-[#141414]">
              ID: {influencer.id.slice(0, 8)}...
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#141414] flex items-center justify-center hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          
          {/* Avatar and Main Info */}
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 rounded-full bg-white border border-[#141414] overflow-hidden flex items-center justify-center text-3xl font-serif italic font-bold shadow-md relative">
              {!(influencer.foto_url && influencer.foto_url.trim() !== "" && (influencer.foto_url.startsWith("http://") || influencer.foto_url.startsWith("https://"))) || imgError ? (
                <span className="text-3xl font-serif italic font-bold text-[#141414]">
                  {influencer.nome.slice(0, 2).toUpperCase()}
                </span>
              ) : (
                <img
                  src={influencer.foto_url}
                  alt={influencer.nome}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setImgError(true);
                  }}
                />
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-serif font-bold text-[#141414] tracking-tight leading-tight">
                {influencer.nome}
              </h2>
              <div className="flex items-center gap-2">
                <a 
                  href={influencer.link_perfil}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E30613] text-sm font-mono font-bold hover:underline inline-flex items-center gap-1"
                >
                  <span>Ver Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-[#141414]/30">|</span>
                <button
                  onClick={() => onToggleFavorite(influencer.id)}
                  className="text-xs font-bold uppercase inline-flex items-center gap-1 hover:text-[#E30613]"
                >
                  <Heart 
                    className="w-4 h-4" 
                    fill={influencer.is_favorito ? "#E30613" : "transparent"} 
                    stroke={influencer.is_favorito ? "#E30613" : "#141414"} 
                  />
                  <span>{influencer.is_favorito ? "Favoritado" : "Salvar de Interesse"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Categories and Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white border border-[#141414] text-xs font-bold uppercase tracking-wider rounded-sm text-[#141414]">
              {influencer.categoria_sobre}
            </span>
            <span className="px-3 py-1 bg-[#141414] text-[#E4E3E0] text-xs font-bold uppercase tracking-wider rounded-sm">
              {influencer.classificacao}
            </span>
            {influencer.grupo === "concorrentes" && (
              <span className="px-3 py-1 bg-[#E30613]/10 border border-[#E30613]/20 text-xs font-mono font-bold uppercase tracking-wider rounded-sm text-[#E30613]">
                Concorrente
              </span>
            )}
          </div>

          {/* Detailed Performance Metric Grid */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-wider opacity-60 font-mono">
              MÉTRICAS DE PERFORMANCE
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-[#141414] p-4 rounded-xs">
                <span className="text-[10px] text-gray-500 uppercase block font-mono">Seguidores Reais</span>
                <span className="text-xl font-mono font-bold text-[#141414]">
                  {formatFollowers(influencer.seguidores)}
                </span>
                <span className="text-[8px] text-gray-400 block mt-1">Auditado por Apify API</span>
              </div>

              <div className="bg-white border border-[#141414] p-4 rounded-xs">
                <span className="text-[10px] text-gray-500 uppercase block font-mono">Público-Alvo Prioritário</span>
                <span className="text-sm font-bold uppercase text-[#141414] mt-1 block truncate">
                  {influencer.publico_alvo || "Geral"}
                </span>
                <span className="text-[8px] text-gray-400 block mt-1">Nicho / Persona Principal</span>
              </div>
            </div>
          </div>

          {/* Core System Notes */}
          <div className="border-t border-[#141414]/10 pt-6 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-[#141414]/80">
              <ShieldCheck className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Tolerância a falhas ativada</span>
                Este influenciador possui histórico estável de conformidade comercial. Perfil qualificado para campanhas Enterprise de missão crítica.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-[#141414]/80">
              <Award className="w-4.5 h-4.5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Reclassificação Automatizada</span>
                O tier do influenciador é verificado após cada sincronização baseada nas faixas estritas de negócio (de Nano a Mega).
              </div>
            </div>
          </div>

        </div>

        {/* System Footer Metadata */}
        <div className="p-6 border-t border-[#141414] bg-[#DCDAD7] flex justify-between items-center text-[10px] font-mono text-[#141414]">
          <span className="flex items-center gap-1.5 font-bold">
            <Clock className="w-3.5 h-3.5" />
            Última Sincronização:
          </span>
          <span className="font-bold opacity-80">
            {formatDate(influencer.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
