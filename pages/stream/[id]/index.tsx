import client from "libs/client/client";
import Loading from "@components/Loading";
import DeleteButton from "@components/delete-button";
import StreamMessage from "@components/stream-message";
import FloatingButton from "@components/FloatingButton";
import RecordedVideoItem from "@components/items/recorded-video-item";
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
import { GetStaticPaths, GetStaticProps, GetStaticPropsContext, NextPage } from "next";
import useUser from "@libs/client/useUser";
import Layout from "@components/Layout";
import Message from "@components/Message";
import { useIntersectionObserver } from "@libs/client/useIntersectionObserver";
import { FiChevronsDown } from "react-icons/fi";
import { cls, parseId } from "@libs/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ApiResponseType,
  LifecycleResult,
  MessageData,
  StreamDetailFormData,
  StreamDetailResult,
  StreamMessageResponse,
  ViewsResult,
} from "apiLibs/atypes";
import {
  deleteStream,
  getLifecycle,
  getStreamDetail,
  getViews,
  writeStreamMessage,
} from "apiLibs/streams";
import { handleLoadingAndError } from "@components/LoadingError";

const StreamDetail: NextPage<StreamDetailResult> = ({ stream, recordedVideos }) => {
  const { user } = useUser();
  const router: NextRouter = useRouter();
  const id = (router.query.id !== undefined ? parseId(router.query.id) : 0) ?? 0;
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

  //const id = parseId(router.query.id);

  console.log("Entry.isIntersecting: ", entry?.isIntersecting);

  const {
    mutate: streamMessageAdd,
    isPending: isLoadingStreamMessageAdd,
    isError: isErrorStreamMessageAdd,
    error: errorStreamMessageAdd,
  } = useMutation({
    mutationFn: (messageData: MessageData) => writeStreamMessage({ id: id!, messageData }),
    onMutate: async ({ message }) => {
      const newMessage = {
        id: Date.now(),
        message,
        user: {
          ...user,
        },
      };

      await queryClient.cancelQueries({ queryKey: ["stream", id] });
      const previousData = queryClient.getQueryData(["stream", id]);

      queryClient.setQueryData(["stream", id], (old: any) => {
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
      if (context?.previousData) {
        queryClient.setQueryData(["stream", id], context.previousData);
      }
      console.error("Failed to add message:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["stream", id] });
    },
  });

  const {
    mutate: streamDelete,
    data: streamDeleteData,
    isPending: isLoadingStreamDelete,
    isError: isErrorStreamDelete,
    error: errorStreamDelete,
  } = useMutation({
    mutationFn: deleteStream,
    onSuccess: () => {
      console.log("Stream deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["streams"] });
    },
    onError: (error) => {
      console.error("Failed to delete stream:", error);
    },
  });

  const { register, handleSubmit, getValues, reset } = useForm<StreamDetailFormData>({
    defaultValues: { message: "" },
  });

  const {
    data: streamData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["stream", id],
    queryFn: () => getStreamDetail(id!),
    enabled: !!id,
  });

  const {
    data: viewsData,
    isLoading: isLoadingViews,
    isError: isErrorViews,
    error: errorViews,
  } = useQuery({
    queryKey: ["views", streamData?.stream?.cloudflareId],
    queryFn: () => getViews(streamData?.stream?.cloudflareId!),
    enabled: !!streamData?.stream?.cloudflareId,
  });

  const {
    data: lifecycleData,
    isLoading: isLoadingLifecycle,
    isError: isErrorLifecycle,
    error: errorLifecycle,
  } = useQuery({
    queryKey: ["lifecycle", streamData?.stream?.cloudflareId],
    queryFn: () => getLifecycle(streamData?.stream?.cloudflareId!),
    enabled: !!streamData?.stream?.cloudflareId,
  });

  const onValid = async () => {
    if (isLoadingStreamMessageAdd) return;

    const { message } = getValues();
    setNewMessageSubmitted(true);
    streamMessageAdd({ message });
    reset();
  };

  const handleDeleteStream = async () => {
    if (isLoadingStreamDelete) return;
    streamDelete(id.toString());
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

  const scrollToBottom = (elementRef: MutableRefObject<HTMLDivElement | null>) => {
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

  const isLoadingAny =
    isLoading ||
    isLoadingStreamMessageAdd ||
    isLoadingStreamDelete ||
    isLoadingViews ||
    isLoadingLifecycle;
  const isErrorAny =
    isError || isErrorStreamMessageAdd || isErrorStreamDelete || isErrorViews || isErrorLifecycle;
  const errorAny =
    error || errorStreamMessageAdd || errorStreamDelete || errorViews || errorLifecycle;
  const loadingOrError = handleLoadingAndError(isLoadingAny, isErrorAny, errorAny);
  if (loadingOrError) return loadingOrError;

  return (
    <Layout
      seoTitle={`${streamData?.stream?.name} || 라이브`}
      title={`${streamData?.stream?.user.name}의 라이브`}
      canGoBack
      backUrl={"/stream"}
    >
      <div className="wrapper">
        <div className="mx-auto h-full max-w-[700px] pb-8 pt-8">
          <div>
            <div className="aspect-video w-full rounded-lg border">
              {streamData?.stream?.cloudflareId ? (
                <iframe
                  src={`https://iframe.videodelivery.net/${streamData?.stream?.cloudflareId}?preload=true&poster=https://iframe.videodelivery.net/${streamData?.stream?.cloudflareId}/thumbnails/thumbnail.jpg?time=2s`}
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
            </div>
            <div className="relative mb-5 mt-3 h-[60px]">
              <h1 className="text-xl">
                {lifecycleData?.live === true && "[생] "}
                {stream?.name}
              </h1>
              {lifecycleData?.live === false ? (
                <p className="mt-1.5 text-base text-gray-800">{stream?.description}</p>
              ) : null}
              {lifecycleData?.live === true ? (
                <p className="mt-1.5 text-[14px] text-gray-600">
                  현재 {viewsData?.liveViewers}명 시청 중
                </p>
              ) : null}
              {streamData?.stream?.userId === user?.id ? (
                <div className="absolute right-0 top-0 w-full">
                  <DeleteButton
                    onClick={handleDeleteStream}
                    text="스트림 삭제"
                    loading={isLoadingStreamDelete}
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
            <div className="mb-2 flex flex-col space-y-4 rounded-md bg-gray-100 px-5 py-5">
              <div>
                <p className="text-[14px] font-semibold">서버 URL</p>
                <span className="text-[14px]">{streamData?.stream?.cloudflareUrl}</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold">스트림 키</p>
                <span className="text-[14px]">{streamData?.stream?.cloudflareKey}</span>
              </div>
            </div>
          ) : null}

          <div className="relative rounded-lg border border-gray-100">
            <div id="msg" className="h-80 flex-col overflow-y-scroll">
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
                <div className="flex h-full items-center justify-center">
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
            <form onSubmit={handleSubmit(onValid)} className="mt-10 w-full border-t px-1 py-1">
              <div className="relative w-full rounded-md bg-white px-2 py-2 outline-none">
                <input
                  {...register("message", { required: true, maxLength: 80 })}
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
                  {isLoadingStreamMessageAdd === true ? (
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
        <FloatingButton href={user ? "/streams/create" : "/login"} isGroup={true} yPosition="top-5">
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

export const getStaticProps: GetStaticProps = async (context: GetStaticPropsContext) => {
  console.log("stream/[id].index.tsx-getStaticProps--context?.params?.id: ", context?.params?.id);

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
