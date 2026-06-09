/**
 * The money model. The game has exactly two monetary concepts:
 * - `value`: the club's market value, which drives league progression.
 * - `funds`: the spendable budget used to buy collectibles in the Mercado.
 *
 * Both are stored in millions of euros (`club_value`, `club_funds`) but always
 * shown in full euros (never abbreviated with "M") followed by the euro sign.
 */
export type MoneyKind = "value" | "funds";

/** One million euros: the factor from the stored €M fields to full euros. */
export const EUR_PER_MILLION = 1_000_000;

const FMT = new Intl.NumberFormat("en-US");

/** Full-digit euro string with a trailing euro sign, e.g. `250,000,000 €`. */
export function formatEuros(euros: number): string {
  return `${FMT.format(Math.round(euros))} €`;
}

/** Convert a millions-denominated amount (the stored unit) to full euros. */
export function eurosFromMillions(millions: number): number {
  return millions * EUR_PER_MILLION;
}
