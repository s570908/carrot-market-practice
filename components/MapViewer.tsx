import React, { useEffect, useRef } from "react";
import { useMap } from "@libs/client/useMap";

interface MapViewerProps {
  lat: number;
  lng: number;
  name?: string;
  zoomLevel?: number;
  width?: string;
  height?: string;
}

const MapViewer: React.FC<MapViewerProps> = ({
  lat,
  lng,
  name = "선택된 위치",
  zoomLevel = 15,
  width = "100%",
  height = "300px",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  // 정적 지도로 만들기 위한 옵션 설정
  const { updateMarker } = useMap(mapRef, {
    isClickable: false,
    isZummable: false, // 휠 스크롤을 통한 줌 기능 비활성화
  });

  // 좌표가 변경되면 마커 업데이트
  useEffect(() => {
    if (lat && lng) {
      // 유효한 좌표인 경우에만 마커 업데이트
      updateMarker({ latitude: lat, longitude: lng }, "red");
    }
  }, [lat, lng, updateMarker]);

  return (
    <>
      <div
        style={{ width, height }}
        className="relative overflow-hidden rounded-md shadow-md"
      >
        <div
          id="map"
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          className="rounded-md"
        ></div>
      </div>
    </>
  );
};

export default MapViewer;
