import React from "react";

import ChatMessage from "./ChatMessage";

interface IMsg {
  user: string;
  msg: string;
}
type Props = {
  chat: IMsg[];
  user: string;
};

function Chat({ chat, user }: Props) {
  return (
    <div className="flex-1 p-4 font-mono">
      {chat?.length ? (
        chat.map((chat, i) => <ChatMessage key={"msg_" + i} chat={chat} user={user} />)
      ) : (
        <div className="py-6 text-center text-sm text-gray-400">No chat messages</div>
      )}
    </div>
  );
}

export default Chat;
