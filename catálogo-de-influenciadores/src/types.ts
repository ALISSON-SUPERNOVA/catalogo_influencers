export interface Influencer {
  id: string;
  nome: string;
  link_perfil: string;
  seguidores: number;
  categoria_sobre: string;
  classificacao: string;
  engajamento: number;
  preco_estimado: number;
  is_favorito: boolean;
  updated_at: string;
  publico_alvo?: string; // Optional field for target audience details
  rede_social?: string; // Optional field for social network (instagram, tiktok, youtube, twitch, facebook)
  foto_url?: string; // Custom portrait/avatar image URL
  grupo?: "catalogo" | "concorrentes" | "casting"; // Separate the lists cleanly
  media_valor?: string; // The raw value notes from the spreadsheet
}

export interface AdminStats {
  totalCount: number;
  megaCount: number;
  macroCount: number;
  microCount: number;
  nanoCount: number;
  lastSync?: string;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'failed';
}

export const ALLOWED_CATEGORIES = [
  "Humor",
  "Gastronomia",
  "Moda",
  "Maquiagem",
  "Decoração",
  "Entrevistador",
  "Viagem",
  "Academia"
] as const;

export type AllowedCategory = typeof ALLOWED_CATEGORIES[number];

export function normalizeCategory(cat: string): string {
  if (!cat) return "Humor";
  const lower = cat.toLowerCase().trim();

  if (lower.includes("humor") || lower.includes("entretenimento") || lower.includes("apresentadora") || lower.includes("reality")) {
    return "Humor";
  }
  if (lower.includes("gastronomia") || lower.includes("comida") || lower.includes("culinaria") || lower.includes("culinária") || lower.includes("chef") || lower.includes("restaurante") || lower.includes("avaliaco") || lower.includes("avaliaço") || lower.includes("floripa em dobro") || lower.includes("cupom")) {
    return "Gastronomia";
  }
  if (lower.includes("maquiagem") || lower.includes("beleza") || lower.includes("beauty") || lower.includes("cosmetico") || lower.includes("cosmético")) {
    return "Maquiagem";
  }
  if (lower.includes("decoracao") || lower.includes("decoração") || lower.includes("casa") || lower.includes("organiza") || lower.includes("organização") || lower.includes("mesas")) {
    return "Decoração";
  }
  if (lower.includes("entrevistador") || lower.includes("entrevista")) {
    return "Entrevistador";
  }
  if (lower.includes("viagem") || lower.includes("turismo") || lower.includes("gui") || lower.includes("joinville") || lower.includes("curitiba") || lower.includes("floripa") || lower.includes("lugar") || lower.includes("local") || lower.includes("viagens")) {
    return "Viagem";
  }
  if (lower.includes("academia") || lower.includes("fitness") || lower.includes("powerlifter") || lower.includes("treino") || lower.includes("muscula") || lower.includes("esporte")) {
    return "Academia";
  }
  if (lower.includes("moda") || lower.includes("style") || lower.includes("vestu") || lower.includes("look") || lower.includes("luxo")) {
    return "Moda";
  }
  
  return "Moda"; // Default fallback
}

