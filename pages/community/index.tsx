import type { NextPage } from "next";
import Link from "next/link";
import FloatingButton from "@components/FloatingButton";
import Layout from "@components/Layout";
import useSWR from "swr";
import { Post, User, Wondering } from "@prisma/client";
import useCoords from "@libs/client/useCoords";
import RegDate from "@components/RegDate";
import { useEffect, useState } from "react";
import PaginationButton from "@components/PaginationButton";
import { cls } from "@libs/utils";
import useUser from "@libs/client/useUser";
import { useRouter } from "next/router";
import client from "@libs/client/client";

interface PostWithUser extends Post {
  user: User;
  wonderings: Wondering[];
  _count: {
    wonderings: number;
    answer: number;
  };
}

interface PostsResponse {
  // ok: boolean;
  posts: PostWithUser[];
}

const Community: NextPage<PostsResponse> = ({ posts }) => {
  const { user } = useUser();
  // const router = useRouter();
  // const { latitude, longitude } = useCoords();
  // const [page, setPage] = useState(1);
  // const [isWonder, setIsWonder] = useState(false);
  // const { data } = useSWR<PostsResponse>(
  //   latitude && longitude
  //     ? `/api/posts?page=${page}&latitude=${latitude}&longitude=${longitude}`
  //     : null
  // );
  // const onPrevBtn = () => {
  //   setPage((prev) => prev - 1);
  // };
  // const onNextBtn = () => {
  //   setPage((prev) => prev + 1);
  // };
  // useEffect(() => {
  //   data?.posts.map((post) => {
  //     post.wonderings.map((who) => {
  //       if (who.userId === user?.id) {
  //         setIsWonder(true);
  //       } else {
  //         setIsWonder(false);
  //       }
  //     });
  //   });
  // }, [data, router]);
  return (
    <Layout seoTitle="동네생활" title="동네생활" hasTabBar notice>
      <div className="space-y-6 px-4 py-4">
        {posts?.map((post) => (
          <Link key={post.id} href={`/community/${post.id}`}>
            <a className="flex cursor-pointer flex-col items-start pt-4">
              <span className="ml-4 flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                동네질문
              </span>
              <div className="mt-2 px-4 text-gray-700">
                <span className="font-medium text-orange-500">Q. </span>
                {post.question}
              </div>
              <div className="mt-5 flex w-full items-center justify-between px-4 text-xs font-medium text-gray-500">
                <span>{post.user.name}</span>
                <RegDate regDate={post.createdAt} />
              </div>
              <div className="mt-3 flex w-full space-x-5 border-t px-4 py-2.5   text-gray-700">
                <span
                  className={cls(
                    // isWonder ? "text-green-700" : "",
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
                  <span>궁금해요 {post._count?.wonderings}</span>
                </span>
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
                  <span>답변 {post._count?.answer}</span>
                </span>
              </div>
            </a>
          </Link>
        ))}
      </div>
      {/* <PaginationButton
        onClick={onPrevBtn}
        direction="prev"
        page={page}
        isGroup={true}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z"
          />
        </svg>
      </PaginationButton>
      <PaginationButton
        onClick={onNextBtn}
        direction="next"
        page={page}
        itemLength={data?.posts.length}
        isGroup={true}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </PaginationButton> */}
      <FloatingButton href="/community/write" isGroup={true}>
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          ></path>
        </svg>
      </FloatingButton>
    </Layout>
  );
};

export async function getStaticProps() {
  const posts = await client?.post.findMany({ include: { user: true } });
  return {
    props: {
      posts: JSON.parse(JSON.stringify(posts)),
    },
  };
}

export default Community;
