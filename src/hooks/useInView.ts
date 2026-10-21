import { useEffect, useState, type RefObject } from "react";

/**
 * True once the element has scrolled into view (and stays true), so each
 * section's entrance plays exactly once.
 */
export function useInView(
  ref: RefObject<Element>,
  { threshold = 0.2, rootMargin = "0px 0px -10% 0px" }: IntersectionObserverInit = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (!("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, inView, threshold, rootMargin]);

  return inView;
}
