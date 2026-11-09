# Arcon Studio

The architect's workspace for [Arcon](https://arcon-ten.vercel.app): open a client's design, ask the agent what to
change, see the new plan and what it does to the cost, and approve it. Nothing changes until you do.

**Live: [arcon-studio.vercel.app](https://arcon-studio.vercel.app)**

## What it does

- **Your projects, as you see them.** Every Arcon project you own or work on, with your role on each one.
- **The plan, drawn from the design itself.** Rooms, sizes in your units, the cost to build in your currency, and the
  reasons behind the plan, taken from your client's interview and taste.
- **Change it yourself.** Pick a room: bigger, smaller, rename, remove; open or close the kitchen; add a room. Each
  change goes straight to Arcon, and Undo steps it back.
- **Or ask the agent.** It reads the design, the cost and the reasons, then proposes one change at a time with a
  one-line reason. You see it on the plan (new rooms, changed rooms, removed rooms) with the change in cost.
- **You approve.** The agent can't apply a change on its own: every apply needs your yes, in the page or in the chat.
- **Safe by design.** A proposal applies once, and only to the version of the design it was worked out on. If the
  design changed since, it is marked out of date and nothing is saved.
- **A record of who did what.** "Agent proposed, you approved", "You changed it", "You undid a change".

## How it fits with Arcon

Arcon designs the home or space from a person's interview and taste and keeps every project. Studio is a separate app
that works on those projects through a token API:

1. On Arcon's account page, **Connect Arcon Studio** shows a token once. Arcon keeps only its hash; it lasts 90 days and
   can be disconnected at any time.
2. In Studio, paste it once. It is stored as your own key, never shown to the agent.
3. Studio reads designs and makes changes as you, with your role on each project. Every change names the design version
   it expects, so a change never overwrites one it didn't see.

## Built with

[Agent-Native](https://agent-native.com) (actions shared by the UI and the agent, approvals, live sync), React Router,
Nitro, Postgres (Supabase), Vercel. The agent runs on Builder.io's models.

Each operation is one action, used by a button and by the agent alike:

| Action | What it does |
| --- | --- |
| `list-projects` | Your Arcon projects and your role on each |
| `get-design` | The chosen plan: rooms, sizes, concept and reasons, version |
| `get-budget` | Cost to build, by category and by room |
| `get-reasons` | Why the design is the way it is, from the interview and taste |
| `propose-change` | Previews one change in Arcon and saves it as a proposal |
| `apply-change` | Applies a proposal once, against its version; needs approval |
| `reject-change` | Turns a proposal down |
| `change-design`, `undo-change` | The person's own edits (not available to the agent) |
| `list-changes` | What happened, newest first |

## Run it locally

```bash
corepack pnpm install
ARCON_URL=http://localhost:3000 corepack pnpm exec agent-native dev
```

Local data lives in PGlite under `data/`. Deploying: `DATABASE_URL=<session pooler URL> bash scripts/deploy.sh` (runs
migrations, builds for Vercel, ships).

Checks: `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm agent-native:doctor`.
