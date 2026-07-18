import { normalizeCategory } from "../types";

export interface RawCSVRow {
  nome: string;
  link_perfil: string;
  seguidores: number;
  categoria_sobre: string;
  engajamento: number;
  preco_estimado: number;
  rede_social?: string;
  publico_alvo?: string;
  grupo: "catalogo" | "concorrentes" | "casting";
}

function removeDiacritics(str: string): string {
  return str.normalize("NFD").replace(/\p{Mark}/gu, "");
}

function normalizeHeader(h: string): string {
  const clean = removeDiacritics(h.trim().toLowerCase())
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/__+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (["nome", "nome_completo", "name", "influenciador", "influencer"].includes(clean)) return "nome";
  if (["link_perfil", "link", "perfil", "instagram", "tiktok", "url", "link_do_perfil", "perfil_link", "link_perfil_instagram", "instagram_url", "redes"].includes(clean)) return "link_perfil";
  if (["rede_social", "rede", "social_network", "social", "network", "plataforma", "platform"].includes(clean)) return "rede_social";
  if (["seguidores", "seguidores_total", "followers", "n_seguidores", "num_seguidores", "seg", "folowers"].includes(clean)) return "seguidores";
  if (["categoria_sobre", "categoria", "sobre", "nicho", "ramo_nicho", "tema", "ramo_de_atuacao", "ramo", "atuacao", "categoria_nicho", "nicho_de_atuacao"].includes(clean)) return "categoria_sobre";
  if (["engajamento", "taxa_de_engajamento", "taxa_engajamento", "engajamento_percent", "engagement", "engajamento_pct", "engajamento_percentual"].includes(clean)) return "engajamento";
  if (["preco_estimado", "preco", "preço", "custo", "valor", "preco_estimado_post", "preco_post", "pre_o_estimado", "preco_cobrado", "valor_cobrado", "valor_estimado"].includes(clean)) return "preco_estimado";
  if (["publico_alvo", "publico", "publico_alvo_prioritario", "target_audience", "audience", "persona"].includes(clean)) return "publico_alvo";
  if (["grupo", "group", "tipo_perfil", "categoria_perfil"].includes(clean)) return "grupo";
  if (["tag_concorrente", "concorrente", "e_concorrente", "eh_concorrente", "competitor", "is_competitor"].includes(clean)) return "tag_concorrente";

  return clean;
}

function detectDelimiter(headerLine: string): string {
  const commas = (headerLine.match(/,/g) || []).length;
  const semicolons = (headerLine.match(/;/g) || []).length;
  return semicolons > commas ? ";" : ",";
}

function parseNumeric(val: string): number {
  if (!val) return 0;
  let clean = val.trim().toLowerCase();

  let multiplier = 1;
  if (clean.endsWith("k")) {
    multiplier = 1000;
    clean = clean.slice(0, -1).trim();
  } else if (clean.endsWith("m")) {
    multiplier = 1000000;
    clean = clean.slice(0, -1).trim();
  }

  // Remove currency, spaces, and %
  clean = clean.replace(/[r\$\s%€]/g, "");

  // If there is both a dot and a comma (e.g., 1.234,56), remove the dots and replace the comma with a dot
  if (clean.includes(".") && clean.includes(",")) {
    clean = clean.replace(/\./g, "").replace(/,/g, ".");
  } else if (clean.includes(",")) {
    const commaCount = (clean.match(/,/g) || []).length;
    if (commaCount === 1) {
      clean = clean.replace(/,/g, ".");
    } else {
      clean = clean.replace(/,/g, "");
    }
  }

  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num * multiplier;
}

// grupo in the CSV is expected in DB vocabulary (influenciador/modelo); tag_concorrente is a
// separate boolean column. Both get folded into the app's single grupo field here.
function parseGrupo(rawGrupo: string, rawTagConcorrente: string): "catalogo" | "concorrentes" | "casting" {
  const isCompetitor = ["true", "1", "sim", "yes", "verdadeiro", "x"].includes(rawTagConcorrente.trim().toLowerCase());
  if (isCompetitor) return "concorrentes";

  const v = removeDiacritics(rawGrupo.trim().toLowerCase());
  if (["modelo", "modelos", "casting"].includes(v)) return "casting";
  return "catalogo";
}

export function parseCSV(
  text: string,
  onProgress: (percent: number) => void
): { success: boolean; data?: RawCSVRow[]; error?: string } {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

  if (lines.length === 0) {
    return { success: false, error: "O arquivo CSV está vazio." };
  }

  const delimiter = detectDelimiter(lines[0]);

  // Header parsing with normalization and delimiter support
  const rawHeaders = lines[0].split(delimiter).map(h => h.trim());
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  const requiredFields = ["nome", "link_perfil"];
  const missing = requiredFields.filter(req => !normalizedHeaders.includes(req));

  if (missing.length > 0) {
    return {
      success: false,
      error: `Validação de cabeçalho rígida falhou. Campos obrigatórios ausentes ou não mapeados: [${missing.join(", ")}]. Cabeçalhos lidos: [${rawHeaders.join(", ")}].`
    };
  }

  const results: RawCSVRow[] = [];
  const totalRows = lines.length - 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    // Delimiter-aware splitter handling quotes correctly
    const row: string[] = [];
    let insideQuotes = false;
    let entry = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        row.push(entry.trim());
        entry = "";
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());

    // Map columns dynamically based on normalized headers
    const item: Record<string, string> = {};
    normalizedHeaders.forEach((header, index) => {
      item[header] = row[index] || "";
    });

    const followers = parseNumeric(item["seguidores"]);
    const engagement = parseNumeric(item["engajamento"]);
    const price = parseNumeric(item["preco_estimado"]);

    results.push({
      nome: item["nome"] || "Sem Nome",
      link_perfil: item["link_perfil"] || "",
      seguidores: followers,
      categoria_sobre: normalizeCategory(item["categoria_sobre"] || "Geral"),
      engajamento: engagement,
      preco_estimado: price,
      rede_social: item["rede_social"] ? item["rede_social"].toLowerCase().trim() : undefined,
      publico_alvo: item["publico_alvo"] || undefined,
      grupo: parseGrupo(item["grupo"] || "", item["tag_concorrente"] || "")
    });

    // Send progress
    const percent = Math.round((i / totalRows) * 100);
    onProgress(percent);
  }

  return { success: true, data: results };
}
