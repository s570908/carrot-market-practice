// usePersistentSocket: 페이지 이동/새로고침에도 소켓 연결과 이벤트를 자동으로 복구하는 커스텀 훅 예시

import { useEffect, useRef } from "react";
import useUser from "@libs/client/useUser";
import useSocket from "@libs/client/useSocket";

// chatRoomIds: 사용자가 가입한 채팅방 id 배열을 반드시 prop으로 전달해야 함
export default function usePersistentSocket(
  workspace: string,
  chatRoomIds: number[]
) {
  const [socket, disconnectSocket] = useSocket(workspace);
  const { user } = useUser();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!socket || !user?.id || !chatRoomIds?.length) return;

    // 최초 연결 또는 새로고침/페이지 이동 시 login 이벤트 재전송
    if (!isInitialized.current) {
      socket.emit("login", { id: user.id, channels: chatRoomIds });
      isInitialized.current = true;
    }

    // onlineList 등 이벤트 핸들러 등록
    const handleOnlineList = (onlineUsers: number[]) => {
      // 온라인 유저 목록을 상태로 관리하거나, UI에 반영
      // 예: setOnlineUsers(onlineUsers);
    };
    socket.on("onlineList", handleOnlineList);

    // 필요시 다른 이벤트 핸들러도 등록

    // cleanup: 언마운트 시 핸들러 해제
    return () => {
      socket.off("onlineList", handleOnlineList);
      // 필요시 disconnectSocket();
      isInitialized.current = false;
    };
  }, [socket, user?.id, chatRoomIds]);

  return socket;
}

/*
설명:
- usePersistentSocket 훅을 사용하는 방식은 각 페이지/컴포넌트에서 필요한 소켓 이벤트와 상태를 독립적으로 관리할 수 있어
  코드의 재사용성과 유지보수성이 높아집니다.
- 반면, _app.tsx에서 소켓 연결 및 이벤트를 전역으로 관리하면 모든 페이지에서 동일한 소켓 인스턴스를 공유할 수 있지만,
  페이지별로 필요한 이벤트/상태를 세분화하기 어렵고, 불필요한 이벤트 핸들러가 등록될 수 있습니다.

- 브라우저 새로고침 시 _app.tsx의 상태(React state, context 등)는 모두 초기화되며,
  소켓 연결도 끊어지고 다시 연결됩니다. 특별한 처리가 없다면 소켓 이벤트는 다시 등록해야 합니다.
- usePersistentSocket 훅은 새로고침/페이지 이동 시에도 소켓 연결과 이벤트를 자동으로 복구할 수 있도록 설계되어 있습니다.

결론:
- 페이지별로 소켓 이벤트와 상태가 다르거나, 여러 채팅방/기능별로 분리 관리가 필요하다면 훅 방식이 더 좋습니다.
- 전체 앱에서 단일 소켓 인스턴스와 이벤트만 필요하다면 _app.tsx에서 관리해도 무방합니다.
- Next.js의 _app.tsx는 SPA 라우팅 시에는 상태가 유지되지만, 브라우저 새로고침 시에는 항상 초기화됩니다.
*/

/*
사용 예시:

import usePersistentSocket from "@libs/client/usePersistentSocket";

// 예를 들어, 사용자가 가입한 채팅방 id 배열을 가져온다고 가정
const chatRoomIds = [1, 2, 3]; // 실제로는 서버에서 받아온 값 사용

function MyComponent() {
  const socket = usePersistentSocket("market", chatRoomIds);

  useEffect(() => {
    if (!socket) return;
    // 원하는 소켓 이벤트 핸들러 등록
    socket.on("onlineList", (onlineUsers) => {
      // 온라인 유저 목록 처리
      console.log("온라인 유저 목록:", onlineUsers);
    });

    // cleanup
    return () => {
      socket.off("onlineList");
    };
  }, [socket]);

  // ...컴포넌트 렌더링...
}

설명:
- usePersistentSocket("market", chatRoomIds)로 소켓을 얻고, 필요한 이벤트를 등록하면 됩니다.
- chatRoomIds는 사용자가 가입한 채팅방 id 배열입니다.
- 페이지 이동/새로고침 시에도 소켓 연결과 이벤트가 자동으로 복구됩니다.
*/

/*
Q: usePersistentSocket을 사용하면 네트워크 탭에서 소켓을 볼 때 ws://localhost:3000/api/socket/?EIO=4&transport=websocket가 다시 생성 안 되고 메세지가 그 안에서 계속 나오는 것을 볼 수 있나요?
A:
- "페이지 이동"만 할 경우(Next.js SPA 라우팅 등) 기존 웹소켓 연결이 유지되며, 네트워크 탭에서 동일한 ws://... 연결이 계속 유지되고 메시지가 그 안에서 주고받아집니다.
- "브라우저 새로고침(F5 등)"을 하면 React 앱이 완전히 새로 로드되고, 기존 웹소켓 연결이 끊어지고 새로운 ws://... 연결이 다시 생성됩니다. 네트워크 탭에서 이전 연결은 종료되고 새 연결이 보입니다.

Q: 특정 창에서 새로 고침을 해도 웹소켓이 다시 생성 안 되는지 궁금합니다.
A:
- 새로고침 시에는 항상 웹소켓이 새로 생성됩니다(브라우저의 특성상 기존 JS context가 사라지기 때문).
- usePersistentSocket 훅은 새로고침 후에도 자동으로 소켓 연결 및 이벤트 등록을 복구해주지만, 네트워크 탭에서는 새로운 ws://... 연결이 보입니다.

요약:
- SPA 라우팅(페이지 이동) → 웹소켓 연결 유지(네트워크 탭에서 동일한 연결)
- 브라우저 새로고침 → 웹소켓 연결 재생성(네트워크 탭에서 새 연결)
*/

/*
Q: usePersistentSocket 훅에 "requestOnlineList", "joinRoom", "leaveRoom", "changeState", "requestRoomList" 관련 소켓 이벤트는 안 넣어도 괜찮나요?
A:
- 네, 반드시 usePersistentSocket 훅 내부에 위 이벤트들을 등록할 필요는 없습니다.
- usePersistentSocket은 "공통적으로 모든 페이지에서 반드시 필요한 이벤트"만 등록하는 것이 좋으며,
  각 페이지/컴포넌트에서 필요한 이벤트(예: joinRoom, leaveRoom, changeState 등)는 해당 컴포넌트에서 직접 socket.on/emit으로 관리하는 것이 더 유연합니다.
- 이렇게 하면 불필요한 이벤트 핸들러 등록을 피하고, 페이지별로 필요한 이벤트만 효율적으로 관리할 수 있습니다.
*/
/*
네, 맞습니다.
usePersistentSocket 훅을 사용하는 방식은 각 페이지/컴포넌트에서 직접 호출해야 하므로
모든 페이지에서 일일이 사용해야 하는 번거로움이 있습니다.

장점:
- 페이지별로 필요한 소켓 이벤트와 상태를 독립적으로 관리할 수 있습니다.
- 불필요한 이벤트 핸들러 등록을 피할 수 있습니다.

단점:
- 모든 페이지/컴포넌트에서 훅을 직접 호출해야 하므로 반복 코드가 생길 수 있습니다.
- 전체 앱에서 공통적으로 필요한 소켓 이벤트가 있다면 _app.tsx 또는 Context에서 한 번만 관리하는 것이 더 효율적일 수 있습니다.

대안:
- _app.tsx에서 usePersistentSocket을 한 번만 호출하고, Context로 소켓 인스턴스를 하위 컴포넌트에 전달하면
  모든 페이지에서 중복 호출 없이 소켓을 사용할 수 있습니다.
- 페이지별로 특화된 이벤트만 추가로 등록하고 싶을 때는 훅을 병행해서 사용할 수 있습니다.

결론:
- 앱 전체에서 공통 소켓 연결/이벤트가 필요하면 _app.tsx+Context 방식이 더 편리합니다.
- 페이지별로 세분화된 이벤트 관리가 필요하면 훅 방식이 더 유연합니다.
*/

/*
프로젝트 상황에 따른 권장 방식:

- 홈 화면, 채팅방 목록, 채팅방 상세 등 "실시간 온라인 상태/메시지/알림"이 필요한 주요 페이지에서는 usePersistentSocket을 사용하는 것이 적합합니다.
- 상품 등록, 상품 수정, 약속 생성 등 "실시간 소켓 이벤트가 필요 없는" 페이지에서는 굳이 소켓 연결을 유지할 필요가 없습니다.

비교:
1. _app.tsx에서 usePersistentSocket + Context 방식
   - 모든 페이지에서 소켓 인스턴스를 공유할 수 있어 중복 호출이 없습니다.
   - 하지만, 상품 등록/수정/약속 생성 등 소켓이 필요 없는 페이지에서도 소켓 연결이 유지되어 리소스가 낭비될 수 있습니다.
   - 페이지별로 특화된 이벤트 관리가 어렵고, 불필요한 이벤트 핸들러가 등록될 수 있습니다.

2. 페이지별로 usePersistentSocket을 필요한 곳에서만 호출
   - 소켓 연결과 이벤트 핸들러를 필요한 페이지에서만 관리할 수 있어 효율적입니다.
   - 실시간 기능이 필요한 곳에서만 소켓 리소스를 사용하므로 불필요한 연결을 줄일 수 있습니다.
   - 각 페이지에서 특화된 이벤트만 등록할 수 있어 유지보수성이 높습니다.

결론:
- 이 프로젝트처럼 "채팅/실시간 알림"이 필요한 페이지가 명확히 구분된다면,
  _app.tsx에서 소켓을 전역으로 관리하기보다는, 각 페이지에서 usePersistentSocket을 필요에 따라 사용하는 방식이 더 적합합니다.
- 실시간 기능이 필요 없는 페이지에서는 소켓을 사용하지 않아도 되므로, 리소스 관리와 코드 유지보수에 유리합니다.
*/
