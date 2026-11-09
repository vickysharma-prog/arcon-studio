import { LandingHeader } from "@arcon/landing/Hero";
import { Docs } from "@arcon/landing/Docs";
import { Footer } from "@arcon/landing/Sections";

export function meta() {
  return [{ title: "Resources · Arcon Studio" }, { name: "description", content: "How to start, working with clients and the agent, how a design is made, questions and a developer guide." }];
}

export default function ResourcesRoute() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <LandingHeader />
      <Docs />
      <Footer />
    </div>
  );
}
