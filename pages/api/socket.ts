import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "../../types/types";
import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!res.socket.server.io) {
    console.log("New Socket.io server...");
    // adapt Next's net Server to http Server
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket",
    });

    // Socket.IO connection event handler
    io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);

      // Joining a chat room based on the provided room ID
      socket.on("joinRoom", (roomId) => {
        console.log(`User ${socket.id} joining room of roomId: ${roomId}`);
        socket.join(`${roomId}`);
      });
    });

    //   socket.on("message", (message) => {
    //     console.log("message of socket io handler: ", message);
    //     // emit this message to everyone
    //     //io.to(room).emit(CHAT_MESSAGE, message);
    //   });

    //   // Leaving a chat room (if needed)
    //   socket.on("leaveRoom", (roomId) => {
    //     console.log(`User ${socket.id} leaving room: chatRoom-${roomId}`);
    //     socket.leave(`${roomId}`);
    //   });

    //   // Handle disconnection
    //   socket.on("disconnect", () => {
    //     console.log(`User disconnected: ${socket.id}`);
    //   });
    // });

    // append SocketIO server to Next.js socket server response
    res.socket.server.io = io;
  }
  res.end();
}
