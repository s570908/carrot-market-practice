import type { NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
import useSWR from "swr";
import { SellerChat, User } from "@prisma/client";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import Message from "@components/Message";
import { MutableRefObject, useEffect, useRef } from "react";
import { useIntersectionObserver } from "@libs/client/useIntersectionObserver";
import { FiChevronsDown } from "react-icons/fi";
import { cls } from "@libs/utils";
import Loading from "@components/Loading";

interface ChatWithUser extends SellerChat {
  user: User;
}
interface SellerChatResponse {
  ok: boolean;
  sellerChat: ChatWithUser[];
  chatRoomOfSeller: {
    buyerId: number;
    sellerId: number;
    buyer: User;
    seller: User;
  };
}
interface ChatFormResponse {
  chatMsg: string;
}

const ChatDetail: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  //// router.query.id: chatRoom id
  //// chatRoom list 가져오기
  const { data, mutate } = useSWR<SellerChatResponse>(
    router.query.id ? `/api/chat/${router.query.id}` : null,
    { refreshInterval: 1000 }
  );

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const entry = useIntersectionObserver(scrollRef, {
    root: null,
    rootMargin: "0%",
    threshold: 0, // visibleRef가 모두 보였을 때만 true,
    freezeOnceVisible: false, // 계속하여 감지하겠다.
  });
  const scrollToBottom = (elementRef: MutableRefObject<HTMLDivElement | null>) => {
    if (elementRef) {
      elementRef.current!.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  //console.log("Entry.isIntersecting: ", entry?.isIntersecting);

  const { register, handleSubmit, reset } = useForm<ChatFormResponse>();
  //// api server를 통해서 chatRoom에 chat data를 보내기
  const [sendChat, { loading: sendChatDataLoading, data: sendChatData }] = useMutation(
    `/api/chat/${router.query.id}/chats`
  );
  const onValid = (chatForm: ChatFormResponse) => {
    if (sendChatDataLoading) return;
    reset();

    const newMessage = {
      id: Date.now(),
      chatMsg: chatForm.chatMsg,
      user: { ...user },
      userId: user?.id,
    };

    mutate(
      (prev) => {
        if (prev) {
          return {
            ...prev,
            sellerChat: [...prev.sellerChat, newMessage],
          } as any;
        }
      },
      false // cache만 업데이트한다. 즉 optimistic UI이다. 서버의 데이터를 업데이트하지 않는다. 이것이 true라면 서버의 데이터를 이 시점에서 업데이트를 한다.
    );
    sendChat(chatForm); // mutate에서 option을 false로 하였기 때문에 서버의 데이터가 아직 업데이트되지 않았으므로 지금 여기서 서버의 데이터를 업데이트한다.
  };
  // useEffect(() => {
  //   const chatBox = document.getElementById("chatBox") as HTMLElement;
  //   //// scrollTop 의 최대치는 scrollHeight-clientHeght. scrollTop에 이 최대치보다 큰 수를 넣더라도 scrollTop은 최대치 만큼만 반응한다.
  //   chatBox.scrollTop = chatBox.scrollHeight + 20;
  // }, [data?.ok, sendChatData, mutate]);
  // ref: https://velog.io/@lumpenop/TIL-nextron-React-%EC%B1%84%ED%8C%85%EC%B0%BD-%EA%B5%AC%ED%98%84-%EC%9E%85%EB%A0%A5-%EC%8B%9C-%EC%B1%84%ED%8C%85%EC%B0%BD-%EC%95%84%EB%9E%98%EB%A1%9C-%EC%8A%A4%ED%81%AC%EB%A1%A4-220724
  useEffect(() => {
    scrollToBottom(scrollRef);
  }, [data?.ok, sendChatData, mutate]);

  return (
    <Layout
      seoTitle={`${
        data?.chatRoomOfSeller?.buyerId === user?.id
          ? data?.chatRoomOfSeller?.seller.name
          : data?.chatRoomOfSeller?.buyer.name
      } || 채팅`}
      title={`${
        data?.chatRoomOfSeller?.buyerId === user?.id
          ? data?.chatRoomOfSeller?.seller.name
          : data?.chatRoomOfSeller?.buyer.name
      }`}
      canGoBack
      backUrl={"/chats"}
    >
      <div className="relative px-4 pb-12 pt-5">
        <div
          className="flex h-[calc(95vh-106px)] flex-col space-y-2 overflow-y-scroll py-5 transition-all"
          id="chatBox"
        >
          {data?.sellerChat?.map((message) => {
            //console.log("message: ", JSON.stringify(message, null, 2));
            return (
              <Message
                reversed={message.userId === user?.id}
                key={message.id}
                name={message.user.name}
                message={message.chatMsg}
                avatar={message.user.avatar}
                date={message.createdAt}
              />
            );
          })}
          {!entry?.isIntersecting ? (
            <button
              onClick={() => {
                scrollToBottom(scrollRef);
              }}
              className={cls(
                "inline",
                "absolute bottom-28 right-1 z-20 flex h-7 w-7 cursor-pointer items-center justify-center bg-slate-700 "
              )}
            >
              <FiChevronsDown className="text-xl text-gray-400" />
            </button>
          ) : null}
          <div ref={scrollRef}></div>
        </div>
        <div>
          {/* <form onSubmit={handleSubmit(onValid)} className="fixed inset-x-0 bottom-0 py-2 bg-white">
            <div className="relative flex items-center w-full max-w-md pl-2 mx-auto">
              <input
                {...register("chatMsg", { required: true })}
                type="text"
                className="w-full pr-12 border-gray-300 rounded-full shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <button className="flex items-center px-3 text-sm text-white bg-orange-500 rounded-full hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                  &rarr;
                </button>
              </div>
            </div>
          </form> */}
          <form onSubmit={handleSubmit(onValid)} className="mt-10 w-full border-t px-1 py-1">
            <div className="relative w-full rounded-md bg-white px-2 py-2 outline-none">
              <input
                {...register("chatMsg", { required: true, maxLength: 80 })}
                maxLength={80}
                placeholder={
                  user === undefined ? "로그인 후 이용가능합니다." : "메세지를 입력해주세요."
                }
                className="w-full text-[15px] outline-none placeholder:text-gray-300"
              />
              <button
                disabled={user === undefined}
                type="submit"
                className="absolute bottom-1 right-0.5 flex h-8 items-end rounded-md bg-orange-400 px-4 py-1.5 text-sm text-white hover:bg-orange-500"
              >
                {sendChatDataLoading === true ? (
                  <div>
                    <Loading color="" size={12} />
                  </div>
                ) : (
                  "전송"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ChatDetail;
