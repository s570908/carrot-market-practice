import type { NextPage } from "next";
import Layout from "@components/Layout";
import TextArea from "@components/TextArea";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Answer, Post, User } from "@prisma/client";
import Link from "next/link";
import { useForm } from "react-hook-form";
import useMutation from "@libs/client/useMutation";
import { cls } from "@libs/utils";
import { useEffect, useState } from "react";
import RegDate from "@components/RegDate";
import ImgComponent from "@components/Img-component";

interface AnswerWithUser extends Answer {
  user: User;
}

interface PostWithUser extends Post {
  user: User;
  _count: {
    answer: number;
    wonderings: number;
  };
  answer: AnswerWithUser[];
}

interface CommunityPostResponse {
  ok: boolean;
  post: PostWithUser;
  isWondering: boolean;
}

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
  const { data, mutate } = useSWR<CommunityPostResponse>(
    router.query.id ? `/api/posts/${router.query.id}?page=${page}` : null
  );
  const [wonder, { loading }] = useMutation(`/api/posts/${router.query.id}/wonder`);
  const [sendAnswer, { data: answerData, loading: ansLoading }] = useMutation<AnswerResponse>(
    `/api/posts/${router.query.id}/answers`
  );
  const onWonderClick = () => {
    if (!data) return;
    mutate(
      {
        ...data,
        post: {
          ...data?.post,
          _count: {
            ...data?.post._count,
            wonderings: data.isWondering
              ? +data?.post._count.wonderings - 1
              : +data?.post._count.wonderings + 1,
          },
        },
        isWondering: !data.isWondering,
      },
      false
    );
    if (!loading) {
      wonder({});
    }
  };
  const onValid = (ansForm: AnswerForm) => {
    if (ansLoading) return;
    sendAnswer(ansForm);
  };
  useEffect(() => {
    if (answerData && answerData.ok) {
      reset();
      mutate();
    }
  }, [answerData, reset, mutate]);
  return (
    <Layout seoTitle="동네생활" title="동네생활" canGoBack backUrl={"/community"}>
      <div>
        <span className="my-3 ml-4 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
          동네질문
        </span>
        <div className="mb-3 flex items-center space-x-3 border-b px-4 pb-3">
          <ImgComponent
            imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
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
              <span>답변 {data?.post?._count?.answer}</span>
            </span>
          </div>
        </div>
        <div className="my-5 space-y-5 px-4">
          {data?.post?.answer?.map((ans) => (
            <div key={ans.id} className="flex items-start space-x-3">
              {ans.user.avatar ? (
                <ImgComponent
                  imgAdd={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
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
            {ansLoading ? "Loading..." : "Reply"}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default CommunityPostDetail;
