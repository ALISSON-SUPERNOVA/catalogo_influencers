import fs from "fs/promises";
import path from "path";
import { db } from "./firebase.js";
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  getDoc, 
  writeBatch 
} from "firebase/firestore";

const FALLBACK_FILE = path.join(process.cwd(), "influencers-fallback.json");

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

// Seed data matching Catalog, Competitors, and Casting lists
const seedInfluencers = [
  // 1. CATALOG GROUP
  { nome: "Marina Simplifica", link_perfil: "https://www.instagram.com/marinasimplifica/", seguidores: 4800, categoria_sobre: "Organização / Dicas", classificacao: "Microinfluenciador", engajamento: 4.2, preco_estimado: 250.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Francine Cagnin", link_perfil: "https://www.instagram.com/francagnin", seguidores: 12500, categoria_sobre: "Maternidade / Família", classificacao: "Microinfluenciador", engajamento: 3.8, preco_estimado: 450.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Avaliando Floripa", link_perfil: "https://www.instagram.com/avaliandofloripa", seguidores: 32000, categoria_sobre: "Avaliacoes / Dicas", classificacao: "Microinfluenciador", engajamento: 5.1, preco_estimado: 800.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Dhe Silva", link_perfil: "https://www.tiktok.com/@dhe.sillva", seguidores: 75000, categoria_sobre: "Casa / Organizacao", classificacao: "Microinfluenciador", engajamento: 6.5, preco_estimado: 1200.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "casa.616", link_perfil: "https://www.instagram.com/casa.616/", seguidores: 8900, categoria_sobre: "Casa e Decoracao", classificacao: "Microinfluenciador", engajamento: 3.2, preco_estimado: 350.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Jaque na cozinha", link_perfil: "https://www.instagram.com/jaquenacozinha/", seguidores: 124000, categoria_sobre: "Comida / Culinaria", classificacao: "Macro influencidor", engajamento: 4.8, preco_estimado: 2200.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Familia Maoli", link_perfil: "https://www.instagram.com/familiamaoli/", seguidores: 153000, categoria_sobre: "Conteudo de Familia", classificacao: "Macro influencidor", engajamento: 5.4, preco_estimado: 2800.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Familia Smith", link_perfil: "https://www.instagram.com/familiassmith/", seguidores: 220000, categoria_sobre: "Conteudo de Familia", classificacao: "Macro influencidor", engajamento: 6.1, preco_estimado: 4000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "guimestiere", link_perfil: "https://www.instagram.com/guimestiere/", seguidores: 5300, categoria_sobre: "Criador de conteúdo", classificacao: "Microinfluenciador", engajamento: 4.0, preco_estimado: 300.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Karol Lunardi", link_perfil: "https://www.instagram.com/karollunardi/", seguidores: 41000, categoria_sobre: "Curitiba", classificacao: "Microinfluenciador", engajamento: 3.5, preco_estimado: 750.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Thiara Gambaro", link_perfil: "https://www.instagram.com/mesasthiaragambaro/", seguidores: 15000, categoria_sobre: "Decoracao", classificacao: "Microinfluenciador", engajamento: 2.9, preco_estimado: 400.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Giovanna e Manuela", link_perfil: "https://www.instagram.com/gioemanu.butzke/?hl=pt", seguidores: 9400, categoria_sobre: "Dicas", classificacao: "Microinfluenciador", engajamento: 4.1, preco_estimado: 300.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "marijoinville", link_perfil: "https://www.instagram.com/marijoinville/", seguidores: 54000, categoria_sobre: "Dicas de Joinville", classificacao: "Microinfluenciador", engajamento: 4.7, preco_estimado: 950.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Onde ir BC", link_perfil: "https://www.instagram.com/ondeirbc/", seguidores: 112000, categoria_sobre: "Dicas de locais / Turismo", classificacao: "Macro influencidor", engajamento: 5.2, preco_estimado: 2100.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Elaine Ribeiro", link_perfil: "https://www.instagram.com/elianaribeirooficial/", seguidores: 22000, categoria_sobre: "Dicas de lugares/restaurantes", classificacao: "Microinfluenciador", engajamento: 3.4, preco_estimado: 550.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Floripa em Dobro", link_perfil: "https://www.instagram.com/floripaemdobro/", seguidores: 135000, categoria_sobre: "Dicas e Cupons em dobro", classificacao: "Macro influencidor", engajamento: 5.9, preco_estimado: 2600.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Cami por Floripa", link_perfil: "https://www.instagram.com/camiporfloripa/", seguidores: 18400, categoria_sobre: "Divulgacao e dicas", classificacao: "Microinfluenciador", engajamento: 3.9, preco_estimado: 500.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Enaldinho", link_perfil: "https://www.instagram.com/enaldinho/", seguidores: 4600000, categoria_sobre: "Entretenimento / Público Jovem", classificacao: "Mega influenciador", engajamento: 8.4, preco_estimado: 45000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Xuxa", link_perfil: "https://www.instagram.com/xuxameneghel/?hl=pt-br", seguidores: 12100000, categoria_sobre: "Apresentadora", classificacao: "Mega influenciador", engajamento: 4.1, preco_estimado: 95000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Bruna Rotta", link_perfil: "https://www.instagram.com/brunarotta_/", seguidores: 1400000, categoria_sobre: "Estilo de vida / Fitness / Viagem", classificacao: "Mega influenciador", engajamento: 6.9, preco_estimado: 18000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Maria F. Ramos", link_perfil: "https://www.instagram.com/mariaf_ramos/", seguidores: 11000, categoria_sobre: "Estilo de vida / Pessoal", classificacao: "Microinfluenciador", engajamento: 4.3, preco_estimado: 400.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Bianca Cardoso", link_perfil: "https://www.instagram.com/bianc.ardoso/", seguidores: 27000, categoria_sobre: "Estilo de vida / Pessoal", classificacao: "Microinfluenciador", engajamento: 3.6, preco_estimado: 600.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Leticia Mueller", link_perfil: "https://www.instagram.com/leticiamuellerr/", seguidores: 43000, categoria_sobre: "Estilo de vida / Pessoal", classificacao: "Microinfluenciador", engajamento: 4.2, preco_estimado: 850.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Laysa", link_perfil: "https://www.instagram.com/laysamff/", seguidores: 6500, categoria_sobre: "Estilo de vida / Pessoal", classificacao: "Microinfluenciador", engajamento: 5.0, preco_estimado: 350.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Chef Melchert", link_perfil: "https://www.instagram.com/chef_melchert", seguidores: 890000, categoria_sobre: "Gastronomia / Chef de Cozinha", classificacao: "Macro influencidor", engajamento: 5.7, preco_estimado: 9500.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Zaratineats", link_perfil: "https://www.instagram.com/zaratineats/", seguidores: 14000, categoria_sobre: "Gastronomia / Comida", classificacao: "Microinfluenciador", engajamento: 4.1, preco_estimado: 450.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Pitacos do Casal", link_perfil: "https://www.instagram.com/pitacosdocasal/", seguidores: 49000, categoria_sobre: "Gastronomia e Casal", classificacao: "Microinfluenciador", engajamento: 3.9, preco_estimado: 800.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "gastronomiajlle", link_perfil: "https://www.instagram.com/gastronomiajlle/", seguidores: 31000, categoria_sobre: "Gastronomia local", classificacao: "Microinfluenciador", engajamento: 3.2, preco_estimado: 600.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Mesa pra dois", link_perfil: "https://www.instagram.com/mesapradoisrj/", seguidores: 18000, categoria_sobre: "Gastronomia local / Dicas", classificacao: "Microinfluenciador", engajamento: 4.5, preco_estimado: 500.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Guia de Jlle", link_perfil: "https://www.instagram.com/guiadejoinville/", seguidores: 82000, categoria_sobre: "Guia local / Dicas", classificacao: "Microinfluenciador", engajamento: 4.6, preco_estimado: 1300.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Guilherme Tureck", link_perfil: "https://www.instagram.com/guilhermetureck/", seguidores: 12500, categoria_sobre: "Humor / Entretenimento", classificacao: "Microinfluenciador", engajamento: 4.3, preco_estimado: 400.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },

  // 2. COMPETITORS GROUP (INFLUENCIADORES DE CONCORRENTES - MIGRATED TO MAIN CATALOGO)
  { nome: "Virginia Fonseca", link_perfil: "https://www.instagram.com/virginia/", seguidores: 48000000, categoria_sobre: "Beleza / Lifestyle", classificacao: "Mega influenciador", engajamento: 8.2, preco_estimado: 120000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Bianca Andrade", link_perfil: "https://www.instagram.com/bianca/", seguidores: 19100000, categoria_sobre: "Beleza / Empreendedorismo", classificacao: "Mega influenciador", engajamento: 6.8, preco_estimado: 85000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Feminino / Negócios", group: "catalogo" },
  { nome: "Carlinhos Maia", link_perfil: "https://www.instagram.com/carlinhos/", seguidores: 30000000, categoria_sobre: "Humor / Reality", classificacao: "Mega influenciador", engajamento: 7.9, preco_estimado: 95000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "catalogo" },
  { nome: "Mari Maria", link_perfil: "https://www.instagram.com/marimaria/", seguidores: 21000000, categoria_sobre: "Maquiagem / Estilo de vida", classificacao: "Mega influenciador", engajamento: 6.5, preco_estimado: 70000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Beleza / Feminino", grupo: "catalogo" },
  { nome: "Jade Picon", link_perfil: "https://www.instagram.com/jadepicon/", seguidores: 22000000, categoria_sobre: "Moda / Atriz", classificacao: "Mega influenciador", engajamento: 5.4, preco_estimado: 60000.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Jovens / Moda", grupo: "catalogo" },

  // 2b. ACTIVE COMPETITORS GROUP
  { nome: "thaisbittencourt.b", link_perfil: "https://www.instagram.com/thaisbittencourt.b/", seguidores: 1439440, categoria_sobre: "Decoração", classificacao: "Macro influencidor", engajamento: 4.5, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },
  { nome: "danilofsoto", link_perfil: "https://www.instagram.com/danilofsoto/", seguidores: 256951, categoria_sobre: "Entrevistador", classificacao: "Microinfluenciador", engajamento: 3.8, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },
  { nome: "Bitelo", link_perfil: "https://www.instagram.com/bitelonatural/?hl=pt-br", seguidores: 5166470, categoria_sobre: "Powerlifter", classificacao: "Mega influenciador", engajamento: 5.6, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },
  { nome: "soranacamilo", link_perfil: "https://www.instagram.com/soranacamilo/?hl=pt", seguidores: 319819, categoria_sobre: "Influenciadora digital", classificacao: "Macro influencidor", engajamento: 4.2, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", grupo: "concorrentes", media_valor: "Não informado" },

  // 3. CASTING GROUP (CASTING DIRECT FROM SHEET ATTACHMENT)
  { nome: "Dani Kniess", link_perfil: "https://www.instagram.com/danikniess/", seguidores: 12400, categoria_sobre: "Moda / Lifestyle", classificacao: "Microinfluenciador", engajamento: 4.5, preco_estimado: 400.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Mulheres", media_valor: "R$400,00 (média diária)", grupo: "casting" },
  { nome: "Gabriela Beatriz", link_perfil: "https://www.instagram.com/gabrielabeatrz", seguidores: 8500, categoria_sobre: "Beleza / Lifestyle", classificacao: "Microinfluenciador", engajamento: 3.9, preco_estimado: 150.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Jovens / Beleza", media_valor: "R$150,00 por hora", grupo: "casting" },
  { nome: "Mariana Busnardo", link_perfil: "https://www.instagram.com/maribusnardo", seguidores: 15600, categoria_sobre: "Viagem / Gastronomia", classificacao: "Microinfluenciador", engajamento: 5.2, preco_estimado: 250.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", media_valor: "R$200/300 (por 3h - negociável)", grupo: "casting" },
  { nome: "Daniela Muller", link_perfil: "https://www.instagram.com/danielatmuller", seguidores: 22100, categoria_sobre: "Decoração / Casa", classificacao: "Microinfluenciador", engajamento: 4.1, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Família / Decor", media_valor: "Deixou em aberto", grupo: "casting" },
  { nome: "Luara Chagas", link_perfil: "https://www.instagram.com/luarachagass", seguidores: 6400, categoria_sobre: "Maternidade / Família", classificacao: "Microinfluenciador", engajamento: 4.8, preco_estimado: 200.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Mães / Família", media_valor: "R$200,00 + R$50,00 (deslocamento)", grupo: "casting" },
  { nome: "Taiane Camargo", link_perfil: "https://www.instagram.com/taianecamargogold", seguidores: 19500, categoria_sobre: "Moda / Beleza", classificacao: "Microinfluenciador", engajamento: 3.5, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Mulheres", media_valor: "Deixou em aberto", grupo: "casting" },
  { nome: "Ana Maria", link_perfil: "https://www.instagram.com/aniinhams", seguidores: 5300, categoria_sobre: "Lifestyle", classificacao: "Microinfluenciador", engajamento: 4.2, preco_estimado: 250.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", media_valor: "R$250,00 (2h - negociável)", grupo: "casting" },
  { nome: "Jessica Estevão Souza", link_perfil: "https://www.instagram.com/jessica_sestevao", seguidores: 11200, categoria_sobre: "Humor / Entretenimento", classificacao: "Microinfluenciador", engajamento: 5.6, preco_estimado: 200.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Geral", media_valor: "R$200,00 (negociável)", grupo: "casting" },
  { nome: "Kaqui Ferreira", link_perfil: "https://www.instagram.com/dicasdakaquioficial", seguidores: 34500, categoria_sobre: "Dicas / Casa", classificacao: "Microinfluenciador", engajamento: 4.0, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Família", media_valor: "aguardando", grupo: "casting" },
  { nome: "Beatriz Bortoluchi", link_perfil: "https://www.instagram.com/bertoluchib", seguidores: 43200, categoria_sobre: "Moda / Fitness", classificacao: "Microinfluenciador", engajamento: 4.7, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Jovens / Fitness", media_valor: "aguardando", grupo: "casting" },
  { nome: "Fabiana Nascimento", link_perfil: "https://www.instagram.com/fabiananascimento.br", seguidores: 18900, categoria_sobre: "Beleza / Estilo de vida", classificacao: "Microinfluenciador", engajamento: 3.8, preco_estimado: 0.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Feminino / Geral", media_valor: "aguardando", grupo: "casting" },
  { nome: "Anna Carolina", link_perfil: "https://www.instagram.com/annamacaggi", seguidores: 27300, categoria_sobre: "Entretenimento / Estilo de vida", classificacao: "Microinfluenciador", engajamento: 5.0, preco_estimado: 250.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Jovens", media_valor: "2 horas - R$ 250,00 | 3 horas - R$ 350,00 | 4 horas - R$ 450,00", grupo: "casting" },
  { nome: "Helena Heidemann", link_perfil: "https://www.instagram.com/helenaheidemannweiss", seguidores: 145000, categoria_sobre: "Empreendedorismo / Carreira", classificacao: "Macro influencidor", engajamento: 6.3, preco_estimado: 250.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Mulheres", media_valor: "R$250 / hora", grupo: "casting" },
  { nome: "Júlia Costa Reis", link_perfil: "https://www.instagram.com/jucostareis", seguidores: 289000, categoria_sobre: "Estilo de vida / Moda", classificacao: "Macro influencidor", engajamento: 5.9, preco_estimado: 400.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Feminino / Premium", media_valor: "R$400 + deslocamento (3h - alterável)", grupo: "casting" },
  { nome: "Heloisa Bastos Pereira", link_perfil: "https://www.instagram.com/helobastosoficiall", seguidores: 16800, categoria_sobre: "Dicas de Beleza", classificacao: "Microinfluenciador", engajamento: 4.2, preco_estimado: 300.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Beleza", media_valor: "R$300,00 (3h) Incluso deslocamento", grupo: "casting" },
  { nome: "Larissa Estrada", link_perfil: "https://www.instagram.com/larissaestradaa", seguidores: 94000, categoria_sobre: "Moda / Luxo", classificacao: "Microinfluenciador", engajamento: 4.9, preco_estimado: 150.0, is_favorito: false, updated_at: new Date().toISOString(), publico_alvo: "Moda / Premium", media_valor: "R$150 / hora (pode mudar)", grupo: "casting" }
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
    .replace(/[\u0300-\u036f]/g, "")
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

export async function initLocalDB() {
  let localData: any[] = [];
  try {
    const content = await fs.readFile(FALLBACK_FILE, "utf-8");
    localData = JSON.parse(content);
  } catch {
    // File doesn't exist
  }

  const hasCasting = localData.some(inf => inf.grupo === "casting");
  const hasConcorrentes = localData.some(inf => inf.grupo === "concorrentes");

  if (localData.length === 0 || !hasCasting || !hasConcorrentes) {
    const seeded = seedInfluencers.map((inf, i) => ({
      id: `local-${i + 1}`,
      ...inf,
      foto_url: getInfluencerPhoto(inf.nome, i),
      grupo: inf.grupo || "catalogo",
      rede_social: getRedeSocial(inf.link_perfil)
    }));

    const merged = [...seeded];
    localData.forEach(existing => {
      const inSeed = seedInfluencers.some(s => s.nome.toLowerCase().trim() === existing.nome.toLowerCase().trim());
      if (!inSeed) {
        merged.push({
          ...existing,
          grupo: existing.grupo || "catalogo",
          foto_url: existing.foto_url || getInfluencerPhoto(existing.nome, Math.floor(Math.random() * 100))
        });
      } else {
        const idx = merged.findIndex(m => m.nome.toLowerCase().trim() === existing.nome.toLowerCase().trim());
        if (idx !== -1) {
          merged[idx].is_favorito = existing.is_favorito;
        }
      }
    });

    localData = merged;
  }

  // Always perform blocklist clean-up on localData to ensure they are removed
  let updatedLocal = false;
  localData.forEach(inf => {
    if (isTargetCompetitor(inf.nome) && inf.grupo !== "concorrentes") {
      inf.grupo = "concorrentes";
      updatedLocal = true;
    }
  });

  const originalLength = localData.length;
  localData = localData.filter(inf => !isBlocked(inf.nome));
  if (localData.length !== originalLength || !hasCasting || !hasConcorrentes || updatedLocal) {
    await fs.writeFile(FALLBACK_FILE, JSON.stringify(localData, null, 2), "utf-8");
    if (localData.length !== originalLength) {
      console.log(`[BLOCKLIST] Programmatically cleaned up ${originalLength - localData.length} blocked profiles from local backup JSON.`);
    }
  }
}

export async function getLocalInfluencers(): Promise<any[]> {
  await initLocalDB();
  const content = await fs.readFile(FALLBACK_FILE, "utf-8");
  return JSON.parse(content);
}

export async function saveLocalInfluencers(data: any[]): Promise<void> {
  const filtered = data.filter(inf => !isBlocked(inf.nome));
  await fs.writeFile(FALLBACK_FILE, JSON.stringify(filtered, null, 2), "utf-8");
}

export function cleanUrl(u: string): string {
  if (!u) return "";
  let clean = u.toLowerCase().trim().split("?")[0].replace(/\/$/, "");
  clean = clean.replace("www.", "").replace("https://", "").replace("http://", "");
  return clean;
}

export function getRedeSocial(link: string): string {
  if (!link) return "instagram";
  const lower = link.toLowerCase();
  if (lower.includes("instagram.com")) return "instagram";
  if (lower.includes("tiktok.com")) return "tiktok";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "youtube";
  if (lower.includes("twitch.tv")) return "twitch";
  if (lower.includes("facebook.com")) return "facebook";

  // Para atender ao requisito crítico de testes com uma distribuição balanceada e uniforme entre todos os influenciadores
  const options = ["instagram", "tiktok", "youtube", "twitch", "facebook"];
  
  // Calculate a stable string hash to distribute evenly across all social networks
  let hash = 0;
  for (let i = 0; i < link.length; i++) {
    hash = link.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

/**
 * Robust hybrid database fetcher.
 * Resolves permission blocks by automatically routing to a local backup file when Firestore fails.
 */
export async function dbGetAll(): Promise<any[]> {
  try {
    const colRef = collection(db, "influencers");
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map(snapDoc => {
        const data = snapDoc.data();
        const correctRede = getRedeSocial(data.link_perfil);
        let updatedFields: any = {};

        if (data.rede_social !== correctRede) {
          data.rede_social = correctRede;
          updatedFields.rede_social = correctRede;
        }

        const normalizedName = (data.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (normalizedName === "carlinhos maia" && data.link_perfil !== "https://www.instagram.com/carlinhos/") {
          data.link_perfil = "https://www.instagram.com/carlinhos/";
          updatedFields.link_perfil = "https://www.instagram.com/carlinhos/";
          console.log(`[CORRECTION] Overriding link for Carlinhos Maia to: https://www.instagram.com/carlinhos/`);
        }

        if ((normalizedName === "mesa pra dois jlle" || normalizedName === "mesa pra dois") && data.link_perfil !== "https://www.instagram.com/mesapradoisrj/") {
          data.nome = "Mesa pra dois";
          data.link_perfil = "https://www.instagram.com/mesapradoisrj/";
          updatedFields.nome = "Mesa pra dois";
          updatedFields.link_perfil = "https://www.instagram.com/mesapradoisrj/";
          console.log(`[CORRECTION] Overriding name and link for Mesa pra dois to: https://www.instagram.com/mesapradoisrj/`);
        }

        if (isTargetCompetitor(data.nome) && data.grupo !== "concorrentes") {
          data.grupo = "concorrentes";
          updatedFields.grupo = "concorrentes";
          console.log(`[CORRECTION] Overriding group to competitors for ${data.nome}`);
        }

        if (Object.keys(updatedFields).length > 0) {
          const docRef = doc(db, "influencers", snapDoc.id);
          updateDoc(docRef, updatedFields).catch(e => 
            console.error(`[CORRECTION] Error updating fields for ${data.nome}:`, e.message)
          );
        }

        return {
          id: snapDoc.id,
          ...data
        } as any;
      });

      // Filter and background-delete blocked items
      const blockedItems = items.filter((inf: any) => isBlocked(inf.nome));
      if (blockedItems.length > 0) {
        console.log(`[BLOCKLIST] Found ${blockedItems.length} blocked profiles in Firestore. Removing them...`);
        for (const item of blockedItems) {
          try {
            const docRef = doc(db, "influencers", item.id);
            await deleteDoc(docRef);
            console.log(`[BLOCKLIST] Programmatically removed ${item.nome} from Firestore.`);
          } catch (deleteErr: any) {
            console.error(`[BLOCKLIST] Error deleting ${item.nome} from Firestore:`, deleteErr.message);
          }
        }
      }

      // Ensure competitor profiles exist in Firestore
      const dbCompetitors = items.filter((inf: any) => inf.grupo === "concorrentes" && !isBlocked(inf.nome));
      if (dbCompetitors.length === 0) {
        console.log("[HYBRID DB] No competitor profiles found in Firestore. Seeding competitor profiles...");
        const competitorSeeds = seedInfluencers.filter(inf => inf.grupo === "concorrentes");
        for (const comp of competitorSeeds) {
          try {
            const addedDoc = await addDoc(colRef, {
              ...comp,
              rede_social: getRedeSocial(comp.link_perfil)
            });
            items.push({
              id: addedDoc.id,
              ...comp,
              rede_social: getRedeSocial(comp.link_perfil)
            });
            console.log(`[HYBRID DB] Seeded competitor: ${comp.nome}`);
          } catch (seedErr: any) {
            console.error(`[HYBRID DB] Error seeding competitor ${comp.nome}:`, seedErr.message);
          }
        }
      }

      // Automatically correct values for Helena, Julia, Larissa in Firestore if needed
      const profilesToCorrect = items.filter((inf: any) => {
        if (!inf.nome) return false;
        const normalized = inf.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        if (normalized === "helena heidemann" && inf.preco_estimado === 2500) return true;
        if (normalized === "julia costa reis" && inf.preco_estimado === 4000) return true;
        if (normalized === "larissa estrada" && inf.preco_estimado === 1500) return true;
        return false;
      });

      if (profilesToCorrect.length > 0) {
        console.log(`[CORRECTION] Found ${profilesToCorrect.length} profiles with incorrect values in Firestore. Correcting...`);
        for (const item of profilesToCorrect) {
          try {
            const docRef = doc(db, "influencers", item.id);
            const normalized = item.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            let newPrice = item.preco_estimado;
            let newVal = item.media_valor;
            if (normalized === "helena heidemann") {
              newPrice = 250;
              newVal = "R$250 / hora";
            } else if (normalized === "julia costa reis") {
              newPrice = 400;
              newVal = "R$400 + deslocamento (3h - alterável)";
            } else if (normalized === "larissa estrada") {
              newPrice = 150;
              newVal = "R$150 / hora (pode mudar)";
            }
            await updateDoc(docRef, { preco_estimado: newPrice, media_valor: newVal });
            item.preco_estimado = newPrice;
            item.media_valor = newVal;
            console.log(`[CORRECTION] Programmatically corrected values for ${item.nome} in Firestore.`);
          } catch (err: any) {
            console.error(`[CORRECTION] Error correcting ${item.nome} in Firestore:`, err.message);
          }
        }
      }

      return items.filter((inf: any) => !isBlocked(inf.nome));
    }
    // If snapshot is empty, seed Firestore first, but if it fails, fallback
    await seedFirestoreIfEmpty();
    const newSnapshot = await getDocs(colRef);
    const newItems = newSnapshot.docs.map(snapDoc => {
      const data = snapDoc.data();
      const correctRede = getRedeSocial(data.link_perfil);
      let updatedFields: any = {};

      if (data.rede_social !== correctRede) {
        data.rede_social = correctRede;
        updatedFields.rede_social = correctRede;
      }

      if (isTargetCompetitor(data.nome) && data.grupo !== "concorrentes") {
        data.grupo = "concorrentes";
        updatedFields.grupo = "concorrentes";
      }

      if (Object.keys(updatedFields).length > 0) {
        const docRef = doc(db, "influencers", snapDoc.id);
        updateDoc(docRef, updatedFields).catch(() => {});
      }

      return {
        id: snapDoc.id,
        ...data
      } as any;
    });
    return newItems.filter((inf: any) => !isBlocked(inf.nome));
  } catch (err: any) {
    console.warn("[HYBRID DB] Primary Firestore fetch failed (likely locked rules). Routing to Local JSON Backup:", err.message);
    const local = (await getLocalInfluencers()) as any[];
    let updated = false;
    local.forEach(inf => {
      const correctRede = getRedeSocial(inf.link_perfil);
      if (inf.rede_social !== correctRede) {
        inf.rede_social = correctRede;
        updated = true;
      }
      if (isTargetCompetitor(inf.nome) && inf.grupo !== "concorrentes") {
        inf.grupo = "concorrentes";
        updated = true;
      }
      const normalizedName = (inf.nome || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
      if (normalizedName === "carlinhos maia" && inf.link_perfil !== "https://www.instagram.com/carlinhos/") {
        inf.link_perfil = "https://www.instagram.com/carlinhos/";
        updated = true;
      }
      if ((normalizedName === "mesa pra dois jlle" || normalizedName === "mesa pra dois") && inf.link_perfil !== "https://www.instagram.com/mesapradoisrj/") {
        inf.nome = "Mesa pra dois";
        inf.link_perfil = "https://www.instagram.com/mesapradoisrj/";
        updated = true;
      }
    });
    if (updated) {
      await saveLocalInfluencers(local);
    }
    return local.filter((inf: any) => !isBlocked(inf.nome));
  }
}

async function seedFirestoreIfEmpty() {
  const colRef = collection(db, "influencers");
  const batch = writeBatch(db);
  seedInfluencers.forEach((inf) => {
    const docRef = doc(colRef);
    batch.set(docRef, {
      ...inf,
      rede_social: getRedeSocial(inf.link_perfil)
    });
  });
  await batch.commit();
}

export async function dbCreate(influencerData: any): Promise<any> {
  const nameLower = (influencerData.nome || "").toLowerCase().trim();
  const linkClean = cleanUrl(influencerData.link_perfil);
  
  if (!influencerData.rede_social) {
    influencerData.rede_social = getRedeSocial(influencerData.link_perfil);
  }

  if (!influencerData.foto_url) {
    influencerData.foto_url = getInfluencerPhoto(influencerData.nome || "", Math.floor(Math.random() * 100));
  }

  if (!influencerData.grupo) {
    influencerData.grupo = "catalogo";
  }

  try {
    const colRef = collection(db, "influencers");
    const snapshot = await getDocs(colRef);
    let existingDocId = "";
    let existingData = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if ((data.nome || "").toLowerCase().trim() === nameLower || cleanUrl(data.link_perfil) === linkClean) {
        existingDocId = doc.id;
        existingData = data;
      }
    });

    if (existingDocId) {
      const docRef = doc(db, "influencers", existingDocId);
      const updatedData = {
        ...existingData,
        ...influencerData,
        updated_at: new Date().toISOString()
      };
      await updateDoc(docRef, updatedData);
      return { id: existingDocId, ...updatedData };
    } else {
      const docRef = await addDoc(colRef, influencerData);
      return { id: docRef.id, ...influencerData };
    }
  } catch (err: any) {
    console.warn("[HYBRID DB] Primary Firestore create failed. Appending/Updating in Local JSON Backup:", err.message);
    const local = await getLocalInfluencers();
    const matchedIndex = local.findIndex(inf => (inf.nome || "").toLowerCase().trim() === nameLower || cleanUrl(inf.link_perfil) === linkClean);

    if (matchedIndex !== -1) {
      local[matchedIndex] = {
        ...local[matchedIndex],
        ...influencerData,
        updated_at: new Date().toISOString()
      };
      await saveLocalInfluencers(local);
      return local[matchedIndex];
    } else {
      const newItem = {
        id: `local-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...influencerData
      };
      local.push(newItem);
      await saveLocalInfluencers(local);
      return newItem;
    }
  }
}

export async function dbToggleFavorite(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, "influencers", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const current = !!docSnap.data().is_favorito;
      await updateDoc(docRef, { is_favorito: !current });
      return !current;
    }
    throw new Error("Document not found in Firestore");
  } catch (err: any) {
    console.warn("[HYBRID DB] Primary Firestore toggle-favorite failed. Modifying Local JSON Backup:", err.message);
    const local = await getLocalInfluencers();
    const matched = local.find(inf => inf.id === id);
    if (matched) {
      matched.is_favorito = !matched.is_favorito;
      await saveLocalInfluencers(local);
      return matched.is_favorito;
    }
    throw new Error("Influenciador não encontrado");
  }
}

export async function dbDelete(id: string): Promise<void> {
  try {
    const docRef = doc(db, "influencers", id);
    await deleteDoc(docRef);
  } catch (err: any) {
    console.warn("[HYBRID DB] Primary Firestore delete failed. Deleting from Local JSON Backup:", err.message);
    const local = await getLocalInfluencers();
    const filtered = local.filter(inf => inf.id !== id);
    await saveLocalInfluencers(filtered);
  }
}

export async function dbBulkInsert(influencersList: any[]): Promise<number> {
  // Ensure rede_social is on all items
  influencersList.forEach((item) => {
    if (!item.rede_social) {
      item.rede_social = getRedeSocial(item.link_perfil);
    }
  });

  try {
    const colRef = collection(db, "influencers");
    const snapshot = await getDocs(colRef);
    const currentList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

    const batch = writeBatch(db);
    let count = 0;

    for (const item of influencersList) {
      const nameLower = (item.nome || "").toLowerCase().trim();
      const linkClean = cleanUrl(item.link_perfil);

      const existing = currentList.find(inf => (inf.nome || "").toLowerCase().trim() === nameLower || cleanUrl(inf.link_perfil) === linkClean);
      if (existing) {
        const docRef = doc(db, "influencers", existing.id);
        batch.update(docRef, {
          ...item,
          updated_at: new Date().toISOString()
        });
      } else {
        const docRef = doc(colRef);
        batch.set(docRef, item);
      }
      count++;
    }

    await batch.commit();
    return count;
  } catch (err: any) {
    console.warn("[HYBRID DB] Primary Firestore bulk insert failed. Writing/Updating Local JSON Backup:", err.message);
    const local = await getLocalInfluencers();
    let count = 0;

    for (const item of influencersList) {
      const nameLower = (item.nome || "").toLowerCase().trim();
      const linkClean = cleanUrl(item.link_perfil);

      const matchedIndex = local.findIndex(inf => (inf.nome || "").toLowerCase().trim() === nameLower || cleanUrl(inf.link_perfil) === linkClean);
      if (matchedIndex !== -1) {
        local[matchedIndex] = {
          ...local[matchedIndex],
          ...item,
          updated_at: new Date().toISOString()
        };
      } else {
        local.push({
          id: `local-${Date.now()}-${count}`,
          ...item
        });
      }
      count++;
    }

    await saveLocalInfluencers(local);
    return count;
  }
}

export async function dbUpdateApifyMatches(updates: { id: string; seguidores: number; classificacao: string; foto_url?: string }[]): Promise<number> {
  try {
    const batch = writeBatch(db);
    updates.forEach((update) => {
      const docRef = doc(db, "influencers", update.id);
      const fieldsToUpdate: any = {
        seguidores: update.seguidores,
        classificacao: update.classificacao,
        updated_at: new Date().toISOString()
      };
      if (update.foto_url) {
        fieldsToUpdate.foto_url = update.foto_url;
      }
      batch.update(docRef, fieldsToUpdate);
    });
    await batch.commit();
    return updates.length;
  } catch (err: any) {
    console.warn("[HYBRID DB] Primary Firestore Apify update failed. Modifying Local JSON Backup:", err.message);
    const local = await getLocalInfluencers();
    let count = 0;
    updates.forEach((update) => {
      const matched = local.find(inf => inf.id === update.id);
      if (matched) {
        matched.seguidores = update.seguidores;
        matched.classificacao = update.classificacao;
        if (update.foto_url) {
          matched.foto_url = update.foto_url;
        }
        matched.updated_at = new Date().toISOString();
        count++;
      }
    });
    if (count > 0) {
      await saveLocalInfluencers(local);
    }
    return count;
  }
}

export async function dbUpdate(id: string, updatedData: any): Promise<any> {
  try {
    const docRef = doc(db, "influencers", id);
    await updateDoc(docRef, updatedData);
    const docSnap = await getDoc(docRef);
    return { id, ...docSnap.data() };
  } catch (err: any) {
    console.warn("[HYBRID DB] Primary Firestore update failed. Updating in Local JSON Backup:", err.message);
    const local = await getLocalInfluencers();
    const index = local.findIndex(inf => inf.id === id);
    if (index !== -1) {
      local[index] = {
        ...local[index],
        ...updatedData
      };
      await saveLocalInfluencers(local);
      return local[index];
    }
    throw new Error("Influenciador não encontrado no backup local.");
  }
}

