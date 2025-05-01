# 약속 시스템 소켓 이벤트 통합 구현 가이드

이 문서는 약속 상태 변경 및 실시간 알림 기능의 구현에 대한 종합 가이드입니다.

## 목차

1. [소켓 서버 구현](#1-소켓-서버-구현)
2. [클라이언트 소켓 훅 구현](#2-클라이언트-소켓-훅-구현)
3. [이벤트 흐름 다이어그램](#3-이벤트-흐름-다이어그램)
4. [API 통합 방법](#4-api-통합-방법)

## 1. 소켓 서버 구현

```typescript
import { Server } from "socket.io";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as HTTPServer } from "http";
import { NextApiResponseServerIo } from "../../types/types";
import onlineMap from "@libs/server/onlineMap";
import { instrument } from "@socket.io/admin-ui";
import { AppointmentStatus, ParticipantStatus } from "@prisma/client";

export const config = {
  api: {
    bodyParser: false, // WebSocket 요청에서 bodyParser 사용 안 함
  },
};

// 활성 약속 참여자 추적용 객체
const appointmentParticipants = {};

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
        console.log("login socket event--data: ", data);

        // Workspace URL과 Socket ID를 키로 사용자 ID를 기록
        onlineMap[socket.nsp.name][socket.id] = data.id;

        // Workspace URL에 속한 모든 socket에 사용자 ID 배열을 페이로드로 송부
        socket.nsp.emit("onlineList", Object.values(onlineMap[socket.nsp.name]));

        // 로그인 user의 socket을 각각의 채널(chat room)에 등록한다.
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
        console.log(`joinRoom -- Socket:${socket.id} joined room:${roomName}`);
      });

      socket.on("changeState", (data) => {
        console.log("changeState -- data: ", data);
        // 동일한 namespace에 있는 모든 socket 클라이언트에게 상태 변경 이벤트 전송
        socket.nsp.emit("changeState", data);
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

      // 약속 관련 이벤트 핸들러 추가

      // 약속 룸 참여
      socket.on("joinAppointment", (data: { appointmentId: number; userId: number }) => {
        const { appointmentId, userId } = data;
        const roomName = `appointment-${appointmentId}`;
        socket.join(roomName);

        // 참여자 추적
        if (!appointmentParticipants[appointmentId]) {
          appointmentParticipants[appointmentId] = new Set();
        }
        appointmentParticipants[appointmentId].add(userId);

        console.log(`User ${userId} joined appointment room: ${roomName}`);

        // 룸에 참여 알림
        socket.to(roomName).emit("appointmentRoomJoined", {
          appointmentId,
          userId,
          count: appointmentParticipants[appointmentId].size,
        });
      });

      // 약속 상태 변경 알림
      socket.on(
        "appointmentStatusChanged",
        (data: {
          appointmentId: number;
          status: AppointmentStatus;
          updatedBy: number;
          timestamp: string;
        }) => {
          const roomName = `appointment-${data.appointmentId}`;
          socket.to(roomName).emit("appointmentStatusUpdated", data);
          console.log(`Appointment ${data.appointmentId} status changed to ${data.status}`);
        }
      );

      // 참가자 응답 변경 알림
      socket.on(
        "participantResponseChanged",
        (data: {
          appointmentId: number;
          participantId: number;
          userId: number;
          userName: string;
          status: ParticipantStatus;
        }) => {
          const roomName = `appointment-${data.appointmentId}`;
          socket.to(roomName).emit("participantResponseUpdated", data);
          console.log(`Participant ${data.participantId} responded with ${data.status}`);
        }
      );

      // 알림 전송
      socket.on(
        "sendAppointmentNotification",
        (data: { recipients: number[]; message: string; type: string; appointmentId: number }) => {
          const { recipients, message, type, appointmentId } = data;

          // 각 수신자별로 알림 전송
          recipients.forEach((recipientId) => {
            const userRoom = `user-${recipientId}`;
            socket.to(userRoom).emit("notification", {
              message,
              type,
              appointmentId,
              timestamp: new Date().toISOString(),
            });
          });

          console.log(`Appointment notification sent to ${recipients.length} recipients`);
        }
      );

      // 위치 공유
      socket.on(
        "shareLocation",
        (data: {
          appointmentId: number;
          userId: number;
          userName: string;
          latitude: number;
          longitude: number;
        }) => {
          const roomName = `appointment-${data.appointmentId}`;
          socket.to(roomName).emit("locationShared", {
            ...data,
            timestamp: new Date().toISOString(),
          });
        }
      );

      // 사용자 연결 해제 이벤트
      socket.on("disconnect", (reason) => {
        console.log(`client disconnted from namespace: ${socket.nsp.name}`);
        console.log(`disconnected socket.id: ${socket.id}, reason: ${reason}`);

        // 기존 코드
        delete onlineMap[socket.nsp.name][socket.id];
        socket.nsp.emit("onlineList", Object.values(onlineMap[socket.nsp.name]));

        // 약속 참여 정보 정리 (userId를 알 수 있는 경우에만 처리 가능)
        const userId = onlineMap[socket.nsp.name][socket.id];
        if (userId) {
          // 모든 약속 룸에서 확인
          Object.keys(appointmentParticipants).forEach((appointmentId) => {
            if (appointmentParticipants[appointmentId].has(userId)) {
              appointmentParticipants[appointmentId].delete(userId);
              const roomName = `appointment-${appointmentId}`;
              socket.to(roomName).emit("appointmentRoomLeft", {
                appointmentId,
                userId,
                count: appointmentParticipants[appointmentId].size,
              });
            }
          });
        }
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
```

## 2. 클라이언트 소켓 훅 구현

```typescript


Made changes.

import { useEffect, useState, useCallback } from "react";
import useSocket from "@libs/client/useSocket";
import { AppointmentStatus, ParticipantStatus } from "@prisma/client";

interface UseAppointmentSocketProps {
  workspace: string;
  appointmentId?: number;
  userId?: number;
  enabled?: boolean;
}

interface AppointmentStatusChangeData {
  appointmentId: number;
  status: AppointmentStatus;
  updatedBy: number;
  timestamp: string;
}

interface ParticipantResponseData {
  appointmentId: number;
  participantId: number;
  userId: number;
  userName: string;
  status: ParticipantStatus;
}

interface NotificationData {
  message: string;
  type: string;
  appointmentId?: number;
  timestamp: string;
}

interface LocationData {
  appointmentId: number;
  userId: number;
  userName: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}

// 약속 관련 소켓 이벤트를 처리하는 커스텀 훅
export default function useAppointmentSocket({
  workspace,
  appointmentId,
  userId,
  enabled = true,
}: UseAppointmentSocketProps) {
  // 기존 소켓 연결 사용
  const [socket, connected] = useSocket(workspace);

  // 상태 관리
  const [lastStatusChange, setLastStatusChange] = useState<AppointmentStatusChangeData | null>(null);
  const [lastParticipantResponse, setLastParticipantResponse] = useState<ParticipantResponseData | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [locationUpdates, setLocationUpdates] = useState<LocationData[]>([]);
  const [roomParticipants, setRoomParticipants] = useState<number>(0);

  // 약속 룸 참여
  useEffect(() => {
    if (!socket || !appointmentId || !userId || !enabled) return;

    // 약속 룸 참여
    socket.emit("joinAppointment", { appointmentId, userId });

    // 사용자 개인 룸 참여 (알림용)
    socket.emit("joinRoom", { room: `user-${userId}` });

    // 컴포넌트 언마운트 시 정리
    return () => {
      // 소켓은 useSocket 훅에서 자동 관리됨
    };
  }, [socket, appointmentId, userId, enabled]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!socket || !enabled) return;

    // 약속 상태 변경 이벤트
    socket.on("appointmentStatusUpdated", (data: AppointmentStatusChangeData) => {
      if (data.appointmentId === appointmentId) {
        console.log("Appointment status updated:", data);
        setLastStatusChange(data);
      }
    });

    // 참가자 응답 이벤트
    socket.on("participantResponseUpdated", (data: ParticipantResponseData) => {
      if (data.appointmentId === appointmentId) {
        console.log("Participant response updated:", data);
        setLastParticipantResponse(data);
      }
    });

    // 알림 이벤트
    socket.on("notification", (data: NotificationData) => {
      console.log("Notification received:", data);
      setNotifications(prev => [...prev, data]);
    });

    // 위치 공유 이벤트
    socket.on("locationShared", (data: LocationData) => {
      if (data.appointmentId === appointmentId) {
        console.log("Location shared:", data);
        setLocationUpdates(prev => [...prev, data]);
      }
    });

    // 룸 참여자 수 업데이트
    socket.on("appointmentRoomJoined", (data: { appointmentId: number, count: number }) => {
      if (data.appointmentId === appointmentId) {
        setRoomParticipants(data.count);
      }
    });

    socket.on("appointmentRoomLeft", (data: { appointmentId: number, count: number }) => {
      if (data.appointmentId === appointmentId) {
        setRoomParticipants(data.count);
      }
    });

    // 이벤트 리스너 정리
    return () => {
      socket.off("appointmentStatusUpdated");
      socket.off("participantResponseUpdated");
      socket.off("notification");
      socket.off("locationShared");
      socket.off("appointmentRoomJoined");
      socket.off("appointmentRoomLeft");
    };
  }, [socket, appointmentId, enabled]);

  // 이벤트 발신 메서드들
  const emitAppointmentStatusChange = useCallback((status: AppointmentStatus, updatedBy: number) => {
    if (!socket || !appointmentId) return;

    socket.emit("appointmentStatusChanged", {
      appointmentId,
      status,
      updatedBy,
      timestamp: new Date().toISOString()
    });
  }, [socket, appointmentId]);

  const emitParticipantResponse = useCallback((
    participantId: number,
    userId: number,
    userName: string,
    status: ParticipantStatus
  ) => {
    if (!socket || !appointmentId) return;

    socket.emit("participantResponseChanged", {
      appointmentId,
      participantId,
      userId,
      userName,
      status
    });
  }, [socket, appointmentId]);

  const sendNotification = useCallback((recipients: number[], message: string, type: string = "info") => {
    if (!socket || !appointmentId) return;

    socket.emit("sendAppointmentNotification", {
      recipients,
      message,
      type,
      appointmentId
    });
  }, [socket, appointmentId]);

  const shareLocation = useCallback((latitude: number, longitude: number) => {
    if (!socket || !appointmentId || !userId) return;

    socket.emit("shareLocation", {
      appointmentId,
      userId,
      userName: "사용자", // 이름 정보가 필요하면 상위 컴포넌트에서 전달받아야 함
      latitude,
      longitude
    });
  }, [socket, appointmentId, userId]);

  return {
    connected,
    lastStatusChange,
    lastParticipantResponse,
    notifications,
    locationUpdates,
    roomParticipants,
    clearNotifications: () => setNotifications([]),
    clearLocationUpdates: () => setLocationUpdates([]),
    emitAppointmentStatusChange,
    emitParticipantResponse,
    sendNotification,
    shareLocation
  };
}
```

## 3. 이벤트 흐름 다이어그램

### 1) 약속 방 참여 흐름 (Room Joining Flow)

```
주최자/참가자 클라이언트  -------joinAppointment------>  소켓 서버
                                                          |
                                                          | (내부 처리: 방에 사용자 추가)
                                                          v
주최자/참가자 클라이언트  <---appointmentRoomJoined----  소켓 서버
```

#### 이벤트 페이로드

**클라이언트 → 서버 (`joinAppointment`)**

```javascript
{
  appointmentId: number,  // 참여할 약속 ID
  userId: number          // 참여 사용자 ID
}
```

**서버 → 클라이언트 (`appointmentRoomJoined`)**

```javascript
{
  appointmentId: number,  // 약속 ID
  userId: number,        // 참여한 사용자 ID
  count: number          // 현재 방에 있는 사용자 수
}
```

#### 서버 처리 로직

- 소켓 서버는 `appointmentParticipants` 객체에 사용자 참여 정보를 기록
- `socket.join()` 메서드를 사용하여 사용자를 Socket.IO 룸(`appointment-{appointmentId}`)에 추가
- 룸에 있는 다른 참가자들에게 새 사용자 참여 알림

#### API 연계 요소

- 약속 상세 페이지 접속 시, 클라이언트는 `/api/appointments/{id}` API 호출 이후 소켓 연결 설정
- 서버는 약속 참여 권한 확인 로직(DB 쿼리를 통해 실제 참가자인지 확인) 필요

### 2) 약속 상태 변경 흐름 (Status Change Flow)

```
주최자 클라이언트  -------(1) PUT /api/appointments/{id}/status------>  API 서버
                                                                          |
                                                                          | (DB 업데이트)
                                                                          v
주최자 클라이언트  <-----------(2) HTTP 응답----------------------  API 서버
        |
        | (3) appointmentStatusChanged
        v
     소켓 서버  ---------(4) appointmentStatusUpdated----------->  참가자 클라이언트
```

#### 이벤트 페이로드

**클라이언트 → 서버 (`appointmentStatusChanged`)**

```javascript
{
  appointmentId: number,           // 약속 ID
  status: AppointmentStatus,      // 새 상태(PENDING/CONFIRMED/CANCELLED/COMPLETED)
  updatedBy: number,              // 상태 변경한 사용자 ID
  timestamp: string               // ISO 형식 타임스탬프
}
```

**서버 → 클라이언트 (`appointmentStatusUpdated`)**

```javascript
{
  // 동일한 데이터 구조 전달됨
}
```

#### 서버 처리 로직

- API 서버는 데이터베이스에서 약속 상태를 업데이트 (`appointment` 테이블의 `status` 필드)
- 소켓 서버는 `socket.to(roomName).emit()` 메서드로 해당 룸의 다른 사용자들에게 이벤트 전파
- API 응답에 성공 후 클라이언트는 React Query invalidation과 함께 소켓 이벤트도 발송

#### API 연계 요소

- `PUT /api/appointments/{id}/status` API가 상태 DB 업데이트 담당
- API 호출 시 권한 검증 필요: 주최자만 약속 전체 상태 변경 가능
- 소켓 이벤트는 DB 업데이트 성공 후 클라이언트에서 추가로 발송됨

### 3) 참가자 응답 변경 흐름 (Participant Response Flow)

```
참가자 클라이언트  -------(1) PUT /api/appointments/{id}/status------>  API 서버
                                                                          |
                                                                          | (DB 업데이트: 참가자 상태)
                                                                          v
참가자 클라이언트  <-----------(2) HTTP 응답----------------------  API 서버
        |
        | (3) participantResponseChanged
        v
     소켓 서버  ---------(4) participantResponseUpdated---------->  주최자 클라이언트
                                                                     (및 다른 참가자)
```

#### 이벤트 페이로드

**클라이언트 → 서버 (`participantResponseChanged`)**

```javascript
{
  appointmentId: number,           // 약속 ID
  participantId: number,           // 참가자 레코드 ID
  userId: number,                  // 참가자 사용자 ID
  userName: string,                // 참가자 이름
  status: ParticipantStatus        // CONFIRMED, DECLINED, PENDING
}
```

**서버 → 클라이언트 (`participantResponseUpdated`)**

```javascript
{
  // 동일한 데이터 구조 전달됨
}
```

#### 서버 처리 로직

- API 서버는 `appointmentParticipant` 테이블에서 참가자의 상태 필드 업데이트
- 참가자 상태 변경은 주최자에게 특히 중요한 알림이므로 주최자 클라이언트에서 특별 처리 가능
- 소켓 서버는 룸의 모든 사람에게 응답 상태 변경을 브로드캐스트

#### API 연계 요소

- 주최자와 참가자가 동일한 API 엔드포인트를 사용하지만 내부적으로 다른 처리 로직 적용
- 주최자는 약속 전체 상태를, 참가자는 자신의 참여 상태만 변경 가능
- API 서버는 사용자 역할(주최자/참가자)을 확인하여 적절한 테이블 업데이트

### 4) 알림 전송 흐름 (Notification Flow)

```
주최자 클라이언트  -----sendAppointmentNotification----->  소켓 서버
                                                            |
                                                            | (특정 사용자 룸으로 메시지 전달)
                                                            v
참가자 클라이언트  <-----------notification-------------  소켓 서버
```

#### 이벤트 페이로드

**클라이언트 → 서버 (`sendAppointmentNotification`)**

```javascript
{
  recipients: number[],           // 알림 받을 사용자 ID 배열
  message: string,                // 알림 메시지 내용
  type: string,                   // 알림 유형(reminder, update 등)
  appointmentId: number           // 관련 약속 ID
}
```

**서버 → 클라이언트 (`notification`)**

```javascript
{
  message: string,                // 알림 메시지
  type: string,                   // 알림 유형
  appointmentId: number,          // 관련 약속 ID
  timestamp: string               // 서버 생성 타임스탬프
}
```

#### 서버 처리 로직

- 소켓 서버는 `recipients` 배열의 각 사용자 ID마다 개인 룸(`user-{userId}`)으로 알림 전송
- 개인 룸 메커니즘을 활용하여 온라인 상태인 특정 사용자에게만 타겟팅된 알림 전달
- 각 수신자는 자신의 사용자 ID에 해당하는 룸에 미리 join해야 함 (최초 연결 시 설정)

#### API 연계 요소

- DB에 알림 기록 저장을 위한 별도 API가 필요할 수 있음 (`POST /api/notifications`)
- 오프라인 사용자를 위해 푸시 알림 시스템과의 연동 고려 필요
- 주기적으로 실행되는 서버 크론잡이 예정된 알림(`AppointmentNotification` 테이블)을 처리

### 5) 위치 공유 흐름 (Location Sharing Flow)

```
참가자/주최자 클라이언트  --------shareLocation---------->  소켓 서버
                                                              |
                                                              | (약속 방 전체에 공유)
                                                              v
참가자/주최자 클라이언트  <-------locationShared---------  소켓 서버
```

#### 이벤트 페이로드

**클라이언트 → 서버 (`shareLocation`)**

```javascript
{
  appointmentId: number,         // 약속 ID
  userId: number,                // 위치 공유 사용자 ID
  userName: string,              // 사용자 이름
  latitude: number,              // 위도
  longitude: number              // 경도
}
```

**서버 → 클라이언트 (`locationShared`)**

```javascript
{
  appointmentId: number,         // 약속 ID
  userId: number,                // 위치 공유 사용자 ID
  userName: string,              // 사용자 이름
  latitude: number,              // 위도
  longitude: number,             // 경도
  timestamp: string              // 서버 생성 타임스탬프
}
```

#### 서버 처리 로직

- 위치 정보를 받은 소켓 서버는 해당 약속 룸의 모든 멤버에게 위치 데이터 브로드캐스트
- 서버는 위치 공유 요청 시 타임스탬프를 추가하여 클라이언트가 데이터 신선도 파악 가능
- 실시간 정보이므로 DB에 저장하지 않고 메모리에서만 처리하는 것이 일반적

#### API 연계 요소

- 위치 기록이 필요한 경우 별도 API 구현 필요 (`POST /api/appointments/{id}/locations`)
- 위치 권한 및 개인정보 관련 정책 설정 필요 (API와 소켓 모두에 적용)
- 약속 당일/특정 시간대에만 위치 공유 활성화할 지 여부 결정 필요

### 6) 약속 방 퇴장 흐름 (Room Leaving Flow)

```
클라이언트  ---------disconnect/페이지 이탈--------->  소켓 서버
                                                        |
                                                        | (사용자 ID로 참여 중인 룸 확인)
                                                        | (해당 룸에서 사용자 제거)
                                                        v
약속방 참여자들  <-------appointmentRoomLeft--------  소켓 서버
```

#### 이벤트 페이로드

**서버 → 클라이언트 (`appointmentRoomLeft`)**

```javascript
{
  appointmentId: number,        // 약속 ID
  userId: number,               // 나간 사용자 ID
  count: number                 // 방에 남은 사용자 수
}
```

#### 서버 처리 로직

- 소켓 연결 해제 시 사용자가 참여 중이던 모든 약속 방에서 사용자 정보 제거
- `appointmentParticipants` 객체에서 해당 사용자를 제거하고 현재 인원 수 업데이트
- 방에 남은 다른 사용자들에게 퇴장 이벤트와 업데이트된 참여자 수 알림

#### API 연계 요소

- 명시적인 API가 없으며 소켓 연결 해제로 자동 처리됨
- 페이지 이동/브라우저 닫기/네트워크 오류 등 다양한 연결 해제 시나리오 대응
- 클라이언트에서 페이지를 꾸준히 유지하고 있는지 확인하는 별도의 핑-퐁 메커니즘 구현 고려 가능

## 4. API 통합 방법

### 약속 상태 변경 API 수정

```typescript


Made changes.

import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { ParticipantStatus } from "@prisma/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { status } = req.body;
  const { id } = req.query;
  const appointmentId = parseInt(id as string);

  // 사용자 인증
  const {
    session: { user },
  } = req;
  if (!user) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  console.log("id, user, status", appointmentId, user.id, status);

  try {
    // 약속 정보 조회
    const appointment = await client.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        organizerId: true,
        status: true,
        title: true,
        organizer: {
          select: {
            name: true,
          }
        }
      },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    // 주최자인 경우: 약속 자체의 상태 변경
    if (appointment.organizerId === user.id) {
      await client.appointment.update({
        where: { id: appointmentId },
        data: { status },
      });

      // 참가자 목록 조회하여 알림 데이터에 포함
      const participants = await client.appointmentParticipant.findMany({
        where: { appointmentId },
        select: {
          userId: true,
          user: {
            select: { name: true }
          }
        }
      });

      // 소켓 이벤트용 응답 데이터 구성
      const socketEventData = {
        ok: true,
        message: "Appointment status updated",
        isOrganizer: true,
        updatedBy: user.id,
        organizerName: appointment.organizer.name,
        appointmentId,
        appointmentTitle: appointment.title,
        newStatus: status,
        participants: participants.map(p => ({
          userId: p.userId,
          name: p.user.name
        })),
        timestamp: new Date().toISOString()
      };

      return res.json(socketEventData);
    }
    // 참가자인 경우: 참가자 응답 상태 변경
    else {
      // 현재 사용자가 실제 참가자인지 확인
      const participant = await client.appointmentParticipant.findFirst({
        where: {
          appointmentId,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (!participant) {
        return res.status(403).json({ ok: false, error: "Not a participant" });
      }

      // 참가자의 응답 상태 업데이트
      const updatedParticipant = await client.appointmentParticipant.update({
        where: { id: participant.id },
        data: { status: status as ParticipantStatus, responseTime: new Date() },
      });

      // 소켓 이벤트용 응답 데이터
      const socketEventData = {
        ok: true,
        message: "Participant response updated",
        isOrganizer: false,
        participantId: participant.id,
        userId: user.id,
        userName: participant.user.name,
        appointmentId,
        appointmentTitle: appointment.title,
        organizerId: appointment.organizerId,
        newStatus: status,
        timestamp: new Date().toISOString()
      };

      return res.json(socketEventData);
    }
  } catch (error) {
    console.error("상태 업데이트 오류:", error);
    return res.status(500).json({ ok: false, error: "Failed to update status" });
  }
}

export default withApiSession(withHandler({ methods: ["PUT"], handler, isPrivate: true }));
```

### 약속 상세 페이지에 소켓 통합

```tsx


Made changes.

// ...existing code...

export default function AppointmentDetail() {
  // ...existing code...
  const { user } = useUser();
  const [status, setStatus] = useState("");
  const queryClient = useQueryClient();

  // 소켓 연결 설정
  const {
    connected: socketConnected,
    lastStatusChange,
    lastParticipantResponse,
    notifications,
    roomParticipants,
    emitAppointmentStatusChange,
    emitParticipantResponse,
    sendNotification,
    clearNotifications
  } = useAppointmentSocket({
    workspace: "market",
    appointmentId: id,
    userId: user?.id,
    enabled: !!id && !!user?.id
  });

  // API 뮤테이션
  const { mutate: updateStatus, isPending: updateLoading } = useMutation({
    mutationFn: (newStatus: string) => updateAppointmentStatus(id!, newStatus),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });

      // 상태가 변경되면 소켓 이벤트 발송
      if (isOrganizer && appointmentStatus !== data.status) {
        emitAppointmentStatusChange(data.status as AppointmentStatus, user?.id!);
      }

      toast.success("상태가 성공적으로 변경되었습니다.");
    },
    // ...existing code...
  });

  // 참가자 응답 처리
  const handleParticipantResponse = (newStatus: string) => {
    updateStatus(newStatus);

    // 참가자 응답이 변경되면 소켓 이벤트 발송
    if (!isOrganizer && appointment) {
      const currentParticipant = appointment.participants.find(
        (p: any) => p.user.id === user?.id
      );

      if (currentParticipant) {
        emitParticipantResponse(
          currentParticipant.id,
          user?.id!,
          user?.name || "참가자",
          newStatus as ParticipantStatus
        );
      }
    }
  };

  // 알림 보내기 기능
  const handleSendReminder = () => {
    if (appointment && isOrganizer) {
      const recipients = appointment.participants.map((p: any) => p.user.id);
      sendNotification(
        recipients,
        `"${appointment.title}" 약속에 대한 응답을 기다리고 있습니다.`,
        "reminder"
      );
      toast.success("참가자들에게 알림이 전송되었습니다.");
    }
  };

  // 소켓 이벤트 처리
  useEffect(() => {
    // 약속 상태 변화 알림
    if (lastStatusChange && lastStatusChange.appointmentId === id) {
      // 자신이 변경한 경우가 아니라면 알림
      if (lastStatusChange.updatedBy !== user?.id) {
        toast.info(`약속 상태가 ${statusText[lastStatusChange.status]}으로 변경되었습니다.`);
        queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      }
    }

    // 참가자 응답 알림 (주최자에게만)
    if (lastParticipantResponse && lastParticipantResponse.appointmentId === id && isOrganizer) {
      toast.info(
        `${lastParticipantResponse.userName}님이 약속에 ${
          lastParticipantResponse.status === "CONFIRMED" ? "수락했습니다" :
          lastParticipantResponse.status === "DECLINED" ? "거절했습니다" :
          "응답했습니다"
        }`
      );
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
    }
  }, [lastStatusChange, lastParticipantResponse, id, user?.id, isOrganizer, queryClient]);

  // 알림 처리
  useEffect(() => {
    if (notifications.length > 0) {
      // 가장 최근 알림만 표시
      const latestNotification = notifications[notifications.length - 1];
      toast.info(latestNotification.message);
      clearNotifications();
    }
  }, [notifications, clearNotifications]);

  // ...existing code...

  return (
    <Layout
      seoTitle={`약속: ${appointment?.title || "상세 정보"}`}
      title={appointment?.title || "약속 상세"}
      canGoBack
      backUrl={backUrl}
    >
      {/* 소켓 연결 상태 표시 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`text-xs text-right pr-2 ${socketConnected ? 'text-green-500' : 'text-red-500'}`}>
          {socketConnected ? '실시간 업데이트 활성화' : '실시간 업데이트 비활성화'}
          {socketConnected && roomParticipants > 0 && ` (${roomParticipants}명 접속중)`}
        </div>
      )}

      {/* 기존 레이아웃과 컨텐츠 */}
      <div className="pb-20">
        {/* ...existing code... */}
      </div>
    </Layout>
  );
}
```

### 약속 참가자 실시간 응답 현황 컴포넌트 구현

```tsx


Made changes.

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AnimatePresence, motion } from 'framer-motion';
import { ParticipantStatus } from '@prisma/client';

interface RealTimeParticipantStatusProps {
  appointmentId: number;
  participants: Array<{
    id: number;
    userId: number;
    status: ParticipantStatus;
    user: {
      id: number;
      name: string;
      avatar?: string;
    }
  }>;
}

export default function RealTimeParticipantStatus({
  appointmentId,
  participants: initialParticipants
}: RealTimeParticipantStatusProps) {
  const [participants, setParticipants] = useState(initialParticipants);
  const [recentlyUpdated, setRecentlyUpdated] = useState<number | null>(null);

  useEffect(() => {
    // 초기 데이터 설정
    setParticipants(initialParticipants);

    // 소켓 연결
    const socket = io('/ws-market', {
      path: '/api/socket',
      transports: ['websocket']
    });

    // 약속 룸 참여
    socket.emit('joinAppointment', { appointmentId, userId: 0 });

    // 참가자 응답 업데이트 수신
    socket.on('participantResponseUpdated', (data) => {
      if (data.appointmentId === appointmentId) {
        setParticipants(prev => prev.map(participant => {
          if (participant.userId === data.userId) {
            setRecentlyUpdated(participant.id);

            // 하이라이트 효과를 3초 후 제거
            setTimeout(() => setRecentlyUpdated(null), 3000);

            return {
              ...participant,
              status: data.status
            };
          }
          return participant;
        }));
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [appointmentId, initialParticipants]);

  // 상태에 따른 통계 계산
  const stats = {
    total: participants.length,
    confirmed: participants.filter(p => p.status === 'CONFIRMED').length,
    declined: participants.filter(p => p.status === 'DECLINED').length,
    pending: participants.filter(p => p.status === 'PENDING').length,
  };

  return (
    <div className="space-y-4">
      {/* 응답 통계 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-green-50 p-2">
          <span className="text-sm font-medium text-green-800">수락</span>
          <p className="mt-1 text-xl font-bold text-green-600">{stats.confirmed}</p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-2">
          <span className="text-sm font-medium text-yellow-800">대기중</span>
          <p className="mt-1 text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="rounded-lg bg-red-50 p-2">
          <span className="text-sm font-medium text-red-800">거절</span>
          <p className="mt-1 text-xl font-bold text-red-600">{stats.declined}</p>
        </div>
      </div>

      {/* 참가자 목록 */}
      <ul className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 divide-y divide-gray-100">
        <AnimatePresence>
          {participants.map((participant) => (
            <motion.li
              key={participant.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50"
              initial={{ opacity: recentlyUpdated === participant.id ? 0 : 1 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{participant.user.name}</p>
                </div>
              </div>

              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                participant.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                participant.status === "DECLINED" ? "bg-red-100 text-red-800" :
                "bg-yellow-100 text-yellow-800"
              }`}>
                {participant.status === "CONFIRMED" ? "수락" :
                 participant.status === "DECLINED" ? "거절" : "대기중"}
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
```

## 다운로드 방법

이 문서를 다운로드하려면:

1. **전체 내용 복사**:

   - 이 페이지의 모든 내용을 선택하여 복사합니다 (Ctrl+A, Ctrl+C)

2. **텍스트 에디터에 붙여넣기**:

   - Visual Studio Code, Notepad++ 또는 다른 텍스트 에디터를 열고 붙여넣습니다 (Ctrl+V)

3. **Markdown 파일로 저장**:

   - 파일을 `appointment-socket-guide.md`와 같은 이름으로 저장합니다
   - 파일 유형을 "Markdown (.md)" 또는 "모든 파일"로 설정하고 파일 이름에 `.md` 확장자를 추가합니다

4. **온라인 도구 사용**:
   - 아래 코드를 브라우저 콘솔에 붙여넣어 다운로드할 수도 있습니다:

```javascript
function downloadMarkdown() {
  // 현재 페이지의 HTML 텍스트 가져오기
  const markdownText = document.body.innerText;

  // Blob 생성
  const blob = new Blob([markdownText], { type: "text/markdown" });

  // 다운로드 링크 생성
  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(blob);
  downloadLink.download = "appointment-socket-guide.md";

  // 링크 클릭하여 다운로드
  document.body.appendChild(downloadLink);
  downloadLink.click();

  // 링크 제거
  document.body.removeChild(downloadLink);
}

downloadMarkdown();
```

이 방법으로 다운로드한 Markdown 파일은 향후 참고 및 리뷰를 위해 보관할 수 있습니다.

Made changes.

Similar code found with 1 license type
