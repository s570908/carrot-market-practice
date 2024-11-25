import { Server as HttpServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer, Socket } from "socket.io";
import { NextApiResponseServerIo } from "../../types/types";
import onlineMap from "libs/server/onlineMap";

// Socket.IO는 HTTP 프로토콜 위에서 WebSocket 프로토콜로 업그레이드되어 동작합니다.
// 이 업그레이드 요청은 일반적인 HTTP 요청과는 달라서 body-parser와 같은 미들웨어가 필요하지 않습니다.
// 만약 body-parser가 활성화되어 있으면,
// WebSocket 업그레이드 요청이 제대로 처리되지 않아 Socket.IO 서버가 정상적으로 동작하지 않을 수 있습니다.
export const config = {
  api: {
    bodyParser: false, // WebSocket 요청에서 bodyParser 사용 안 함
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (!res.socket.server.io) {
    console.log("Initializing Socket.IO server...");

    const httpServer: HttpServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket", // WebSocket 경로
    });

    io.of(/^\/ws-.+/).on("connection", (socket: Socket) => {
      const namespace = socket.nsp;
      console.log("connected", namespace.name);

      if (!onlineMap[namespace.name]) {
        onlineMap[namespace.name] = {};
      }

      // 사용자 연결 이벤트 처리
      socket.on("login", (data: { id: number; channels: number[] }) => {
        console.log("login", namespace.name);

        // Workspace URL과 Socket ID를 키로 사용자 ID를 기록
        onlineMap[namespace.name][socket.id] = data.id;

        // Workspace URL에 속한 모든 사용자 ID 배열을 페이로드로 송부
        namespace.emit("onlineList", Object.values(onlineMap[namespace.name]));

        // 채널별 소켓 룸에 사용자 추가
        data.channels.forEach((channel) => {
          console.log("join", namespace.name, channel);
          socket.join(`${namespace.name}-${channel}`);
        });
      });

      // 테스트 이벤트
      socket.on("test", (data: string) => {
        console.log("test", data);
      });

      // 사용자 연결 해제 이벤트
      socket.on("disconnect", () => {
        console.log("disconnected", namespace.name);
        delete onlineMap[namespace.name][socket.id];
        namespace.emit("onlineList", Object.values(onlineMap[namespace.name]));
      });

      // 초기 연결 시 클라이언트에 이벤트 전송
      socket.emit("hello", namespace.name);
    });

    res.socket.server.io = io; // `io` 인스턴스를 서버에 저장
  }

  res.end();
}
