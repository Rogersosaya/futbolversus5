import { Sym } from "@/components/svg";
import { formatEuros, type MoneyKind } from "@/lib/money";

// Re-exported so call sites can pull the component and the helpers together.
export { EUR_PER_MILLION, formatEuros, eurosFromMillions } from "@/lib/money";
export type { MoneyKind } from "@/lib/money";

const ICON: Record<MoneyKind, string> = { value: "ic-value", funds: "ic-funds" };

/**
 * The single, standard way to render a monetary amount. Each kind owns a fixed
 * icon and color; the amount is shown in full euros followed by the euro sign.
 * Pass `euros` as a full euro amount; for the millions-denominated profile
 * fields, multiply by {@link EUR_PER_MILLION}.
 */
export function Money({
  euros,
  kind,
  size = "md",
  className,
}: {
  euros: number;
  kind: MoneyKind;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <span className={`money money-${kind} money-${size}${className ? ` ${className}` : ""}`}>
      <Sym id={ICON[kind]} />
      <span className="money-n">{formatEuros(euros)}</span>
    </span>
  );
}
