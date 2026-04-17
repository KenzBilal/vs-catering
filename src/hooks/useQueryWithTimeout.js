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

/**
 * Parses a Convex mutation error into a user-friendly string.
 * Strips internal Convex noise from the message.
 *
 * Usage:
 *   } catch (e) {
 *     setError(parseMutationError(e));
 *   }
 */
export function parseMutationError(e) {
  if (!e) return "Something went wrong.";

  // Network / fetch failure
  if (!navigator.onLine) return "You're offline. Check your connection and try again.";

  const raw = e.data || e.message || String(e);
  if (typeof raw !== "string") return "An unexpected error occurred.";

  // Strip Convex internal prefix: [CONVEX Q(...)] or [CONVEX M(...)]
  const stripped = raw.replace(/^\[CONVEX [A-Z]\([^)]+\)\]\s*/i, "").trim();

  if (stripped.includes("ConvexError:")) {
    return stripped.split("ConvexError:")[1].trim();
  }

  // Known network-level messages
  if (raw.includes("Failed to fetch") || raw.includes("NetworkError")) {
    return "Network error — couldn't reach the server. Please try again.";
  }
  if (raw.includes("timeout") || raw.includes("timed out")) {
    return "Request timed out. Please try again.";
  }

  return stripped || "An unexpected error occurred.";
}
