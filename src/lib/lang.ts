import { useSyncExternalStore } from "react";

/**
 * The card's language — English or Hindi — shared by every EN / हिं switch on
 * the page and remembered on this phone.
 */
export type Lang = "en" | "hi";

const KEY = "dw:lang";
const listeners = new Set<() => void>();

function read(): Lang {
  try {
    return window.localStorage.getItem(KEY) === "hi" ? "hi" : "en";
  } catch {
    return "en";
  }
}

let current: Lang = read();

export function setLang(next: Lang) {
  current = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    // private mode: the choice simply isn't remembered
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, () => current);
}
