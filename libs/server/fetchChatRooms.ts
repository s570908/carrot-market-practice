import axios from "axios";

export async function fetchChatRooms(productId: any) {
  const url = productId ? `/api/chatRoomList/product/${productId}` : "/api/chat";
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching chat rooms", error);
    throw error;
  }
}
