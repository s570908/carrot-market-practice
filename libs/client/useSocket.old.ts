/* import { useEffect, useRef, useState } from "react";
import { io as ClientIO } from "socket.io-client";

const backUrl = "http://localhost:3000";
// process.env.NODE_ENV === "production" ? "https://sleact.nodebird.com" : "http://localhost:3000";

type UseSocketReturnType = {
  socket: any | null;
  isConnected: boolean;
};

// Custom hook for managing the Socket.IO connection
export const useSocket = (): UseSocketReturnType => {
  const socketRef = useRef<any | null>(null); // Use useRef to hold the socket instance
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const fetchSocket = async () => {
      // await fetch("http://localhost:3000/api/socket/io");
      // backUrl을 사용해 API endpoint URL을 구성
      await fetch(`${backUrl}/api/socket`);
    };
    // Initialize the socket if it hasn't been created yet
    if (!socketRef.current) {
      fetchSocket();
      const socketInstance = new (ClientIO as any)(backUrl!, {
        path: "/api/socket",
        transports: ["websocket"],
        addTrailingSlash: false,
      });

      socketRef.current = socketInstance;
      console.log("useSocket socket==: ", socketInstance);

      // Handle connection events
      socketInstance.on("connect", () => {
        setIsConnected(true);
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });
    }

    // Clean up the socket connection on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Run only once on component mount

  return { socket: socketRef.current, isConnected };
};
 */

// libs/client/socket.ts
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

type UseSocketReturnType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SOCKET_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export const useSocket = (): UseSocketReturnType => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 소켓을 연결하도록
    if (typeof window === "undefined") return;

    // 소켓이 이미 생성되어 있으면 연결하지 않음
    if (!socketRef.current) {
      console.log("SOCKET_URL= ", SOCKET_URL);
      // 소켓 인스턴스를 한 번만 생성
      // @ts-ignore
      socketRef.current = io.connect(process.env.NEXT_PUBLIC_BASE_URL, {
        path: "/api/socket",
      });

      console.log("socket= ", socketRef.current);

      // 연결된 후 이벤트 처리
      socketRef.current?.on("connect", () => {
        console.log("Socket connected:", socketRef.current?.id);
        setIsConnected(true);
      });

      socketRef.current?.on("disconnect", () => {
        console.log("Socket disconnected");
        setIsConnected(false);
      });
    } else {
      console.log("Socket already exists, skipping creation.");
    }

    // 컴포넌트 언마운트 시 소켓 연결 해제
    return () => {};
  }, []); // 빈 배열로, 컴포넌트가 마운트될 때만 실행

  return { socket: socketRef.current, isConnected };
};
