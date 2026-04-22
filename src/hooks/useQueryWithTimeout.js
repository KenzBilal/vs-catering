import { useState, useEffect, useRef } from "react";

/**
 * Wraps a Convex useQuery result with a timeout detector.
 * If the query stays `undefined` longer than `timeoutMs`, marks it as timed out.
 *
 * Usage:
 *   const { data, timedOut } = useQueryWithTimeout(caterings, 8000);
 *   if (timedOut) return <ErrorState variant="timeout" onRetry={() => window.location.reload()} />;
 *   if (data === undefined) return <LoadingSkeleton />;
 *
 * @param {*} queryResult   - the raw result from useQuery (undefined = loading)
 * @param {number} timeoutMs - how many ms before declaring a timeout (default 10s)
 */
export function useQueryWithTimeout(queryResult, timeoutMs = 10000) {
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // If result has arrived, cancel any pending timer
    if (queryResult !== undefined) {
      setTimedOut(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    // Start timer — only if still loading
    timerRef.current = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [queryResult, timeoutMs]);

  return { data: queryResult, timedOut };
}

import { parseError } from "../lib/helpers";

export { parseError as parseMutationError };
