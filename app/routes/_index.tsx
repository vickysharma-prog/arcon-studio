import { Landing } from "@/components/landing/Landing";

export function meta() {
  return [
    { title: "Arcon Studio · for architects" },
    { name: "description", content: "Sit with your client, and Arcon turns what they tell you into their style, three plans, a 3D walkthrough and a budget. An agent works beside you: it proposes, you approve." },
  ];
}

// The front page, open to everyone; the studio itself is behind sign-in at /projects.
export default function IndexRoute() {
  return <Landing />;
}
