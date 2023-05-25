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

const ImgComponent = ({
  isLayout,
  width,
  height,
  imgAdd,
  clsProps,
  layoutHeight,
  imgName,
}: ImgComponentProps) => {
  // const myLoader = ({ src }: { src: any }) => {
  //   return `${src}`;
  // };
  return (
    <div className={cls(isLayout ? `relative ${layoutHeight}` : "")}>
      {isLayout ? (
        <Image
          src={"https://raw.githubusercontent.com/Real-Bird/pb/master/rose.jpg"}
          layout="fill"
          className={clsProps}
          alt={imgName}
        />
      ) : (
        <Image
          //loader={myLoader}
          src={`${imgAdd}`}
          width={width}
          height={height}
          className={clsProps}
          //alt={imgName}
          alt="안나옴"
          unoptimized={true}
        />
        // eslint-disable-next-line @next/next/no-img-element
        // <img
        //   src={`http://localhost:3000/32-1684832577509-710871512.webp`}
        //   width={width}
        //   height={height}
        //   className={clsProps}
        //   alt={imgName}
        // />
      )}
    </div>
  );
};

export default ImgComponent;
