import React, { useEffect, useState } from "react";
import Link from "next/link";
import { cls } from "@libs/utils";
import { useRouter } from "next/router";
import Head from "next/head";
import useSWR from "swr";
import useUser from "@libs/client/useUser";
interface LayoutProps {
  title?: string;
  canGoBack?: boolean;
  hasTabBar?: boolean;
  children: React.ReactNode;
  backUrl?: any;
  seoTitle: string;
  isProfile?: boolean;
  notice?: boolean;
  [key: string]: any;
}

interface NewChatProps {
  ok: boolean;
  newChat: [
    {
      recentMsg: {
        isNew: boolean;
        userId: number;
      };
    }
  ];
}

export default function Layout({
  title,
  canGoBack,
  hasTabBar,
  children,
  backUrl,
  seoTitle,
  isProfile,
  notice,
  ...rest
}: LayoutProps) {
  const { user } = useUser();
  const [isNew, setIsNew] = useState(false);
  const router = useRouter();
  const onClick = () => {
    if (backUrl === "back") {
      router.back();
    } else {
      router.push(backUrl);
    }
  };
  const { data } = useSWR<NewChatProps>(`/api/newchat`);
  useEffect(() => {
    data?.newChat?.map((chat) => {
      if (chat.recentMsg?.isNew && chat.recentMsg.userId !== user?.id) setIsNew(true);
    });
  }, [data, user]);

  const titleHead = `${seoTitle} | Carrot Market`;
  return (
    <div>
      <Head>
        <title>{titleHead}</title>
      </Head>
      <div
        {...rest}
        className="fixed top-0 z-10 flex h-12 w-full max-w-xl items-center justify-center border-b bg-white px-10 text-lg font-medium text-gray-800"
      >
        {canGoBack ? (
          <button onClick={onClick} className="absolute left-4 z-[2]">
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
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
          </button>
        ) : null}
        {title ? <span className={cls(canGoBack ? "mx-auto" : "", "")}>{title}</span> : null}
        {notice ? (
          <Link href="/blog">
            <a className="absolute right-4 rounded-md border-2 bg-orange-500 p-1 text-sm text-white hover:bg-orange-600">
              <span>공지사항</span>
            </a>
          </Link>
        ) : null}
      </div>
      <div className={cls("z-0 pt-12", hasTabBar ? "pb-24" : "", isProfile ? "pb-5 sm:pb-10" : "")}>
        {children}
      </div>
      {hasTabBar ? (
        <nav className="fixed bottom-0 flex w-full max-w-xl justify-between border-t bg-white px-10 pb-5 pt-3 text-xs text-gray-700">
          <Link href="/">
            <a
              className={cls(
                "flex flex-col items-center space-y-2 ",
                router.pathname === "/"
                  ? "text-orange-500"
                  : "transition-colors hover:text-gray-500"
              )}
            >
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                ></path>
              </svg>
              <span>홈</span>
            </a>
          </Link>
          <Link href="/community">
            <a
              className={cls(
                "flex flex-col items-center space-y-2 ",
                router.pathname === "/community"
                  ? "text-orange-500"
                  : "transition-colors hover:text-gray-500"
              )}
            >
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
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                ></path>
              </svg>
              <span>동네생활</span>
            </a>
          </Link>
          <Link href="/chats">
            <a
              className={cls(
                "flex flex-col items-center space-y-2",
                router.pathname === "/chats"
                  ? "text-orange-500"
                  : "transition-colors hover:text-gray-500"
              )}
            >
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
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
              {isNew && router.pathname !== "/chats" ? (
                <div className="absolute left-[15.5rem] top-0 text-orange-500 sm:left-72">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                </div>
              ) : null}
              <span>채팅</span>
            </a>
          </Link>
          <Link href="/stream">
            <a
              className={cls(
                "flex flex-col items-center space-y-2 ",
                router.pathname === "/stream"
                  ? "text-orange-500"
                  : "transition-colors hover:text-gray-500"
              )}
            >
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
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                ></path>
              </svg>
              <span>라이브</span>
            </a>
          </Link>
          <Link href="/profile">
            <a
              className={cls(
                "flex flex-col items-center space-y-2 ",
                router.pathname === "/profile"
                  ? "text-orange-500"
                  : "transition-colors hover:text-gray-500"
              )}
            >
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                ></path>
              </svg>
              <span>나의 댕댕마켓</span>
            </a>
          </Link>
        </nav>
      ) : null}
    </div>
  );
}
