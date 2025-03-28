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

// 날짜 포맷팅 함수
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  } catch (error) {
    console.error("날짜 변환 오류:", error);
    return dateStr;
  }
}

// 시간 포맷팅 함수
export function formatTime(timeStr: string): string {
  try {
    const time = new Date(timeStr);
    return time.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("시간 변환 오류:", error);
    return timeStr;
  }
}

// 약속 상태 텍스트 변환
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "대기중",
    CONFIRMED: "확정됨",
    CANCELLED: "취소됨",
    COMPLETED: "완료됨",
    confirmed: "수락",
    pending: "대기중",
    declined: "거절",
  };

  return statusMap[status] || status;
}

// 남은 시간 계산
export function getTimeRemaining(targetDate: string): string {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) {
    return "시간 종료";
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}일 ${hours}시간 후`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분 후`;
  } else {
    return `${minutes}분 후`;
  }
}

// 일정 주기 텍스트 변환
export function getRecurrenceText(frequency: string, interval: number): string {
  if (frequency === "NONE" || !interval) {
    return "반복 없음";
  }

  const frequencyMap: Record<string, string> = {
    DAILY: "일",
    WEEKLY: "주",
    MONTHLY: "개월",
  };

  return `${interval}${frequencyMap[frequency]}마다 반복`;
}
