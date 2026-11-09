import type { Budget } from "./types";

// What the chosen plan costs to build, from Studio's own estimate, in the project's currency.

const fmt = (n: number, currency: string) => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 1, notation: "compact" }).format(n);
  } catch {
    return `${currency} ${Math.round(n).toLocaleString("en")}`;
  }
};

export function BudgetCard({ budget }: { budget: Budget }) {
  const top = budget.byCategory.filter((c) => c.amount > 0).slice(0, 5);
  const max = Math.max(1, ...top.map((c) => c.amount));
  return (
    <section aria-labelledby="budget-heading" className="rounded-xl border border-border bg-card p-3">
      <h2 id="budget-heading" className="text-sm font-semibold">
        Cost to build
      </h2>
      <p className="mt-1 text-lg font-semibold tabular-nums">{budget.text}</p>
      <p className="text-xs text-muted-foreground capitalize">{budget.tier} finish</p>
      {top.length ? (
        <ul className="mt-3 space-y-1.5">
          {top.map((c) => (
            <li key={c.category} className="text-xs">
              <div className="flex justify-between gap-2">
                <span className="capitalize">{c.category.replace(/[-_]/g, " ")}</span>
                <span className="tabular-nums text-muted-foreground">{fmt(c.amount, budget.currency)}</span>
              </div>
              <div className="mt-0.5 h-1.5 rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-brand/70" style={{ width: `${(c.amount / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
