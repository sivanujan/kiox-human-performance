import Hero from "@/components/sections/Hero";
import StatsBar from "@/components/sections/StatsBar";
import VideoShowcase from "@/components/sections/VideoShowcase";
import Introduction from "@/components/sections/Introduction";
import Services from "@/components/sections/Services";
import TrainWithCoach from "@/components/sections/TrainWithCoach";
import Excellence from "@/components/sections/Excellence";
import Wellness from "@/components/sections/Wellness";
import PlayerDevelopment from "@/components/sections/PlayerDevelopment";
import Contact from "@/components/sections/Contact";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between w-full overflow-hidden">
      <Hero />
      <StatsBar />
      <Introduction />
      <Services />
      <TrainWithCoach />
      <Excellence />
      <Wellness />
      <PlayerDevelopment />
      <VideoShowcase />
      <Contact />
    </main>
  );
}
