/** Per-visit flags (e.g. "opening seen"). Storage can be blocked — never throw. */
export function readSessionFlag(key: string): boolean {
  try {
    return sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

export function writeSessionFlag(key: string) {
  try {
    sessionStorage.setItem(key, "1");
  } catch {
    /* storage unavailable — the flag simply won't persist */
  }
}
