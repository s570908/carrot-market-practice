import { Fav, Kind } from "@prisma/client";
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

export const sortByRecentMsgDate = (
  a: { recentMsg: { updatedAt: string | number | Date } },
  b: { recentMsg: { updatedAt: string | number | Date } }
) => {
  const dateA = new Date(a.recentMsg?.updatedAt).getTime();
  const dateB = new Date(b.recentMsg?.updatedAt).getTime();
  return dateB - dateA;
};

export function isLikedByUser(favs: Fav[], userId: string | number) {
  return favs.map((uid) => (uid.userId === userId ? true : false)).includes(true);
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

export const parseId = (id: string | string[] | undefined): number | undefined => {
  if (Array.isArray(id)) {
    return parseInt(id[0], 10);
  }
  if (id) {
    return parseInt(id, 10);
  }
  return undefined;
};

export function getKindString(kind: Kind): string {
  switch (kind) {
    case Kind.Sale:
      return "sales";
    case Kind.Purchase:
      return "purchases";
    case Kind.Fav:
      return "favs";
    default:
      throw new Error(`Unknown kind: ${kind}`);
  }
}
