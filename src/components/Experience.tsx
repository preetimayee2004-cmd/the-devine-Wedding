import { Invitation } from "@/components/sections/Invitation";
import { Couple } from "@/components/sections/Couple";
import { Descent } from "@/components/sections/Descent";
import { Countdown } from "@/components/sections/Countdown";
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
      {/* the scroll-scrubbed descent from the Save the Date to the couple section */}
      <Descent />
      <Countdown />
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
