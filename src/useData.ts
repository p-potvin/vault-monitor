import { useCallback, useEffect, useState } from "react";
import { getAiSessions, getChanges, getInputTracker, getWorkImpact } from "./api";
import type { ChangeEvent, InputTrackerData } from "./types";
import type { AiSessionsData } from "./features/ai-sessions/types";
import type { WorkImpactData } from "./features/work-impact/lib/types";

function useRequest<T>(request: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setData(null);
    request(controller.signal)
      .then(setData)
      .catch((reason: Error) => {
        if (reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [request]);
  return { data, loading, error };
}

export function useWorkImpactData() {
  return useRequest<WorkImpactData>(getWorkImpact);
}

export function useChangesData() {
  const state = useRequest<ChangeEvent[]>(getChanges);
  return { events: state.data ?? [], loading: state.loading, error: state.error };
}

export function useAiSessionsData(months = 12) {
  const request = useCallback((signal: AbortSignal) => getAiSessions(signal, months), [months]);
  return useRequest<AiSessionsData>(request);
}

export function useInputTrackerData(hours = 168) {
  const request = useCallback((signal: AbortSignal) => getInputTracker(signal, hours), [hours]);
  return useRequest<InputTrackerData>(request);
}
