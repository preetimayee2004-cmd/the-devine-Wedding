import { useLayoutEffect, useRef, useState } from "react";

/** A number that rolls up when it changes: the old value lifts away as the new one rises in. */
export function RollingNumber({ value, className = "" }: { value: string; className?: string }) {
  const [previous, setPrevious] = useState<string | null>(null);
  const last = useRef(value);

  useLayoutEffect(() => {
    if (last.current === value) return;
    setPrevious(last.current);
    last.current = value;
    const t = window.setTimeout(() => setPrevious(null), 560);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span className={`relative inline-block ${className}`}>
      {previous !== null && (
        <span key={`was-${previous}`} aria-hidden className="roll-out absolute inset-0">
          {previous}
        </span>
      )}
      <span key={value} className={`block ${previous !== null ? "roll-in" : ""}`}>
        {value}
      </span>
    </span>
  );
}
