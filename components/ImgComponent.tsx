import { cls } from "@libs/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ImgComponentProps {
  isLayout?: boolean;
  layoutHeight?: string;
  width?: number;
  height?: number;
  imgAdd: string;
  clsProps?: string;
  imgName?: string;
}

const ImgComponent = ({
  isLayout,
  width,
  height,
  imgAdd,
  clsProps,
  layoutHeight,
  imgName,
}: ImgComponentProps) => {
  const [mounted, setMounted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if image URL is undefined or contains "undefined"
  const isValidImageUrl =
    imgAdd && typeof imgAdd === "string" && !imgAdd.includes("undefined");

  // SSR에서는 placeholder만 렌더링
  if (!mounted) {
    return (
      <div
        className={`bg-gray-200 animate-pulse ${clsProps}`}
        style={{
          width: isLayout ? undefined : width,
          height: isLayout ? undefined : height,
          aspectRatio: width && height ? `${width}/${height}` : undefined,
        }}
      />
    );
  }

  return (
    <div>
      {isLayout ? (        <div className={`relative ${layoutHeight}`}>
          {/* 짙은 회색과 옅은 회색 그라데이션 배경 (물결 애니메이션) - 이미지 로딩 중에만 표시 */}
          <div
            className={`absolute inset-0 overflow-hidden rounded-md transition-opacity duration-300 ${
              isValidImageUrl && imageLoaded ? "opacity-0" : "opacity-100"
            }`}
            style={{ zIndex: 0 }}
          >
            <div className="absolute inset-0 w-[200%] animate-shimmer"
                style={{
                  backgroundImage: `
                    linear-gradient(
                      to right,
                      #e5e7eb 0%,
                      #6b7280 20%,
                      #e5e7eb 40%,
                      #6b7280 60%,
                      #e5e7eb 80%,
                      #6b7280 100%
                    )
                  `,
                  backgroundSize: '200% 100%',
                }}
            />
          </div>
            {/* 이미지가 유효하고 로드되었을 때만 표시 */}          {isValidImageUrl && (
            <Image
              src={imgAdd}
              alt={imgName || "이미지"}
              layout="fill"
              quality={75}
              className={`object-cover transition-opacity duration-300 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              style={{ zIndex: 1 }}
              onLoadingComplete={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              priority
            />
          )}
        </div>
      ) : (
        <div className="flex items-center">          <div 
            className={`relative ${clsProps}`} 
            style={{ 
              width, 
              height,
              overflow: 'hidden' 
            }}
          >            {/* 짙은 회색과 옅은 회색 그라데이션 배경 (물결 애니메이션) - 이미지 로딩 중에만 표시 */}
            <div
              className={`absolute inset-0 overflow-hidden rounded-md transition-opacity duration-300 ${
                isValidImageUrl && imageLoaded ? "opacity-0" : "opacity-100"
              }`}
              style={{ zIndex: 0 }}
            >
              <div className="absolute inset-0 w-[200%] animate-shimmer"
                  style={{
                    backgroundImage: `
                      linear-gradient(
                        to right,
                        #e5e7eb 0%,
                        #6b7280 20%,
                        #e5e7eb 40%,
                        #6b7280 60%,
                        #e5e7eb 80%,
                        #6b7280 100%
                      )
                    `,
                    backgroundSize: '200% 100%',
                  }}
              />
            </div>
              {/* 이미지가 유효하고 로드되었을 때만 표시 */}            {isValidImageUrl && (              <Image
                src={imgAdd}
                alt={imgName || "이미지"}
                width={width || 100}
                height={height || 100}
                quality={75}
                className={`object-cover transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
                style={{ zIndex: 1 }}
                onLoadingComplete={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                priority
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImgComponent;
