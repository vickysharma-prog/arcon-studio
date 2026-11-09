import React, { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from "react";

// Next's dynamic(), as Studio's components use it: a component loaded on demand, in the browser only when ssr is false.
type Options = { ssr?: boolean; loading?: () => ReactNode };

export default function dynamic<P extends object>(load: () => Promise<{ default: ComponentType<P> }>, options: Options = {}) {
  const Lazy = lazy(load);
  return function Dynamic(props: P) {
    const [mounted, setMounted] = useState(options.ssr !== false);
    useEffect(() => setMounted(true), []);
    const fallback = options.loading ? options.loading() : null;
    if (!mounted) return <>{fallback}</>;
    return (
      <Suspense fallback={fallback}>
        <Lazy {...(props as P & React.JSX.IntrinsicAttributes)} />
      </Suspense>
    );
  };
}
