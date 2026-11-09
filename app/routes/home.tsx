import { redirect } from "react-router";
// Studio opens on the person's projects; the starter's Get started page is not part of it.
import { APP_TITLE } from "@/lib/app-config";

export function meta() {
  return [{ title: APP_TITLE }, { name: "description", content: "Work on your Arcon Studio designs with an agent: it proposes, you approve." }];
}

export const loader = () => redirect("/projects");

export default function HomeRoute() {
  return null;
}
