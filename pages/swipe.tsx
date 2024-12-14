import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation } from "swiper/modules";
import Image from "next/image";

interface ImageType {
  id: number;
  src: string;
}

const ImageSlider: React.FC = () => {
  const imageUrls = [
    "https://picsum.photos/id/1011/400/300",
    "https://picsum.photos/id/1012/400/300",
    "https://picsum.photos/id/1013/400/300",
    "https://picsum.photos/id/1015/400/300",
    "https://picsum.photos/id/1021/400/300",
    "https://picsum.photos/id/1025/400/300",
    "https://picsum.photos/id/1031/400/300",
    "https://picsum.photos/id/1035/400/300",
    "https://picsum.photos/id/1041/400/300",
    "https://picsum.photos/id/1043/400/300",
    "https://picsum.photos/id/1045/400/300",
    "https://picsum.photos/id/1049/400/300",
    "https://picsum.photos/id/1051/400/300",
    "https://picsum.photos/id/1053/400/300",
  ];

  const [images, setImages] = useState<ImageType[]>(
    imageUrls.map((url, index) => ({
      id: index,
      src: url,
    }))
  );

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true); // 클라이언트에서만 렌더링
  }, []);

  const handleRemove = (id: number): void => {
    setImages((prev) => prev.filter((image) => image.id !== id));
  };

  return (
    <div className="mx-auto mt-8 w-4/5">
      <Swiper
        modules={[Navigation]}
        navigation
        slidesPerView={4}
        spaceBetween={16}
        loop={false}
        roundLengths={true}
        className="swiper-container overflow-hidden"
        style={{
          touchAction: "none", // 터치 및 드래그 방지
        }}
      >
        {images.map((image, index) => (
          <SwiperSlide
            key={image.id}
            className="flex items-center justify-center "
            style={{
              userSelect: "none", // 이미지 선택 방지
              pointerEvents: "auto", // Swiper에서 필요한 포인터 이벤트 허용
            }}
          >
            <div
              className="relative"
              style={{
                userSelect: "none", // 이미지 선택 비활성화
                pointerEvents: "none", // 이미지 클릭 및 드래그 방지
                touchAction: "none", // 터치 및 스크롤 동작 차단
              }}
            >
              {isClient && (
                <Image
                  src={image.src}
                  alt={`Image ${image.id}`}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover shadow-lg"
                  priority={index < 4}
                  layout="intrinsic"
                />
              )}
              <button
                onClick={() => handleRemove(image.id)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white transition hover:bg-red-600"
              >
                ⓧ
              </button>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default ImageSlider;
