import { useEffect, useState } from "react";
import { getChanges, getInputTracker, getWorkImpact } from "./api";
import type { ChangeEvent, InputTrackerData } from "./types";
import type { WorkImpactData } from "./features/work-impact/lib/types";

function useRequest<T>(request: (signal: AbortSignal) => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
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

export function useInputTrackerData() {
  return useRequest<InputTrackerData>(getInputTracker);
}
