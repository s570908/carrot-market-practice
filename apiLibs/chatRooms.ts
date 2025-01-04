import aclient from "./aclient";
import {
  ChatRoomByIdResponse,
  ChatRoomCreateResponse,
  ChatRoomIDsResponse,
  ChatRoomResponse,
  ChatRoomsByKeyResponse,
  ChatRoomsByProductResponse,
  ChatRoomType,
} from "./atypes";

export async function getChatRoom(id: number) {
  const response = await aclient.get<ChatRoomResponse>(`/api/chatRoomList/id/${id}`);
  return response.data;
}

export async function getChatRoomIDs(key: ChatRoomType) {
  // key: seller/buyer/all
  const response = await aclient.get<ChatRoomIDsResponse>(`/api/chatRoomList?key=${key}`);
  return response.data;
}

export async function getChatRoomsByProduct(id: number) {
  const response = await aclient.get<ChatRoomsByProductResponse>(`/api/chatRoomList/product/${id}`);
  return response.data;
}

export async function getChatRoomsById(id: number) {
  const response = await aclient.get<ChatRoomByIdResponse>(`/api/chatRoomList/id/${id}`);
  return response.data;
}

export async function getChatRoomsByKey(key: ChatRoomType) {
  // key: seller/buyer/all
  const response = await aclient.get<ChatRoomsByKeyResponse>(`/api/chatRoomList?key=${key}`);
  return response.data;
}

export async function writeChatRoom(params: {
  buyerId: number;
  sellerId: number;
  productId: number;
}) {
  //const { buyerId, sellerId, productId } = params;
  const response = await aclient.post<ChatRoomCreateResponse>(`/api/chatRoomList/`, params);
  return response.data;
}
