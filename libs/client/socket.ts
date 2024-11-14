// libs/socket.ts
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_BASE_URL!;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  console.log("SOCKET_URL= ", SOCKET_URL);
  if (!socket) {
    socket = io(SOCKET_URL, {
      path: "/api/socket",
      transports: ["websocket", "polling"], // Socket.IO 연결을 설정할 때 웹소켓을 우선적으로 사용하도록 지정
    });

    // 연결 상태 로깅
    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });
  }

  return socket;
};
