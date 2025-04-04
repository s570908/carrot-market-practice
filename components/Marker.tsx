"use client"; // Next.js에서 클라이언트 컴포넌트 지정

import PinIcon from "@/assets/icons/pin.svg";
import { TMap, TMapLatLng } from "@/types";
import { reactElementToString } from "@/utils";

type MarkerProps = {
  mapContent: TMap;
  position: TMapLatLng;
  theme: "green" | "red";
};

export const Marker = ({ mapContent, position, theme }: MarkerProps) => {
  // 클라이언트 측에서만 실행되도록 체크
  if (typeof window === "undefined") {
    return null;
  }

  const { Tmapv2 } = window;

  // 테마에 따라 다른 클래스 적용
  const themeClasses = {
    green: "fill-[#00cc99] stroke-[#009973]", // morakGreen, subGreen 색상에 맞게 조정
    red: "fill-[#ff6666] stroke-[#f0f0f0]", // morakRed, grayscale100 색상에 맞게 조정
  };
  return new Tmapv2.Marker({
    position,
    iconHTML: reactElementToString(<PinIcon className={`h-12 w-12 ${themeClasses[theme]}`} />),
    iconSize: new Tmapv2.Size(50, 50),
    map: mapContent,
  });
};
