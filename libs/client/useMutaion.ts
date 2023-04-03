import { useState } from "react";

interface UseMutationState {
  data: undefined | any;
  loading: boolean;
  error: undefined | any;
}
export default function useMutation(url: string): [(data: any) => void, UseMutationState] {
  const [state, setState] = useState<UseMutationState>({
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
