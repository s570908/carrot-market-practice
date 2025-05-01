import { cls } from "@libs/utils";
import React from "react";

interface ButtonProps {
  large?: boolean;
  text: string;
  [key: string]: any;
  loading?: boolean;
}

export default function Button({
  large = false,
  onClick,
  text,
  loading = false,
  className = "",
  ...rest
}: ButtonProps) {
  // loading 속성을 사용하되 나머지 props에서 제외하여 DOM에 전달되지 않도록 함
  const { loading: _, ...restProps } = rest;

  return (
    <button
      {...restProps}
      className={cls(
        "w-full rounded-md border border-transparent bg-orange-500 px-4 font-medium text-white shadow-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2",
        large ? "py-3 text-base" : "mt-6 py-2 text-sm",
        loading ? "cursor-not-allowed opacity-50" : "",
        className
      )}
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent border-l-white border-r-white border-t-white"></div>
          로딩중...
        </div>
      ) : (
        text
      )}
    </button>
  );
}
