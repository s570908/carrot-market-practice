import { co } from "@fullcalendar/core/internal-common";
import aclient from "./aclient";
import { AlarmSettingsParams, AlarmSettingsResponse, ChatFormResponse, ChatMeetupParams, ChatMeetupResponse, ChatMessageResponse, ChatResponse, SystemMessageParams, SystemMessageResponse } from "./atypes";
import dayjs from "dayjs";
import 'dayjs/locale/ko'; // 한국어 로케일 추가

// axios를 사용해 데이터를 가져오는 함수
export async function getChat(id: number) {
  const response = await aclient.get<ChatResponse>(`/api/chat/${id}`);
  return response.data;
}

export async function writeChatMessage(params: { chatForm: ChatFormResponse; chatId: number }) {
  const { chatForm, chatId } = params;
  const response = await aclient.post<ChatMessageResponse>(`/api/chat/${chatId}`, chatForm);
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
  const response = await aclient.post<ChatMeetupResponse>('/api/chat-meetups', params);
  return response.data;
}

export const writeSystemMessage = async ({ chatRoomId, message, userId, meta = {} }: SystemMessageParams) => {
  const response = await aclient.post<SystemMessageResponse>('/api/chat/system-message', {
    chatRoomId,
    message,
    userId,
    meta
  });
  return response.data;
};

// 약속 수정 API 함수
export async function updateChatMeetup(params: {
  appointmentId: number;
  appointmentTime?: Date;
  place?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  alarmTime?: string | null;
}) {
  const response = await aclient.put<ChatMeetupResponse>(`/api/chat-meetups/${params.appointmentId}`, {
    appointmentTime: params.appointmentTime,
    place: params.place,
    locationLatitude: params.locationLatitude,
    locationLongitude: params.locationLongitude,
    alarmTime: params.alarmTime,
  });
  return response.data;
}

// 약속 조회 API 함수
export async function getChatMeetup(appointmentId: number) {
  const response = await aclient.get<ChatMeetupResponse>(`/api/chat-meetups/${appointmentId}`);
  return response.data;
}

// 약속 삭제 API 함수
export async function deleteChatMeetup(appointmentId: number) {
  const response = await aclient.delete(`/api/chat-meetups/${appointmentId}`);
  return response.data;
}

/**
 * 시스템 메시지 템플릿 모음 (클라이언트에서 안전하게 사용 가능)
 */
export const SYSTEM_MESSAGES = {
  ROOM_CREATED: (username: string) => `${username}님이 채팅방을 만들었습니다.`,
  APPOINTMENT_CREATED: (time: Date) => {
    try {
      // Convert Date to dayjs and format
      //console.log("APPOINTMENT_CREATED--time:", time);
      const dateTime = dayjs(time);
      // console.log("${dateTime.locale('ko').format('M월 D일 A h:mm')}: ", 
      //   dateTime.locale('ko').format('M월 D일 A h:mm'));
      return `약속이 생성되었습니다. (${dateTime.locale('ko').format('M월 D일 A h:mm')})`;
    } catch (err) {
      console.error("Error parsing date:", err);
      // Fallback in case of error
      return `약속이 생성되었습니다.`;
    }
  },
  APPOINTMENT_ALERT: (alarmTime: string, chatMeetupId: number, appointmentMessageId?: number) => ({
    message: `약속시간 ${alarmTime}에 알림이 울릴 거예요`,
    meta: {
      type: 'APPOINTMENT_ALERT',
      chatMeetupId: chatMeetupId,  // 이것이 핵심: chatMeetupId를 올바르게 설정
      appointmentMessageId: appointmentMessageId,  // 약속 메시지의 ID
      alarmTime:alarmTime
    }
  }),
  PRODUCT_RESERVED: (username: string) => `${username}님이 상품을 예약했습니다.`,
  PRODUCT_SOLD: () => `거래가 완료되었습니다.`,
};

// 기존 알람 설정을 조회하는 함수
export const getAlarmSettings = async (chatId: number, messageId: number) => {
  try {
    const response = await aclient.get(`/api/chat/${chatId}/alarm-settings/${messageId}`);
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
  const response = await aclient.post(`/api/chat/${params.chatId}/alarm-settings`, {
    messageId: params.messageId,
    alarmTime: params.alarmTime,
    triggerAt: params.triggerAt,
    disableAlarm: params.disableAlarm,
  });
  return response.data;
};

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
  const response = await aclient.put(`/api/chat/${params.chatId}/alarm-settings`, {
    messageId: params.messageId,
    alarmTime: params.alarmTime,
    triggerAt: params.triggerAt,
    disableAlarm: params.disableAlarm,
  });
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
  
  // PATCH 방식으로 부분 업데이트
  const response = await aclient.patch(`/api/chat/${params.chatId}/alarm-settings/${params.messageId}`, {
    alarmTime: params.alarmTime,
    triggerAt: params.triggerAt,
    disableAlarm: params.disableAlarm,
  });
  return response.data;
};

// 알람 설정을 삭제하는 함수
export const deleteAlarmSettings = async (chatId: number, messageId: number) => {
  const response = await aclient.delete(`/api/chat/${chatId}/alarm-settings/${messageId}`);
  return response.data;
};
