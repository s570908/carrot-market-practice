import { useState, useEffect, useCallback } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useFetch<T = any>(url: string, options?: RequestInit) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetch = useCallback(
    async (newUrl?: string, newOptions?: RequestInit) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await window.fetch(newUrl || url, newOptions || options);
        const json = await response.json();

        setState({
          data: json,
          loading: false,
          error: null,
        });

        return json;
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error)),
        });

        throw error;
      }
    },
    [url, options]
  );

  useEffect(() => {
    fetch();
  }, [url]);

  return {
    ...state,
    fetch,
  };
}
