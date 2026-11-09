import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconArrowRight, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { failureText } from "./Changes";

// A new client and their first project in one short form, or a new project for a client already here. The project
// opens at the interview, which the architect runs with the client.

const TYPES = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "office", label: "Office" },
  { value: "cafe", label: "Café" },
  { value: "shop", label: "Shop" },
  { value: "hotel", label: "Hotel" },
  { value: "studio", label: "Studio" },
] as const;

type SpaceType = (typeof TYPES)[number]["value"];

export function NewProject({ client, onClose }: { client?: { id: string; name: string } | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [contactEmail, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [spaceType, setType] = useState<SpaceType | "">("");
  const [location, setLocation] = useState("");
  const createClient = useActionMutation("create-client");
  const createProject = useActionMutation("create-project");
  const busy = createClient.isPending || createProject.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const clientId = client?.id ?? (await createClient.mutateAsync({ name: name.trim(), ...(contactEmail.trim() ? { contactEmail: contactEmail.trim() } : {}), ...(phone.trim() ? { phone: phone.trim() } : {}) })).id;
      const p = await createProject.mutateAsync({ clientId, ...(title.trim() ? { title: title.trim() } : {}), ...(spaceType ? { spaceType } : {}), ...(location.trim() ? { location: location.trim() } : {}) });
      navigate(`/projects/${p.id}/interview`);
    } catch (err) {
      toast.error(failureText(err));
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-sm" aria-labelledby="new-project-heading">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">{client ? client.name : "New client"}</p>
          <h2 id="new-project-heading" className="mt-1 text-lg font-semibold">
            {client ? "Start a project" : "Who are you designing for?"}
          </h2>
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
          <IconX aria-hidden />
        </Button>
      </div>

      {!client ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="Client's name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} autoFocus placeholder="Priya Mehta" />
          </Field>
          <Field label="Email (optional)">
            <Input type="email" value={contactEmail} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Phone (optional)">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={40} />
          </Field>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Project name (optional)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder={client ? `${client.name.split(" ")[0]}'s house` : "Mehta house"} />
        </Field>
        <Field label="What is it?">
          <select
            value={spaceType}
            onChange={(e) => setType(e.target.value as SpaceType | "")}
            className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="">Ask in the interview</option>
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="City (optional)">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={120} placeholder="Pune" />
        </Field>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Next: the interview, with your client. It takes about five minutes.</p>
        <Button type="submit" disabled={busy || (!client && !name.trim())}>
          {busy ? "Starting…" : "Start the interview"}
          <IconArrowRight aria-hidden />
        </Button>
      </div>
    </form>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs text-muted-foreground">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
