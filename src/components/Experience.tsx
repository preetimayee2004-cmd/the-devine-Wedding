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
import { Contact } from "@/components/sections/Contact";
import { ThankYou } from "@/components/sections/ThankYou";
import { LoveNote } from "@/components/sections/LoveNote";
import { SectionSeparator } from "@/components/ui/SectionSeparator";
import { RsvpShortcut } from "@/components/ui/RsvpShortcut";

/**
 * The whole guest journey, in order. The invitation plays the opening itself. Between the sections, a
 * ripple of the Ganga with a lotus, a diya or a shankh by turn (none between the Save the Date and the
 * couple section, which flow into each other, nor between the thank-you and the love note — one finale).
 */
export function Experience() {
  return (
    <>
      <Invitation />
      <Couple />
      {/* the scroll-scrubbed descent from the Save the Date to the couple section */}
      <Descent />
      <SectionSeparator ornament="lotus" />
      <Countdown />
      <SectionSeparator ornament="diya" />
      <Events />
      <SectionSeparator ornament="shankh" />
      <Family />
      <SectionSeparator ornament="lotus" />
      <Gallery />
      <SectionSeparator ornament="diya" />
      <Rsvp />
      <SectionSeparator ornament="shankh" />
      <BlessingWall />
      <SectionSeparator ornament="lotus" />
      <Venue />
      <SectionSeparator ornament="diya" />
      <Contact />
      <SectionSeparator ornament="shankh" />
      {/* the thank-you flows straight on into the love note: one finale */}
      <ThankYou />
      <LoveNote />
      {/* the RSVP, a tap away from anywhere until it is accepted */}
      <RsvpShortcut />
    </>
  );
}
