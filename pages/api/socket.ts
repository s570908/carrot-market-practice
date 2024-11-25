import { Server } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as HTTPServer } from "http";
import { NextApiResponseServerIo } from "../../types/types";
import onlineMap from "@libs/server/onlineMap";

export const config = {
  api: {
    bodyParser: false, // WebSocket 요청에서 bodyParser 사용 안 함
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.io server...");
    const httpServer: HTTPServer = res.socket.server as any;
    const io = new Server(httpServer, {
      path: "/api/socket", // 클라이언트와 동일한 path 사용해야함
      transports: ["websocket", "polling"], // 클라이언트와 동일한 transport 사용해야함
    });

    // /ws-${workspace} 네임스페이스
    const WSmarketnamespace = io.of(/^\/ws-.+/);
    WSmarketnamespace.on("connection", (socket) => {
      console.log(
        `Client connected to workspace namespace: ${socket.nsp.name}. socket.id: ${socket.id}`
      );
      socket.on("message", (data) => {
        console.log("Message from client:", data);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log("Socket.io server already initialized.");
  }

  res.end();
}
