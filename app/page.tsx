import { CurtainHero } from "@/components/sections/CurtainHero/CurtainHero";
import { PatioTrack } from "@/components/sections/PatioTrack/PatioTrack";
import { FlooringSwapper } from "@/components/sections/FlooringSwapper/FlooringSwapper";
import { CushionDrift } from "@/components/sections/CushionDrift/CushionDrift";
import { WallpaperUnroll } from "@/components/sections/WallpaperUnroll/WallpaperUnroll";
import { ContactBand } from "@/components/sections/ContactBand/ContactBand";

// Composition only. Every section owns its own client boundary, so this stays a
// Server Component and the static shell keeps server-rendering.
export default function Home() {
  return (
    <>
      <CurtainHero />
      <PatioTrack />
      <FlooringSwapper />
      <CushionDrift />
      <WallpaperUnroll />
      <ContactBand />
    </>
  );
}
