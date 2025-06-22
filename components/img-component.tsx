import Image from "next/image";
import { useState } from "react";

interface ImgComponentProps {
  width: number;
  height: number;
  clsProps: string;
  imgAdd: string;
  imgName: string;
}

export default function ImgComponent({
  width,
  height,
  clsProps,
  imgName,
  imgAdd,
}: ImgComponentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check if imageId is undefined in the URL
  const hasValidImage = !imgAdd.includes('/undefined/');

  if (!hasValidImage) {
    return (
      <div 
        className={`${clsProps} animate-pulse flex items-center justify-center`}
        style={{ width, height }}
      >
        <svg className="w-8 h-8 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div 
          className={`${clsProps} animate-pulse absolute inset-0 z-10`}
        />
      )}
      <Image
        src={imgAdd}
        alt={imgName}
        width={width}
        height={height}
        className={clsProps}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {hasError && (
        <div 
          className={`${clsProps} bg-gray-300 flex items-center justify-center`}
          style={{ width, height }}
        >
          <span className="text-sm text-gray-500">이미지 없음</span>
        </div>
      )}
    </div>
  );
}
