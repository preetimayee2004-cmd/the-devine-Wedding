import { GuestProvider } from "@/context/GuestContext";
import { Shell } from "@/components/layout/Shell";
import { Experience } from "@/components/Experience";

export default function App() {
  return (
    <GuestProvider>
      <Shell>
        <Experience />
      </Shell>
    </GuestProvider>
  );
}
