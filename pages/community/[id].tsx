import type { NextPage } from "next";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useRouter } from "next/router";
import { Answer, Post, User } from "@prisma/client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { cls, parseId } from "@libs/utils";
import { useEffect, useState } from "react";
import RegDate from "@components/RegDate";
import ImgComponent from "@components/ImgComponent";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCommunityPost, writeCommunityAnswer, writeCommunityPost } from "apiLibs/posts";
import { handleLoadingAndError } from "@components/LoadingError";

interface AnswerForm {
  answer: string;
}

interface AnswerResponse {
  ok: boolean;
  response: Answer;
}

const CommunityPostDetail: NextPage = () => {
  const { register, handleSubmit, reset } = useForm<AnswerForm>();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const id = parseId(router.query.id);

  const { data, refetch, isLoading, isError, error } = useQuery({
    queryKey: ["community", id, page],
    queryFn: () => getCommunityPost(id!, page),
    enabled: !!id,
  });

  const {
    mutate: sendWonder,
    isPending: isLoadingWriteCommunityPost,
    isError: isErrorWriteCommunityPost,
    error: errorWriteCommunityPost,
  } = useMutation({
    mutationFn: writeCommunityPost,
    // onMutate: 서버 요청 전에 캐시 데이터를 optimistic하게 업데이트
    onMutate: async () => {
      // 현재 쿼리 무효화 방지
      await queryClient.cancelQueries({ queryKey: ["community", id, page] });

      // 현재 캐시된 데이터를 가져오기 (롤백을 위해 저장)
      const previousData = queryClient.getQueryData(["community", id, page]);

      // optimistic하게 캐시된 데이터를 업데이트
      queryClient.setQueryData(["community", id, page], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          post: {
            ...oldData.post,
            _count: {
              ...oldData.post._count,
              wonderings: oldData.isWondering
                ? oldData.post._count.wonderings - 1
                : oldData.post._count.wonderings + 1,
            },
          },
          isWondering: !oldData.isWondering,
        };
      });

      // 롤백을 위해 이전 데이터를 반환
      return { previousData };
    },
    // onError: 서버 요청이 실패하면 롤백
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["community", id, page], context.previousData);
      }
      console.error("Error toggling wonder status:", error);
    },
    // onSettled: 요청이 성공하거나 실패한 후 캐시를 다시 무효화하여 최신 상태로 갱신
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community", id, page] });
    },
  });

  const {
    mutate: sendAnswer,
    data: answerData,
    isPending: isLoadingWriteCommunityAnswer,
    isError: isErrorWriteCommunityAnswer,
    error: errorWriteCommunityAnswer,
  } = useMutation({
    mutationFn: writeCommunityAnswer,
    onSuccess: (data) => {
      console.log("Answer submitted successfully", data);
    },
    onError: (error) => {
      console.error("Error submitting answer:", error);
    },
  });

  // 답변 제출 시 호출되는 함수
  const handleSubmitAnswer = (answerData: AnswerForm) => {
    sendAnswer({ id: id!, answerData }); // mutate() 함수로 데이터를 서버에 전송
  };

  const onWonderClick = () => {
    if (!data) return;
    if (!isLoadingWriteCommunityPost) {
      sendWonder(id!);
    }
  };
  const onValid = (ansForm: AnswerForm) => {
    console.log("Reply button clicked!---andForm: ", ansForm);

    if (isLoadingWriteCommunityAnswer) return;
    handleSubmitAnswer(ansForm);
  };
  useEffect(() => {
    if (answerData && answerData.ok) {
      reset();
      // mutate();
      refetch();
    }
  }, [answerData, reset, refetch]);

  const isLoadingAny = isLoading || isLoadingWriteCommunityPost || isLoadingWriteCommunityAnswer;
  const isErrorAny = isError || isErrorWriteCommunityPost || isErrorWriteCommunityAnswer;
  const errorAny = error || errorWriteCommunityPost || errorWriteCommunityAnswer;

  const loadingOrError = handleLoadingAndError(isLoadingAny, isErrorAny, errorAny);
  if (loadingOrError) return loadingOrError;

  return (
    <Layout seoTitle="동네생활" title="동네생활" canGoBack backUrl={"/community"}>
      <div>
        <span className="my-3 ml-4 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          동네질문
        </span>
        <div className="mb-3 flex items-center space-x-3 border-b px-4 pb-3">
          <ImgComponent
            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${data?.post?.user?.avatar}/public`}
            width={40}
            height={40}
            clsProps="rounded-full"
            imgName={data?.post?.user?.name}
          />
          <div>
            <p className="text-sm font-medium text-gray-700">{data?.post?.user.name}</p>
            <Link href={`/profile/${data?.post?.user.id}`}>
              <a className="cursor-pointer text-xs font-medium text-gray-500">
                View profile &rarr;
              </a>
            </Link>
          </div>
        </div>
        <div>
          <div className="mt-2 px-4 text-gray-700">
            <span className="font-medium text-orange-500">Q. </span>
            {data?.post?.question}
          </div>
          <div className="mt-3 flex w-full space-x-5 border-b-[2px] border-t px-4 py-2.5  text-gray-700">
            <button
              onClick={onWonderClick}
              className={cls(
                data?.isWondering ? "text-green-700" : "",
                "flex items-center space-x-2 text-sm"
              )}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>궁금해요 {data?.post?._count?.wonderings}</span>
            </button>
            <span className="flex items-center space-x-2 text-sm">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              <span>답변 {data?.post?._count?.answers}</span>
            </span>
          </div>
        </div>
        <div className="my-5 space-y-5 px-4">
          {data?.post?.answers.map((ans) => (
            <div key={ans.id} className="flex items-start space-x-3">
              {ans.user.avatar ? (
                <ImgComponent
                  imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${ans.user.avatar}/public`}
                  width={32}
                  height={32}
                  clsProps="rounded-full"
                  imgName={ans.user.name}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-slate-200" />
              )}
              <div>
                <span className="block text-sm font-medium text-gray-700">{ans.user.name}</span>
                <RegDate className="text-sm font-medium text-gray-700" regDate={ans.createdAt} />
                <p className="mt-2 text-gray-700">{ans.answer}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit(onValid)} className="px-4">
          <TextArea
            register={register("answer", { required: true, minLength: 2 })}
            name="description"
            placeholder="Answer this question!"
          />
          <button className="mt-2 w-full rounded-md border border-transparent bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ">
            {isLoadingWriteCommunityAnswer ? "Loading..." : "Reply"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default CommunityPostDetail;
