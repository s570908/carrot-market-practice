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

  const initializeSocketServer = async () => {
    try {
      console.info("Initializing Socket.IO server...");
      await fetch(`${backUrl}/api/socket`); // Ensure the server initializes
    } catch (error) {
      console.error("Failed to initialize Socket.IO server:", error);
    }
  };

  const connectSocket = () => {
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

    // socket을 상태로 설정
    setSocket(sockets[workspace]);
  };

  if (typeof window !== "undefined") {
    initializeSocketServer().then(connectSocket);
  }

  return [socket, disconnect];
};

export default useSocket;

// import { useCallback, useEffect, useState } from "react";
// import { io, Socket } from "socket.io-client";

// const backUrl =
//   process.env.NODE_ENV === "production" ? "https://sleact.nodebird.com" : "http://localhost:3000";

// const sockets: { [key: string]: Socket } = {};

// const useSocket = (workspace: string = "market"): [Socket | undefined, () => void] => {
//   const [socket, setSocket] = useState<Socket | undefined>(undefined);

//   const disconnect = useCallback(() => {
//     if (workspace && sockets[workspace]) {
//       console.info("disconnecting socket: ", workspace);
//       sockets[workspace].disconnect();
//       delete sockets[workspace];
//       setSocket(undefined);
//     }
//   }, [workspace]);

//   useEffect(() => {
//     const initializeSocketServer = async () => {
//       try {
//         console.info("Initializing Socket.IO server...");
//         await fetch(`${backUrl}/api/socket`); // Ensure the server initializes
//       } catch (error) {
//         console.error("Failed to initialize Socket.IO server:", error);
//       }
//     };

//     const connectSocket = () => {
//       if (!sockets[workspace]) {
//         // /ws-${workspace} namespace에 연결
//         const WSnamespace = io(`${backUrl}/ws-${workspace}`, {
//           path: "/api/socket",
//           transports: ["websocket", "polling"],
//         });

//         // /workspace namespace 이벤트 처리
//         WSnamespace.on("connect", () => {
//           console.log(`Connected to /ws-${workspace} namespace. socket.id: `, WSnamespace.id);
//         });

//         // Handle socket connection errors
//         WSnamespace.on("connect_error", (err) => {
//           console.error("WebSocket connection error:", err.message);
//         });

//         // Handle disconnection
//         WSnamespace.on("disconnect", (reason) => {
//           console.info(`Socket disconnected (${reason}).`);
//         });

//         // 소켓 인스턴스를 저장
//         sockets[workspace] = WSnamespace;
//       }

//       // socket을 상태로 설정
//       setSocket(sockets[workspace]);
//     };

//     initializeSocketServer().then(connectSocket);

//     // // Cleanup function: disconnect socket explicitly if workspace changes
//     // return () => {
//     //   if (workspace) {
//     //     console.info("Cleaning up socket for workspace:", workspace);
//     //     disconnect();
//     //   }
//     // };
//     return () => {};
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   return [socket, disconnect];
// };

// export default useSocket;
