import Link from "next/link";
import Image from "next/image";
import Region from "@components/region";
import noImage from "public/images/no_image.png";

interface ProductItemProps {
  id: number;
  name: string;
  price: number;
  cloudflareImageId: string;
  user: { address: string | null };
  _count: { productLikes: number };
  isSelling: boolean;
}

const ProductItem = ({
  id,
  name,
  price,
  cloudflareImageId,
  user,
  _count,
  isSelling,
}: ProductItemProps) => {
  return (
    <Link href={`/products/${id}`}>
      <a>
        <div className="relative h-[208px] w-[208px]">
          <Image
            priority
            objectFit="cover"
            layout="fill"
            src={
              cloudflareImageId
                ? `https://imagedelivery.net/mrfqMz0r88w_Qqln2FwPhQ/${cloudflareImageId}/product`
                : noImage
            }
            alt={name}
            className="rounded-2xl border border-gray-100 transition-all hover:scale-[1.02]"
          />
        </div>
        <h3 className="mb-0.5 mt-2">{name.length > 18 ? `${name.substring(0, 18)}...` : name}</h3>
        <div className="mt-0.5 flex items-center">
          {isSelling === false ? (
            <span className="mr-1.5 rounded-[4px] bg-gray-700 px-2 py-1.5 text-xs text-white">
              거래완료
            </span>
          ) : null}
          <span className="font-semibold">{Number(price).toLocaleString("ko-KR")}원</span>
        </div>
        <div>
          <Region text={user?.address} size="text-[13px]" />
        </div>
        <p className="text-[13px] text-gray-400">관심 {_count?.productLikes}</p>
      </a>
    </Link>
  );
};

export default ProductItem;
