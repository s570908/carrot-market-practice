import aclient from "./aclient";
import { ChatFormResponse, ChatMeetupParams, ChatMeetupResponse, ChatMessageResponse, ChatResponse, SystemMessageParams, SystemMessageResponse } from "./atypes";
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
export async function createChatMeetup(params: ChatMeetupParams) {
  // Client should pass appointmentTime as ISO string (already in UTC)
  console.log("createChatMeetup params:", params);
  
  const response = await aclient.post<ChatMeetupResponse>('/api/chat-meetups', params);
  return response.data;
}

// System message creation API function
export async function createSystemMessage(params: SystemMessageParams) {
  console.log("createSystemMessage params:", params);
  
  const response = await aclient.post<SystemMessageResponse>('/api/chat/system-message', params);
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
      console.log("APPOINTMENT_CREATED--time:", time);
      const dateTime = dayjs(time);
      console.log("${dateTime.locale('ko').format('M월 D일 A h:mm')}: ", 
        dateTime.locale('ko').format('M월 D일 A h:mm'));
      return `약속이 생성되었습니다. (${dateTime.locale('ko').format('M월 D일 A h:mm')})`;
    } catch (err) {
      console.error("Error parsing date:", err);
      // Fallback in case of error
      return `약속이 생성되었습니다.`;
    }
  },
  APPOINTMENT_ALERT: (time: string) => `약속시간 ${time}에 알림이 울릴 거예요`,
  PRODUCT_RESERVED: (username: string) => `${username}님이 상품을 예약했습니다.`,
  PRODUCT_SOLD: () => `거래가 완료되었습니다.`,
};
