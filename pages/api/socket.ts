import { Server } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as HTTPServer } from "http";
import { NextApiResponseServerIo } from "../../types/types";
import onlineMap from "@libs/server/onlineMap";
import { instrument } from "@socket.io/admin-ui"; // Import the admin UI plugin

export const config = {
  api: {
    bodyParser: false, // WebSocket 요청에서 bodyParser 사용 안 함
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!res.socket.server.io) {
    //console.log("Initializing Socket.io server...");
    const httpServer: HTTPServer = res.socket.server as any;
    const io = new Server(httpServer, {
      path: "/api/socket", // 클라이언트와 동일한 path 사용해야함
      transports: ["websocket", "polling"], // 클라이언트와 동일한 transport 사용해야함
      cors: {
        origin: ["https://admin.socket.io", "http://localhost:3000"],
        credentials: true, // 쿠키 또는 인증 정보 사용 시 true로 설정
        methods: ["GET", "POST"],
      },
    });

    // Add Admin UI plugin
    instrument(io, {
      auth: false,
      // auth: {
      //   type: "basic",
      //   username: "admin", // Admin UI login username
      //   password: "$2a$04$WnbCwmDn6SFrC93Z/DuF8evNsjz9Q4NBRN7iS0LmoanxqDfhBGosS", // Replace with bcrypt-hashed password
      // },
      mode: "development", // Use "development" or "production" mode
    });

    // /ws-${workspace} 네임스페이스
    const WSmarketnamespace = io.of(/^\/ws-.+/);
    WSmarketnamespace.on("connection", (socket) => {
      console.log(`Client connected to workspace namespace: ${socket.nsp.name}`);
      console.log(`User connected socket.id: ${socket.id}`);

      if (!onlineMap[socket.nsp.name]) {
        onlineMap[socket.nsp.name] = {};
      }

      // 사용자 연결 이벤트 처리
      socket.on("login", (data: { id: number; channels: number[] }) => {
        console.log("login to the worksapce: ", socket.nsp.name);

        // Workspace URL과 Socket ID를 키로 사용자 ID를 기록
        onlineMap[socket.nsp.name][socket.id] = data.id;

        // Workspace URL에 속한 모든 사용자 ID 배열을 페이로드로 송부
        socket.nsp.emit("onlineList", Object.values(onlineMap[socket.nsp.name]));

        // 채널별 소켓 룸에 사용자 추가
        data.channels.forEach((channel) => {
          const roomName = `${socket.nsp.name}-${channel}`;
          console.log(`룸네임: ${roomName} 에 조인한다.`);
          socket.join(roomName);
        });
      });

      // Listen for 'requestOnlineList' event
      socket.on("requestOnlineList", () => {
        console.log(`Request for online list received from socket ID: ${socket.id}`);
        const onlineList = Object.values(onlineMap[socket.nsp.name]);
        socket.emit("onlineList", onlineList); // Respond with the online list
      });

      socket.on("joinRoom", (data) => {
        const roomName = data.room;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room ${roomName}`);
        // 조인한 룸에 테스트 메시지 전송
        // const testMessage = `Test message for room: ${roomName}`;
        // WSmarketnamespace.to(roomName).emit("message", { room: roomName, message: testMessage });
      });

      // 테스트 이벤트
      socket.on("test", (data: string) => {
        console.log("test", data);
      });

      // 클라이언트가 Room 리스트 요청
      socket.on("requestRoomList", () => {
        const rooms = Array.from(socket.rooms); // 소켓이 속한 Room 리스트
        socket.emit("roomList", rooms); // Room 리스트를 클라이언트로 전송
      });

      // 사용자 연결 해제 이벤트
      socket.on("disconnect", (reason) => {
        console.log(`client disconnted from namespace: ${socket.nsp.name}`);
        console.log(`disconnected socket.id: ${socket.id}, reason: ${reason}`);
        delete onlineMap[socket.nsp.name][socket.id];
        socket.nsp.emit("onlineList", Object.values(onlineMap[socket.nsp.name]));
      });

      // 초기 연결 시 클라이언트에 이벤트 전송
      socket.emit("hello", socket.nsp.name);
    });

    res.socket.server.io = io;
  } else {
    //console.log("Socket.io server already initialized.");
  }

  res.end();
}
