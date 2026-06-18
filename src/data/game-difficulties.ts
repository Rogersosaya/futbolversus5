/** Per-game difficulty configuration — the single source of truth for the
 * label, player-facing description, and rule parameters of every minigame's
 * difficulty options. Client-safe (plain data) and imported by the server
 * actions, so the /amistoso picker and the match engine never disagree.
 *
 * Each game owns its own difficulties: the keys persisted in
 * `Game.availableDifficulties[]` / `MatchRoom.difficulty` map here to richer
 * entities. NACIONES scales the FIFA-ranking deck (its description is derived
 * from `fifaTop`, so the text can never drift from the rule); the other games
 * scale their player/criteria pool. Add a game or a difficulty by editing the
 * registry below — nothing else needs to change. */

/** Stable game ids (see prisma/seed.ts). */
export const GAME_IDS = {
  NACIONES: 6,
  CLUBES: 7,
  GRID: 8,
  BINGO: 9,
  BINGO_ALT: 10,
} as const;

/** One difficulty option of a minigame. `key` is the value stored in
 * `Game.availableDifficulties[]` and `MatchRoom.difficulty`; `label` and
 * `description` drive the picker UI; `fifaTop` (nation-pool games only) is the
 * deck size the match server reads when building the cycle. */
export interface GameDifficulty {
  key: string;
  label: string;
  description: string;
  /** FIFA-ranking deck size: only the top-N selecciones enter the pool. */
  fifaTop?: number;
}

/** Builds a NACIONES difficulty whose description always matches its deck size. */
const nation = (key: string, label: string, fifaTop: number): GameDifficulty => ({
  key,
  label,
  fifaTop,
  description: `Se juega solo con las ${fifaTop} selecciones mejor ubicadas en el ranking FIFA.`,
});

/** Difficulty options per game, in display order. */
export const GAME_DIFFICULTIES: Record<number, GameDifficulty[]> = {
  [GAME_IDS.NACIONES]: [
    nation("Fácil", "Canterano", 15),
    nation("Medio", "Titular", 30),
    nation("Difícil", "Leyenda", 50),
  ],
  [GAME_IDS.CLUBES]: [
    { key: "Fácil", label: "Canterano", description: "Solo los clubes más famosos de las grandes ligas." },
    { key: "Medio", label: "Titular", description: "Se suman clubes de media tabla y de ligas de segundo nivel." },
    { key: "Difícil", label: "Leyenda", description: "Cualquier club profesional, incluidas ligas poco conocidas." },
  ],
  [GAME_IDS.GRID]: [
    { key: "Fácil", label: "Canterano", description: "Criterios sencillos: clubes y países muy reconocibles." },
    { key: "Medio", label: "Titular", description: "Criterios mixtos que cruzan club, país y posición." },
    { key: "Difícil", label: "Leyenda", description: "Cruces exigentes con combinaciones poco habituales." },
  ],
  [GAME_IDS.BINGO]: [
    { key: "Fácil", label: "Canterano", description: "Aparecen futbolistas estrella, fáciles de clasificar." },
    { key: "Medio", label: "Titular", description: "Mezcla de estrellas y jugadores de rotación." },
    { key: "Difícil", label: "Leyenda", description: "Incluye futbolistas poco mediáticos: solo para expertos." },
  ],
  [GAME_IDS.BINGO_ALT]: [
    { key: "Fácil", label: "Canterano", description: "Categorías claras con futbolistas muy conocidos." },
    { key: "Medio", label: "Titular", description: "Categorías que combinan club, país y posición." },
    { key: "Difícil", label: "Leyenda", description: "Categorías poco habituales: solo para expertos." },
  ],
};

/** Default FIFA-ranking deck size when a room has no (or an unknown) difficulty. */
export const DEFAULT_FIFA_TOP = 30;

/** Every difficulty configured for a game (empty for an unknown game). */
export function getGameDifficulties(gameId: number | null | undefined): GameDifficulty[] {
  return (gameId != null && GAME_DIFFICULTIES[gameId]) || [];
}

/** Metadata for one difficulty of a game, by its stored key. */
export function getDifficulty(
  gameId: number | null | undefined,
  key: string | null | undefined,
): GameDifficulty | undefined {
  if (key == null) return undefined;
  return getGameDifficulties(gameId).find((d) => d.key === key);
}

/** Player-facing label for a stored difficulty key, falling back to the key. */
export function difficultyLabel(
  gameId: number | null | undefined,
  key: string | null | undefined,
): string | null {
  if (key == null) return null;
  return getDifficulty(gameId, key)?.label ?? key;
}

/** FIFA-ranking deck size for a NACIONES difficulty key (the only game whose
 * difficulty currently drives engine logic — see buildNationCycle). */
export function nationDeckTop(key: string | null | undefined): number {
  return getDifficulty(GAME_IDS.NACIONES, key)?.fifaTop ?? DEFAULT_FIFA_TOP;
}
