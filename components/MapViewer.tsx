import React, { useEffect, useRef } from "react";

declare global {
  interface Window {
    Tmapv2: any;
  }
}

interface MapViewerProps {
  lat: number;
  lng: number;
  name?: string;
  zoomLevel?: number;
}

const MapViewer: React.FC<MapViewerProps> = ({
  lat,
  lng,
  name = "선택된 위치",
  zoomLevel = 15,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // SK TMAP 스크립트 로드
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_API_KEY}`;

    script.onload = () => {
      if (!mapRef.current) return;

      // 지도 생성
      const map = new window.Tmapv2.Map(mapRef.current, {
        center: new window.Tmapv2.LatLng(lat, lng),
        width: "100%",
        height: "100%",
        zoom: zoomLevel,
      });
      mapInstanceRef.current = map;

      // 마커 생성
      const marker = new window.Tmapv2.Marker({
        position: new window.Tmapv2.LatLng(lat, lng),
        map: map,
        icon: "https://tmapapi.sktelecom.com/upload/tmap/marker/pin_r_m_a.png", // 기본 마커 아이콘
        title: name,
      });
      markerRef.current = marker;

      // 인포윈도우 생성 (장소 이름 표시)
      if (name) {
        const infoWindow = new window.Tmapv2.InfoWindow({
          position: new window.Tmapv2.LatLng(lat, lng),
          content: `
            <div style="padding:5px;width:150px;text-align:center;">
              <span style="font-size:12px;font-weight:bold;">${name}</span>
            </div>
          `,
        });
        infoWindow.open(map, marker);
      }
    };

    document.head.appendChild(script);

    return () => {
      // 스크립트 정리
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }

      // 마커와 지도 인스턴스 해제
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name, zoomLevel]);

  // 좌표나 줌레벨이 변경되면 지도 업데이트
  useEffect(() => {
    if (!mapInstanceRef.current || !markerRef.current || !window.Tmapv2) return;

    // 지도 중심 변경
    const position = new window.Tmapv2.LatLng(lat, lng);
    mapInstanceRef.current.setCenter(position);
    mapInstanceRef.current.setZoom(zoomLevel);

    // 마커 위치 변경
    markerRef.current.setPosition(position);
  }, [lat, lng, zoomLevel]);

  return (
    <div className="relative h-full w-full">
      <div ref={mapRef} className="h-full w-full rounded-md"></div>
    </div>
  );
};

export default MapViewer;
