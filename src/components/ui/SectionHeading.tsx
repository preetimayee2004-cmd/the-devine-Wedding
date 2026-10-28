import { Reveal } from "@/components/ui/Reveal";

interface SectionHeadingProps {
  id: string;
  /** The small gold line above the title (optional). */
  eyebrow?: string;
  title: string;
  intro?: string;
  show: boolean;
  delay?: number;
}

/** The shared heading: a small gold eyebrow, the navy title, an optional line of introduction. */
export function SectionHeading({ id, eyebrow, title, intro, show, delay = 0 }: SectionHeadingProps) {
  return (
    <header className="flex flex-col items-center text-center">
      {eyebrow && (
        <Reveal
          show={show}
          delay={delay}
          as="p"
          className="sh-eyebrow font-sans text-[11px] font-medium uppercase tracking-eyebrow text-gold-ink"
        >
          {eyebrow}
        </Reveal>
      )}
      <Reveal show={show} delay={delay + 120}>
        <h2 id={id} className={`${eyebrow ? "mt-2 " : ""}text-balance text-[clamp(32px,9.4vw,40px)]`}>
          {title}
        </h2>
      </Reveal>
      {intro && (
        <Reveal
          show={show}
          delay={delay + 240}
          as="p"
          className="mt-3 max-w-[20rem] text-balance font-display text-[19px] font-medium italic leading-snug text-slate"
        >
          {intro}
        </Reveal>
      )}
    </header>
  );
}
