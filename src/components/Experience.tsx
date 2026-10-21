import { useState } from "react";
import { Preloader } from "@/components/opening/Preloader";
import { Invitation } from "@/components/sections/Invitation";
import { Couple } from "@/components/sections/Couple";
import { Countdown } from "@/components/sections/Countdown";
import { Story } from "@/components/sections/Story";
import { Events } from "@/components/sections/Events";
import { Family } from "@/components/sections/Family";
import { Gallery } from "@/components/sections/Gallery";
import { Rsvp } from "@/components/sections/Rsvp";
import { BlessingWall } from "@/components/sections/BlessingWall";
import { Venue } from "@/components/sections/Venue";
import { ThankYou } from "@/components/sections/ThankYou";
import { LoveNote } from "@/components/sections/LoveNote";

type OpeningState = "playing" | "revealing" | "done";

/** The whole guest journey: the opening, then the sections in order. */
export function Experience() {
  const [opening, setOpening] = useState<OpeningState>("playing");

  return (
    <>
      <Invitation revealed={opening !== "playing"} />
      <Couple />
      <Countdown />
      <Story />
      <Events />
      <Family />
      <Gallery />
      <Rsvp />
      <BlessingWall />
      <Venue />
      <ThankYou />
      <LoveNote />
      {opening !== "done" && <Preloader onReveal={() => setOpening("revealing")} onDone={() => setOpening("done")} />}
    </>
  );
}
