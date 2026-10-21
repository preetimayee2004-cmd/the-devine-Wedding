import { useState } from "react";
import { Preloader } from "@/components/opening/Preloader";
import { InvitationPlaceholder } from "@/components/sections/InvitationPlaceholder";

type OpeningState = "playing" | "revealing" | "done";

/** The whole guest journey: the opening, then the sections in order. */
export function Experience() {
  const [opening, setOpening] = useState<OpeningState>("playing");
  const [replays, setReplays] = useState(0);

  return (
    <>
      <InvitationPlaceholder
        visible={opening !== "playing"}
        onReplay={() => {
          setReplays((n) => n + 1);
          setOpening("playing");
        }}
      />
      {opening !== "done" && (
        <Preloader
          key={replays}
          forceFull={replays > 0}
          onReveal={() => setOpening("revealing")}
          onDone={() => setOpening("done")}
        />
      )}
    </>
  );
}
