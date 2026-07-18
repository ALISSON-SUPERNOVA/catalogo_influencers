import { useState } from "react";
import { Heart, Instagram, Youtube, Twitch, Facebook, Video } from "lucide-react";
import { Influencer } from "../types";
import { resolveInfluencerPhoto } from "../utils/photoResolver";

interface InfluencerCardProps {
  key?: string | number;
  influencer: Influencer;
  onToggleFavorite: (id: string) => void | Promise<void>;
  onViewDetails: (influencer: any) => void;
}

export default function InfluencerCard({
  influencer,
  onToggleFavorite,
  onViewDetails
}: InfluencerCardProps) {
  const [imgError, setImgError] = useState(false);

  const hasPhoto = !!(influencer.foto_url && 
    influencer.foto_url.trim() !== "" && 
    (influencer.foto_url.startsWith("http://") || influencer.foto_url.startsWith("https://")));
  
  // Format followers dynamically (e.g. 1.2M or 450K or 950)
  const formatFollowers = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace(".0", "")}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K`;
    }
    return num.toString();
  };

  // Format currency (e.g. R$ 12.500,00)
  const formatCurrency = (val: number) => {
    return val.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  };

  // Extract initials for the avatar (Maximiliano Rost -> MR)
  const getInitials = (name: string) => {
    if (!name) return "S";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Safe extraction of Instagram/TikTok/Youtube handle from link_perfil
  const getHandleLabel = (url: string, rede?: string) => {
    if (!url) return "@supernova";
    try {
      const urlWithoutQuery = url.split("?")[0];
      const cleanUrl = urlWithoutQuery.trim().replace(/\/$/, "");
      const segments = cleanUrl.split("/");
      let last = segments[segments.length - 1];
      if (last) {
        last = last.replace("@", "");
        if (last && !last.startsWith("http")) {
          return `@${last}`;
        }
      }
    } catch (e) {}
    
    const r = (rede || "instagram").toLowerCase();
    return `@${r}_perfil`;
  };

  const getRedeSocialIcon = (rede?: string) => {
    const r = (rede || "").toLowerCase();
    if (r === "youtube") return <Youtube className="w-3.5 h-3.5 shrink-0" />;
    if (r === "twitch") return <Twitch className="w-3.5 h-3.5 shrink-0" />;
    if (r === "facebook") return <Facebook className="w-3.5 h-3.5 shrink-0" />;
    if (r === "tiktok") return <Video className="w-3.5 h-3.5 shrink-0" />;
    return <Instagram className="w-3.5 h-3.5 shrink-0" />;
  };

  return (
    <div
      onClick={() => onViewDetails(influencer)}
      className="bg-canvas border border-line rounded-2xl shadow-soft p-5 relative flex flex-col justify-between h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 select-none cursor-pointer"
    >
      <div>
        <div className="flex gap-4 items-start">
          {/* Circular Avatar with photo or initials */}
          <div className="w-14 h-14 rounded-full bg-canvas-muted border border-line overflow-hidden flex items-center justify-center shrink-0 text-ink relative">
            {!hasPhoto || imgError ? (
              <span className="text-lg font-sans italic font-semibold">
                {getInitials(influencer.nome)}
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

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-1">
              <h3 className="text-lg font-semibold leading-tight text-ink truncate font-sans" title={influencer.nome}>
                {influencer.nome}
              </h3>

              {/* Favorites Button (Optimistic Heart) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(influencer.id);
                }}
                className="text-accent hover:scale-110 active:scale-95 transition-transform duration-150 shrink-0 p-1"
                aria-label="Favoritar"
              >
                <Heart
                  className="w-5 h-5 transition-colors duration-150"
                  fill={influencer.is_favorito ? "#E30613" : "transparent"}
                  stroke="#E30613"
                  strokeWidth={2}
                />
              </button>
            </div>

            {/* Social Network Icon and Handle */}
            <a
              href={influencer.link_perfil}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-accent text-xs font-sans font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
            >
              {getRedeSocialIcon(influencer.rede_social)}
              <span className="capitalize">{influencer.rede_social || "instagram"}: {getHandleLabel(influencer.link_perfil, influencer.rede_social)}</span>
            </a>

            {/* Badges */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[9px] px-2 py-0.5 bg-canvas-subtle border border-line rounded-md uppercase font-semibold text-ink-soft">
                {influencer.categoria_sobre}
              </span>
              {influencer.grupo === "concorrentes" && (
                <span className="text-[9px] px-2 py-0.5 bg-accent/10 border border-accent/20 rounded-md uppercase font-sans font-semibold text-accent">
                  Concorrente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Inner Data Grid without Price Estimado and Engagement */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-line pt-4">
          <div>
            <span className="text-[9px] uppercase font-medium text-ink-soft block font-sans">Seguidores</span>
            <span className="text-base font-sans font-semibold text-ink">
              {formatFollowers(influencer.seguidores)}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-medium text-ink-soft block font-sans">Classificação</span>
            <span className="text-[10px] font-semibold uppercase text-ink truncate block mt-1" title={influencer.classificacao}>
              {influencer.classificacao}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-medium text-ink-soft block font-sans">Público-Alvo</span>
            <span className="text-[10px] font-semibold uppercase text-ink truncate block mt-1" title={influencer.publico_alvo || "Geral"}>
              {influencer.publico_alvo || "Geral"}
            </span>
          </div>
        </div>

        {influencer.media_valor && influencer.grupo !== "concorrentes" && (
          <div className="mt-4 px-3 py-2 bg-canvas-subtle border border-line rounded-lg">
            <span className="text-[8px] uppercase font-sans font-semibold text-ink-soft block leading-none">ORÇAMENTO / CACHÊ</span>
            <span className="text-[11px] font-sans font-semibold text-accent block mt-1 leading-tight break-words" title={influencer.media_valor}>
              {influencer.media_valor}
            </span>
          </div>
        )}
      </div>

      {/* Visitar perfil button instead of Ver Perfil Detalhado */}
      <a
        href={influencer.link_perfil}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="mt-5 w-full py-2.5 rounded-lg bg-accent text-white text-[10px] font-semibold uppercase tracking-wider hover:bg-accent-ink transition-colors duration-200 text-center block shadow-soft"
      >
        Visitar perfil
      </a>
    </div>
  );
}
