import { useParams } from "react-router";

import { ProjectView } from "@arcon/project/ProjectView";

export function meta() {
  return [{ title: "Design · Arcon Studio" }];
}

// Arcon's project screens, running on Studio's engine and data through the same actions the agent uses.
export default function ArconProjectRoute() {
  const { id = "" } = useParams();
  return (
    <div className="flex min-h-full flex-col bg-paper text-ink">
      <ProjectView key={id} id={id} />
    </div>
  );
}
