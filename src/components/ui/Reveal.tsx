import type { CSSProperties, ElementType, ReactNode } from "react";
import { EASE, MOTION } from "@/lib/motion";
import { usePrefersReducedMotion } from "@/hooks/useMediaQuery";

interface RevealProps {
  show: boolean;
  /** Milliseconds after `show` turns true. */
  delay?: number;
  as?: ElementType;
  className?: string;
  /** Rise into place as it fades in (the default), or only fade. */
  rise?: boolean;
  children: ReactNode;
}

/**
 * The shared staggered fade-up (PRD §6). Text stays still once it has
 * arrived; with reduced motion it simply fades in, without the rise.
 */
export function Reveal({ show, delay = 0, as: Tag = "div", className = "", rise = true, children }: RevealProps) {
  const reduced = usePrefersReducedMotion();
  const style: CSSProperties = reduced
    ? { opacity: show ? 1 : 0, transition: `opacity 400ms linear ${Math.min(delay, 300)}ms` }
    : {
        opacity: show ? 1 : 0,
        transform: show || !rise ? "none" : `translateY(${MOTION.rise}px)`,
        transition: `opacity ${MOTION.revealMs}ms ${EASE.silk} ${delay}ms, transform ${MOTION.revealMs}ms ${EASE.silk} ${delay}ms`,
      };
  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}
