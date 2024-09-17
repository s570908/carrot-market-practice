import { useEffect, useRef, useState } from "react";
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
      await fetch("http://localhost:3000/api/socket/io");
    };
    // Initialize the socket if it hasn't been created yet
    if (!socketRef.current) {
      fetchSocket();
      const socketInstance = new (ClientIO as any)(backUrl!, {
        path: "/api/socket/io",
        transports: ["websocket"],
        addTrailingSlash: false,
      });

      socketRef.current = socketInstance;

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
