# 질문 
안 읽은 멧지의 갯수를 실시간으로 보여 주기 위해서
{chatRoom.unreadCount > 0 ? (
<div className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full">
<div className="text-sm text-white">{chatRoom.unreadCount}</div>
</div>
) : null}
이 UI를 사용하였다.
const {
data: chatRoomData,
isLoading,
isError,
error,
refetch,
} = useQuery({
queryKey: ["chatRoomList", chatRoomId], // 쿼리 키
queryFn: () => getChatRoomsById(chatRoomId), // 쿼리 함수
enabled: !!chatRoomId, // id가 있을 때만 실행
//staleTime: 1000 * 60 * 5, // 데이터가 5분 동안 최신 상태로 간주
// cacheTime: 1000 * 60 * 10, // 데이터 캐시 10분 동안 유지
// onSuccess: (data) => {
// // 성공 시 실행되는 콜백
// console.log("Fetched chat room data:", data);
// },
}); 이것이 사용되었다.
이 읽지 않은 메시지의 갯수를 카운트하기 위해서 코딩된 부분들을 전부 추적하여 프리스마 모델과 알고리즘을 연관지어 추적하여 설명을 해라.
model User {
  id                        Int                      @id @default(autoincrement())
  phone                     String?                  @unique
  email                     String?                  @unique
  name                      String
  avatar                    String?
  createdAt                 DateTime                 @default(now())
  updatedAt                 DateTime                 @updatedAt
  tokens                    Token[]
  products                  Product[]
  favs                      Fav[]
  sales                     Sale[]
  purchases                 Purchase[]
  posts                     Post[]
  answers                   Answer[]
  wonderings                Wondering[]
  writtenReviews            Review[]                 @relation("writtenReviews") // 유저가 구매자일때는 리뷰를 쓴다.
  receivedReviews           Review[]                 @relation("receivedReviews") // 유저가 판매자일때 리뷰를 받는다.
  records                   Record[]
  streams                   Stream[]
  messages                  Message[]
  sellerchats               SellerChat[]
  chatrooms_buyer           ChatRoom[]               @relation(name: "buyer")
  chatrooms_seller          ChatRoom[]               @relation(name: "seller")
  Reservations              Reservation[]
  lastReadMessages          LastReadMessage[]
  // 약속 관련 관계 추가
  organizedAppointments     Appointment[]            @relation("organizedAppointments")
  appointmentParticipations AppointmentParticipant[]
  // 친구 관계 (내가 친구로 추가한 사람들)
  friendships               Friendship[]             @relation("UserFriendships")
  // 친구 관계 (나를 친구로 추가한 사람들) - 이름 변경
  friendInvited             Friendship[]             @relation("FriendInvited")
  pushSubscriptions         PushSubscription[]
  alarmSettings             AlarmSetting[] @relation("UserToAlarmSetting")
  scheduledNotifications    ScheduledNotification[]
} 
에서
  lastReadMessages          LastReadMessage[]
  // 약속 관련 관계 추가
  를 참조해라.

  model LastReadMessage {
    id           Int        @id @default(autoincrement())
    createdAt    DateTime   @default(now())
    updatedAt    DateTime   @default(now()) @updatedAt // Add a temporary default
    userId       Int
    chatRoomId   Int
    sellerChatId Int
    user         User       @relation(fields: [userId], references: [id], onDelete: Cascade)
    chatRoom     ChatRoom   @relation(fields: [chatRoomId], references: [id], onDelete: Cascade)
    sellerChat   SellerChat @relation(fields: [sellerChatId], references: [id], onDelete: Cascade)
  
    @@unique([userId, chatRoomId]) // 사용자-채널 조합은 유일해야 함
  } 도 참조해라
  가장 마지막으로 읽은 메시지를 결정하는 알고리즘도 코들르 추적하여 알아내줘.


## 안 읽은 메시지 개수(`unreadCount`) 추적 및 실시간 업데이트 상세 설명

안 읽은 메시지 개수(`unreadCount`)는 사용자가 특정 채팅방에서 아직 확인하지 않은, 상대방이 보낸 새로운 메시지의 수를 의미합니다. 이 값은 `LastReadMessage` Prisma 모델과 연동되어 계산되며, WebSocket을 통해 실시간으로 업데이트될 수 있습니다.

### 1. Prisma 모델 관계

`unreadCount` 계산에 직접적으로 관련된 주요 Prisma 모델은 다음과 같습니다:

1.  **`User`**:
    *   `id`: 사용자 식별자.
    *   `lastReadMessages: LastReadMessage[]`: 사용자가 각 채팅방에서 마지막으로 읽은 메시지 정보를 참조합니다.

2.  **`ChatRoom`**:
    *   `id`: 채팅방 식별자.
    *   `sellerChat: SellerChat[]`: 해당 채팅방에 속한 모든 메시지 목록을 참조합니다. (여기서 `SellerChat`이 실제 메시지 모델입니다.)
    *   `lastReadMessage: LastReadMessage[]`: 이 채팅방에 대한 여러 사용자의 마지막 읽음 상태를 참조합니다.

3.  **`SellerChat`** (채팅 메시지 모델):
    *   `id`: 메시지 식별자.
    *   `chatRoomId`: 메시지가 속한 채팅방 ID.
    *   `userId`: 메시지를 보낸 사용자 ID.
    *   `chatMsg`: 메시지 내용.
    *   `createdAt`: 메시지 생성 시간.

4.  **`LastReadMessage`**:
    *   `userId`: 사용자 ID.
    *   `chatRoomId`: 채팅방 ID.
    *   `sellerChatId`: 해당 `userId`의 사용자가 해당 `chatRoomId`의 채팅방에서 **마지막으로 읽은 `SellerChat` (메시지)의 ID**를 저장합니다.
    *   `updatedAt`: 이 레코드가 마지막으로 업데이트된 시간 (즉, 사용자가 해당 메시지까지 읽었다고 표시한 시간).
    *   `@@unique([userId, chatRoomId])`: 한 사용자는 각 채팅방에 대해 하나의 "마지막 읽은 메시지" 상태만 가집니다.

### 2. `unreadCount` 계산 알고리즘 (API 로직)

`EachChatRoom.tsx` 컴포넌트에서 `useQuery`를 통해 호출되는 `getChatRoomsById(chatRoomId)` 함수는 백엔드 API (예: `/api/chatRooms/[id]`)를 호출합니다. 이 API 엔드포인트에서 다음과 같은 알고리즘으로 `unreadCount`를 계산합니다:

1.  **현재 로그인한 사용자 ID (`currentUserId`) 가져오기**: API 요청을 보낸 사용자의 세션 등에서 `currentUserId`를 식별합니다.
2.  **요청된 `chatRoomId` 가져오기**.
3.  **사용자의 마지막 읽은 메시지 정보 조회**:
    *   `LastReadMessage` 테이블에서 `userId`가 `currentUserId`이고 `chatRoomId`가 현재 조회 중인 채팅방 ID와 일치하는 레코드를 찾습니다.
    *   `const userLastReadEntry = await client.lastReadMessage.findUnique({ where: { userId_chatRoomId: { userId: currentUserId, chatRoomId: +chatRoomId } } });`
4.  **마지막으로 읽은 메시지의 생성 시간 (`lastReadMessageCreatedAt`) 결정**:
    *   **만약 `userLastReadEntry`가 존재하고 `userLastReadEntry.sellerChatId`가 유효하다면**:
        *   `SellerChat` 테이블에서 `id`가 `userLastReadEntry.sellerChatId`인 메시지를 조회하여 그것의 `createdAt` 값을 `lastReadMessageCreatedAt`으로 설정합니다.
        *   `const lastReadMessage = await client.sellerChat.findUnique({ where: { id: userLastReadEntry.sellerChatId } });`
        *   `const lastReadMessageCreatedAt = lastReadMessage ? lastReadMessage.createdAt : new Date(0);`
    *   **만약 `userLastReadEntry`가 존재하지 않거나 `sellerChatId`가 유효하지 않다면**:
        *   해당 사용자는 이 채팅방의 메시지를 "읽음"으로 표시한 적이 없거나, 초기 상태일 수 있습니다. 이 경우, 모든 상대방 메시지를 안 읽은 것으로 간주하기 위해 `lastReadMessageCreatedAt`을 매우 오래된 날짜 (예: `new Date(0)`)로 설정합니다.
5.  **안 읽은 메시지 개수 계산**:
    *   `SellerChat` 테이블에서 다음 모든 조건을 만족하는 메시지들의 개수를 셉니다:
        *   `chatRoomId`가 현재 조회 중인 채팅방의 ID와 일치.
        *   메시지를 보낸 `userId`가 `currentUserId`와 **다름** (즉, 상대방이 보낸 메시지).
        *   메시지의 `createdAt`이 4단계에서 결정된 `lastReadMessageCreatedAt`보다 **큼**.
    *   ```typescript
      // API 핸들러 내의 unreadCount 계산 로직 예시
      const unreadCount = await client.sellerChat.count({
        where: {
          chatRoomId: +chatRoomId,
          userId: {
            not: currentUserId, // 상대방이 보낸 메시지만 카운트
          },
          createdAt: {
            gt: lastReadMessageCreatedAt, // 마지막으로 읽은 메시지 이후에 온 메시지
          },
        },
      });
      ```
6.  계산된 `unreadCount`를 채팅방 정보에 포함하여 클라이언트에 응답합니다.

### 3. 마지막으로 읽은 메시지 결정 및 업데이트 알고리즘

`LastReadMessage.sellerChatId`는 사용자가 특정 채팅방의 메시지를 어디까지 읽었는지를 나타내는 핵심 정보입니다. 이 값은 주로 다음과 같은 상황에서 업데이트됩니다:

1.  **사용자가 채팅방에 입장했을 때**:
    *   클라이언트(채팅방 상세 뷰 컴포넌트)는 해당 채팅방의 모든 메시지를 불러와 화면에 표시합니다.
    *   화면에 표시된 메시지 중 가장 최신 메시지(또는 사용자가 스크롤하여 본 가장 마지막 메시지)의 ID (`latestVisibleMessageId`)를 식별합니다.
    *   클라이언트는 서버에 "이 채팅방의 메시지를 `latestVisibleMessageId`까지 읽었습니다"라는 요청을 보냅니다 (예: `POST /api/chatRooms/[chatRoomId]/markAsRead` API 호출, 요청 본문에 `{ lastReadMessageId: latestVisibleMessageId }` 포함).
2.  **API에서 `LastReadMessage` 업데이트**:
    *   `markAsRead` API 핸들러는 요청을 보낸 `currentUserId`와 `chatRoomId`, 그리고 전달받은 `lastReadMessageId`를 사용하여 `LastReadMessage` 테이블의 레코드를 `upsert` (update or insert) 합니다.
    *   ```typescript
      // /api/chatRooms/[chatRoomId]/markAsRead API 핸들러 예시
      const { lastReadMessageId } = req.body;
      const currentUserId = req.session.user.id;
      const chatRoomId = +req.query.id;

      await client.lastReadMessage.upsert({
        where: {
          userId_chatRoomId: {
            userId: currentUserId,
            chatRoomId: chatRoomId,
          },
        },
        create: {
          userId: currentUserId,
          chatRoomId: chatRoomId,
          sellerChatId: lastReadMessageId,
          updatedAt: new Date(), // 생성 시에도 updatedAt 설정
        },
        update: {
          sellerChatId: lastReadMessageId,
          updatedAt: new Date(),
        },
      });
      ```
    *   이렇게 `LastReadMessage`가 업데이트되면, 다음에 `unreadCount`를 계산할 때 이 최신 정보가 반영됩니다.

### 4. 프론트엔드: 데이터 요청 및 실시간 업데이트 (`EachChatRoom.tsx`)

1.  **초기 데이터 로드**:
    ```tsx
    // filepath: c:\Users\song\Documents\DebugJS\carrot-market-practice\components\EachChatRoom.tsx
    // ...existing code...
      const {
        data: chatRoomData, // API로부터 unreadCount가 포함된 데이터 수신
        // ...
        refetch,
      } = useQuery({
        queryKey: ["chatRoomList", chatRoomId],
        queryFn: () => getChatRoomsById(chatRoomId), // API 호출 함수
        // ...
      });
    // ...existing code...
    ```
    컴포넌트가 마운트될 때 `useQuery`는 `getChatRoomsById`를 통해 API를 호출하고, API는 위 2번 알고리즘에 따라 계산된 `unreadCount`를 포함한 채팅방 데이터를 반환합니다.

2.  **UI 표시**:
    ```tsx
    // filepath: c:\Users\song\Documents\DebugJS\carrot-market-practice\components\EachChatRoom.tsx
    // ...existing code...
                        {chatRoom.unreadCount > 0 ? (
                          <div className="flex items-center justify-center w-5 h-5 bg-red-500 rounded-full">
                            <div className="text-sm text-white">{chatRoom.unreadCount}</div>
                          </div>
                        ) : null}
    // ...existing code...
    ```
    가져온 `chatRoom.unreadCount` 값을 사용하여 UI에 배지를 표시합니다.

3.  **실시간 업데이트 (WebSocket)**:
    ```tsx
    // filepath: c:\Users\song\Documents\DebugJS\carrot-market-practice\components\EachChatRoom.tsx
    // ...existing code...
      useEffect(() => {
        if (socket) {
          socket?.on("message", (message: any) => {
            // message 객체는 { chatRoomId: ..., /* 기타 메시지 정보 */ } 형태를 가짐
            if (chatRoomId && message.chatRoomId === chatRoomId) {
              // 현재 컴포넌트가 보고 있는 채팅방에 새 메시지가 도착한 경우
              refetch(); // 데이터를 다시 가져와 unreadCount를 업데이트
            }
          });
          // ...
        }
        // ...
      }, [/* ...dependencies... */, refetch, socket]);
    // ...existing code...
    ```
    *   새로운 메시지가 서버에 도착하면, 서버는 해당 채팅방에 연결된 클라이언트들에게 WebSocket을 통해 "message" 이벤트를 보냅니다.
    *   `EachChatRoom` 컴포넌트는 이 이벤트를 감지하고, 만약 해당 메시지가 현재 자신이 표시하고 있는 채팅방의 메시지라면 `refetch()`를 호출합니다.
    *   `refetch()`는 `useQuery`가 API를 다시 호출하도록 하여, 최신 `unreadCount` (새 메시지를 포함하여 계산된)를 가져오고 UI를 업데이트합니다.
    *   **중요**: 이 실시간 업데이트는 "새로운 메시지가 왔다"는 사실에 기반하여 `unreadCount`를 다시 계산하는 것입니다. 사용자가 실제로 메시지를 읽었는지 여부는 위 3번("마지막으로 읽은 메시지 결정 및 업데이트 알고리즘")에서 설명한 "읽음 처리" 로직이 별도로 수행되어야 `LastReadMessage`가 정확히 업데이트되고, 그 결과 `unreadCount`도 정확해집니다. 채팅 목록(`EachChatRoom`)에서는 단순히 새 메시지 도착 시 `refetch`를 통해 서버로부터 최신 `unreadCount`를 받아오는 역할을 합니다.

이러한 과정을 통해 `unreadCount`가 계산되고, 사용자가 채팅방을 보거나 새로운 메시지를 받을 때마다 적절히 업데이트되어 UI에 반영됩니다.