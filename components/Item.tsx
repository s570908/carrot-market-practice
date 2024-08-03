import Link from "next/link";
import { cls } from "@libs/utils";
import ImgComponent from "@components/ImgComponent";
import { Status } from "@prisma/client";

interface ItemProps {
  title: string;
  price: number;
  id: number;
  comments?: number;
  hearts: number;
  isLike?: boolean;
  photo?: string;
  kind?: string;
  date?: Date;
  status?: Status;
}

const Item = ({
  title,
  price,
  comments,
  hearts,
  id,
  isLike,
  photo,
  date,
  status,
}: ItemProps) => {
  return (
    <Link href={`/products/${id}`}>
      <a className="flex cursor-pointer justify-between px-4 pt-5">
        <div className="flex space-x-4">
          <ImgComponent
            width={80}
            height={80}
            clsProps="rounded-md bg-gray-400"
            imgAdd={`https://imagedelivery.net/${process.env.NEXT_PUBLIC_CF_HASH}/${photo}/public`}
            imgName={title}
          />
          <div className="flex flex-col pt-2">
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            <span className="mt-1 font-medium text-gray-900">￦{price}</span>
          </div>
        </div>
        <div>
          {status === Status.Reserved
            ? "예약중"
            : status === Status.Sold
            ? "거래완료"
            : "판매중"}
        </div>
        {/* <div>{isReserved && <span className="mt-1 text-xs text-red-500">예약됨</span>}</div> */}
        <div className="flex items-end justify-end space-x-2">
          <div
            className={cls(
              isLike ? "text-red-600" : "text-gray-600",
              "flex items-center space-x-0.5 text-sm"
            )}
          >
            {isLike ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                ></path>
              </svg>
            )}
            <span className="text-gray-700">{hearts}</span>
          </div>
          {comments && (
            <div className="flex items-center space-x-0.5 text-sm  text-gray-600">
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
              <span>{comments}</span>
            </div>
          )}
        </div>
      </a>
    </Link>
  );
};

export default Item;
