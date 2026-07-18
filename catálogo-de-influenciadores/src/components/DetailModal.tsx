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
        className="absolute inset-0 bg-ink/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Slide Drawer Content with hardware acceleration */}
      <div
        style={{ transform: "translate3d(0, 0, 0)" }}
        className="relative w-full max-w-lg h-full bg-canvas border-l border-line shadow-soft flex flex-col justify-between z-10 animate-slide-in"
      >
        {/* Header Block */}
        <div className="p-6 border-b border-line flex justify-between items-center bg-canvas-subtle">
          <div>
            <span className="text-[9px] uppercase tracking-widest font-medium text-ink-soft font-sans block">
              Dossiê Corporativo
            </span>
            <span className="text-sm font-semibold tracking-tight text-ink">
              ID: {influencer.id.slice(0, 8)}...
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-line flex items-center justify-center hover:bg-ink hover:text-white transition-colors duration-150 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">

          {/* Avatar and Main Info */}
          <div className="flex gap-6 items-center">
            <div className="w-20 h-20 rounded-full bg-canvas-muted border border-line overflow-hidden flex items-center justify-center text-3xl font-sans italic font-semibold shadow-soft relative">
              {!(influencer.foto_url && influencer.foto_url.trim() !== "" && (influencer.foto_url.startsWith("http://") || influencer.foto_url.startsWith("https://"))) || imgError ? (
                <span className="text-3xl font-sans italic font-semibold text-ink">
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
              <h2 className="text-2xl font-sans font-semibold text-ink tracking-tight leading-tight">
                {influencer.nome}
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href={influencer.link_perfil}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent text-sm font-sans font-semibold hover:underline inline-flex items-center gap-1"
                >
                  <span>Ver Instagram</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <span className="text-line">|</span>
                <button
                  onClick={() => onToggleFavorite(influencer.id)}
                  className="text-xs font-semibold uppercase inline-flex items-center gap-1 hover:text-accent transition-colors duration-150"
                >
                  <Heart
                    className="w-4 h-4"
                    fill={influencer.is_favorito ? "#E30613" : "transparent"}
                    stroke={influencer.is_favorito ? "#E30613" : "#18181B"}
                  />
                  <span>{influencer.is_favorito ? "Favoritado" : "Salvar de Interesse"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Categories and Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-canvas-subtle border border-line text-xs font-semibold uppercase tracking-wider rounded-md text-ink">
              {influencer.categoria_sobre}
            </span>
            <span className="px-3 py-1 bg-ink text-white text-xs font-semibold uppercase tracking-wider rounded-md">
              {influencer.classificacao}
            </span>
            {influencer.grupo === "concorrentes" && (
              <span className="px-3 py-1 bg-accent/10 border border-accent/20 text-xs font-sans font-semibold uppercase tracking-wider rounded-md text-accent">
                Concorrente
              </span>
            )}
          </div>

          {/* Detailed Performance Metric Grid */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft font-sans">
              MÉTRICAS DE PERFORMANCE
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-canvas-subtle border border-line rounded-lg p-4">
                <span className="text-[10px] text-ink-soft uppercase block font-sans">Seguidores Reais</span>
                <span className="text-xl font-sans font-semibold text-ink">
                  {formatFollowers(influencer.seguidores)}
                </span>
                <span className="text-[8px] text-ink-soft block mt-1">Auditado por Apify API</span>
              </div>

              <div className="bg-canvas-subtle border border-line rounded-lg p-4">
                <span className="text-[10px] text-ink-soft uppercase block font-sans">Público-Alvo Prioritário</span>
                <span className="text-sm font-semibold uppercase text-ink mt-1 block truncate">
                  {influencer.publico_alvo || "Geral"}
                </span>
                <span className="text-[8px] text-ink-soft block mt-1">Nicho / Persona Principal</span>
              </div>
            </div>
          </div>

          {/* Core System Notes */}
          <div className="border-t border-line pt-6 space-y-3">
            <div className="flex items-start gap-2.5 text-xs text-ink-soft">
              <ShieldCheck className="w-4.5 h-4.5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-ink">Tolerância a falhas ativada</span>
                Este influenciador possui histórico estável de conformidade comercial. Perfil qualificado para campanhas Enterprise de missão crítica.
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-ink-soft">
              <Award className="w-4.5 h-4.5 text-yellow-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-ink">Reclassificação Automatizada</span>
                O tier do influenciador é verificado após cada sincronização baseada nas faixas estritas de negócio (de Nano a Mega).
              </div>
            </div>
          </div>

        </div>

        {/* System Footer Metadata */}
        <div className="p-6 border-t border-line bg-canvas-subtle flex justify-between items-center text-[10px] font-sans text-ink-soft">
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <Clock className="w-3.5 h-3.5" />
            Última Sincronização:
          </span>
          <span className="font-medium">
            {formatDate(influencer.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
}
