import type { NextPage } from "next";
import Layout from "@components/Layout";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
import useSWR from "swr";
import { SellerChat, User } from "@prisma/client";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import Message from "@components/Message";
import { useEffect } from "react";

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

  const { register, handleSubmit, reset } = useForm<ChatFormResponse>();
  //// api server를 통해서 chatRoom에 chat data를 보내기
  const [sendChat, { loading, data: sendChatData }] = useMutation(
    `/api/chat/${router.query.id}/chats`
  );
  const onValid = (chatForm: ChatFormResponse) => {
    if (loading) return;
    reset();
    mutate(
      (prev) =>
        prev &&
        ({
          ...prev,
          sellerChat: [
            ...prev.sellerChat,
            {
              id: Date.now(),
              chatMsg: chatForm.chatMsg,
              user: { ...user },
              userId: user?.id,
            },
          ],
        } as any),
      false // cache만 업데이트한다. 즉 optimistic UI이다. 서버의 데이터를 업데이트하지 않는다. 이것이 true라면 서버의 데이터를 이 시점에서 업데이트를 한다.
    );
    sendChat(chatForm); // mutate에서 option을 false로 하였기 때문에 서버의 데이터가 아직 업데이트되지 않았으므로 지금 여기서 서버의 데이터를 업데이트한다.
  };
  useEffect(() => {
    const chatBox = document.getElementById("chatBox") as HTMLElement;
    //// scrollTop 의 최대치는 scrollHeight-clientHeght. scrollTop에 이 최대치보다 큰 수를 넣더라도 scrollTop은 최대치 만큼만 반응한다.
    chatBox.scrollTop = chatBox.scrollHeight + 20;
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
      <div className="px-4 pb-12 pt-5">
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
        </div>
        <div>
          <form onSubmit={handleSubmit(onValid)} className="fixed inset-x-0 bottom-0 bg-white py-2">
            <div className="relative mx-auto flex w-full max-w-md items-center">
              <input
                {...register("chatMsg", { required: true })}
                type="text"
                className="w-full rounded-full border-gray-300 pr-12 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <button className="flex items-center rounded-full bg-orange-500 px-3 text-sm text-white hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                  &rarr;
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default ChatDetail;
