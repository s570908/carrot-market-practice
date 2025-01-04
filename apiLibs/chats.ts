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
