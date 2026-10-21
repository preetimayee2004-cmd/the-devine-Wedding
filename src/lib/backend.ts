/**
 * Where RSVPs and blessings are kept (PRD §4, sections 08 and 09).
 *
 * With VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set (see README and
 * supabase/migrations), they go to Supabase's REST API with plain fetch:
 *   wishes: guests may add and read
 *   rsvps:  guests may add; only the couple can read them (dashboard)
 *
 * Without them the site runs in "local" mode: everything is kept on the
 * guest's own phone, and the wording says so. Nothing ever claims the
 * family received something that was not actually sent.
 */
import type { Wish } from "@/config/types";

const BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const backendMode: "remote" | "local" = BASE && KEY ? "remote" : "local";

export type FailureKind = "offline" | "rejected" | "server";

export class BackendError extends Error {
  constructor(
    public kind: FailureKind,
    message: string,
  ) {
    super(message);
  }
}

export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

// ── Supabase REST ──────────────────────────────────────────────

async function rest(path: string, init: RequestInit & { prefer?: string } = {}): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: KEY!,
        Authorization: `Bearer ${KEY}`,
        "Content-Type": "application/json",
        ...(init.prefer ? { Prefer: init.prefer } : {}),
      },
    });
  } catch {
    throw new BackendError("offline", "We couldn't reach the server. Please check your connection and try again.");
  }
  // 409: this exact id was already saved (a retry) — that's a success.
  if (res.ok || res.status === 409) return res;
  if (res.status === 400 || res.status === 403 || res.status === 422) {
    throw new BackendError("rejected", "That couldn't be saved. Please check your wish and try again.");
  }
  throw new BackendError("server", "Something went wrong on our side. Please try again in a moment.");
}

// ── This phone ─────────────────────────────────────────────────

const LOCAL_WISHES = "dw:wishes";
const LOCAL_ACCEPTED = "dw:accepted";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Wishes ─────────────────────────────────────────────────────

/** Newest first. In local mode: the wishes left from this phone. */
export async function listWishes(limit = 200): Promise<Wish[]> {
  if (backendMode === "local") return readLocal<Wish[]>(LOCAL_WISHES, []).slice(0, limit);
  const res = await rest(`wishes?select=id,name,message&order=created_at.desc&limit=${limit}`);
  return (await res.json()) as Wish[];
}

export async function addWish(wish: Wish): Promise<void> {
  if (backendMode === "remote") {
    await rest("wishes", { method: "POST", body: JSON.stringify(wish), prefer: "return=minimal" });
    return;
  }
  await pause(500);
  // While developing, a wish containing "#fail" rehearses the error state.
  if (import.meta.env.DEV && wish.message.includes("#fail")) {
    throw new BackendError("server", "Something went wrong on our side. Please try again in a moment.");
  }
  const saved = readLocal<Wish[]>(LOCAL_WISHES, []);
  if (!writeLocal(LOCAL_WISHES, [wish, ...saved.filter((w) => w.id !== wish.id)])) {
    throw new BackendError("server", "Your phone wouldn't let us keep the wish. Please try again.");
  }
}

// ── RSVP ───────────────────────────────────────────────────────

export interface Acceptance {
  id: string;
  guestName: string;
  /** "remote": the family has it. "local": kept on this phone only. */
  savedTo: "remote" | "local";
}

/** A previous acceptance from this phone, so a returning guest sees their confirmation. */
export function readAcceptance(): Acceptance | null {
  return readLocal<Acceptance | null>(LOCAL_ACCEPTED, null);
}

export async function acceptInvitation(guestName: string, guestKey: string | null): Promise<Acceptance> {
  const acceptance: Acceptance = { id: newId(), guestName, savedTo: backendMode };
  if (backendMode === "remote") {
    await rest("rsvps", {
      method: "POST",
      body: JSON.stringify({ id: acceptance.id, guest_name: guestName, guest_key: guestKey }),
      prefer: "return=minimal",
    });
  } else {
    await pause(350);
  }
  writeLocal(LOCAL_ACCEPTED, acceptance);
  return acceptance;
}
