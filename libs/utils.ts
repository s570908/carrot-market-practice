import {
  AppointmentForCalendarEvent,
  AppointmentListResponse,
  AppointmentResponse,
  AppointmentWithRelations,
  FullCalendarEvent,
  statusColors,
} from "@/types";
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

// 날짜를 포맷팅합니다. (YYYY년 M월 D일 형식)
export function formatDate(dateString: string | Date): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// 시간을 포맷팅합니다. (HH:MM 형식)
export function formatTime(dateString: string | Date): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// 약속 상태 텍스트 변환
export function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    PENDING: "대기중",
    CONFIRMED: "확정됨",
    CANCELLED: "취소됨",
    COMPLETED: "완료됨",
    DECLINED: "거절",
    // 하위 호환성을 위해 소문자 키도 유지
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

// 약속 데이터를 FullCalendar 이벤트 형식으로 변환하는 함수
export function formatAppointmentsForAll(
  appointments: AppointmentWithRelations[]
): FullCalendarEvent[] {
  return appointments.map((appointment) => {
    return {
      id: appointment.id.toString(),
      title: appointment.title,
      start: appointment.startTime,
      end: appointment.endTime,
      backgroundColor: statusColors[appointment.status],
      textColor: "white",
      borderColor: statusColors[appointment.status],
      allDay: false, // allDay 속성 추가
      extendedProps: {
        status: appointment.status,
        locationTmap: appointment.locationTmap,
      },
    };
  });
}

// 추가: 날짜 형식을 검증하는 유틸리티 함수
export function validateDateForCalendar(date: string | Date): Date {
  const parsedDate = new Date(date);

  // 날짜가 유효하지 않거나 2010년 이전인 경우 현재 시간으로 대체
  if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2010) {
    console.warn("유효하지 않은 날짜 감지:", date);
    console.error("유효하지 않은 날짜 감지:", date);
    return new Date();
  }

  return parsedDate;
}

// 알림 시간 타입 정의
export type AlarmTimeType = "10분 전" | "30분 전" | "1시간 전" | "1일 전" | "알림 없이 생성";

// 트리거 시간 계산 함수
export const calculateTriggerTime = (appointmentTime: Date, alarmTime: AlarmTimeType): Date => {
  const triggerTime = new Date(appointmentTime);

  switch (alarmTime) {
    case "10분 전":
      triggerTime.setMinutes(triggerTime.getMinutes() - 10);
      break;
    case "30분 전":
      triggerTime.setMinutes(triggerTime.getMinutes() - 30);
      break;
    case "1시간 전":
      triggerTime.setHours(triggerTime.getHours() - 1);
      break;
    case "1일 전":
      triggerTime.setDate(triggerTime.getDate() - 1);
      break;
    case "알림 없이 생성":
      return new Date();
    default:
      console.warn(`Unknown alarm time: ${alarmTime}`);
      break;
  }

  return triggerTime;
};

  export const validatealarmTime = (appointmentTime: Date, alarmTime: string) => {
    // 알림 없이 생성 옵션이면 항상 유효
    if (alarmTime === "알림 없이 생성") {
      return { isValid: true, timeDiffInMinutes: 0, alertTriggerTime: new Date() };
    }

    const now = new Date();
    // 약속 시간과 현재 시간의 차이를 먼저 계산
    const appointmentDiffInMinutes = Math.floor((appointmentTime.getTime() - now.getTime()) / (1000 * 60));

    // 알림 시간(분)을 계산
    let alertMinutesBefore = 0;
    switch (alarmTime) {
      case "10분 전": alertMinutesBefore = 10; break;
      case "30분 전": alertMinutesBefore = 30; break;
      case "1시간 전": alertMinutesBefore = 60; break;
      case "1일 전": alertMinutesBefore = 1440; break; // 24시간 * 60분
    }

    // 알림이 가능한지 확인: 약속시간까지 남은 시간이 알림 시간보다 크거나 같아야 함
    const isValid = appointmentDiffInMinutes >= alertMinutesBefore;

    // 알림 발송 시간 계산
    const alertTriggerTime = new Date(appointmentTime.getTime() - (alertMinutesBefore * 60 * 1000));
    const timeDiffInMinutes = Math.floor((alertTriggerTime.getTime() - now.getTime()) / (1000 * 60));

    return {
      isValid,
      timeDiffInMinutes,
      alertTriggerTime
    };
  };
