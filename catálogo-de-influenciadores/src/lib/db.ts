import { supabase } from "./supabase.js";

const TABLE = "perfis";

const PORTRAITS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1513956589380-bad6acb9b9d4?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=200",
  "https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&q=80&w=200"
];

export function getInfluencerPhoto(name: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash + index) % PORTRAITS.length;
  return PORTRAITS[idx];
}

// Seed data matching Catalog, Competitors, and Casting lists (app-shape; translated to DB rows on insert)
const seedInfluencers = [
  // 1. CATALOG GROUP
  { nome: "Marina Simplifica", link_perfil: "https://www.instagram.com/marinasimplifica/", seguidores: 4800, categoria_sobre: "Organização / Dicas", engajamento: 4.2, preco_estimado: 250.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Francine Cagnin", link_perfil: "https://www.instagram.com/francagnin", seguidores: 12500, categoria_sobre: "Maternidade / Família", engajamento: 3.8, preco_estimado: 450.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Avaliando Floripa", link_perfil: "https://www.instagram.com/avaliandofloripa", seguidores: 32000, categoria_sobre: "Avaliacoes / Dicas", engajamento: 5.1, preco_estimado: 800.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Dhe Silva", link_perfil: "https://www.tiktok.com/@dhe.sillva", seguidores: 75000, categoria_sobre: "Casa / Organizacao", engajamento: 6.5, preco_estimado: 1200.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "casa.616", link_perfil: "https://www.instagram.com/casa.616/", seguidores: 8900, categoria_sobre: "Casa e Decoracao", engajamento: 3.2, preco_estimado: 350.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Jaque na cozinha", link_perfil: "https://www.instagram.com/jaquenacozinha/", seguidores: 124000, categoria_sobre: "Comida / Culinaria", engajamento: 4.8, preco_estimado: 2200.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Familia Maoli", link_perfil: "https://www.instagram.com/familiamaoli/", seguidores: 153000, categoria_sobre: "Conteudo de Familia", engajamento: 5.4, preco_estimado: 2800.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Familia Smith", link_perfil: "https://www.instagram.com/familiassmith/", seguidores: 220000, categoria_sobre: "Conteudo de Familia", engajamento: 6.1, preco_estimado: 4000.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "guimestiere", link_perfil: "https://www.instagram.com/guimestiere/", seguidores: 5300, categoria_sobre: "Criador de conteúdo", engajamento: 4.0, preco_estimado: 300.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Karol Lunardi", link_perfil: "https://www.instagram.com/karollunardi/", seguidores: 41000, categoria_sobre: "Curitiba", engajamento: 3.5, preco_estimado: 750.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Thiara Gambaro", link_perfil: "https://www.instagram.com/mesasthiaragambaro/", seguidores: 15000, categoria_sobre: "Decoracao", engajamento: 2.9, preco_estimado: 400.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Giovanna e Manuela", link_perfil: "https://www.instagram.com/gioemanu.butzke/?hl=pt", seguidores: 9400, categoria_sobre: "Dicas", engajamento: 4.1, preco_estimado: 300.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "marijoinville", link_perfil: "https://www.instagram.com/marijoinville/", seguidores: 54000, categoria_sobre: "Dicas de Joinville", engajamento: 4.7, preco_estimado: 950.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Onde ir BC", link_perfil: "https://www.instagram.com/ondeirbc/", seguidores: 112000, categoria_sobre: "Dicas de locais / Turismo", engajamento: 5.2, preco_estimado: 2100.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Elaine Ribeiro", link_perfil: "https://www.instagram.com/elianaribeirooficial/", seguidores: 22000, categoria_sobre: "Dicas de lugares/restaurantes", engajamento: 3.4, preco_estimado: 550.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Floripa em Dobro", link_perfil: "https://www.instagram.com/floripaemdobro/", seguidores: 135000, categoria_sobre: "Dicas e Cupons em dobro", engajamento: 5.9, preco_estimado: 2600.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Cami por Floripa", link_perfil: "https://www.instagram.com/camiporfloripa/", seguidores: 18400, categoria_sobre: "Divulgacao e dicas", engajamento: 3.9, preco_estimado: 500.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Enaldinho", link_perfil: "https://www.instagram.com/enaldinho/", seguidores: 4600000, categoria_sobre: "Entretenimento / Público Jovem", engajamento: 8.4, preco_estimado: 45000.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Xuxa", link_perfil: "https://www.instagram.com/xuxameneghel/?hl=pt-br", seguidores: 12100000, categoria_sobre: "Apresentadora", engajamento: 4.1, preco_estimado: 95000.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Bruna Rotta", link_perfil: "https://www.instagram.com/brunarotta_/", seguidores: 1400000, categoria_sobre: "Estilo de vida / Fitness / Viagem", engajamento: 6.9, preco_estimado: 18000.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Maria F. Ramos", link_perfil: "https://www.instagram.com/mariaf_ramos/", seguidores: 11000, categoria_sobre: "Estilo de vida / Pessoal", engajamento: 4.3, preco_estimado: 400.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Bianca Cardoso", link_perfil: "https://www.instagram.com/bianc.ardoso/", seguidores: 27000, categoria_sobre: "Estilo de vida / Pessoal", engajamento: 3.6, preco_estimado: 600.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Leticia Mueller", link_perfil: "https://www.instagram.com/leticiamuellerr/", seguidores: 43000, categoria_sobre: "Estilo de vida / Pessoal", engajamento: 4.2, preco_estimado: 850.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Laysa", link_perfil: "https://www.instagram.com/laysamff/", seguidores: 6500, categoria_sobre: "Estilo de vida / Pessoal", engajamento: 5.0, preco_estimado: 350.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Chef Melchert", link_perfil: "https://www.instagram.com/chef_melchert", seguidores: 890000, categoria_sobre: "Gastronomia / Chef de Cozinha", engajamento: 5.7, preco_estimado: 9500.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Zaratineats", link_perfil: "https://www.instagram.com/zaratineats/", seguidores: 14000, categoria_sobre: "Gastronomia / Comida", engajamento: 4.1, preco_estimado: 450.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Pitacos do Casal", link_perfil: "https://www.instagram.com/pitacosdocasal/", seguidores: 49000, categoria_sobre: "Gastronomia e Casal", engajamento: 3.9, preco_estimado: 800.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "gastronomiajlle", link_perfil: "https://www.instagram.com/gastronomiajlle/", seguidores: 31000, categoria_sobre: "Gastronomia local", engajamento: 3.2, preco_estimado: 600.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Mesa pra dois", link_perfil: "https://www.instagram.com/mesapradoisrj/", seguidores: 18000, categoria_sobre: "Gastronomia local / Dicas", engajamento: 4.5, preco_estimado: 500.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Guia de Jlle", link_perfil: "https://www.instagram.com/guiadejoinville/", seguidores: 82000, categoria_sobre: "Guia local / Dicas", engajamento: 4.6, preco_estimado: 1300.0, publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Guilherme Tureck", link_perfil: "https://www.instagram.com/guilhermetureck/", seguidores: 12500, categoria_sobre: "Humor / Entretenimento", engajamento: 4.3, preco_estimado: 400.0, publico_alvo: "Geral", grupo: "catalogo" },

  // 2. COMPETITORS GROUP (migrated to main catalogo, tagged as competitors)
  { nome: "Virginia Fonseca", link_perfil: "https://www.instagram.com/virginia/", seguidores: 48000000, categoria_sobre: "Beleza / Lifestyle", engajamento: 8.2, preco_estimado: 120000.0, publico_alvo: "Geral", grupo: "concorrentes" },
  { nome: "Bianca Andrade", link_perfil: "https://www.instagram.com/bianca/", seguidores: 19100000, categoria_sobre: "Beleza / Empreendedorismo", engajamento: 6.8, preco_estimado: 85000.0, publico_alvo: "Feminino / Negócios", grupo: "concorrentes" },
  { nome: "Carlinhos Maia", link_perfil: "https://www.instagram.com/carlinhos/", seguidores: 30000000, categoria_sobre: "Humor / Reality", engajamento: 7.9, preco_estimado: 95000.0, publico_alvo: "Geral", grupo: "concorrentes" },
  { nome: "Mari Maria", link_perfil: "https://www.instagram.com/marimaria/", seguidores: 21000000, categoria_sobre: "Maquiagem / Estilo de vida", engajamento: 6.5, preco_estimado: 70000.0, publico_alvo: "Beleza / Feminino", grupo: "concorrentes" },
  { nome: "Jade Picon", link_perfil: "https://www.instagram.com/jadepicon/", seguidores: 22000000, categoria_sobre: "Moda / Atriz", engajamento: 5.4, preco_estimado: 60000.0, publico_alvo: "Jovens / Moda", grupo: "concorrentes" },
  { nome: "thaisbittencourt.b", link_perfil: "https://www.instagram.com/thaisbittencourt.b/", seguidores: 1439440, categoria_sobre: "Decoração", engajamento: 4.5, preco_estimado: 0.0, publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },
  { nome: "danilofsoto", link_perfil: "https://www.instagram.com/danilofsoto/", seguidores: 256951, categoria_sobre: "Entrevistador", engajamento: 3.8, preco_estimado: 0.0, publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },
  { nome: "Bitelo", link_perfil: "https://www.instagram.com/bitelonatural/?hl=pt-br", seguidores: 5166470, categoria_sobre: "Powerlifter", engajamento: 5.6, preco_estimado: 0.0, publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },
  { nome: "soranacamilo", link_perfil: "https://www.instagram.com/soranacamilo/?hl=pt", seguidores: 319819, categoria_sobre: "Influenciadora digital", engajamento: 4.2, preco_estimado: 0.0, publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },

  // 3. CASTING GROUP
  { nome: "Dani Kniess", link_perfil: "https://www.instagram.com/danikniess/", seguidores: 12400, categoria_sobre: "Moda / Lifestyle", engajamento: 4.5, preco_estimado: 400.0, publico_alvo: "Mulheres", media_valor: "R$400,00 (média diária)", grupo: "casting" },
  { nome: "Gabriela Beatriz", link_perfil: "https://www.instagram.com/gabrielabeatrz", seguidores: 8500, categoria_sobre: "Beleza / Lifestyle", engajamento: 3.9, preco_estimado: 150.0, publico_alvo: "Jovens / Beleza", media_valor: "R$150,00 por hora", grupo: "casting" },
  { nome: "Mariana Busnardo", link_perfil: "https://www.instagram.com/maribusnardo", seguidores: 15600, categoria_sobre: "Viagem / Gastronomia", engajamento: 5.2, preco_estimado: 250.0, publico_alvo: "Geral", media_valor: "R$200/300 (por 3h - negociável)", grupo: "casting" },
  { nome: "Daniela Muller", link_perfil: "https://www.instagram.com/danielatmuller", seguidores: 22100, categoria_sobre: "Decoração / Casa", engajamento: 4.1, preco_estimado: 0.0, publico_alvo: "Família / Decor", media_valor: "Deixou em aberto", grupo: "casting" },
  { nome: "Luara Chagas", link_perfil: "https://www.instagram.com/luarachagass", seguidores: 6400, categoria_sobre: "Maternidade / Família", engajamento: 4.8, preco_estimado: 200.0, publico_alvo: "Mães / Família", media_valor: "R$200,00 + R$50,00 (deslocamento)", grupo: "casting" },
  { nome: "Taiane Camargo", link_perfil: "https://www.instagram.com/taianecamargogold", seguidores: 19500, categoria_sobre: "Moda / Beleza", engajamento: 3.5, preco_estimado: 0.0, publico_alvo: "Mulheres", media_valor: "Deixou em aberto", grupo: "casting" },
  { nome: "Ana Maria", link_perfil: "https://www.instagram.com/aniinhams", seguidores: 5300, categoria_sobre: "Lifestyle", engajamento: 4.2, preco_estimado: 250.0, publico_alvo: "Geral", media_valor: "R$250,00 (2h - negociável)", grupo: "casting" },
  { nome: "Jessica Estevão Souza", link_perfil: "https://www.instagram.com/jessica_sestevao", seguidores: 11200, categoria_sobre: "Humor / Entretenimento", engajamento: 5.6, preco_estimado: 200.0, publico_alvo: "Geral", media_valor: "R$200,00 (negociável)", grupo: "casting" },
  { nome: "Kaqui Ferreira", link_perfil: "https://www.instagram.com/dicasdakaquioficial", seguidores: 34500, categoria_sobre: "Dicas / Casa", engajamento: 4.0, preco_estimado: 0.0, publico_alvo: "Família", media_valor: "aguardando", grupo: "casting" },
  { nome: "Beatriz Bortoluchi", link_perfil: "https://www.instagram.com/bertoluchib", seguidores: 43200, categoria_sobre: "Moda / Fitness", engajamento: 4.7, preco_estimado: 0.0, publico_alvo: "Jovens / Fitness", media_valor: "aguardando", grupo: "casting" },
  { nome: "Fabiana Nascimento", link_perfil: "https://www.instagram.com/fabiananascimento.br", seguidores: 18900, categoria_sobre: "Beleza / Estilo de vida", engajamento: 3.8, preco_estimado: 0.0, publico_alvo: "Feminino / Geral", media_valor: "aguardando", grupo: "casting" },
  { nome: "Anna Carolina", link_perfil: "https://www.instagram.com/annamacaggi", seguidores: 27300, categoria_sobre: "Entretenimento / Estilo de vida", engajamento: 5.0, preco_estimado: 250.0, publico_alvo: "Jovens", media_valor: "2 horas - R$ 250,00 | 3 horas - R$ 350,00 | 4 horas - R$ 450,00", grupo: "casting" },
  { nome: "Helena Heidemann", link_perfil: "https://www.instagram.com/helenaheidemannweiss", seguidores: 145000, categoria_sobre: "Empreendedorismo / Carreira", engajamento: 6.3, preco_estimado: 250.0, publico_alvo: "Mulheres", media_valor: "R$250 / hora", grupo: "casting" },
  { nome: "Júlia Costa Reis", link_perfil: "https://www.instagram.com/jucostareis", seguidores: 289000, categoria_sobre: "Estilo de vida / Moda", engajamento: 5.9, preco_estimado: 400.0, publico_alvo: "Feminino / Premium", media_valor: "R$400 + deslocamento (3h - alterável)", grupo: "casting" },
  { nome: "Heloisa Bastos Pereira", link_perfil: "https://www.instagram.com/helobastosoficiall", seguidores: 16800, categoria_sobre: "Dicas de Beleza", engajamento: 4.2, preco_estimado: 300.0, publico_alvo: "Beleza", media_valor: "R$300,00 (3h) Incluso deslocamento", grupo: "casting" },
  { nome: "Larissa Estrada", link_perfil: "https://www.instagram.com/larissaestradaa", seguidores: 94000, categoria_sobre: "Moda / Luxo", engajamento: 4.9, preco_estimado: 150.0, publico_alvo: "Moda / Premium", media_valor: "R$150 / hora (pode mudar)", grupo: "casting" }
];

const BLOCKED_NAMES_NORMALIZED = [
  "william costa",
  "maikon prado",
  "maikon do prado",
  "luiz henrique",
  "joinville secreta",
  "sabores joinville",
  "sabores de joinville",
  "descubra jlle",
  "vem pra jlle",
  "nossa jlle",
  "isadora mello",
  "saray lopes",
  "por ai por jlle",
  "erika lopes",
  "achei joinville",
  "achei em jlle",
  "achei em joinville",
  "barbara moreira",
  "agata caroline"
];

export function isBlocked(name: string): boolean {
  if (!name) return false;
  const normalized = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Mark}/gu, "")
    .trim()
    .replace(/\s+/g, " ");

  return BLOCKED_NAMES_NORMALIZED.some(blocked => {
    if (normalized === blocked) return true;
    const regex1 = new RegExp(`\\b${blocked}\\b`, "i");
    const regex2 = new RegExp(`\\b${normalized}\\b`, "i");
    return regex1.test(normalized) || regex2.test(blocked);
  });
}

export function isTargetCompetitor(name: string): boolean {
  if (!name) return false;
  const normalized = name.toLowerCase().trim().replace(/['"“”\s]/g, "");
  return [
    "thaisbittencourt.b",
    "danilofsoto",
    "bitelo",
    "soranacamilo"
  ].some(target => normalized === target || normalized.includes(target) || target.includes(normalized));
}

export function cleanUrl(u: string): string {
  if (!u) return "";
  let clean = u.toLowerCase().trim().split("?")[0].replace(/\/$/, "");
  clean = clean.replace("www.", "").replace("https://", "").replace("http://", "");
  return clean;
}

// The perfis table only accepts 'instagram' or 'tiktok' for rede_social.
export function getRedeSocial(link: string): string {
  if (!link) return "instagram";
  return link.toLowerCase().includes("tiktok.com") ? "tiktok" : "instagram";
}

export function extractHandle(urlOrUsername: string): string {
  if (!urlOrUsername) return "";
  let input = urlOrUsername.trim();

  if (input.includes("/") || input.includes("instagram.com") || input.includes("tiktok.com")) {
    let cleanUrlStr = input.split("?")[0];
    cleanUrlStr = cleanUrlStr.replace(/\/+$/, "");
    const parts = cleanUrlStr.split("/");
    input = parts[parts.length - 1] || "";
  }

  return input.replace(/@/g, "").replace(/\s+/g, "").toLowerCase();
}

// ---------------------------------------------------------------------------
// Row <-> app-shape mapping. The rest of the app (server.ts, React components)
// keeps working with the original field names (nome, categoria_sobre, foto_url,
// engajamento, grupo: catalogo|concorrentes|casting); only this module knows
// about the catalogo.perfis column names.
// ---------------------------------------------------------------------------

function rowToInfluencer(row: any): any {
  return {
    id: row.id,
    nome: row.nome_completo,
    link_perfil: row.link_perfil,
    seguidores: row.seguidores,
    categoria_sobre: row.ramo_nicho,
    classificacao: row.classificacao,
    engajamento: row.taxa_engajamento,
    preco_estimado: row.preco_estimado,
    is_favorito: row.is_favorito,
    updated_at: row.updated_at,
    publico_alvo: row.publico_alvo,
    rede_social: row.rede_social,
    foto_url: row.foto_perfil_url,
    grupo: row.tag_concorrente ? "concorrentes" : (row.grupo === "modelo" ? "casting" : "catalogo"),
    media_valor: row.media_valor
  };
}

// classificacao, created_at and updated_at are computed/managed by the database and never written here.
function influencerToRow(inf: any, origemDado: string): any {
  const rede = inf.rede_social === "tiktok" ? "tiktok" : getRedeSocial(inf.link_perfil);
  const isCompetitor = inf.grupo === "concorrentes" || isTargetCompetitor(inf.nome);

  return {
    nome_completo: inf.nome,
    link_perfil: inf.link_perfil,
    rede_social: rede,
    ramo_nicho: inf.categoria_sobre || "Geral",
    grupo: inf.grupo === "casting" ? "modelo" : "influenciador",
    tag_concorrente: isCompetitor,
    seguidores: inf.seguidores ?? 0,
    handle_normalizado: extractHandle(inf.link_perfil),
    foto_perfil_url: inf.foto_url,
    origem_dado: origemDado,
    taxa_engajamento: inf.engajamento ?? 0,
    preco_estimado: inf.preco_estimado ?? 0,
    publico_alvo: inf.publico_alvo,
    is_favorito: inf.is_favorito ?? false,
    media_valor: inf.media_valor
  };
}

async function seedIfEmpty() {
  const rows = seedInfluencers.map((inf, i) => influencerToRow({
    ...inf,
    foto_url: getInfluencerPhoto(inf.nome, i)
  }, "manual"));

  const { error } = await supabase.from(TABLE).insert(rows);
  if (error) {
    console.error("[DB] Falha ao popular dados iniciais no Supabase:", error.message);
  } else {
    console.log(`[DB] Catálogo inicial (${rows.length} perfis) inserido no Supabase.`);
  }
}

export async function dbGetAll(): Promise<any[]> {
  let { data, error } = await supabase.from(TABLE).select("*");
  if (error) throw new Error(`Falha ao buscar perfis no Supabase: ${error.message}`);

  if (!data || data.length === 0) {
    await seedIfEmpty();
    const seeded = await supabase.from(TABLE).select("*");
    if (seeded.error) throw new Error(`Falha ao buscar perfis no Supabase: ${seeded.error.message}`);
    data = seeded.data;
  }

  return (data || []).map(rowToInfluencer).filter(inf => !isBlocked(inf.nome));
}

async function findExistingRow(nome: string, linkPerfil: string) {
  const nameLower = (nome || "").toLowerCase().trim();
  const linkClean = cleanUrl(linkPerfil);

  const { data, error } = await supabase.from(TABLE).select("*");
  if (error) throw new Error(`Falha ao consultar perfis existentes no Supabase: ${error.message}`);

  return (data || []).find(row =>
    (row.nome_completo || "").toLowerCase().trim() === nameLower || cleanUrl(row.link_perfil) === linkClean
  );
}

export async function dbCreate(influencerData: any): Promise<any> {
  if (!influencerData.foto_url) {
    influencerData.foto_url = getInfluencerPhoto(influencerData.nome || "", Math.floor(Math.random() * 100));
  }
  if (!influencerData.grupo) {
    influencerData.grupo = "catalogo";
  }

  const existing = await findExistingRow(influencerData.nome, influencerData.link_perfil);
  const row = influencerToRow(influencerData, "manual");

  if (existing) {
    const { data, error } = await supabase.from(TABLE).update(row).eq("id", existing.id).select().single();
    if (error) throw new Error(`Falha ao atualizar perfil no Supabase: ${error.message}`);
    return rowToInfluencer(data);
  }

  const { data, error } = await supabase.from(TABLE).insert(row).select().single();
  if (error) throw new Error(`Falha ao criar perfil no Supabase: ${error.message}`);
  return rowToInfluencer(data);
}

export async function dbToggleFavorite(id: string): Promise<boolean> {
  const { data: current, error: getErr } = await supabase.from(TABLE).select("is_favorito").eq("id", id).single();
  if (getErr) throw new Error(`Perfil não encontrado no Supabase: ${getErr.message}`);

  const next = !current.is_favorito;
  const { error } = await supabase.from(TABLE).update({ is_favorito: next }).eq("id", id);
  if (error) throw new Error(`Falha ao atualizar favorito no Supabase: ${error.message}`);
  return next;
}

export async function dbDelete(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(`Falha ao remover perfil no Supabase: ${error.message}`);
}

export async function dbBulkInsert(influencersList: any[]): Promise<number> {
  const { data: existingRows, error: findErr } = await supabase.from(TABLE).select("*");
  if (findErr) throw new Error(`Falha ao consultar perfis existentes no Supabase: ${findErr.message}`);

  let count = 0;
  for (const item of influencersList) {
    const nameLower = (item.nome || "").toLowerCase().trim();
    const linkClean = cleanUrl(item.link_perfil);
    const existing = (existingRows || []).find(row =>
      (row.nome_completo || "").toLowerCase().trim() === nameLower || cleanUrl(row.link_perfil) === linkClean
    );
    const row = influencerToRow(item, "csv");

    const { error } = existing
      ? await supabase.from(TABLE).update(row).eq("id", existing.id)
      : await supabase.from(TABLE).insert(row);

    if (error) {
      console.error(`[DB] Falha ao gravar perfil "${item.nome}" no Supabase:`, error.message);
      continue;
    }
    count++;
  }
  return count;
}

// Fills handle_normalizado (derived from link_perfil) for Instagram profiles that don't have it yet.
export async function backfillInstagramHandles(): Promise<void> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, link_perfil")
    .eq("rede_social", "instagram")
    .is("handle_normalizado", null);

  if (error) {
    console.error("[DB] Falha ao buscar perfis sem handle_normalizado no Supabase:", error.message);
    return;
  }

  for (const row of data || []) {
    const handle = extractHandle(row.link_perfil);
    if (!handle) continue;
    const { error: updateErr } = await supabase.from(TABLE).update({ handle_normalizado: handle }).eq("id", row.id);
    if (updateErr) {
      console.error(`[DB] Falha ao preencher handle_normalizado do perfil ${row.id} no Supabase:`, updateErr.message);
    }
  }
}

export interface InstagramSyncCandidate {
  id: string;
  nome_completo: string | null;
  handle_normalizado: string | null;
  foto_perfil_url: string | null;
  ultima_sincronizacao: string | null;
}

// Instagram profiles never synced, or last synced more than `staleDays` ago.
export async function getInstagramProfilesNeedingSync(staleDays: number): Promise<InstagramSyncCandidate[]> {
  const cutoff = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .select("id, nome_completo, handle_normalizado, foto_perfil_url, ultima_sincronizacao")
    .eq("rede_social", "instagram")
    .not("handle_normalizado", "is", null)
    .or(`ultima_sincronizacao.is.null,ultima_sincronizacao.lt.${cutoff}`);

  if (error) throw new Error(`Falha ao buscar perfis do Instagram para sincronizar no Supabase: ${error.message}`);
  return data || [];
}

// Writes exactly the Apify-sourced fields for one profile. Commercial/manual fields
// (ramo_nicho, grupo, preco_estimado, media_valor, publico_alvo, taxa_engajamento,
// tag_concorrente, is_favorito) are never touched here.
export async function applyApifySyncResult(id: string, fields: {
  seguidores: number;
  foto_perfil_url?: string;
  nome_completo?: string;
}): Promise<void> {
  const { error } = await supabase.from(TABLE).update({
    ...fields,
    origem_dado: "apify",
    ultima_sincronizacao: new Date().toISOString()
  }).eq("id", id);

  if (error) throw new Error(`Falha ao salvar sincronização do Apify no Supabase: ${error.message}`);
}

export async function dbUpdate(id: string, updatedData: any): Promise<any> {
  const partial: any = {};
  if (updatedData.nome !== undefined) partial.nome_completo = updatedData.nome;
  if (updatedData.link_perfil !== undefined) {
    partial.link_perfil = updatedData.link_perfil;
    partial.handle_normalizado = extractHandle(updatedData.link_perfil);
  }
  if (updatedData.seguidores !== undefined) partial.seguidores = updatedData.seguidores;
  if (updatedData.categoria_sobre !== undefined) partial.ramo_nicho = updatedData.categoria_sobre;
  if (updatedData.engajamento !== undefined) partial.taxa_engajamento = updatedData.engajamento;
  if (updatedData.preco_estimado !== undefined) partial.preco_estimado = updatedData.preco_estimado;
  if (updatedData.publico_alvo !== undefined) partial.publico_alvo = updatedData.publico_alvo;
  if (updatedData.rede_social !== undefined) partial.rede_social = updatedData.rede_social === "tiktok" ? "tiktok" : "instagram";
  if (updatedData.foto_url !== undefined) partial.foto_perfil_url = updatedData.foto_url;
  if (updatedData.media_valor !== undefined) partial.media_valor = updatedData.media_valor;
  if (updatedData.grupo !== undefined) {
    partial.grupo = updatedData.grupo === "casting" ? "modelo" : "influenciador";
    partial.tag_concorrente = updatedData.grupo === "concorrentes";
  }

  const { data, error } = await supabase.from(TABLE).update(partial).eq("id", id).select().single();
  if (error) throw new Error(`Falha ao atualizar perfil no Supabase: ${error.message}`);
  return rowToInfluencer(data);
}
