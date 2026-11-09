import { useLocation, useNavigate, useSearchParams as useRouterSearchParams } from "react-router";

// Next's navigation hooks, answered by React Router, for Studio's components.
export function useRouter() {
  const navigate = useNavigate();
  return {
    push: (to: string) => navigate(to),
    replace: (to: string) => navigate(to, { replace: true }),
    back: () => navigate(-1),
    refresh: () => navigate(0),
    prefetch: (_to: string) => {},
  };
}

export const usePathname = () => useLocation().pathname;
export const useSearchParams = () => useRouterSearchParams()[0];
