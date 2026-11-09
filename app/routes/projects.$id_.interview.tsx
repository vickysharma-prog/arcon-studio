import { IconArrowLeft } from "@tabler/icons-react";
import { Link, useParams } from "react-router";

import { Interview } from "@arcon/interview/Interview";

export function meta() {
  return [{ title: "Interview · Arcon Studio" }];
}

// Arcon's interview for one project, run by the architect with the client.
export default function InterviewRoute() {
  const { id = "" } = useParams();
  return (
    <div className="flex min-h-full flex-col bg-paper text-ink">
      <div className="px-4 pt-4 sm:px-8">
        <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink">
          <IconArrowLeft className="size-3.5" aria-hidden />
          Your studio
        </Link>
      </div>
      <Interview key={id} projectId={id} />
    </div>
  );
}
