import { signInLandingLoader } from "@agent-native/core/client/sign-in-landing";
import type { LoaderFunctionArgs } from "react-router";

// Signed in, Studio opens on the person's projects.
export const loader = ({ request }: LoaderFunctionArgs) => signInLandingLoader("/projects", request);
