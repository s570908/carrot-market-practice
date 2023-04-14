import { useState } from "react";

interface UseMutationState<T> {
  data?: T;
  loading: boolean;
  error?: any;
}

type UseMutationResult<T> = [(data: any) => void, UseMutationState<T>];

export default function useMutation<T = any>(url: string): UseMutationResult<T> {
  const [state, setState] = useState<UseMutationState<T>>({
    data: undefined,
    loading: false,
    error: undefined,
  });

  // http post request  requires: url, data
  function mutation(data: any) {
    setState((prev) => {
      return { ...prev, loading: true };
    });
    fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(async (response) => {
        return response.json().catch((error) => {
          console.log(error, "--response.json");
        });
      })
      .then((data) => {
        setState((prev) => {
          return {
            ...prev,
            data,
          };
        });
      })
      .catch((error) => {
        setState((prev) => {
          return {
            ...prev,
            error,
          };
        });
      })
      .finally(() => {
        setState((prev) => {
          return { ...prev, loading: false };
        });
      });
  }

  return [mutation, state];
}

/*
사용법

const [enter, {data, loading, error}] = useMutation("/api/users/enter");
enter(inputData);

const [wonder, { loading }] = useMutation(`/api/posts/${router.query.id}/wonder`);
wonder({});

*/
