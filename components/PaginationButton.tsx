import { cls } from "@libs/utils";
import React from "react";

interface PaginationButton {
  children: React.ReactNode;
  rOpt?: number;
  direction?: "prev" | "next";
  page: number;
  itemLength?: any;
  isProfile?: boolean;
  isGroup?: boolean;
  [key: string]: any;
}

export default function PaginationButton({
  children,
  direction,
  page,
  itemLength,
  onClick,
  rest,
  isProfile,
  isGroup,
}: PaginationButton) {
  return (
    <button
      {...rest}
      onClick={onClick}
      className={cls(
        (isGroup && direction === "next") || (direction === "prev" && page <= 1)
          ? "z-10 group-hover:bottom-40"
          : "z-0 group-hover:bottom-56",
        direction === "prev" && page <= 1 ? "hidden" : "",
        (direction === "next" || isProfile) && itemLength < 1
          ? "bg-gray-500 text-gray-800 hover:bg-gray-500"
          : isProfile
          ? "bottom-10"
          : "bottom-24",
        isProfile && itemLength < 1 ? "hidden" : "",
        `fixed bottom-24 right-5 flex aspect-square w-14 cursor-pointer items-center justify-center  rounded-full border-0 border-transparent bg-orange-400 text-white shadow-xl transition-all hover:bg-orange-500 sm:right-[8%] md:right-[15%] lg:right-1/4 xl:right-[30%] 2xl:right-[36%]`
      )}
      disabled={direction === "next" && itemLength < 1 ? true : false}
    >
      {children}
    </button>
  );
}
