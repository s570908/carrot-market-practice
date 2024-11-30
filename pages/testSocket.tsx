import { useEffect } from "react";
import { io } from "socket.io-client";

export default function TestSocket() {
  useEffect(() => {
    // Connect to the Socket.IO server
    const socket = io("http://localhost:3000/ws-market", {
      path: "/api/socket", // Ensure the path matches the server configuration
      transports: ["websocket", "polling"],
    });

    console.log("socket: ", socket);

    // Listen for 'message' events
    socket.on("message", (data) => {
      console.log("Received message event:", data);
    });

    const roomName = "/ws-market-100";
    socket.emit("joinRoom", { room: roomName });

    // Clean up on unmount
    return () => {
      socket.off("message");
    };
  }, []);

  return <div>Home Page - Check the console for messages</div>;
}
