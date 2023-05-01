import { useEffect, useState } from "react";

export const cls = (...classnames: string[]) => {
  return classnames.join(" ");
};

export async function delay(ms: number | undefined) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      console.log("Delay", ms);
      resolve();
    }, ms);
  });
}

export function usePromise<I, T>(promise: (arg: I) => Promise<T>, arg: I) {
  const [_promise, _setPromise] = useState<Promise<void>>();
  const [_status, _setStatus] = useState<"pending" | "fulfilled" | "error">("pending");
  const [_result, _setResult] = useState<T>();
  const [_error, _setError] = useState<Error>();

  useEffect(() => {
    function resolvePromise(result: T) {
      _setStatus("fulfilled");
      _setResult(result);
    }
    function rejectPromise(error: Error) {
      _setStatus("error");
      _setError(error);
    }
    _setStatus("pending");
    _setPromise(promise(arg).then(resolvePromise, rejectPromise));
  }, [arg, promise]);

  if (_status === "pending" && _promise) {
    throw _promise;
  }
  if (_error) {
    throw _error;
  }
  return _result;
}
