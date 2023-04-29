import { useState } from "react";

interface UseMutationState<T> {
  data?: T;
  error?: object;
  loading: boolean;
}

export type UseMutationResult<T> = [(data: any) => void, UseMutationState<T>];

const useMutation = <T = any>(url: string): UseMutationResult<T> => {
  const [state, setState] = useState<UseMutationState<T>>({
    data: undefined,
    error: undefined,
    loading: false,
  });

  function mutate(data: any) {
    setState((prev) => ({ ...prev, loading: true }));
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) =>
        response.json().catch((error) => {
          console.log(error);
        })
      )
      .then((data) => {
        setState((prev) => ({ ...prev, data }));
      })
      .catch((error) => {
        setState((prev) => ({ ...prev, error }));
      })
      .finally(() => {
        setState((prev) => ({ ...prev, loading: false }));
      });
  }
  return [mutate, state];
};

export default useMutation;
