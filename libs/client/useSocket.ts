import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const backUrl =
  process.env.NODE_ENV === "production" ? "https://sleact.nodebird.com" : "http://localhost:3000";

const sockets: { [key: string]: Socket } = {};

const useSocket = (workspace: string = "market"): [Socket | undefined, () => void] => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);

  const disconnect = useCallback(() => {
    if (workspace && sockets[workspace]) {
      console.info("disconnecting socket: ", workspace);
      sockets[workspace].disconnect();
      delete sockets[workspace];
      setSocket(undefined);
    }
  }, [workspace]);

  useEffect(() => {
    if (typeof window !== "undefined" && workspace) {
      console.log("useSocket useEffect called workspace: ", workspace);
      if (!sockets[workspace]) {
        console.info("Creating socket connection for workspace:", workspace);

        // socketInstance 생성 시 URI를 명시
        const socketInstance = io(`${backUrl}`, {
          path: "/api/socket",
          //transports: ["websocket"], // Only use websocket transport
          query: { namespace: workspace }, // 클라이언트에서 namespace 전달
          // reconnectionAttempts: 3, // Limit reconnection attempts
          // timeout: 5000, // Set connection timeout
        });

        console.log("socketInstance: ", socketInstance);

        // 연결 성공 이벤트 처리
        socketInstance.on("connect", () => {
          console.log(`Connected to ${workspace}: ${socketInstance.id}`);
        });

        // Handle socket connection errors
        socketInstance.on("connect_error", (err) => {
          console.error("WebSocket connection error:", err.message);
        });

        // Handle disconnection
        socketInstance.on("disconnect", (reason) => {
          console.info(`Socket disconnected (${reason}).`);
        });

        // 소켓 인스턴스를 저장
        sockets[workspace] = socketInstance;
      }

      // socket을 상태로 설정
      setSocket(sockets[workspace]);
    }

    // Cleanup function: disconnect socket explicitly if workspace changes
    return () => {
      if (workspace) {
        console.info("Cleaning up socket for workspace:", workspace);
        disconnect();
      }
    };
  }, [workspace, disconnect]);

  return [socket, disconnect];
};

export default useSocket;
