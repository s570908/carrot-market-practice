import { co } from "@fullcalendar/core/internal-common";
import aclient from "./aclient";
import {
  AlarmSettingsParams,
  AlarmSettingsResponse,
  ChatFormResponse,
  ChatMeetupParams,
  ChatMeetupResponse,
  ChatMessageResponse,
  ChatResponse,
  SystemMessageParams,
  SystemMessageResponse,
} from "./atypes";
import dayjs from "dayjs";
import "dayjs/locale/ko"; // 한국어 로케일 추가

// axios를 사용해 데이터를 가져오는 함수
export async function getChat(id: number) {
  const response = await aclient.get<ChatResponse>(`/api/chat/${id}`);
  return response.data;
}

export async function writeChatMessage(params: {
  chatForm: ChatFormResponse;
  chatId: number;
}) {
  const { chatForm, chatId } = params;
  const response = await aclient.post<ChatMessageResponse>(
    `/api/chat/${chatId}`,
    chatForm
  );
  return response.data;
}

export async function getUnreadMessagesForUser() {
  try {
    // 세션에서 이미 인증된 사용자 정보를 서버가 사용하도록 수정
    const response = await aclient.get(`/api/chat/unreadMessagesForUser`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unread messages:", error);
    return { ok: false, hasUnreadMessages: false };
  }
}

// Updated ChatMeetup creation API function
export async function writeChatMeetup(params: ChatMeetupParams) {
  // 약속 생성 + 약속 메시지 생성 API 호출
  const response = await aclient.post<ChatMeetupResponse>(
    "/api/chat-meetups",
    params
  );
  return response.data;
}

/**
 * 약속(채팅 약속) 업데이트용 함수
 * @param chatRoomId 채팅방 ID (URL 파라미터)
 * @param params 업데이트할 약속 데이터
 */
export async function updateChatMeetup(params: ChatMeetupParams) {
  // 약속 수정 API 호출 (POST /api/chat-meetups/[id])
  const response = await aclient.post<ChatMeetupResponse>(
    `/api/chat-meetups/${params.chatRoomId}`,
    params
  );
  return response.data;
}

export const writeSystemMessage = async ({
  chatRoomId,
  message,
  userId,
  meta = {},
}: SystemMessageParams) => {
  const response = await aclient.post<SystemMessageResponse>(
    "/api/chat/system-message",
    {
      chatRoomId,
      message,
      userId,
      meta,
    }
  );
  return response.data;
};

/**
 * 시스템 메시지 템플릿 모음 (클라이언트에서 안전하게 사용 가능)
 */
export const SYSTEM_MESSAGES = {
  ROOM_CREATED: (username: string) => `${username}님이 채팅방을 만들었습니다.`,
  APPOINTMENT_CREATED: (time: Date) => {
    try {
      const dateTime = dayjs(time);
      return `약속이 생성되었습니다. (${dateTime
        .locale("ko")
        .format("M월 D일 A h:mm")})`;
    } catch (err) {
      console.error("Error parsing date:", err);
      return `약속이 생성되었습니다.`;
    }
  },
  APPOINTMENT_UPDATED: (time: Date) => {
    try {
      const dateTime = dayjs(time);
      return `약속이 변경되었습니다. (${dateTime
        .locale("ko")
        .format("M월 D일 A h:mm")})`;
    } catch (err) {
      console.error("Error parsing date:", err);
      return `약속이 변경되었습니다.`;
    }
  },
  APPOINTMENT_ALERT: (
    alarmTime: string,
    chatMeetupId: number,
    appointmentMessageId?: number
  ) => ({
    message: `약속시간 ${alarmTime}에 알림이 울릴 거예요`,
    meta: {
      type: "APPOINTMENT_ALERT",
      chatMeetupId: chatMeetupId,
      appointmentMessageId: appointmentMessageId,
      alarmTime: alarmTime,
    },
  }),
  PRODUCT_RESERVED: (username: string) =>
    `${username}님이 상품을 예약했습니다.`,
  PRODUCT_SOLD: () => `거래가 완료되었습니다.`,
};

// 기존 알람 설정을 조회하는 함수
export const getAlarmSettings = async (chatId: number, messageId: number) => {
  try {
    const response = await aclient.get(
      `/api/chat/${chatId}/alarm-settings/${messageId}`
    );
    return response.data;
  } catch (error) {
    // 404 에러는 설정이 없다는 의미이므로 정상 처리
    if ((error as any)?.response?.status === 404) {
      return { ok: false, exists: false };
    }
    throw error;
  }
};

// 새로운 알람 설정 생성
export const createAlarmSettings = async (params: {
  chatId: number;
  messageId: number;
  alarmTime: string;
  triggerAt?: string;
  disableAlarm: boolean;
}) => {
  console.log("createAlarmSettings params:", params);

  // POST 방식으로 새로운 알람 생성
  const response = await aclient.post(
    `/api/chat/${params.chatId}/alarm-settings`,
    {
      messageId: params.messageId,
      alarmTime: params.alarmTime,
      triggerAt: params.triggerAt,
      disableAlarm: params.disableAlarm,
    }
  );
  return response.data;
};

/*
writeAlarmSettings와 updateAlarmSettings의 차이점

1. writeAlarmSettings (PUT)
   - "전체 알람 설정을 upsert(있으면 업데이트, 없으면 생성)"하는 함수입니다.
   - 서버의 /api/chat/[chatId]/alarm-settings 엔드포인트에 PUT 요청을 보냅니다.
   - 모든 필드를 한 번에 전달하며, 기존 알림이 있으면 덮어쓰고, 없으면 새로 만듭니다.
   - 주로 알림 전체를 새로 등록하거나, 전체 필드를 갱신할 때 사용합니다.

2. updateAlarmSettings (PATCH)
   - "기존 알람 설정의 일부 필드만 부분적으로 수정"하는 함수입니다.
   - 서버의 /api/chat/[chatId]/alarm-settings/[messageId] 엔드포인트에 PATCH 요청을 보냅니다.
   - 일부 필드만 전달하여, 해당 필드만 변경합니다.
   - 주로 알림의 일부 속성만 바꿀 때 사용합니다.

정리:
- writeAlarmSettings: 전체 upsert(생성/전체 갱신, PUT)
- updateAlarmSettings: 부분 수정(PATCH)
*/

// 기존 알람 설정 전체 업데이트 또는 생성 (upsert)
export const writeAlarmSettings = async (params: {
  chatId: number;
  messageId: number;
  alarmTime: string;
  triggerAt?: string;
  disableAlarm: boolean;
}) => {
  console.log("writeAlarmSettings params:", params);

  // PUT 방식으로 upsert (있으면 업데이트, 없으면 생성)
  const response = await aclient.put(
    `/api/chat/${params.chatId}/alarm-settings`,
    {
      messageId: params.messageId,
      alarmTime: params.alarmTime,
      triggerAt: params.triggerAt,
      disableAlarm: params.disableAlarm,
    }
  );
  return response.data;
};

// 기존 알람 설정 부분 수정
export const updateAlarmSettings = async (params: {
  chatId: number;
  messageId: number;
  alarmTime?: string;
  triggerAt?: string;
  disableAlarm?: boolean;
}) => {
  console.log("updateAlarmSettings params:", params);

  try {
    // PATCH 방식으로 부분 업데이트
    const response = await aclient.patch(
      `/api/chat/${params.chatId}/alarm-settings/${params.messageId}`,
      {
        alarmTime: params.alarmTime,
        triggerAt: params.triggerAt,
        disableAlarm: params.disableAlarm,
      }
    );
    return response.data;
  } catch (error: any) {
    // 404 에러는 기존 알람이 없다는 의미이므로 명확한 에러 메시지 반환
    if (error?.response?.status === 404) {
      return {
        ok: false,
        error: "기존 알람 설정이 존재하지 않습니다. 먼저 알람을 생성하세요.",
      };
    }
    throw error;
  }
};

// 알람 설정을 삭제하는 함수
export const deleteAlarmSettings = async (
  chatId: number,
  messageId: number
) => {
  const response = await aclient.delete(
    `/api/chat/${chatId}/alarm-settings/${messageId}`
  );
  return response.data;
};

/**
 * 알람 변경(취소 후 새로 생성/업데이트) 요청을 서버에 보내는 함수
 * 서버에서 기존 알림을 cancel하고 새 알림을 생성/스케줄링함
 */
export const changeAlarmSettings = async (params: {
  chatId: number;
  messageId: number;
  alarmTime: string;
  triggerAt?: string;
  disableAlarm: boolean;
}) => {
  // PUT 방식으로 upsert (있으면 기존 알림 취소 후 새로 생성/업데이트)
  // 서버에서 모든 취소/생성/스케줄링을 처리함
  return await writeAlarmSettings(params);
};
