import { Hero, LandingHeader } from "@arcon/landing/Hero";
import { Intro } from "@arcon/landing/Intro";
import { PlansDemo } from "@arcon/landing/PlansDemo";
import { Faq, Features, FinalCall, Footer, HowItWorks, TasteFlow } from "@arcon/landing/Sections";
import { AgentSide, HouseFilm, Judges } from "@arcon/landing/Studio";

// Arcon Studio's front page: Arcon's own landing, told for architects, with the house as a film you scroll through,
// the agent beside the architect, and a short path for judges.
export function Landing() {
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-paper text-ink">
      <Intro />
      <LandingHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <HouseFilm />
        <PlansDemo />
        <TasteFlow />
        <AgentSide />
        <Features />
        <Faq />
        <Judges />
        <FinalCall />
      </main>
      <Footer />
    </div>
  );
}
