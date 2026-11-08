import { useId } from "react";

import { areaText, type Diff, type Space } from "@/lib/plan";
import { cn } from "@/lib/utils";

// One floor of an Arcon plan, drawn from the layout itself (metres), so Studio and Arcon never disagree about it.
// Rooms are buttons when `onSelect` is given. With a `diff`, new rooms are green, changed ones blue, and rooms the
// change removes are drawn as dashed outlines from `ghosts`.

const PAD = 0.6;

const ZONE_FILL: Record<string, string> = {
  public: "fill-brand/10",
  private: "fill-leaf/10",
  service: "fill-muted",
  circulation: "fill-background",
};

export function PlanView({
  spaces,
  shell,
  floor,
  units,
  selected,
  onSelect,
  diff,
  ghosts = [],
  label,
}: {
  spaces: Space[];
  shell: { width: number; depth: number };
  floor: number;
  units: "imperial" | "metric";
  selected?: string | null | undefined;
  onSelect?: ((id: string) => void) | undefined;
  diff?: Diff | null | undefined;
  ghosts?: Space[];
  label: string;
}) {
  const titleId = useId();
  const here = spaces.filter((s) => s.floor === floor);
  const gone = ghosts.filter((s) => s.floor === floor && diff?.removed.has(s.id));
  const w = shell.width + PAD * 2;
  const h = shell.depth + PAD * 2;

  return (
    <svg
      viewBox={`${-PAD} ${-PAD} ${w} ${h}`}
      className="mx-auto h-auto max-h-[62vh] w-full select-none"
      role="group"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{label}</title>
      <rect
        x={0}
        y={0}
        width={shell.width}
        height={shell.depth}
        className="fill-card stroke-foreground"
        strokeWidth={0.12}
      />
      {here.map((s) => {
        const room = s.zone !== "circulation";
        const isSel = selected === s.id;
        const added = diff?.added.has(s.id);
        const changed = diff?.changed.has(s.id);
        const fill = added ? "fill-leaf/30" : changed ? "fill-brand/25" : (ZONE_FILL[s.zone] ?? "fill-muted");
        const stroke = isSel ? "stroke-brand" : added ? "stroke-leaf" : changed ? "stroke-brand" : "stroke-foreground/50";
        const minSide = Math.min(s.rect.w, s.rect.h);
        const size = Math.max(0.22, Math.min(0.42, minSide / 5.5));
        const cx = s.rect.x + s.rect.w / 2;
        const cy = s.rect.y + s.rect.h / 2;
        const showArea = room && minSide > 1.6;
        const clickable = room && onSelect;
        return (
          <g
            key={s.id}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-pressed={clickable ? isSel : undefined}
            aria-label={room ? `${s.name}, ${areaText(s.area, units)}` : undefined}
            onClick={clickable ? () => onSelect(s.id) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(s.id);
                    }
                  }
                : undefined
            }
            className={cn(clickable && "cursor-pointer outline-none [&:focus-visible>rect]:stroke-brand")}
          >
            <rect
              x={s.rect.x}
              y={s.rect.y}
              width={s.rect.w}
              height={s.rect.h}
              className={cn(fill, stroke, "transition-colors", clickable && "hover:fill-brand/20")}
              strokeWidth={isSel ? 0.14 : 0.06}
              strokeDasharray={s.zone === "circulation" ? "0.2 0.15" : undefined}
            />
            {room && minSide > 0.9 ? (
              <text
                x={cx}
                y={showArea ? cy - size * 0.35 : cy}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none fill-foreground font-medium"
                style={{ fontSize: size }}
              >
                {fit(s.name, s.rect.w, size)}
              </text>
            ) : null}
            {showArea ? (
              <text
                x={cx}
                y={cy + size * 0.85}
                textAnchor="middle"
                dominantBaseline="middle"
                className="pointer-events-none fill-muted-foreground"
                style={{ fontSize: size * 0.78 }}
              >
                {areaText(s.area, units)}
              </text>
            ) : null}
          </g>
        );
      })}
      {gone.map((s) => (
        <g key={`gone-${s.id}`} aria-label={`${s.name}, removed`}>
          <rect
            x={s.rect.x}
            y={s.rect.y}
            width={s.rect.w}
            height={s.rect.h}
            className="fill-destructive/10 stroke-destructive"
            strokeWidth={0.08}
            strokeDasharray="0.25 0.18"
          />
          <text
            x={s.rect.x + s.rect.w / 2}
            y={s.rect.y + s.rect.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="pointer-events-none fill-destructive line-through"
            style={{ fontSize: Math.max(0.22, Math.min(0.4, Math.min(s.rect.w, s.rect.h) / 5.5)) }}
          >
            {fit(s.name, s.rect.w, 0.35)}
          </text>
        </g>
      ))}
    </svg>
  );
}

/** Shortens a label that would run past its room. Rough, from the font size: about 0.55 of it per character. */
function fit(name: string, width: number, size: number): string {
  const max = Math.max(3, Math.floor((width - 0.3) / (size * 0.55)));
  return name.length <= max ? name : `${name.slice(0, max - 1)}…`;
}
