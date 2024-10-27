import useSWR from "swr";
import client from "libs/client/client";
import Loading from "@components/Loading";
// import useMutation from "libs/client/useMutation";
import DeleteButton from "@components/delete-button";
import StreamMessage from "@components/stream-message";
import FloatingButton from "@components/FloatingButton";
import RecordedVideoItem from "@components/items/recorded-video-item";
import { Stream, User } from "@prisma/client";
import { useForm } from "react-hook-form";
import {
  DetailedHTMLProps,
  HTMLAttributes,
  MutableRefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { RiVideoAddFill } from "react-icons/ri";
import { NextRouter, useRouter } from "next/router";
import {
  GetStaticPaths,
  GetStaticProps,
  GetStaticPropsContext,
  NextPage,
} from "next";
import useUser from "@libs/client/useUser";
import Layout from "@components/Layout";
import { ResponseType } from "@libs/server/withHandler";
import Message from "@components/Message";
import { useIntersectionObserver } from "@libs/client/useIntersectionObserver";
import { FiChevronsDown } from "react-icons/fi";
import { cls } from "@libs/utils";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "react-query";

interface StreamDetailFormData {
  message: string;
}

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
  status: {
    state: string;
    pctComplete: string;
    errorReasonCode: string;
    errorReasonText: string;
  };
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

interface StreamDetailResult extends ResponseType {
  stream?: StreamWithMessages;
  recordedVideos?: RecordedVideos;
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

const StreamDetail: NextPage<StreamDetailResult> = ({
  stream,
  recordedVideos,
}) => {
  const { user } = useUser();
  const router: NextRouter = useRouter();
  const [showStreamInfo, setShowStreamInfo] = useState(false);
  const [newMessageSubmitted, setNewMessageSubmitted] = useState(false);
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const entry = useIntersectionObserver(scrollRef, {
    root: null,
    rootMargin: "0%",
    threshold: 0, // visibleRef가 조금이라도 보이게 되면 true,
    freezeOnceVisible: false, // 계속하여 감지하겠다.
  });

  console.log("Entry.isIntersecting: ", entry?.isIntersecting);

  // const [streamMessageAddMutation, { loading: streamMessageAddLoading }] =
  //   useMutation(`/api/streams/${router.query.id}/messages`);

  const addStreamMessage = async (messageData: any) => {
    const { data } = await axios.post(
      `/api/streams/${router.query.id}/messages`,
      messageData
    );
    return data;
  };

  const {
    mutate: streamMessageAddMutation,
    isLoading: streamMessageAddLoading,
  } = useMutation(
    async ({ message }: { message: string }) => {
      const { data } = await axios.post(
        `/api/streams/${router.query.id}/messages`,
        { message }
      );
      return data;
    },
    {
      onMutate: async ({ message }) => {
        // 새로운 메시지를 바로 추가하는 낙관적 업데이트
        const newMessage = {
          id: Date.now(),
          message,
          user: {
            ...user,
          },
        };

        // 이전 데이터 백업
        await queryClient.cancelQueries(["stream", router.query.id]);
        const previousData = queryClient.getQueryData([
          "stream",
          router.query.id,
        ]);

        // 업데이트된 메시지 리스트로 바로 반영
        queryClient.setQueryData(["stream", router.query.id], (old: any) => {
          if (old && old.stream) {
            return {
              ...old,
              stream: {
                ...old.stream,
                messages: [...old.stream.messages, newMessage],
              },
            };
          }
          return old;
        });

        return { previousData };
      },
      onError: (error, _, context) => {
        // 오류 발생 시 이전 데이터로 복구
        if (context?.previousData) {
          queryClient.setQueryData(
            ["stream", router.query.id],
            context.previousData
          );
        }
        console.error("Failed to add message:", error);
      },
      onSettled: () => {
        // 요청이 성공하든 실패하든 다시 쿼리 데이터를 가져와 동기화
        queryClient.invalidateQueries(["stream", router.query.id]);
      },
    }
  );

  // const [
  //   streamDeleteMutation,
  //   { data: streamDeleteData, loading: streamDeleteLoading },
  // ] = useMutation<any>(`/api/streams/${router.query.id}/delete`);

  const deleteStream = async (id: string) => {
    const { data } = await axios.delete(`/api/streams/${id}/delete`);
    return data;
  };

  const {
    mutate: streamDeleteMutation,
    data: streamDeleteData,
    isLoading: streamDeleteLoading,
  } = useMutation((id: string) => deleteStream(id), {
    onSuccess: () => {
      console.log("Stream deleted successfully");
      queryClient.invalidateQueries("streams"); // 'streams' 데이터를 다시 불러오기 위해 쿼리 무효화
    },
    onError: (error) => {
      console.error("Failed to delete stream:", error);
    },
  });

  const { register, handleSubmit, getValues, reset } =
    useForm<StreamDetailFormData>({
      defaultValues: { message: "" },
    });

  // const { data, mutate } = useSWR<ResponseType>(
  //   router.query.id ? `/api/streams/${router.query.id}` : null,
  //   { refreshInterval: 1000 }
  // );

  const fetchStream = async (id: number) => {
    const { data } = await axios.get<ResponseType>(`/api/streams/${id}`);
    return data;
  };

  const { data: streamData } = useQuery<ResponseType>(
    ["stream", router?.query?.id], // 쿼리 키 설정
    () =>
      fetchStream(
        Number(
          Array.isArray(router?.query?.id)
            ? router.query.id[0]
            : router?.query?.id
        )
      ), // id를 안전하게 number로 변환
    {
      enabled: !!router?.query?.id, // id가 존재할 때만 쿼리 실행
      // refetchInterval: 1000, // 1초마다 데이터 리프레시
    }
  );

  // console.log(
  //   "strem/[id]/index.tsx---/api/streams/${router.query.id} data: ",
  //   JSON.stringify(data, null, 2)
  // );

  // const { data: viewsData } = useSWR<ViewsResult>(
  //   streamData?.stream?.cloudflareId
  //     ? `https://videodelivery.net/${streamData?.stream?.cloudflareId}/views`
  //     : null,
  //   {
  //     refreshInterval: 1000,
  //   }
  // );

  const fetchViews = async (cloudflareId: string) => {
    const { data } = await axios.get<ViewsResult>(
      `https://videodelivery.net/${cloudflareId}/views`
    );
    return data;
  };

  const { data: viewsData } = useQuery<ViewsResult>(
    ["views", streamData?.stream?.cloudflareId], // 쿼리 키로 cloudflareId를 사용
    () => fetchViews(streamData?.stream?.cloudflareId as string), // 데이터를 가져오는 함수
    {
      enabled: !!streamData?.stream?.cloudflareId, // cloudflareId가 존재할 때만 쿼리 실행
      // refetchInterval: 1000, // 1초마다 데이터 리프레시
    }
  );

  // console.log(
  //   "strem/[id]/index.tsx---https://videodelivery.net/${data?.stream?.cloudflareId}/views viewsData: ",
  //   JSON.stringify(viewsData, null, 2)
  // );

  // const { data: lifecycleData } = useSWR<LifecycleResult>(
  //   streamData?.stream?.cloudflareId
  //     ? `https://videodelivery.net/${streamData?.stream?.cloudflareId}/lifecycle`
  //     : null,
  //   {
  //     refreshInterval: 1000,
  //   }
  // );

  const fetchLifecycle = async (cloudflareId: string) => {
    const { data } = await axios.get<LifecycleResult>(
      `https://videodelivery.net/${cloudflareId}/lifecycle`
    );
    return data;
  };

  const {
    data: lifecycleData,
    isLoading,
    error,
  } = useQuery<LifecycleResult>(
    ["lifecycle", streamData?.stream?.cloudflareId], // 쿼리 키로 cloudflareId를 사용
    () => fetchLifecycle(streamData?.stream?.cloudflareId as string), // 데이터를 가져오는 함수
    {
      enabled: !!streamData?.stream?.cloudflareId, // cloudflareId가 존재할 때만 쿼리 실행
      // refetchInterval: 1000, // 1초마다 데이터 리프레시
    }
  );

  // console.log(
  //   "strem/[id]/index.tsx---https://videodelivery.net/${data?.stream?.cloudflareId}/lifecycle lifecycleData: ",
  //   JSON.stringify(lifecycleData, null, 2)
  // );

  const onValid = async () => {
    if (streamMessageAddLoading === true) {
      return;
    }

    const { message } = getValues();
    // const newMessage = {
    //   id: Date.now(),
    //   message: message,
    //   user: {
    //     ...user,
    //   },
    // };

    // mutate((prev) => {
    //   if (prev && prev.stream) {
    //     return {
    //       ...prev,
    //       stream: {
    //         ...prev.stream,
    //         messages: [...prev.stream?.messages, newMessage],
    //       },
    //     };
    //   }
    // }, false);

    setNewMessageSubmitted(true);

    streamMessageAddMutation({ message });
    reset();
  };

  const handleDeleteStream = async () => {
    if (streamDeleteLoading === true) {
      return;
    }
    if (typeof router.query.id === "string") {
      streamDeleteMutation(router.query.id); // id를 문자열로 전달
    } else if (Array.isArray(router.query.id)) {
      streamDeleteMutation(router.query.id[0]); // id가 배열일 경우 첫 번째 요소 사용
    } else {
      console.error("Invalid stream ID");
    }
  };

  const handleToggleStreamInfo = () => {
    setShowStreamInfo((showStreamInfo) => !showStreamInfo);
  };

  useEffect(() => {
    if (streamDeleteData?.ok === true) {
      router.push("/stream");
    }
  }, [streamDeleteData, router]);

  useEffect(() => {
    if (streamData?.ok === false) {
      router.push("/stream");
    }
  }, [streamData, router]);

  const scrollToBottom = (
    elementRef: MutableRefObject<HTMLDivElement | null>
  ) => {
    if (elementRef) {
      elementRef.current!.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };
  //
  // 채팅창의 스크롤을 맨 밑으로 유지
  // useEffect(() => {
  //   const msgBox = document.querySelector("#msg") as HTMLElement;
  //   msgBox.scrollTop = msgBox.scrollHeight;
  // }, [data?.ok]);
  // ref: https://velog.io/@lumpenop/TIL-nextron-React-%EC%B1%84%ED%8C%85%EC%B0%BD-%EA%B5%AC%ED%98%84-%EC%9E%85%EB%A0%A5-%EC%8B%9C-%EC%B1%84%ED%8C%85%EC%B0%BD-%EC%95%84%EB%9E%98%EB%A1%9C-%EC%8A%A4%ED%81%AC%EB%A1%A4-220724

  const isScrollToBottom = newMessageSubmitted === true;
  useEffect(() => {
    scrollToBottom(scrollRef);
    setNewMessageSubmitted(false);
  }, [isScrollToBottom]);

  return (
    <Layout
      seoTitle={`${streamData?.stream.name} || 라이브`}
      title={`${streamData?.stream.user.name}의 라이브`}
      canGoBack
      backUrl={"/stream"}
    >
      <div className="wrapper">
        <div className="mx-auto h-full max-w-[700px] pb-8 pt-8">
          <div>
            <div className="w-full border rounded-lg aspect-video">
              {streamData?.stream?.cloudflareId ? (
                <iframe
                  src={`https://iframe.videodelivery.net/${streamData?.stream?.cloudflareId}?preload=true&poster=https://iframe.videodelivery.net/${streamData?.stream?.cloudflareId}/thumbnails/thumbnail.jpg?time=2s`}
                  allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                  allowFullScreen={true}
                  className="w-full h-full rounded-lg"
                ></iframe>
              ) : (
                <div className="w-full h-full rounded-lg bg-gray-50">
                  <div className="flex items-center justify-center h-full">
                    <Loading color="orange" size={36} />
                  </div>
                </div>
              )}
            </div>
            <div className="relative mb-5 mt-3 h-[60px]">
              <h1 className="text-xl">
                {lifecycleData?.live === true && "[생] "}
                {stream?.name}
              </h1>
              {lifecycleData?.live === false ? (
                <p className="mt-1.5 text-base text-gray-800">
                  {stream?.description}
                </p>
              ) : null}
              {lifecycleData?.live === true ? (
                <p className="mt-1.5 text-[14px] text-gray-600">
                  현재 {viewsData?.liveViewers}명 시청 중
                </p>
              ) : null}
              {streamData?.stream?.userId === user?.id ? (
                <div className="absolute top-0 right-0 w-full">
                  <DeleteButton
                    onClick={handleDeleteStream}
                    text="스트림 삭제"
                    loading={streamDeleteLoading}
                  />
                  <button
                    onClick={handleToggleStreamInfo}
                    type="button"
                    className="absolute right-0 top-9 cursor-pointer rounded-md border px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-50"
                  >
                    스트림 정보
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          {/* 스트림 정보 보기 */}
          {showStreamInfo === true ? (
            <div className="flex flex-col px-5 py-5 mb-2 space-y-4 bg-gray-100 rounded-md">
              <div>
                <p className="text-[14px] font-semibold">서버 URL</p>
                <span className="text-[14px]">
                  {streamData?.stream?.cloudflareUrl}
                </span>
              </div>
              <div>
                <p className="text-[14px] font-semibold">스트림 키</p>
                <span className="text-[14px]">
                  {streamData?.stream?.cloudflareKey}
                </span>
              </div>
            </div>
          ) : null}

          <div className="relative border border-gray-100 rounded-lg">
            <div id="msg" className="flex-col overflow-y-scroll h-80">
              {streamData?.stream?.messages ? (
                <>
                  {streamData?.stream?.messages.map((message: any) => (
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
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loading color="orange" size={36} />
                </div>
              )}
              <div ref={scrollRef}></div>
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
            </div>
            <form
              onSubmit={handleSubmit(onValid)}
              className="w-full px-1 py-1 mt-10 border-t"
            >
              <div className="relative w-full px-2 py-2 bg-white rounded-md outline-none">
                <input
                  {...register("message", { required: true, maxLength: 80 })}
                  maxLength={80}
                  placeholder={
                    user === undefined
                      ? "로그인 후 이용가능합니다."
                      : "메세지를 입력해주세요."
                  }
                  className="w-full text-[15px] outline-none placeholder:text-gray-300"
                />
                <button
                  disabled={user === undefined}
                  type="submit"
                  className="absolute bottom-1 right-0.5 flex h-8 items-end rounded-md bg-orange-400 px-4 py-1.5 text-sm text-white hover:bg-orange-500"
                >
                  {streamMessageAddLoading === true ? (
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

          {/* 최근 방송 */}
          {recordedVideos?.result.length !== 0 ? (
            <div className="mt-12">
              <h2 className="mb-3 font-medium">최근 방송</h2>
              <div className="grid grid-cols-2 gap-x-5 gap-y-14">
                {recordedVideos?.result.map((recordedVideo) => (
                  <RecordedVideoItem
                    key={recordedVideo.uid}
                    preview={recordedVideo.preview}
                    meta={recordedVideo.meta}
                    duration={recordedVideo.duration}
                    created={recordedVideo.created}
                  />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <FloatingButton
          href={user ? "/streams/create" : "/login"}
          isGroup={true}
          yPosition="top-5"
        >
          <RiVideoAddFill />
        </FloatingButton>
      </div>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps = async (
  context: GetStaticPropsContext
) => {
  console.log(
    "stream/[id].index.tsx-getStaticProps--context?.params?.id: ",
    context?.params?.id
  );

  if (!context?.params?.id) {
    return {
      props: {},
    };
  }

  const foundStream = await client.stream.findUnique({
    where: { id: +context.params.id },
    include: {
      messages: {
        select: {
          id: true,
          message: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  });

  let recordedVideos = undefined;
  if (foundStream?.cloudflareId) {
    recordedVideos = await (
      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/stream/live_inputs/${foundStream.cloudflareId}/videos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`,
          },
        }
      )
    ).json();
  }

  return {
    props: {
      ok: true,
      message: "스트리밍 보기에 성공하였습니다.",
      stream: JSON.parse(JSON.stringify(foundStream)),
      recordedVideos: JSON.parse(JSON.stringify(recordedVideos)),
    },
    revalidate: 10,
  };
};

export default StreamDetail;
