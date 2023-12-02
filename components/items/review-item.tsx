import Link from "next/link";
import Region from "@components/region";
import Avatar from "@components/avatar";
import Username from "@components/username";
import CreatedAt from "@components/created-at";
import DeleteButton from "@components/delete-button";
import { AiFillStar } from "react-icons/ai";
import useUser from "@libs/client/useUser";

interface ReviewItemProps {
  id: number;
  text: string;
  rating: number;
  createdAt?: Date | string;
  from: { id: number; name: string; avatar: string | null; address: string | null };
  handleDeleteReview: () => any;
  loading?: boolean;
}

const ReviewItem = ({
  id,
  text,
  rating,
  createdAt,
  from,
  handleDeleteReview,
  loading,
}: ReviewItemProps) => {
  const { user } = useUser();

  return (
    <div className="border-b border-b-gray-200 py-5 last-of-type:border-none">
      <div className="relative flex items-center space-x-2">
        <Link href={`/users/${from?.name}/posts`}>
          <a>
            <Avatar cloudflareImageId={from?.avatar} size="w-6 h-6" />
          </a>
        </Link>
        <Link href={`/users/${from?.name}/posts`}>
          <a>
            <Username text={from?.name} size="text-[15px]" textDecoration={true} />
          </a>
        </Link>
        <Region text={from?.address} size="text-[13px]" />
        <div className="flex">
          {[1, 2, 3, 4, 5].map((index) => (
            <AiFillStar key={index} color={rating >= index ? "gold" : "lightgray"} />
          ))}
        </div>
        {from.id === user?.id ? (
          <DeleteButton onClick={handleDeleteReview} text="삭제" loading={loading} />
        ) : null}
      </div>
      <div className="mb-1 mt-3 text-[15px]">{text}</div>
      <CreatedAt date={createdAt} size="text-[13px]" />
    </div>
  );
};

export default ReviewItem;
