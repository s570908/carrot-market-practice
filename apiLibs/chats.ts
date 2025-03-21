import aclient from "./aclient";
import { ChatFormResponse, ChatMessageResponse, ChatResponse } from "./atypes";

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
