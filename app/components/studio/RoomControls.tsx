import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconMinus, IconPencil, IconPlus, IconSparkles, IconTrash } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ADDABLE, areaText, BIGGER, SMALLER } from "@/lib/plan";

import { failureText } from "./Changes";
import type { Change, Design } from "./types";

// The person's own controls. Each one calls the same change Arcon makes from its own editor, against the version on
// screen, so a change that raced another one is refused instead of overwriting it.

export function RoomControls({ design, selected, onSelect }: { design: Design; selected: string | null; onSelect: (id: string | null) => void }) {
  const room = design.rooms.find((r) => r.id === selected) ?? null;
  const kitchen = design.rooms.find((r) => r.kind === "kitchen") ?? null;
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState("");
  const [addKind, setAddKind] = useState<string>(ADDABLE[0].kind);

  useEffect(() => {
    setRenaming(false);
    setName(room?.name ?? "");
  }, [room?.id, room?.name]);

  const change = useActionMutation("change-design", {
    onSuccess: (r) => toast.success(r.message),
    onError: (e) => toast.error(failureText(e)),
  });
  const run = (c: Change) => change.mutate({ id: design.id, change: c, baseVersion: design.version });
  const busy = change.isPending;

  const ask = (message: string) =>
    sendToAgentChat({
      message,
      context: JSON.stringify({ projectId: design.id, roomId: room?.id ?? null, version: design.version }),
      submit: true,
      openSidebar: true,
    });

  return (
    <div className="space-y-4">
      {room ? (
        <section aria-labelledby="room-heading" className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 id="room-heading" className="truncate text-sm font-semibold">
                {room.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {areaText(room.area, design.units)} · {room.kind.replace(/-/g, " ")}
                {design.floors > 1 ? ` · ${room.floor === 0 ? "ground" : "first"} floor` : ""}
              </p>
            </div>
            <Button size="xs" variant="ghost" onClick={() => onSelect(null)} aria-label="Close room">
              Close
            </Button>
          </div>
          {design.canEdit ? (
            renaming ? (
              <form
                className="mt-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const next = name.trim();
                  if (next && next !== room.name) run({ op: "rename", room: room.id, name: next });
                  setRenaming(false);
                }}
              >
                <label htmlFor="rename-room" className="sr-only">
                  New name for {room.name}
                </label>
                <Input id="rename-room" value={name} maxLength={40} autoFocus onChange={(e) => setName(e.target.value)} className="h-8" />
                <Button size="sm" type="submit" disabled={busy || !name.trim()}>
                  Save
                </Button>
              </form>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run({ op: "resize", room: room.id, by: SMALLER })}>
                  <IconMinus aria-hidden />
                  Smaller
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => run({ op: "resize", room: room.id, by: BIGGER })}>
                  <IconPlus aria-hidden />
                  Bigger
                </Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => setRenaming(true)}>
                  <IconPencil aria-hidden />
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="outline-destructive"
                  disabled={busy}
                  onClick={() => {
                    run({ op: "remove", room: room.id });
                    onSelect(null);
                  }}
                >
                  <IconTrash aria-hidden />
                  Remove
                </Button>
              </div>
            )
          ) : null}
          <div className="mt-2 flex flex-wrap gap-1">
            <Button size="xs" variant="ghost-inset" onClick={() => ask(`Why is the ${room.name} the way it is?`)}>
              <IconSparkles aria-hidden />
              Why is it like this?
            </Button>
            {design.canEdit ? (
              <Button size="xs" variant="ghost-inset" onClick={() => ask(`Suggest one change to the ${room.name} that suits how I live, and propose it.`)}>
                <IconSparkles aria-hidden />
                Suggest a change
              </Button>
            ) : null}
          </div>
        </section>
      ) : (
        <p className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Pick a room on the plan to change it, or ask the agent.</p>
      )}

      {design.canEdit ? (
        <section aria-label="Whole plan" className="space-y-3">
          {kitchen ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>Kitchen</span>
              <div role="group" aria-label="Kitchen" className="inline-flex rounded-md border border-border p-0.5">
                {[
                  { open: true, label: "Open" },
                  { open: false, label: "Closed" },
                ].map((o) => {
                  const on = Boolean(kitchen.open) === o.open;
                  return (
                    <button
                      key={o.label}
                      type="button"
                      aria-pressed={on}
                      disabled={busy || on}
                      onClick={() => run({ op: "kitchen", open: o.open })}
                      className={`rounded px-2.5 py-1 text-xs transition-colors ${on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const pick = ADDABLE.find((a) => a.kind === addKind)!;
              run({ op: "add", kind: pick.kind, name: pick.name });
            }}
          >
            <label htmlFor="add-room" className="text-sm">
              Add
            </label>
            <select
              id="add-room"
              value={addKind}
              onChange={(e) => setAddKind(e.target.value)}
              className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
            >
              {ADDABLE.map((a) => (
                <option key={a.kind} value={a.kind}>
                  {a.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant="outline" type="submit" disabled={busy}>
              <IconPlus aria-hidden />
              Add
            </Button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
