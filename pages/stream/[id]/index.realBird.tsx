//import type { NextPage } from "next";
import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext, NextPage } from "next";
import Layout from "@components/Layout";
import Message from "@components/Message";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Stream, User } from "@prisma/client";
import useUser from "@libs/client/useUser";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import { useEffect } from "react";
import { cls } from "@libs/utils";
import { ResponseType } from "@libs/server/withHandler";
import Loading from "@components/Loading";

interface RecordedVideo {
  uid: string;
  meta: { name: string };
  preview: string;
  liveInput: string;
  thumbnail: string;
  thumbnailTimestampPct: number;
  allowedOrigins: any[];
  size: number;
  input: { width: number; height: number };
  playback: { hls: string; dash: string };
  status: { state: string; pctComplete: string; errorReasonCode: string; errorReasonText: string };
  creator: any;
  duration: number;
  maxDurationSeconds: any;
  maxSizeBytes: any;
  modified: string;
  readyToStream: boolean;
  requireSignedURLs: boolean;
  uploadExpiry: any;
  watermark: any;
  created: string;
  uploaded: string;
}

interface RecordedVideos {
  success: boolean;
  errors: any[];
  messages: any[];
  result: RecordedVideo[];
}

interface ViewsResult {
  liveViewers: number;
}

interface LifecycleResult {
  isInput: boolean;
  live: boolean;
  status: string;
  videoUID: string | null;
}

interface StreamMessage {
  message: string;
  id: number;
  user: {
    avatar?: string;
    id: number;
    name: string;
  };
}

interface StreamWithMessages extends Stream {
  messages: StreamMessage[];
  user: User; // 없애야 할 것 같다. 중복!
}

interface StreamResponse {
  ok: boolean;
  stream: StreamWithMessages;
  live: boolean;
}

interface MessageForm {
  message: string;
}

interface StreamDetailResult extends ResponseType {
  stream?: StreamWithMessages;
  recordedVideos?: RecordedVideos;
}

const StreamDetail: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();

  // 라이브스트림 메시지 리액트 훅 폼
  const { register, handleSubmit, reset } = useForm<MessageForm>();

  const { data, mutate } = useSWR<ResponseType>(
    router.query.id ? `/api/streams/${router.query.id}` : null,
    { refreshInterval: 1000 }
  );

  const { data: viewsData } = useSWR<ViewsResult>(
    data?.stream?.cloudflareId
      ? `https://videodelivery.net/${data?.stream?.cloudflareId}/views`
      : null,
    {
      refreshInterval: 1000,
    }
  );

  const { data: lifecycleData } = useSWR<LifecycleResult>(
    data?.stream?.cloudflareId
      ? `https://videodelivery.net/${data?.stream?.cloudflareId}/lifecycle`
      : null,
    {
      refreshInterval: 1000,
    }
  );

  console.log("stream.[id].tsx---data: ", JSON.stringify(data, null, 2));

  // 존재하지 않는 라이브스트림 접근시, 목록으로 replace
  useEffect(() => {
    if (data?.ok === false) {
      router.replace("/streams");
    }
  }, [data, router]);

  // 라이브스트림 메시지 생성 API (POST)
  const [sendMessage, { loading, data: sendMessageData }] = useMutation(
    `/api/streams/${router.query.id}/messages`
  );
  const onValid = (form: MessageForm) => {
    if (loading) return;
    reset();
    mutate(
      (prev) =>
        prev &&
        ({
          ...prev,
          stream: {
            ...prev.stream,
            messages: [
              ...prev.stream?.messages!,
              { id: Date.now(), message: form.message, user: { ...user } },
            ],
          },
        } as any),
      false
    );
    // 라이브스트림 메시지 API 요청 (POST)
    sendMessage(form);
  };

  // 채팅창의 스크롤을 맨 밑으로 유지
  useEffect(() => {
    const msgBox = document.querySelector("#msg") as HTMLElement;
    msgBox.scrollTop = msgBox.scrollHeight;
  }, [data?.ok, sendMessageData]);

  const preview = true;

  return (
    <Layout
      seoTitle={`${data?.stream.name} || 라이브`}
      title={`${data?.stream.user.name}의 라이브`}
      canGoBack
      backUrl={"/stream"}
    >
      <div className="space-y-4 px-4 py-10">
        <div className="relative bg-slate-300">
          {data?.stream?.cloudflareId ? (
            <iframe
              src={`https://iframe.videodelivery.net/${data?.stream?.cloudflareId}`}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
              allowFullScreen={true}
              className="h-full w-full rounded-lg"
            ></iframe>
          ) : (
            <div className="h-full w-full rounded-lg bg-gray-50">
              <div className="flex h-full items-center justify-center">
                <Loading color="orange" size={36} />
              </div>
            </div>
          )}
          <div className="absolute right-1 top-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={cls(
                data?.stream?.cloudflareId ? "text-red-500" : "text-gray-500",
                "h-6 w-6"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
              />
            </svg>
          </div>
        </div>
        <div className="mt-5">
          {/* 라이브 제목 */}
          <h1 className="text-3xl font-bold text-gray-900">{data?.stream.name}</h1>
          <div className="flex flex-row items-center justify-between">
            <span className="mt-3 text-2xl text-gray-900">￦ {data?.stream.price}</span>
            <span className="mt-3 text-base text-gray-900">
              <span className="font-bold">판매자: </span>
              {data?.stream.user.name}
            </span>
          </div>
          <p className="my-6 text-gray-700 ">{data?.stream.description}</p>
          {user?.id === data?.stream.userId ? (
            <div className="flex flex-col space-y-3 overflow-x-scroll rounded-md bg-orange-300 p-5">
              <span className="font-medium">Stream Keys (secret)</span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">URL:</span>
                {data?.stream.cloudflareUrl}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Key:</span>
                {data?.stream.cloudflareKey}
              </span>
            </div>
          ) : null}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Chat</h2>
          <div id="msg" className="h-[38rem] space-y-2 overflow-y-scroll px-4 py-8">
            {data?.stream.messages?.map((message: any) => (
              <Message
                reversed={message.user.id === user?.id}
                key={message.id}
                name={message.user.name}
                message={message.message}
                // avatar={"https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg"}
                avatar={message.user.avatar}
                date={message.createdAt}
              />
            ))}
          </div>
          <div className="fixed inset-x-0 bottom-0 bg-white py-2">
            <form
              onSubmit={handleSubmit(onValid)}
              className="relative mx-auto flex w-full max-w-md items-center"
            >
              <input
                type="text"
                {...register("message", { required: true })}
                className="w-full rounded-full border-gray-300 pr-12 shadow-sm focus:border-orange-500 focus:outline-none focus:ring-orange-500"
              />
              <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                <button className="flex items-center rounded-full bg-orange-500 px-3 text-sm text-white hover:bg-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2">
                  &rarr;
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

// export const getStaticPaths: GetStaticPaths = () => {
//   return {
//     paths: [],
//     fallback: "blocking",
//   };
// };

// export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
//   console.log("getStaticProps: context.params.id: ", context.params?.id);
//   if (!context?.params?.id) {
//     return {
//       props: {},
//     };
//   }

//   const foundStream = await client?.stream.findUnique({
//     where: { id: +context.params.id },
//     include: {
//       messages: {
//         select: {
//           id: true,
//           message: true,
//           user: { select: { id: true, name: true } },
//         },
//       },
//     },
//   });

//   let recordedVideos = undefined;
//   if (foundStream?.cloudflareId) {
//     recordedVideos = await (
//       await fetch(
//         `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs/${foundStream.cloudflareId}/videos`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
//           },
//         }
//       )
//     ).json();
//   }

//   return {
//     props: {
//       ok: true,
//       message: "스트리밍 보기에 성공하였습니다.",
//       stream: JSON.parse(JSON.stringify(foundStream)),
//       recordedVideos: JSON.parse(JSON.stringify(recordedVideos)),
//     },
//     revalidate: 10,
//   };
// };

export default StreamDetail;
