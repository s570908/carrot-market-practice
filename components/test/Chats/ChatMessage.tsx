import React from "react";

interface IMsg {
  user: string;
  msg: string;
}

type Props = {
  chat: IMsg;
  user: string;
};

function ChatMessage({ chat, user }: Props) {
  return (
    <div className="my-4">
      <span className={chat?.user === user ? "text-[#80ffea]" : "text-[#8aff80]"}>
        {chat?.user === user ? "Me" : chat?.user}
      </span>
      :
      {chat?.user === user ? (
        <span className="mx-1 rounded border-2 border-[#80ffea] bg-[#6c7393] px-10 py-1 text-[#80ffea]">
          {chat?.msg}
        </span>
      ) : (
        <span className="mx-1 rounded border-2 border-[#8aff80] bg-[#6c7393] px-10 py-1 text-[#8aff80]">
          {chat?.msg}
        </span>
      )}
    </div>
  );
}

export default ChatMessage;
