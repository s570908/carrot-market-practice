//import { CreateForm, CreateResponse } from "@/types/streams";
import { CreateForm, CreateResponse } from "@/types";
import aclient, { videoClient } from "./aclient";
import {
  LifecycleResult,
  MessageData,
  SellCompleteResponse,
  StreamDetailResponse,
  StreamsResponse,
  ViewsResult,
  StreamMessageResponse,
} from "./atypes";

export async function getStreamsPaging(page: number, limit: number) {
  const response = await aclient.get<StreamsResponse>(`/api/products?page=${page}&limit=${limit}`);
  return response.data;
}

export async function getStreamDetail(id: number) {
  const response = await aclient.get<StreamDetailResponse>(`/api/streams/${id}`);
  return response.data;
}

export async function writeStreamMessage(params: { id: number; messageData: MessageData }) {
  const { id, messageData } = params;
  const response = await aclient.post<SellCompleteResponse>(
    `/api/streams/${id}/messages`,
    messageData
  );
  return response.data;
}

export async function deleteStream(id: string) {
  const response = await aclient.delete(`/api/streams/${id}/delete`);
  return response.data;
}

export async function getViews(cloudflareId: string) {
  const response = await videoClient.get<ViewsResult>(`/${cloudflareId}/views`);
  return response.data;
}

export async function getLifecycle(cloudflareId: string) {
  const response = await videoClient.get<LifecycleResult>(`/${cloudflareId}/lifecycle`);
  return response.data;
}

export async function writeStream(form: CreateForm) {
  const response = await aclient.post<CreateResponse>(`/api/streams`, form);
  return response.data;
}

// // 스트림 데이터 가져오기 함수
// export async function getStream(id: string) {
//   const response = await aclient.get<StreamDetailResponse>(`/api/streams/${id}`);
//   return response.data;
// }

// // 조회수 데이터 가져오기 함수
// export async function getStreamViews(cloudflareId: string) {
//   const response = await videoClient.get<ViewsResult>(`/${cloudflareId}/views`);
//   return response.data;
// }

// // 라이프사이클 데이터 가져오기 함수
// export async function getStreamLifecycle(cloudflareId: string) {
//   const response = await videoClient.get<LifecycleResult>(`/${cloudflareId}/lifecycle`);
//   return response.data;
// }

// // 스트림 메시지 전송 함수
// export async function writeStreamMessage(params: { formData: MessageForm; streamId: string | string[] }) {
//   const { formData, streamId } = params;
//   const response = await aclient.post<StreamMessageResponse>(
//     `/api/streams/${streamId}/messages`,
//     formData
//   );
//   return response.data;
// }
