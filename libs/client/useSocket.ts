import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const backUrl =
  process.env.NODE_ENV === "production" ? "https://sleact.nodebird.com" : "http://localhost:3000";

const sockets: { [key: string]: Socket } = {};

const useSocket = (workspace: string = "market"): [Socket | undefined, () => void] => {
  const [socket, setSocket] = useState<Socket | undefined>(undefined);
  const isMounted = useRef(false);

  const disconnect = useCallback(() => {
    if (workspace && sockets[workspace]) {
      console.info("disconnecting socket: ", workspace);
      sockets[workspace].disconnect();
      delete sockets[workspace];
      setSocket(undefined);
    }
  }, [workspace]);

  const initializeSocketServer = async () => {
    try {
      //console.info("Initializing Socket.IO server...");
      await fetch(`${backUrl}/api/socket`); // Ensure the server initializes
    } catch (error) {
      console.error("Failed to initialize Socket.IO server:", error);
    }
  };

  const connectSocket = useCallback(() => {
    if (!sockets[workspace]) {
      // /ws-${workspace} namespace에 연결
      const WSnamespace = io(`${backUrl}/ws-${workspace}`, {
        path: "/api/socket",
        transports: ["websocket", "polling"],
      });

      // /workspace namespace 이벤트 처리
      WSnamespace.on("connect", () => {
        console.log(`Connected to /ws-${workspace} namespace. socket.id: `, WSnamespace.id);
      });

      // Handle socket connection errors
      WSnamespace.on("connect_error", (err) => {
        console.error("WebSocket connection error:", err.message);
      });

      // Handle disconnection
      WSnamespace.on("disconnect", (reason) => {
        console.info(`Socket disconnected (${reason}).`);
      });

      // 소켓 인스턴스를 저장
      sockets[workspace] = WSnamespace;
    }

    // 컴포넌트가 마운트된 경우에만 상태 업데이트, 컴포넌트가 마운트되기도 전에 상태를 업데이트하면 warning 나온다.
    if (isMounted.current) {
      setSocket(sockets[workspace]);
    }
  }, [workspace]);

  useEffect(() => {
    // 컴포넌트 마운트가 되었음을 flag으로 표시한다.
    isMounted.current = true;

    // 마운트 시 소켓 연결을 초기화
    if (!sockets[workspace]) {
      initializeSocketServer().then(connectSocket);
    } else {
      setSocket(sockets[workspace]); // 이미 연결된 소켓이 있을 경우
    }
    // 컴포넌트 언마운트 시 소켓 연결을 끊지 않음
    return () => {
      isMounted.current = false; // 언마운트 시 상태를 업데이트하지 않도록 설정
    };
  }, [connectSocket, disconnect, workspace]);

  return [socket, disconnect];
};

export default useSocket;
