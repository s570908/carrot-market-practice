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

function initializeSocketServer(res: NextApiResponseServerIo) {
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

    // Listen for 'requestOnlineList' event
    socket.on("requestOnlineList", () => {
      console.log(
        `Request for online list received from socket ID: ${socket.id}`
      );
      const onlineList = Object.values(onlineMap[namespaceName]);
      socket.emit("onlineList", onlineList); // Respond with the online list
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

    socket.on("changeState", (data) => {
      console.log("changeState -- data: ", data);
      // 동일한 namespace에 있는 모든 socket 클라이언트에게 상태 변경 이벤트 전송
      marketNamespace.emit("changeState", data);
    });

    // 약속방(appointment room) 조인 이벤트 리스너 및 핸들러
    socket.on(
      "joinAppointmentRoom",
      (data: { appointmentId: number; userId: number; userName: string }) => {
        const roomName = `appointment-${data.appointmentId}`;
        socket.join(roomName);
        console.log(`Socket:${socket.id} joined appointment room:${roomName}`);

        // 방에 새로 조인한 유저를 같은 방의 다른 참가자에게 알림
        socket.to(roomName).emit("userJoinedAppointment", {
          appointmentId: data.appointmentId,
          userId: data.userId,
          userName: data.userName,
          timestamp: new Date().toISOString(),
        });
      }
    );

    // 약속방(appointment room) 나가기 이벤트 리스너 및 핸들러
    socket.on("leaveAppointmentRoom", (data: { appointmentId: number }) => {
      const roomName = `appointment-${data.appointmentId}`;
      socket.leave(roomName);
      console.log(`Socket:${socket.id} left appointment room:${roomName}`);
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

    socket.on("meetup:created", (data: string) => {
      console.log("meetup:created", data);
    });

    // 사용자 연결 해제 이벤트
    socket.on("disconnect", (reason) => {
      console.log(`client disconnted from namespace: ${namespaceName}`);
      console.log(`disconnected socket.id: ${socket.id}, reason: ${reason}`);
      delete onlineMap[namespaceName][socket.id];
      marketNamespace.emit(
        "onlineList",
        Object.values(onlineMap[namespaceName])
      );
    });

    // 초기 연결 시 클라이언트에 이벤트 전송
    socket.emit("hello", namespaceName);
  });

  res.socket.server.io = io;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIo
) {
  if (!res.socket.server.io) {
    initializeSocketServer(res);
  }

  res.end();
}
