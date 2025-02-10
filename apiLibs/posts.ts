import aclient from "./aclient";
import {
  AnswerForm,
  AnswerResponse,
  CommunityPostResponse,
  WriteCommunityPostResponse,
} from "./atypes";

export async function getCommunityPost(id: number, page: number) {
  const response = await aclient.get<CommunityPostResponse>(`/api/posts/${id}?page=${page}`);
  return response.data;
}

export async function writeCommunityPost(id: number) {
  const response = await aclient.post<WriteCommunityPostResponse>(`/api/posts/${id}/wonder`);
  return response.data;
}

export async function writeCommunityAnswer(params: { id: number; answerData: AnswerForm }) {
  const { id, answerData } = params;
  const response = await aclient.post<AnswerResponse>(`/api/posts/${id}/answer`, answerData);
  return response.data;
}
