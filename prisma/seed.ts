import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Seeding is a one-off admin task — use the direct connection (DIRECT_URL),
// falling back to the pooled DATABASE_URL.
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const games = [
  {
    id: 6,
    name: "NACIONES",
    description:
      "NACIONES es un juego en el que debes completar una formación con futbolistas de 11 países distintos. Los países aparecen en orden aleatorio y debes añadir un jugador de cada país para llenar el once usando el campo para escribir. Si no conoces ningún jugador, hay un botón para cambiar de país, pero aplica una sanción de 5 segundos antes de que aparezca el siguiente. Modo versus 1v1: ambos comparten el mismo tablero y, cuando uno elige un futbolista para una posición, esa casilla queda bloqueada para el otro. Gana quien tenga más casillas llenas al finalizar la partida.",
    imageUrl: "/minigames/naciones.png",
    availableDifficulties: ["Fácil", "Medio", "Difícil"],
  },
  {
    id: 7,
    name: "CLUBES",
    description:
      "CLUBES es un juego en el que debes completar una formación con futbolistas de 11 clubes distintos. Los clubes aparecen en orden aleatorio y debes añadir un jugador de cada club para completar el once usando el campo para escribir. Si no conoces ningún jugador, hay un botón para cambiar de club, con sanción de 5 segundos antes del siguiente. Modo versus 1v1: el tablero es compartido; si un jugador coloca a alguien en una posición, esa casilla queda bloqueada para el rival. Gana quien tenga más casillas llenas al finalizar la partida.",
    imageUrl: "/minigames/clubes.png",
    availableDifficulties: ["Fácil", "Medio", "Difícil"],
  },
  {
    id: 8,
    name: "GRID",
    description:
      'GRID es un juego 3×3 (tipo "tic-tac-toe" de fútbol) con criterios en filas y columnas. Debes llenar las 9 casillas con futbolistas que cumplan simultáneamente la fila y la columna. Primero seleccionas una casilla de las 9 y después usas el campo de escribir para buscar un jugador que encaje en esa casilla. Modo versus 1v1: ambos comparten la misma grilla; cada elección bloquea esa casilla para el otro. Gana quien tenga más casillas llenas al finalizar la partida.',
    imageUrl: "/minigames/grid.png",
    availableDifficulties: ["Fácil", "Medio", "Difícil"],
  },
  {
    id: 9,
    name: "BINGO",
    description:
      'BINGO es un juego donde aparecen futbolistas uno por uno y debes hacer clic en la casilla de la categoría donde encajan (clubes, países, posiciones, pierna buena, liga y dorsal). Reglas: si eliges una categoría que NO encaja con el futbolista mostrado, recibes una sanción de 3 segundos antes de poder volver a jugar. Botón "Skip": si no sabes dónde encaja, puedes saltarlo pero aplica una sanción de 1 segundo. Llena las 12 casillas para lograr ¡Bingo! Modo versus 1v1: ambos comparten el mismo tablero; cuando uno asigna correctamente un jugador a una casilla, esta queda bloqueada para el rival. Gana quien tenga más casillas llenas al finalizar la partida.',
    imageUrl: "/minigames/bingo.png",
    availableDifficulties: ["Fácil", "Medio", "Difícil"],
  },
  {
    id: 10,
    name: "BINGO ALT",
    description:
      'BINGO ALT es un juego donde aparecen categorías una por una y debes hacer clic en la casilla del futbolista que encaje con ella (clubes, países, posiciones, pierna buena, liga y dorsal). Reglas: si eliges un futbolista que NO encaja con la categoría activa, recibes una sanción de 3 segundos antes de poder volver a jugar. Botón "Skip": si no sabes a qué futbolista asignar la categoría, puedes saltarla pero aplica una sanción de 1 segundo. Llena las 12 casillas para lograr ¡Bingo! Modo versus 1v1: ambos comparten el mismo tablero; cuando uno asigna correctamente una categoría a un futbolista, la casilla queda bloqueada para el rival. Gana quien tenga más casillas llenas al finalizar la partida.',
    imageUrl: "/minigames/bingoalt.png",
    availableDifficulties: ["Fácil", "Medio", "Difícil"],
  },
];

// ── Leagues ("Ruta de Ligas") ────────────────────────────────────────────────
// Adapted from the legacy Ligue_rows.csv. League names corrected to the real
// name of each country's top division. `min`/`max` = market-value (€M) window;
// each `max` equals the next league's `min`. Top tier (Leyendas) has no ceiling.
// ligueId in the CSVs maps to these by `csvId`.
const leagues = [
  { csvId: 1,  code: "pe",      name: "Liga 1",            country: "Perú",       countryCode: "pe", image: "/ligues/liga1-peru.png",          tier: 1,  min: 0,   max: 25 },
  { csvId: 2,  code: "mx",      name: "Liga MX",           country: "México",     countryCode: "mx", image: "/ligues/ligamx-mexico.png",       tier: 2,  min: 25,  max: 50 },
  { csvId: 3,  code: "ar",      name: "Liga Profesional",  country: "Argentina",  countryCode: "ar", image: "/ligues/liga-argentina.png",      tier: 3,  min: 50,  max: 75 },
  { csvId: 4,  code: "br",      name: "Brasileirão",       country: "Brasil",     countryCode: "br", image: "/ligues/brasileirao-brasil.png",  tier: 4,  min: 75,  max: 100 },
  { csvId: 5,  code: "de",      name: "Bundesliga",        country: "Alemania",   countryCode: "de", image: "/ligues/bundesliga-alemania.png", tier: 5,  min: 100, max: 135 },
  { csvId: 6,  code: "fr",      name: "Ligue 1",           country: "Francia",    countryCode: "fr", image: "/ligues/ligue1-francia.png",      tier: 6,  min: 135, max: 170 },
  { csvId: 7,  code: "it",      name: "Serie A",           country: "Italia",     countryCode: "it", image: "/ligues/seriea-italia.png",       tier: 7,  min: 170, max: 205 },
  { csvId: 8,  code: "es",      name: "LaLiga",            country: "España",     countryCode: "es", image: "/ligues/laliga-españa.png",       tier: 8,  min: 205, max: 240 },
  { csvId: 9,  code: "en",      name: "Premier League",    country: "Inglaterra", countryCode: "gb", image: "/ligues/premierleague-inglaterra.png", tier: 9, min: 240, max: 280 },
  { csvId: 10, code: "legends", name: "Leyendas",          country: "Mundo",      countryCode: "world", image: "/ligues/legends.png",          tier: 10, min: 280, max: null },
];

const csvIdToCode = new Map(leagues.map((l) => [l.csvId, l.code]));

type Rarity = "LEGEND" | "EPIC" | "RARE" | "COMMON";

/** Rarity scales with league prestige. */
function rarityForTier(tier: number): Rarity {
  if (tier >= 8) return "LEGEND";
  if (tier >= 5) return "EPIC";
  return "RARE";
}

const slugOf = (url: string) =>
  (url.split("/").pop() ?? "")
    .replace(/\.(png|jpe?g|svg|webp)$/i, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

// ── Avatares (cartas de jugadores icónicos) — from Card_rows.csv ──────────────
// [urlCard, playerName, playerCountry, csvLigueId]
const avatarRows: [string, string, string, number][] = [
  ["/players-iconic/barcos.png", "HERNÁN BARCOS", "Argentina", 1],
  ["/players-iconic/cueva.png", "CHRISTIAN CUEVA", "Perú", 1],
  ["/players-iconic/flores.png", "EDISON FLORES", "Perú", 1],
  ["/players-iconic/guerrero.png", "PAOLO GUERRERO", "Perú", 1],
  ["/players-iconic/zambrano.png", "CARLOS ZAMBRANO", "Perú", 1],
  ["/players-iconic/chicharito.png", "JAVIER HERNÁNDEZ", "México", 2],
  ["/players-iconic/ramos.png", "SERGIO RAMOS", "España", 2],
  ["/players-iconic/james.png", "JAMES RODRÍGUEZ", "Colombia", 2],
  ["/players-iconic/correa.png", "ÁNGEL CORREA", "Argentina", 2],
  ["/players-iconic/cavani.png", "EDINSON CAVANI", "Uruguay", 3],
  ["/players-iconic/quintero.png", "ALBERTO QUINTERO", "Panamá", 3],
  ["/players-iconic/gabigol.png", "GABRIEL BARBOSA", "Brasil", 4],
  ["/players-iconic/roque.png", "VITOR ROQUE", "Brasil", 4],
  ["/players-iconic/kane.png", "HARRY KANE", "Inglaterra", 5],
  ["/players-iconic/kimmich.png", "JOSHUA KIMMICH", "Alemania", 5],
  ["/players-iconic/neuer.png", "MANUEL NEUER", "Alemania", 5],
  ["/players-iconic/luis-diaz.png", "LUIS DÍAZ", "Colombia", 5],
  ["/players-iconic/dembele.png", "OUSMANE DEMBÉLÉ", "Francia", 6],
  ["/players-iconic/hakimi.png", "ACHRAF HAKIMI", "Marruecos", 6],
  ["/players-iconic/vitinha.png", "VITINHA", "Portugal", 6],
  ["/players-iconic/doue.png", "DÉSIRÉ DOUÉ", "Francia", 6],
  ["/players-iconic/leao.png", "RAFAEL LEÃO", "Portugal", 7],
  ["/players-iconic/lautaro.png", "LAUTARO MARTÍNEZ", "Argentina", 7],
  ["/players-iconic/modric.png", "LUKA MODRIĆ", "Croacia", 7],
  ["/players-iconic/dumfries.png", "DENZEL DUMFRIES", "Países Bajos", 7],
  ["/players-iconic/bellingham.png", "JUDE BELLINGHAM", "Inglaterra", 8],
  ["/players-iconic/pedri.png", "PEDRI", "España", 8],
  ["/players-iconic/vinicius.png", "VINÍCIUS JÚNIOR", "Brasil", 8],
  ["/players-iconic/mbappe.png", "KYLIAN MBAPPÉ", "Francia", 8],
  ["/players-iconic/julian.png", "JULIÁN ÁLVAREZ", "Argentina", 8],
  ["/players-iconic/lamine.png", "LAMINE YAMAL", "España", 8],
  ["/players-iconic/haaland.png", "ERLING HAALAND", "Noruega", 9],
  ["/players-iconic/salah.png", "MOHAMED SALAH", "Egipto", 9],
  ["/players-iconic/saka.png", "BUKAYO SAKA", "Inglaterra", 9],
  ["/players-iconic/cole-palmer.png", "COLE PALMER", "Inglaterra", 9],
  ["/players-iconic/bruno.png", "BRUNO FERNANDES", "Portugal", 9],
  ["/players-iconic/caicedo.png", "MOISÉS CAICEDO", "Ecuador", 9],
  ["/players-iconic/enzo.png", "ENZO FERNÁNDEZ", "Argentina", 9],
  ["/players-iconic/son.png", "HEUNG-MIN SON", "Corea del Sur", 9],
  ["/players-iconic/cristiano.png", "CRISTIANO RONALDO", "Portugal", 10],
  ["/players-iconic/messi.png", "LIONEL MESSI", "Argentina", 10],
  ["/players-iconic/ronaldinho.png", "RONALDINHO", "Brasil", 10],
  ["/players-iconic/zidane.png", "ZINEDINE ZIDANE", "Francia", 10],
  ["/players-iconic/maradona.png", "DIEGO MARADONA", "Argentina", 10],
  ["/players-iconic/pele.png", "PELÉ", "Brasil", 10],
  ["/players-iconic/nazario.png", "RONALDO NAZÁRIO", "Brasil", 10],
  ["/players-iconic/cruyff.png", "JOHAN CRUYFF", "Países Bajos", 10],
];

// ── Estadios — from Stadium_rows.csv ─────────────────────────────────────────
// [urlStadium, name, csvLigueId]
const stadiumRows: [string, string, number][] = [
  ["/stadiums/matute.jpg", "Matute", 1],
  ["/stadiums/monumental.jpg", "Monumental", 1],
  ["/stadiums/alberto-gallardo.jpg", "Alberto Gallardo", 1],
  ["/stadiums/azteca.jpg", "Estadio Azteca", 2],
  ["/stadiums/bbva.jpg", "BBVA", 2],
  ["/stadiums/bombonera.jpg", "La Bombonera", 3],
  ["/stadiums/monumental-river.jpg", "Monumental (River)", 3],
  ["/stadiums/maracana.jpg", "Maracanã", 4],
  ["/stadiums/allianz-parque.jpg", "Allianz Parque", 4],
  ["/stadiums/allianz-arena.jpg", "Allianz Arena", 5],
  ["/stadiums/signal-iduna.jpg", "Signal Iduna Park", 5],
  ["/stadiums/parc-des-princes.jpg", "Parc des Princes", 6],
  ["/stadiums/stade-de-franc.jpg", "Stade de France", 6],
  ["/stadiums/san siro.jpg", "San Siro", 7],
  ["/stadiums/juventus.jpg", "Allianz Stadium (Turín)", 7],
  ["/stadiums/bernabeu.jpg", "Santiago Bernabéu", 8],
  ["/stadiums/campnou.jpg", "Camp Nou", 8],
  ["/stadiums/old-trafford.jpg", "Old Trafford", 9],
  ["/stadiums/anfield.jpg", "Anfield", 9],
  ["/stadiums/wembley.jpg", "Wembley Stadium", 10],
  ["/stadiums/olimpico-berlin.jpg", "Olympiastadion Berlin", 10],
];

// ── Escudos de clubes — clubes principales de cada liga ──────────────────────
// Crest images follow the same local-asset convention as players/stadiums:
// [slug, clubName, leagueCode, imageUrl?]. When a remote crest URL is given it
// is used as image_url; otherwise it falls back to /crests/<slug>.png.
const crestRows: [string, string, string, string?][] = [
  ["alianza-lima", "Alianza Lima", "pe", "https://upload.wikimedia.org/wikipedia/commons/c/c5/Escudo_Alianza_Lima.svg"],
  ["universitario", "Universitario", "pe", "https://upload.wikimedia.org/wikipedia/commons/7/77/Logo_oficial_de_Universitario.svg"],
  ["sporting-cristal", "Sporting Cristal", "pe", "https://upload.wikimedia.org/wikipedia/commons/5/59/Escudo_de_Sporting_Cristal_2025.svg"],
  ["america", "Club América", "mx", "https://upload.wikimedia.org/wikipedia/commons/8/8d/Club_America_Logo.svg"],
  ["guadalajara", "Chivas de Guadalajara", "mx", "https://upload.wikimedia.org/wikipedia/en/7/7f/Chivas_de_Guadalajara_logo.svg"],
  ["cruz-azul", "Cruz Azul", "mx", "https://upload.wikimedia.org/wikipedia/commons/5/58/Cruz_Azul_logo.svg"],
  ["tigres", "Tigres UANL", "mx", "https://upload.wikimedia.org/wikipedia/en/8/82/Tigres_UANL_logo_%28crest%29.svg"],
  ["boca-juniors", "Boca Juniors", "ar", "https://upload.wikimedia.org/wikipedia/commons/4/41/CABJ_Logo.svg"],
  ["river-plate", "River Plate", "ar", "https://upload.wikimedia.org/wikipedia/commons/a/ac/Escudo_del_C_A_River_Plate.svg"],
  ["racing", "Racing Club", "ar", "https://upload.wikimedia.org/wikipedia/commons/5/56/Escudo_de_Racing_Club_%282014%29.svg"],
  ["independiente", "Independiente", "ar", "https://upload.wikimedia.org/wikipedia/commons/d/db/Escudo_del_Club_Atl%C3%A9tico_Independiente.svg"],
  ["flamengo", "Flamengo", "br", "https://upload.wikimedia.org/wikipedia/commons/9/93/Flamengo-RJ_%28BRA%29.png"],
  ["palmeiras", "Palmeiras", "br", "https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg"],
  ["corinthians", "Corinthians", "br", "https://upload.wikimedia.org/wikipedia/en/5/5a/Corinthians_oficial_logo.svg"],
  ["sao-paulo", "São Paulo", "br", "https://upload.wikimedia.org/wikipedia/commons/f/f4/S%C3%A3o_Paulo_Futebol_Clube_logo_%282022%29.svg"],
  ["bayern-munich", "Bayern Múnich", "de", "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg"],
  ["borussia-dortmund", "Borussia Dortmund", "de", "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg"],
  ["rb-leipzig", "RB Leipzig", "de", "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg"],
  ["bayer-leverkusen", "Bayer Leverkusen", "de", "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg"],
  ["psg", "Paris Saint-Germain", "fr", "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg"],
  ["marseille", "Olympique de Marsella", "fr", "https://upload.wikimedia.org/wikipedia/commons/4/4f/Olympique_de_Marseille_2026_logo.svg"],
  ["lyon", "Olympique de Lyon", "fr", "https://upload.wikimedia.org/wikipedia/en/1/1c/Olympique_Lyonnais_logo.svg"],
  ["monaco", "AS Mónaco", "fr", "https://upload.wikimedia.org/wikipedia/en/c/cf/LogoASMonacoFC2021.svg"],
  ["juventus", "Juventus", "it", "https://upload.wikimedia.org/wikipedia/commons/a/a8/Juventus_FC_-_pictogram_black_%28Italy%2C_2017%29.svg"],
  ["inter", "Inter de Milán", "it", "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg"],
  ["milan", "AC Milan", "it", "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg"],
  ["napoli", "Napoli", "it", "https://upload.wikimedia.org/wikipedia/commons/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg"],
  ["real-madrid", "Real Madrid", "es", "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg"],
  ["barcelona", "FC Barcelona", "es", "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"],
  ["atletico-madrid", "Atlético de Madrid", "es", "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg"],
  ["sevilla", "Sevilla FC", "es", "https://upload.wikimedia.org/wikipedia/en/3/3b/Sevilla_FC_logo.svg"],
  ["manchester-city", "Manchester City", "en", "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"],
  ["liverpool", "Liverpool", "en", "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg"],
  ["manchester-united", "Manchester United", "en", "https://upload.wikimedia.org/wikipedia/en/7/7a/Manchester_United_FC_crest.svg"],
  ["arsenal", "Arsenal", "en", "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg"],
  ["chelsea", "Chelsea", "en", "https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg"],
  ["santos", "Santos FC", "legends", "https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg"],
  ["ajax", "AFC Ajax", "legends", "https://upload.wikimedia.org/wikipedia/en/7/79/Ajax_Amsterdam.svg"],
  ["cosmos", "New York Cosmos", "legends", "https://upload.wikimedia.org/wikipedia/en/8/85/New_York_Cosmos_2010.svg"],
];

interface SeedCollectible {
  id: string;
  leagueCode: string;
  kind: "CREST" | "AVATAR" | "STADIUM";
  name: string;
  imageUrl: string;
  rarity: Rarity;
  price: number;
  sortOrder: number;
}

function buildCollectibles(): SeedCollectible[] {
  const out: SeedCollectible[] = [];
  const counters = new Map<string, number>();
  const next = (key: string) => {
    const n = counters.get(key) ?? 0;
    counters.set(key, n + 1);
    return n;
  };
  const tierOf = (code: string) => leagues.find((l) => l.code === code)?.tier ?? 1;

  for (const [url, player, , csvLigueId] of avatarRows) {
    const code = csvIdToCode.get(csvLigueId)!;
    const tier = tierOf(code);
    out.push({
      id: `${code}-avatar-${slugOf(url)}`,
      leagueCode: code,
      kind: "AVATAR",
      name: player,
      imageUrl: url,
      rarity: rarityForTier(tier),
      price: tier * 3, // €M
      sortOrder: next(`${code}:AVATAR`),
    });
  }

  for (const [url, name, csvLigueId] of stadiumRows) {
    const code = csvIdToCode.get(csvLigueId)!;
    const tier = tierOf(code);
    out.push({
      id: `${code}-stadium-${slugOf(url)}`,
      leagueCode: code,
      kind: "STADIUM",
      name,
      imageUrl: url,
      rarity: rarityForTier(tier),
      price: tier * 4, // €M
      sortOrder: next(`${code}:STADIUM`),
    });
  }

  for (const [slug, club, code, crestUrl] of crestRows) {
    const tier = tierOf(code);
    out.push({
      id: `${code}-crest-${slug}`,
      leagueCode: code,
      kind: "CREST",
      name: club,
      imageUrl: crestUrl ?? `/crests/${slug}.png`,
      rarity: rarityForTier(tier),
      price: tier * 3, // €M
      sortOrder: next(`${code}:CREST`),
    });
  }

  return out;
}

async function seedGames() {
  console.log("Seeding games...");
  for (const game of games) {
    await prisma.game.upsert({ where: { id: game.id }, update: game, create: game });
    console.log(`  ✓ ${game.name}`);
  }
}

async function seedLeaguesAndCollectibles() {
  const collectibles = buildCollectibles();

  console.log("Replacing leagues + collectibles...");
  // Clean replace. Deleting leagues nulls profiles.league_id via FK (SET NULL).
  await prisma.collectible.deleteMany();
  await prisma.league.deleteMany();

  for (const l of leagues) {
    await prisma.league.create({
      data: {
        id: l.code,
        code: l.code,
        name: l.name,
        country: l.country,
        countryCode: l.countryCode,
        imageUrl: l.image,
        tier: l.tier,
        minMarketValue: l.min,
        maxMarketValue: l.max,
      },
    });
  }
  console.log(`  ✓ ${leagues.length} leagues`);

  for (const c of collectibles) {
    await prisma.collectible.create({
      data: {
        id: c.id,
        kind: c.kind,
        name: c.name,
        imageUrl: c.imageUrl,
        rarity: c.rarity,
        price: c.price,
        sortOrder: c.sortOrder,
        leagueId: c.leagueCode,
      },
    });
  }
  console.log(`  ✓ ${collectibles.length} collectibles`);

  // Restore the default starting league for any profile whose FK was nulled.
  const restored = await prisma.profile.updateMany({
    where: { leagueId: null },
    data: { leagueId: "pe" },
  });
  if (restored.count > 0) console.log(`  ✓ restored league for ${restored.count} profile(s)`);
}

async function main() {
  await seedGames();
  await seedLeaguesAndCollectibles();
  console.log("Done.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
