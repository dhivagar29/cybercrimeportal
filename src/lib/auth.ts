import { findPersona } from "@/lib/mock/personas";

export const SESSION_KEY = "reclaim:session:v1";
export const AUTH_EVENT = "reclaim:auth-change";

export interface MockSession {
  personaId: string;
  signedInAt: string;
}

export function readMockSession() {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as MockSession;
    return findPersona(session.personaId) ? session : null;
  } catch {
    return null;
  }
}

export function writeMockSession(personaId: string) {
  const session: MockSession = { personaId, signedInAt: new Date().toISOString() };
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event(AUTH_EVENT));
}
