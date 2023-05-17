import type { NextPage } from "next";
import Link from "next/link";
import FloatingButton from "@components/FloatingButton";
import Layout from "@components/Layout";
import useSWR, { mutate } from "swr";
import { Stream } from "@prisma/client";
import useUser from "@libs/client/useUser";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import PaginationButton from "@components/PaginationButton";
import Image from "next/image";
import { cls } from "@libs/utils";

interface StreamsResponse {
  ok: boolean;
  streams: Stream[];
  result: [];
}

const Streams: NextPage = () => {
  const { user } = useUser();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const { data } = useSWR<StreamsResponse>(`/api/streams?page=${page}&limit=${limit}`, {
    refreshInterval: 1000,
  });
  const onPrevBtn = (page: number) => {
    router.push(`${router.pathname}?page=${page - 1}&limit=${limit}`);
    setPage((prev) => prev - 1);
  };
  const onNextBtn = (page: number) => {
    router.push(`${router.pathname}?page=${page + 1}&limit=${limit}`);
    setPage((prev) => prev + 1);
  };
  return (
    <Layout seoTitle="라이브" title="라이브" hasTabBar notice>
      <div className="space-y-8 divide-y-2 px-4">
        {data?.streams?.map((stream) => (
          <Link key={stream.id} href={`/stream/${stream.id}`}>
            <a className="block px-4 pt-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-slate-300 shadow-sm">
                {stream.live ? (
                  <Image
                    layout="fill"
                    src={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
                    alt={stream.name}
                  />
                ) : (
                  <Image
                    layout="fill"
                    src={`https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg`}
                    alt={stream.name}
                  />
                )}
              </div>
              <div className="flex flex-row items-center justify-evenly space-x-32">
                <h1 className="mt-2 text-2xl font-bold text-gray-900">{stream.name}</h1>
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={cls(stream.live ? "text-red-500" : "text-gray-500", "h-6 w-6")}
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
            </a>
          </Link>
        ))}
      </div>
      <PaginationButton onClick={onPrevBtn} direction="prev" page={page} isGroup={true}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
        itemLength={data?.streams.length}
        isGroup={true}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
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
      </PaginationButton>
      <FloatingButton href="/stream/create" isGroup={true}>
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
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </FloatingButton>
    </Layout>
  );
};

export default Streams;
