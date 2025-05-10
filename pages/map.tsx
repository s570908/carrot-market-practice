"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

export default function SimpleMap() {
  const [map, setMap] = useState(null);
  const [tmapLoaded, setTmapLoaded] = useState(false); // Tmap API가 로드되었는지 여부

  // Tmap이 로드된 후 지도 초기화
  useEffect(() => {
    if (tmapLoaded && window.Tmapv3) {
      initTmap();
    }
  }, [tmapLoaded]);

  // 지도 초기화 함수
  const initTmap = () => {
    if (!window.Tmapv3) return;

    const mapInstance = new window.Tmapv3.Map("map_div", {
      center: new window.Tmapv3.LatLng(37.5652045, 126.98702028),
      width: "100%",
      height: "400px",
      zoom: 16,
    });
    console.log("mapInstance", mapInstance);
    setMap(mapInstance);
  };

  return (
    <div>
      {/* Tmap API 스크립트 로드 */}
      <Script
        src={`https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_APP_KEY}`}
        strategy="lazyOnload"
        onLoad={() => setTmapLoaded(true)} // 스크립트 로드 후 상태 업데이트
      />

      {/* 지도 컨테이너 */}
      <div id="map_div" style={{ width: "100%", height: "400px" }}></div>
    </div>
  );
}
