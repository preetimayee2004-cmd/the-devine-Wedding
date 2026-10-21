import { useLayoutEffect, useState, type RefObject } from "react";

/** The element's current width in px (0 until measured); follows resizes. */
export function useWidth(ref: RefObject<Element>): number {
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [ref]);
  return width;
}
