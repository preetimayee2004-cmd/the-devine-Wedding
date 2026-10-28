import { useMemo, useSyncExternalStore } from "react";

/**
 * The invitation's language — English or Hindi — shared by every EN / हिं switch on the page and
 * remembered on this phone. On हिं every section reads in Hindi: each part of the config has a
 * `hindi` twin of its words (and each item in a list its own), laid over the English by `useCopy` /
 * `inLang`; the page's `lang` follows, so the Devanagari face and spacing apply (see index.css).
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

/** The page's own `lang`, for the browser, a screen reader and the Devanagari styles. */
function mark(lang: Lang) {
  document.documentElement.lang = lang === "hi" ? "hi" : "en";
}
mark(current);

export function setLang(next: Lang) {
  current = next;
  mark(next);
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

/** Words that may have a Hindi twin: any of their own fields, said in Hindi. */
type WithHindi = { hindi?: object };

/** An item in the language: on हिं, its `hindi` fields laid over its own. */
export function inLang<T extends WithHindi>(item: T, hindi: boolean): T {
  return hindi && item.hindi ? { ...item, ...item.hindi } : item;
}

/** A part of the config in the invitation's language (it follows the EN / हिं switch). */
export function useCopy<T extends WithHindi>(copy: T): T {
  const hindi = useLang() === "hi";
  return useMemo(() => inLang(copy, hindi), [copy, hindi]);
}
