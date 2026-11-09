import { randomUUID } from "node:crypto";

import { getDbExec } from "@agent-native/core/db";
import { createBetterAuthSessionForEmail, setBetterAuthSessionCookie } from "@agent-native/core/server";
import { defineEventHandler, sendRedirect } from "h3";

import { seedStudio } from "../lib/seed.js";

// The judges' way in, with nothing to fill in: a fresh demo studio of their own (a throwaway account, signed in on
// the spot), the sample clients in it, then the guided run. Each visit gets its own studio, so judges never meet.
export default defineEventHandler(async (event) => {
  const email = `judge-${randomUUID().slice(0, 12)}@demo.arcon-studio.app`;
  const now = new Date().toISOString();
  await getDbExec().execute({
    sql: `INSERT INTO "user" (id, name, email, email_verified, created_at, updated_at) VALUES (?, ?, ?, true, ?, ?)`,
    args: [randomUUID(), "Judge", email, now, now],
  });
  const session = await createBetterAuthSessionForEmail(email);
  if (!session) return sendRedirect(event, "/demo", 302);
  await setBetterAuthSessionCookie(event, session.token);
  await seedStudio(email);
  return sendRedirect(event, "/demo", 302);
});
