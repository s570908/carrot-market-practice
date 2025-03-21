import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext, NextPage } from "next";
import Layout from "@components/Layout";
import Message from "@components/Message";
import { useRouter } from "next/router";
import { Stream, User } from "@prisma/client";
import useUser from "@libs/client/useUser";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { cls, parseId } from "@libs/utils";
import { ResponseType } from "@libs/server/withHandler";
import Loading from "@components/Loading";
import { getStreamDetail, getViews, getLifecycle, writeStreamMessage } from "@/apiLibs/streams";

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

interface MessageForm {
  message: string;
}

const StreamDetail: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const id = (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;
  const queryClient = useQueryClient();

  // 라이브스트림 메시지 리액트 훅 폼
  const { register, handleSubmit, reset } = useForm<MessageForm>();

  // 스트림 데이터 쿼리
  const { data, refetch } = useQuery({
    queryKey: ["stream", id],
    queryFn: () => getStreamDetail(id),
    enabled: Boolean(id),
    refetchInterval: 1000,
  });

  // 함수형 업데이트와 SWR의 기능을 모두 지원하는 mutate 함수
  const mutate = (updater?: ((prev: ResponseType | undefined) => ResponseType) | ResponseType) => {
    // 1. updater가 없으면 refetch() 실행
    if (updater === undefined) {
      refetch();
      return;
    }

    // 2. updater가 함수이면 함수형 업데이트 실행
    if (typeof updater === "function") {
      queryClient.setQueryData(["stream", id], (oldData: any) => updater(oldData));
      return;
    }

    // 3. updater가 데이터 객체이면 직접 업데이트
    queryClient.setQueryData(["stream", id], updater);
  };

  // 조회수 데이터 쿼리
  const { data: viewsData } = useQuery({
    queryKey: ["streamViews", data?.stream?.cloudflareId],
    queryFn: () => getViews(data!.stream!.cloudflareId),
    enabled: Boolean(data?.stream?.cloudflareId),
    refetchInterval: 1000,
  });

  // 라이프사이클 데이터 쿼리
  const { data: lifecycleData } = useQuery({
    queryKey: ["streamLifecycle", data?.stream?.cloudflareId],
    queryFn: () => getLifecycle(data!.stream!.cloudflareId),
    enabled: Boolean(data?.stream?.cloudflareId),
    refetchInterval: 1000,
  });

  console.log("stream.[id].tsx---data: ", JSON.stringify(data, null, 2));

  // 존재하지 않는 라이브스트림 접근시, 목록으로 replace
  useEffect(() => {
    if (data?.ok === false) {
      router.replace("/streams");
    }
  }, [data, router]);

  // 라이브스트림 메시지 생성 API (POST)
  const {
    mutate: sendMessage,
    isPending: loading,
    data: sendMessageData,
  } = useMutation({
    mutationFn: (formData: MessageForm) => writeStreamMessage({ messageData: formData, id: id }),
    onSuccess: () => {
      // 메시지 전송 성공 후 스트림 데이터 캐시 무효화 (선택 사항)
      // queryClient.invalidateQueries({ queryKey: ['stream', id] });
    },
  });

  const onValid = (form: MessageForm) => {
    if (loading) return;
    reset();

    // 현재 데이터를 가져와서 직접 수정
    const currentData = queryClient.getQueryData(["stream", id]) as ResponseType;
    if (currentData) {
      // 새 메시지가 추가된 데이터 생성
      const newData = {
        ...currentData,
        stream: {
          ...currentData.stream,
          messages: [
            ...currentData.stream?.messages!,
            { id: Date.now(), message: form.message, user: { ...user } },
          ],
        },
      };

      // 수정된 데이터로 캐시 업데이트
      mutate(newData);
    }

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
      seoTitle={`${data?.stream?.name || "라이브"} || 라이브`}
      title={`${data?.stream?.user?.name || "사용자"}의 라이브`}
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
          <h1 className="text-3xl font-bold text-gray-900">{data?.stream?.name}</h1>
          <div className="flex flex-row items-center justify-between">
            <span className="mt-3 text-2xl text-gray-900">￦ {data?.stream?.price}</span>
            <span className="mt-3 text-base text-gray-900">
              <span className="font-bold">판매자: </span>
              {data?.stream?.user.name}
            </span>
          </div>
          <p className="my-6 text-gray-700 ">{data?.stream?.description}</p>
          {user?.id === data?.stream?.userId ? (
            <div className="flex flex-col space-y-3 overflow-x-scroll rounded-md bg-orange-300 p-5">
              <span className="font-medium">Stream Keys (secret)</span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">URL:</span>
                {data?.stream?.cloudflareUrl}
              </span>
              <span className="text-gray-600">
                <span className="font-medium text-gray-900">Key:</span>
                {data?.stream?.cloudflareKey}
              </span>
            </div>
          ) : null}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Chat</h2>
          <div id="msg" className="h-[38rem] space-y-2 overflow-y-scroll px-4 py-8">
            {data?.stream?.messages?.map((message: any) => (
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
