import { NextApiRequest } from "next";
import { NextApiResponseServerIo } from "../../types/types";
import { Server as ServerIO } from "socket.io";
import { Server as NetServer } from "http";
import onlineMap from "@libs/server/onlineMap";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (!res.socket.server.io) {
    console.log("New Socket.io server...");
    // adapt Next's net Server to http Server
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: "/api/socket", // 클라이언트와 동일한 path 사용해야함
      transports: ["websocket", "polling"], // 클라이언트와 동일한 transport 사용해야함
      cors: {
        origin: ["https://admin.socket.io", "http://localhost:3000"],
        credentials: true, // 쿠키 또는 인증 정보 사용 시 true로 설정
        methods: ["GET", "POST"],
      },
    });

    // /ws-${workspace} 네임스페이스
    const marketNamespace = io.of(/^\/ws-.+/);
    marketNamespace.on("connection", (socket) => {
      // namespace 이름을 명확하게 변수에 저장
      const namespaceName = socket.nsp.name;
      console.log(`Client connected to workspace namespace: ${namespaceName}`);
      console.log(`User connected socket.id: ${socket.id}`);

      if (!onlineMap[namespaceName]) {
        onlineMap[namespaceName] = {};
      }
      // 사용자 연결 이벤트 처리
      // 사용자가 login 이벤트를 보낸다. payload에는 로그인  user id, 로그인 user가 가입한 chat room id 목록이 들어 있다.
      socket.on("login", (data: { id: number; channels: number[] }) => {
        console.log("login to the worksapce: ", namespaceName);
        console.log("login socket event--data: ", data);

        // Workspace URL과 Socket ID를 키로 사용자 ID를 기록
        onlineMap[namespaceName][socket.id] = data.id;

        // Workspace URL에 속한 모든 socket에 사용자 ID 배열을 페이로드로 송부
        // socket.nsp.emit 대신 네임스페이스 객체를 통해 직접 emit
        marketNamespace.emit(
          "onlineList",
          Object.values(onlineMap[namespaceName])
        );

        // 로그인 user의 socket을 각각의 채널(chat room)에 등록한다.
        data.channels.forEach((channel) => {
          const roomName = `${namespaceName}-${channel}`;
          console.log(`룸네임: ${roomName} 에 조인한다.`);
          socket.join(roomName);
        });
      });

      socket.on("joinRoom", (data) => {
        const roomName = data.room;
        socket.join(roomName);
        console.log(`joinRoom -- Socket:${socket.id} joined room:${roomName}`);
      });

      socket.on("leaveRoom", (data) => {
        socket.leave(data.room);
        console.log(`leaveRoom -- Socket:${socket.id} left room:${data.room}`);
      });

      // 사용자 연결 해제 이벤트
      socket.on("disconnect", (reason) => {
        console.log(`client disconnted from namespace: ${namespaceName}`);
        console.log(`disconnected socket.id: ${socket.id}, reason: ${reason}`);
        delete onlineMap[namespaceName][socket.id];
        marketNamespace.emit("onlineList", Object.values(onlineMap[namespaceName]));
      });

      socket.on("changeState", (data) => {
        console.log("changeState -- data: ", data);
        // 동일한 namespace에 있는 모든 socket 클라이언트에게 상태 변경 이벤트 전송
        marketNamespace.emit("changeState", data);
      });

       // 클라이언트가 Room 리스트 요청
       socket.on("requestRoomList", () => {
        const rooms = Array.from(socket.rooms); // 소켓이 속한 Room 리스트
        socket.emit("roomList", rooms); // Room 리스트를 클라이언트로 전송
      });

      // 테스트 이벤트
      socket.on("test", (data: string) => {
        console.log("test", data);
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
  } else {
    //console.log("Socket.io server already initialized.");
  }

  res.end();
}
