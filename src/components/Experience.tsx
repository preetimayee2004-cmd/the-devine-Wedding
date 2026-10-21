import { useState } from "react";
import { Preloader } from "@/components/opening/Preloader";
import { Invitation } from "@/components/sections/Invitation";

type OpeningState = "playing" | "revealing" | "done";

/** The whole guest journey: the opening, then the sections in order. */
export function Experience() {
  const [opening, setOpening] = useState<OpeningState>("playing");

  return (
    <>
      <Invitation revealed={opening !== "playing"} />
      {opening !== "done" && (
        <Preloader onReveal={() => setOpening("revealing")} onDone={() => setOpening("done")} />
      )}
    </>
  );
}
