나는 text로 하는 chatting을 nextjs/prisma로 구현을 해 놓았다.
여기에 나는 video chat을 구현하겠다. Chat window에는 나와 대화대상자가 있다. 이 대화대상자를 친구라고 간략히 부르겠다.
이 chat window의 상단 오른쪽에 있는영상통화 아이콘을 누르면 친구의 컴퓨터의 웹앱에서 전화벨이 울리고 전화 accept icon과
전화 reject icon ui가 보이게 만들자. Accept icon을 친구가 누르면 영상통화를 webrtc기반으로 시작한다.
이 영상통화 창에에는 상대방 영상이 주로 보이고 나의 영상은 optional로 보이거나 안보이도록 만들자.
그리고 영상통화 창에는 버튼을 3개 배치하자.
하나는 영상 뮤트 토글 버튼이고 이것은 나의 영상 송출을 막는다,
두번째 버튼은 음성토글 버튼이고 나의 음성송출을 막는다. 세번째 버튼은 누르면 영상통화가 종료되는 버튼이다.
친구가 reject icon을 누르면 영상통화 요청을 거절해야 한다.
이럴 경우 나에게 친구가 통화를 거젏했음을 알리는 토스트 메시지를 보여줘야 한다.
이것을 nextjs/prisma 형식을 prisma scheme, page들, api들을 완성도 높게 구현해줘. 반드시 file path를 알려줘.

VideoChat 페이지는 다음과 같다.
처음 윗 부분은 나의 영상이 보이게 한다.
그 아래 부분에는 나의 친구 이름이 나오게 한다.
그 아래 부분에는 "영상챗 시작" 버튼과 "영상챗 중지" 버튼을 배치한다.
"영상챗 시작" 버튼을 누르면 webrtc 의 signaling 작업을 시작한다.
친구가 나의 전화를 받게 되면 나의 영상은 친구의 영상으로 대체되고 나는 그 영상의 우측상단에 조그만 창으로 나오게 한다.
"영상챗 중지" 버튼을 누르면 webrtc는 종료되고 chats/[id].tsx ChatDetail로 되돌아 간다.
이것을 구현해줘. api, prisma scheme, socketio 등 필요한 것들 모두 작성해줘.

```JS
const startCall = (call) => {
	const sessionId = call.sessionId;
	const callType = call.type; // audio call 인지 video call 인지 구분한다.
	const callSettings = new CometChat.CallSettingsBuilder() // 서버에 이 통화에 대하여 기록한다.
		.setSessionID(sessionId)
		.enableDefaultLayout(true)
		.setIsAudioOnlyCall(callType === "audio" ? true : false)
		.build();

	setSessionID(sessionId);
	setIsOutgoingCall(false); // outgoing call 이 아니다.
	setIsIncomingCall(false); // incoming call 도 아니다.
	setCalling(false); // 전화를 걸고 있는 상황도 아니다.
	setIsLive(true); // live로 진행한다.

	CometChat.startCall(   // 실제로 전화를 건다.
		callSettings,
		document.getElementById("callScreen"),
		new CometChat.OngoingCallListener({
			onUserJoined: (user) => {
				/* Notification received here if another user joins the call. */
				console.log("User joined call:", user);
				/* this method can be use to display message or perform any actions if someone joining the call */
			},
			onUserLeft: (user) => {
				/* Notification received here if another user left the call. */
				console.log("User left call:", user);
				/* this method can be use to display message or perform any actions if someone leaving the call */
			},
			onUserListUpdated: (userList) => {
				console.log("user list:", userList);
			},
			onCallEnded: (call) => {  // 내가 전화를 끝내든 상대방이 전화를 끝내든 전화가 끊어졌다면
				/* Notification received here if current ongoing call is ended. */
				console.log("Call ended:", call);
				/* hiding/closing the call screen can be done here. */
				setIsIncomingCall(false); // incoming call 이 아니고
				setIsOutgoingCall(false);  // outgoing call 도 아니고
				setCalling(false);  // 전화를 거는중도 아니고
				setIsLive(false);  // live 상태도 아니다.
			},
			onError: (error) => {
				console.log("Error :", error);
				/* hiding/closing the call screen can be done here. */
			},
			onMediaDeviceListUpdated: (deviceList) => {
				console.log("Device List:", deviceList);
			},
		})
	);
};

  const listenForCall = (listnerID) => {
    CometChat.addCallListener(
      listnerID,
      new CometChat.CallListener({
        onIncomingCallReceived(call) {  // incoming call 을 내가 받았다면
          console.log("Incoming call:", call);
          // Handle incoming call
          setSessionID(call.sessionId); //
          setIsIncomingCall(true);  //  incoming call 이다.
          setCalling(true);  // calling 중이다. 즉 전화를 받는 중이다.
        },
        onOutgoingCallAccepted(call) {  // outgoing call 을 상대가 받았다면
          console.log("Outgoing call accepted:", call);
          // Outgoing Call Accepted
          startCall(call); // 전화를 시작한다.
        },
        onOutgoingCallRejected(call) {    // outgoing call 을 상대가 받지 않았다면
          console.log("Outgoing call rejected:", call);
          // Outgoing Call Rejected
          setIsIncomingCall(false);  // incoming call 이 아니다.
          setIsOutgoingCall(false);  // outgoing call 도 아니다.
          setCalling(false);   // 전화를 거는중도 아니다.
        },
        onIncomingCallCancelled(call) {   // incoming call 을 내가 cancell 했다면
          console.log("Incoming call calcelled:", call);
          setIsIncomingCall(false); // incoming call 이 아니다.
          setIsIncomingCall(false); // outgoing call 도 아니다.
          setCalling(false);  // 전화 거는중도 아니다.
        },
      })
    );
  };
```

# Sleact REST API

HTTP 요청 리스트(ajax)

### GET /workspaces

- 내 워크스페이스 목록을 가져옴
- return: IWorkspace[]

### POST /workspaces

- 워크스페이스를 생성함
- body: { workspace: string(이름), url: string(주소) }
- return: IWorkspace

### GET /workspaces/:workspace/channels

- :workspace 내부의 내가 속해있는 채널 리스트를 가져옴
- return: IChannel[]

### POST /workspaces/:workspace/channels

- :workspace 내부에 채널을 생성함
- body: { name: string(이름) }
- return: IChannel

### GET /workspaces/:workspace/channels/all

- :workspace 내부의 모든 채널 리스트를 가져옴
- return: IChannel[]

### GET /workspaces/:workspace/channels/:channel

- :workspace 내부의 :channel 정보를 가져옴
- return: IChannel

### GET /workspaces/:workspace/channels/:channel/chats

- :workspace 내부의 :channel의 채팅을 가져옴
- query: { perPage: number(한 페이지 당 몇 개), page: number(페이지) }
- return: IChat[]

### GET /workspaces/:workspace/channels/:channel/unreads

- :workspace 내부의 :channel의 안 읽은 채팅 유무를 가져옴
- query: { after: Timestamp }
- return: number

### POST /workspaces/:workspace/channels/:channel/chats

- :workspace 내부의 :channel의 채팅을 저장
- body: { content: string(내용) }
- return: 'ok'
- message 소켓 이벤트가 emit됨

### POST /workspaces/:workspace/channels/:channel/images

- :workspace 내부의 :channel의 이미지를 저장
- body: { image: 이미지(multipart) }
- return: 'ok'
- message 소켓 이벤트가 emit됨

### GET /workspaces/:workspace/dms/:id/chats

- :workspace 내부의 :id와 나눈 dm을 가져옴
- query: { perPage: number(한 페이지 당 몇 개), page: number(페이지) }
- return: IDM[]

### GET /workspaces/:workspace/dms/:id/unreads

- :workspace 내부의 :id가 보낸 안 읽은 채팅 수를 가져옴.
- query: { after: Timestamp }
- return: number

### POST /workspaces/:workspace/dms/:id/chats

- :workspace 내부의 :id와 나눈 dm을 저장
- body: { content: string(내용) }
- return: 'ok'
- dm 소켓 이벤트가 emit됨

### POST /workspaces/:workspace/dms/:id/images

- :workspace 내부의 :id에게 보낸 이미지 저장
- body: { image: 이미지(multipart) }
- return: 'ok'
- dm 소켓 이벤트가 emit됨

### GET /workspaces/:workspace/members

- :workspace 내부의 멤버 목록을 가져옴
- return: IUser[]

### POST /workspaces/:workspace/members

- :workspace로 멤버 초대
- body: { email: string(이메일) }
- return: 'ok'

### DELETE /workspaces/:workspace/members/:id

- :workspace에서 :id 멤버 제거(또는 탈퇴)
- return 'ok'

### GET /workspaces/:workspace/channels/:channel/members

- :workspace 내부의 :channel 멤버 목록을 가져옴
- return: IUser[]

### POST /workspaces/:workspace/channels/:channel/members

- :workspace 내부의 :channel로 멤버 초대
- body: { email: string(이메일) }
- return: 'ok'

### GET /users

- 내 로그인 정보를 가져옴, 로그인되어있지 않으면 false
- return: IUser | false

### GET /workspaces/:workspace/users/:id

- :workspace의 멤버인 특정 :id 사용자 정보를 가져옴
- return: IUser

### POST /users

- 회원가입
- body: { email: string(이메일), nickname: string(닉네임), password: string(비밀번호) }
- return: 'ok'

### POST /users/login

- 로그인
- body: { email: string(이메일), password: string(비밀번호) }
- return: IUser

### POST /users/logout

- 로그아웃
- return: 'ok'

# WebSocket

웹소켓 API

## socket.on

서버에서 클라이언트로 보내는 이벤트(클라이언트에서는 on으로 받음)

### hello

- 소켓 연결 테스트용 API
- 서버 data: string(네임스페이스 이름)

### onlineList

- 현재 온라인인 사람들 아이디 목록
- 서버 data: number[](아이디 목록)

### message

- 새로운 채널 메시지가 올 때
- 서버 데이터: IChat(채팅 데이터)

### dm

- 새로운 dm 메시지가 올 때
- 서버 데이터: IDM(dm 데이터)

## socket.emit

클라이언트에서 서버로 보내는 이벤트(클라이언트에서는 emit으로 보냄)

### login

- 워크스페이스, 채널이 로딩 완료되었을 때 서버에 로그인했음을 알리는 이벤트
- 클라이언트 data: { id: number(유저 아이디), channels: number[](채널 아이디 리스트) }

## disconnect

- 클라이언트에서 소켓 연결을 종료하는 함수

# React의 useEffect 동작 요약

마운트 후 실행:

useEffect 내부의 콜백 함수는 컴포넌트가 처음 화면에 렌더링된 후, 즉 DOM이 업데이트된 다음에 실행됩니다.
업데이트 후 실행:

의존성 배열에 포함된 값이 변경되면 useEffect가 다시 실행됩니다.
언마운트 시 클린업 실행:

useEffect가 반환하는 함수(클린업 함수)는 컴포넌트가 언마운트되거나, 재실행되기 전에 호출됩니다.

# Sleact server client interaction

server................................... client

src/events/events.gateway.ts
.............................
@WebSocketGateway({ namespace: /\/ws-.+/ })
export class EventsGateway
implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
@WebSocketServer() public server: Server;
......
}

    																		useSocket.ts
    																		..............
    																		const sockets: { [key: string]: Socket } = {};
    																		  if (!sockets[workspace]) {
    																				sockets[workspace] = io(`${backUrl}/ws-${workspace}`, {
    																					transports: ['websocket'],
    																					//withCredentials: true,
    																				});
    																				console.info('create socket', workspace, sockets[workspace]);
    																			}
    																			return [sockets[workspace], disconnect];

src/events/events.gateway.ts
.............................
handleConnection(@ConnectedSocket() socket: Socket) {
console.log('connected', socket.nsp.name);
if (!onlineMap[socket.nsp.name]) {
...onlineMap[socket.nsp.name] = {};
}
// broadcast to all clients in the given sub-namespace
socket.emit('hello', socket.nsp.name);
}

    																			layouts/Workspace/index.tsx
    																			............................
    																			room data와 user data가 존재하면
    																			login, {user id, user가 가입한 모든 room id list} 이벤트를 발사한다.
    																			if (channelData && userData) {
    																			...console.info('로그인하자', socket);
    																			...socket?.emit('login', { id: userData?.id, channels:
    																				...channelData.map((v) => v.id) });
    																			}

login, {user id, user가 가입한 모든 room id list} 이벤트를 받는다.
// workspace url과socket id를 키로 하여서 user id를 기록한다.
onlineMap[socket.nsp.name][socket.id] = data.id;
// workspace url에 속한 모든 user의 id array를 페이로드로 만들어서 이벤트로 송부한다.
newNamespace.emit('onlineList', Object.values(onlineMap[socket.nsp.name]));
data.channels.forEach((channel) => {
socket.join(`${socket.nsp.name}-${channel}`);
});

    																			components/DMList/index.tsx
    																		  .............................
    																		  useEffect(() => {
    																				socket?.on('onlineList', (data: number[]) => {
    																					setOnlineList(data);
    																				});
    																				// socket?.on('dm', onMessage);
    																				console.log('socket on dm', socket?.hasListeners('dm'), socket);
    																				return () => {
    																					// socket?.off('dm', onMessage);
    																					console.log('socket off dm', socket?.hasListeners('dm'));
    																					socket?.off('onlineList');
    																				};
    																			}, [socket]);

    																			@name=POST /workspaces/:workspace/dms/:id/chats
    																			.................................................
    																			@workspaceUrl26=slack
    																			@id26=15
    																			@chat26=test chat 200번째 12 to 15
    																			POST  http://localhost:3095/api/workspaces/{{workspaceUrl26}}/dms/{{id26}}/chats
    																			Content-Type: application/json
    																			{"content": "{{chat26}}"}

    																			@name=POST /workspaces/:workspace/channels/:channel/chats
    																			...........................................................
    																			@workspaceUrl23=slack
    																			@channel23=general
    																			@chat23=test chat
    																			POST  http://localhost:3095/api/workspaces/{{workspaceUrl23}}/channels/{{channel23}}/chats
    																			Content-Type: application/json
    																			{"content": "{{chat23}}"}

src/channels/channels.service.ts
..................................
createWorkspaceChannelChats(
const aChannel = await this.prismaService.channels.findFirst(...)
const chatWithUser = await this.prismaService.channelChats.create(...)
// socket.io로 워크스페이스 + 채널 사용자에게 전송
this.eventsGateway.server
// .of(`/ws-${url}`)
.to(`/ws-${url}-${chatWithUser.chatRoomId}`)
.emit('message', chatWithUser);

    																				pages/Channel/index.tsx
    																				..........................
    																				  useEffect(() => {
    																				    socket?.on('message', onMessage);
    																				    return () => {
    																				      socket?.off('message', onMessage);
    																				    };
    																				  }, [socket, onMessage]);

    																				pages/DirectMessage/index.tsx
    																				...............................
    																				  useEffect(() => {
    																				    socket?.on('message', onMessageChannel);
    																				    return () => {
    																				      socket?.off('message', onMessageChannel);
    																				    };
    																				  }, [socket, onMessageChannel]);
