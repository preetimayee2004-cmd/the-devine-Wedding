import { useState } from "react";
import { Preloader } from "@/components/opening/Preloader";
import { Invitation } from "@/components/sections/Invitation";
import { Couple } from "@/components/sections/Couple";
import { Countdown } from "@/components/sections/Countdown";

type OpeningState = "playing" | "revealing" | "done";

/** The whole guest journey: the opening, then the sections in order. */
export function Experience() {
  const [opening, setOpening] = useState<OpeningState>("playing");

  return (
    <>
      <Invitation revealed={opening !== "playing"} />
      <Couple />
      <Countdown />
      {opening !== "done" && <Preloader onReveal={() => setOpening("revealing")} onDone={() => setOpening("done")} />}
    </>
  );
}
