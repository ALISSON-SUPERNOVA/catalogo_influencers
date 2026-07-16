export function resolveInfluencerPhoto(influencer: { nome: string; foto_url?: string; link_perfil?: string }): string {
  if (influencer.foto_url && influencer.foto_url.trim() !== "" && !influencer.foto_url.includes("images.unsplash.com")) {
    return influencer.foto_url;
  }

  const name = influencer.nome || "";
  const lower = name.toLowerCase().trim();
  const url = influencer.link_perfil || "";
  const clean = url.trim().split("?")[0].replace(/\/$/, "");

  // Determine a beautiful default curated photo based on name match
  let curatedPhoto = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250";

  if (lower.includes("dani kniess")) {
    curatedPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("gabriela beatriz")) {
    curatedPhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("mariana busnardo")) {
    curatedPhoto = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("daniela muller")) {
    curatedPhoto = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("luara chagas")) {
    curatedPhoto = "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("taiane camargo")) {
    curatedPhoto = "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("ana maria")) {
    curatedPhoto = "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("jessica estevão") || lower.includes("jessica estevao") || lower.includes("jessica_sestevao")) {
    curatedPhoto = "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("kaqui ferreira") || lower.includes("dicasdakaqui")) {
    curatedPhoto = "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("beatriz bortoluchi") || lower.includes("bertoluchib")) {
    curatedPhoto = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("fabiana nascimento") || lower.includes("fabriananascimento")) {
    curatedPhoto = "https://images.unsplash.com/photo-1506919258185-6078bba55d2a?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("anna carolina") || lower.includes("annamacaggi")) {
    curatedPhoto = "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("helena heidemann") || lower.includes("helenaheidemann")) {
    curatedPhoto = "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("júlia costa") || lower.includes("julia costa") || lower.includes("jucostareis")) {
    curatedPhoto = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("heloisa bastos") || lower.includes("helobastosoficiall")) {
    curatedPhoto = "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("larissa estrada") || lower.includes("larissaestradaa")) {
    curatedPhoto = "https://images.unsplash.com/photo-1534751516642-a131fed10495?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("marina simplifica")) {
    curatedPhoto = "https://images.unsplash.com/photo-1541647376583-d933036b6022?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("francine cagnin")) {
    curatedPhoto = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("avaliando floripa")) {
    curatedPhoto = "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("dhe silva")) {
    curatedPhoto = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("casa.616")) {
    curatedPhoto = "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("jaque na cozinha")) {
    curatedPhoto = "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("familia maoli")) {
    curatedPhoto = "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("familia smith")) {
    curatedPhoto = "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("guimestiere")) {
    curatedPhoto = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("karol lunardi")) {
    curatedPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("thiara gambaro")) {
    curatedPhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("giovanna e manuela")) {
    curatedPhoto = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("marijoinville")) {
    curatedPhoto = "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("onde ir bc") || lower.includes("achei joinville") || lower.includes("gastronomiajlle") || lower.includes("sabores de joinville") || lower.includes("descubra jlle") || lower.includes("guia de jlle") || lower.includes("joinville secreta") || lower.includes("nossa jlle") || lower.includes("vem pra jlle") || lower.includes("achei em jlle") || lower.includes("por ai por jlle") || lower.includes("zaratineats") || lower.includes("mesa pra dois jlle")) {
    curatedPhoto = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("elaine ribeiro")) {
    curatedPhoto = "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("floripa em dobro") || lower.includes("pitacos do casal")) {
    curatedPhoto = "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("cami por floripa")) {
    curatedPhoto = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("virginia fonseca") || lower.includes("virginia")) {
    curatedPhoto = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("bianca andrade") || lower.includes("bianca")) {
    curatedPhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("carlinhos maia")) {
    curatedPhoto = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("mari maria")) {
    curatedPhoto = "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("jade picon")) {
    curatedPhoto = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("enaldinho")) {
    curatedPhoto = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("xuxa")) {
    curatedPhoto = "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("chef melchert")) {
    curatedPhoto = "https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("thaisbittencourt.b") || lower.includes("thais bittencourt") || lower.includes("thaisbittencourt")) {
    curatedPhoto = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("danilofsoto") || lower.includes("danilo soto")) {
    curatedPhoto = "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("bitelo")) {
    curatedPhoto = "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250";
  } else if (lower.includes("soranacamilo") || lower.includes("sorana camilo")) {
    curatedPhoto = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250";
  } else {
    // Check male names
    const maleKeywords = ["luiz", "henrique", "maikon", "prado", "william", "costa", "guilherme", "tureck", "chef", "dhe", "gui"];
    if (maleKeywords.some(kw => lower.includes(kw))) {
      curatedPhoto = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250";
    }
  }

  // Extract username from profile link
  if (clean) {
    if (clean.includes("instagram.com")) {
      const parts = clean.split("/");
      let last = parts[parts.length - 1] || "";
      last = last.replace("@", "").trim();
      if (last) {
        // Return unavatar URL with our curated fallback!
        return `https://unavatar.io/instagram/${last}?fallback=${encodeURIComponent(curatedPhoto)}`;
      }
    } else if (clean.includes("tiktok.com")) {
      const parts = clean.split("/");
      let last = parts[parts.length - 1] || "";
      last = last.replace("@", "").trim();
      if (last) {
        // Return unavatar TikTok URL with curated fallback!
        return `https://unavatar.io/tiktok/${last}?fallback=${encodeURIComponent(curatedPhoto)}`;
      }
    }
  }

  // Fallback to what was in the object already, or curated photo
  if (influencer.foto_url && !influencer.foto_url.includes("images.unsplash.com/photo-1438761681033-6461ffad8d80")) {
    return influencer.foto_url;
  }

  return curatedPhoto;
}
