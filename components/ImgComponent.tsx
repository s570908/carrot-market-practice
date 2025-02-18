import { cls } from "@libs/utils";
import Image from "next/image";
import { Suspense } from "react";

interface ImgComponentProps {
  isLayout?: boolean;
  layoutHeight?: string;
  width?: number;
  height?: number;
  imgAdd: string;
  clsProps?: string;
  imgName?: string;
}

// const ImgComponent = ({
//   isLayout,
//   width,
//   height,
//   imgAdd,
//   clsProps,
//   layoutHeight,
//   imgName,
// }: ImgComponentProps) => {
//   //console.log("imgAdd: ", imgAdd);
//   return (
//     <div className={cls(isLayout ? `relative ${layoutHeight}` : "")}>
//       {isLayout ? (
//         <Image src={`${imgAdd}`} layout="fill" className={clsProps} alt={imgName} />
//       ) : (
//         <Image src={`${imgAdd}`} width={width} height={height} className={clsProps} alt={imgName} />
//       )}
//     </div>
//   );
// };

const ImgComponent = ({
  isLayout,
  width,
  height,
  imgAdd,
  clsProps,
  layoutHeight,
  imgName,
}: ImgComponentProps) => {
  return (
    <div>
      <div className={cls(isLayout ? `relative ${layoutHeight}` : "flex items-center")}>
        {isLayout ? (
          <Image
            src={`${imgAdd}`}
            layout="fill"
            className={clsProps}
            alt={imgName}
            priority
            // loading="lazy"
          />
        ) : (
          <Image
            src={`${imgAdd}`}
            width={width}
            height={height}
            className={`${clsProps} object-cover`} // aspect ration를 원본과 같세 유지하기 위해 object-cover 추가
            alt={imgName}
            priority // 로딩 우선순위를 높이기 위해 priority 속성 추가
          />
        )}
      </div>
    </div>
  );
};

export default ImgComponent;
