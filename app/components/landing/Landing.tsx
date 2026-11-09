import { useEffect } from "react";

import { AppStory, CleanFooter, CleanHeader, CleanHero, Everything } from "@arcon/landing/Clean";
import { Intro } from "@arcon/landing/Intro";
import { AgentSide, Judges } from "@arcon/landing/Studio";

// Arcon Studio's front page: one big line, the work fanning in around it, the app holding the screen while a project
// runs from interview to approval, the agent, everything a project gets, and a short path for judges.
export function Landing() {
  // larger type on big screens, for this page only
  useEffect(() => {
    document.documentElement.classList.add("landing-big");
    return () => document.documentElement.classList.remove("landing-big");
  }, []);
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip bg-paper text-ink">
      <Intro />
      <CleanHeader />
      <main className="flex-1">
        <CleanHero />
        <AppStory />
        <AgentSide />
        <Everything />
        <Judges />
      </main>
      <CleanFooter />
    </div>
  );
}
