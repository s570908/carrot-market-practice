import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import SocketIOClient from "socket.io-client";
import Chat from "@components/test/Chats";
import CustomInput from "@components/test/CustomInput";
import ButtonAction from "@components/test/ButtonActions";
// import Chat from "./components/Chats";
// import ButtonAction from "./components/ButtonAction";

// import CustomInput from "./components/CustomInput";

interface IMsg {
  user: string;
  msg: string;
}

// create random user
const user = "User_" + String(new Date().getTime()).substr(-3);

export default function Home() {
  const inputRef = useRef(null);
  // connected flag
  const [connected, setConnected] = useState<boolean>(false);

  // init chat and message
  const [chat, setChat] = useState<IMsg[]>([]);
  const [msg, setMsg] = useState<string>("");

  useEffect((): any => {
    // connect to socket server
    // @ts-ignore
    const socket = SocketIOClient.connect(process.env.BASE_URL, {
      path: "/api/socket",
    });

    // log socket connection
    socket.on("connect", () => {
      console.log("SOCKET CONNECTED!", socket.id);
      setConnected(true);
    });

    // update chat on new message dispatched
    socket.on("message", (message: IMsg) => {
      setChat((chat) => [...chat, message]);
    });

    // socket disconnet onUnmount if exists
    if (socket) return () => socket.disconnect();
  }, []);

  const sendMessage = async () => {
    if (msg) {
      // build message obj
      const message: IMsg = {
        user,
        msg,
      };

      // dispatch message to other users
      const resp = await fetch("http://localhost:3000/api/testChat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      // reset field if OK
      if (resp.ok) setMsg("");
    }

    // focus after click
    // @ts-ignore
    inputRef?.current?.focus();
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="sticky top-0 border-2 border-[#9580ff] bg-gray-600 py-4 text-[#9580ff]">
        <h1 className="text-center text-2xl font-semibold">Realtime Chat App</h1>
        <h2 className="mt-2 text-center">with Next.js and Socket.io</h2>
      </div>
      <div className="flex flex-1 flex-col bg-gray-800">
        <Chat chat={chat} user={user} />

        <div className="sticky bottom-0 h-20 bg-gray-600 p-4">
          <div className="flex h-full flex-1 flex-row divide-x divide-gray-200">
            <CustomInput
              inputRef={inputRef}
              msg={msg}
              onChange={(e: any) => {
                setMsg(e.target.value);
              }}
              onKeyPress={(e: any) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              connected={connected}
            />

            <ButtonAction onClick={sendMessage} connected={connected} />
          </div>
        </div>
      </div>
    </div>
  );
}
