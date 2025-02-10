import aclient, { videoClient } from "./aclient";
import {
  LifecycleResult,
  MessageData,
  SellCompleteResponse,
  StreamDetailResponse,
  StreamsResponse,
  ViewsResult,
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
