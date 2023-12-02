import Link from "next/link";
import Image from "next/image";
import basicUser from "public/images/basic_user.png";
import streamPreview from "public/images/stream_preview.png";

interface StreamItemProps {
  id: number;
  title: string;
  user: { id: number; name: string; avatar: string | null };
  cloudflareStreamId: string | null;
}

const StreamItem = ({ id, title, user }: StreamItemProps) => {
  return (
    <Link href={`/streams/${id}`}>
      <a>
        <div className="relative flex h-[185px] items-center justify-center rounded-lg shadow-md transition-all hover:scale-[1.01]">
          <Image priority objectFit="cover" layout="fill" src={streamPreview} alt="" />
        </div>
        <div className="mt-2 flex items-center">
          <div>
            <Image
              width={36}
              height={36}
              src={
                user.avatar
                  ? `https://imagedelivery.net/mrfqMz0r88w_Qqln2FwPhQ/${user.avatar}/avatar`
                  : basicUser
              }
              alt=""
              className="h-9 w-9 rounded-full"
            />
          </div>
          <div className="ml-2 flex flex-col">
            <h2 className="text-base font-medium">{title}</h2>
            <span className="text-sm text-gray-500">{user.name}</span>
          </div>
        </div>
      </a>
    </Link>
  );
};

export default StreamItem;
