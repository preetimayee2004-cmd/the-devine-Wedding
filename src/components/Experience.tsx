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

/** The whole guest journey, in order. The invitation plays the opening itself. */
export function Experience() {
  return (
    <>
      <Invitation />
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
    </>
  );
}
