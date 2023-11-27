import Link from "next/link";
import Region from "@components/region";
import Avatar from "@components/avatar";
import Username from "@components/username";
import CreatedAt from "@components/created-at";
import DeleteButton from "@components/delete-button";
import { User } from "@prisma/client";

interface CommentItemProps {
  id: number;
  text: string;
  createdAt?: Date | string;
  user: { id: number; name: string; avatar: string | null; address: string | null };
  me?: User;
  handleDeleteComment: (postCommentId: number) => Promise<void>;
  loading?: boolean;
}

const CommentItem = ({
  id,
  text,
  createdAt,
  user,
  me,
  handleDeleteComment,
  loading,
}: CommentItemProps) => {
  return (
    <div className="border-b border-b-gray-200 py-5 last-of-type:border-none">
      <div className="relative flex items-center space-x-2">
        <Link href={`/users/${user?.name}/posts`}>
          <a>
            <Avatar cloudflareImageId={user?.avatar} size="w-6 h-6" />
          </a>
        </Link>
        <Link href={`/users/${user?.name}/posts`}>
          <a>
            <Username text={user?.name} size="text-[15px]" textDecoration={true} />
          </a>
        </Link>
        <Region text={user?.address} size="text-[13px]" />
        {user.id === me?.id ? (
          <DeleteButton onClick={() => handleDeleteComment(id)} text="삭제" loading={loading} />
        ) : null}
      </div>
      <div className="mb-1 mt-3 text-[15px]">{text}</div>
      <CreatedAt date={createdAt} size="text-[13px]" />
    </div>
  );
};

export default CommentItem;
