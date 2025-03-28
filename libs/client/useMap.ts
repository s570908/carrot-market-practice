import { useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { DEFAULT_ZOOM_LEVEL, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } from "@/constants";
import { queryKeys } from "@/queries";
import { TMap, TMapEvent, TMapLatLng, TMapMarker } from "@/types";
import { Marker } from "@/components/Marker";

declare global {
  interface Window {
    Tmapv2: any;
  }
}

export const useMap = (mapRef: React.RefObject<HTMLDivElement>) => {
  const [mapInstance, setMapInstance] = useState<TMap | null>(null);
  const [currentCoord, setCurrentCoord] = useState<TMapLatLng | null>(null);

  // 마커 참조를 위한 ref 사용 (상태 대신)
  const currentMarkerRef = useRef<TMapMarker | null>(null);

  // Tmapv2 참조를 useRef로 관리 (무한 렌더링 방지)
  const TmapRef = useRef<any>(null);
  const isMapInitializedRef = useRef(false);

  // 마지막 좌표와 줌 센터 추적을 위한 ref
  const lastCoordRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastZoomCenterRef = useRef<{ lat: number; lng: number } | null>(null);

  const coord = {
    latitude: currentCoord?.lat() || 0,
    longitude: currentCoord?.lng() || 0,
  };

  // Tmapv2 초기화 (한 번만 실행)
  useEffect(() => {
    if (typeof window !== "undefined" && window.Tmapv2 && !TmapRef.current) {
      TmapRef.current = window.Tmapv2;
    }
  }, []);

  // currentCoord가 변경되면 주소 요청
  const { data: addressData } = useQuery({
    ...queryKeys.tmap.getAddressFromCoord({
      latitude: coord.latitude,
      longitude: coord.longitude,
    }),
    placeholderData: keepPreviousData,
    enabled: !!coord.latitude && !!coord.longitude,
    staleTime: 3000, // 캐시 유지 시간 30초
  });

  const currentAddress = addressData?.addressInfo?.fullAddress || "";

  const setCenterToSelectedCoord = useCallback(
    (position: TMapLatLng) => {
      if (mapInstance) {
        mapInstance.setCenter(position);
      }
    },
    [mapInstance]
  );

  // makeMarker 함수 수정
  const makeMarker = useCallback(
    (position: TMapLatLng, theme: "green" | "red" = "green") => {
      if (!mapInstance || !TmapRef.current) return null;

      // 기존 마커 제거 (ref 사용)
      if (currentMarkerRef.current) {
        currentMarkerRef.current.setMap(null);
        currentMarkerRef.current = null; // 참조 초기화
      }

      try {
        // Marker 컴포넌트 사용 - Tmapv2.Marker 객체 생성하여 반환함
        const marker = Marker({
          mapContent: mapInstance,
          position: position,
          theme: theme,
        });

        // ref 업데이트
        currentMarkerRef.current = marker;
        return marker;
      } catch (error) {
        console.error("마커 생성 오류:", error);
        return null;
      }
    },
    [mapInstance] // 의존성 배열
  );

  // 좌표가 변경되면 마커 생성
  useEffect(() => {
    if (!currentCoord || !TmapRef.current || !mapInstance) return;

    const marker = makeMarker(currentCoord);
    if (!marker) {
      console.error("마커 생성 실패");
    }
  }, [currentCoord, makeMarker, mapInstance]);

  // 맵 초기화
  useEffect(() => {
    if (isMapInitializedRef.current || !mapRef.current || typeof window === "undefined") {
      return;
    }

    try {
      // Tmapv2 가져오기
      const Tmapv2 = window.Tmapv2;
      if (!Tmapv2) {
        console.log("useMap--Tmapv2 API가 로드되지 않았습니다.");
        return;
      }

      TmapRef.current = Tmapv2;

      console.log("맵 생성 시작");

      // 맵 인스턴스 생성
      const map = new Tmapv2.Map("map", {
        width: "100%",
        height: "100%",
        zoom: DEFAULT_ZOOM_LEVEL,
        zoomControl: true, // 단순히 true로만 설정
      });

      map.setZoomLimit(MIN_ZOOM_LEVEL, MAX_ZOOM_LEVEL);
      setMapInstance(map);
      isMapInitializedRef.current = true;
    } catch (error) {
      console.error("맵 초기화 오류:", error);
    }
  }, [mapRef]);

  // 맵 이벤트 처리
  useEffect(() => {
    if (!mapInstance || !TmapRef.current) {
      return;
    }

    const Tmapv2 = TmapRef.current;

    const handleMapClick = (e: TMapEvent) => {
      console.log("맵 클릭 이벤트:");
      const { latLng } = e;
      const position = new Tmapv2.LatLng(latLng.lat(), latLng.lng());

      // 새 좌표 저장 (중복 렌더링 방지)
      lastCoordRef.current = {
        latitude: position.lat(),
        longitude: position.lng(),
      };

      setCurrentCoord(position);
    };

    // 줌 변경 시 중심점 유지
    const handleZoomChanged = () => {
      console.log("줌 레벨 변경됨");
      if (lastZoomCenterRef.current && currentCoord) {
        const { lat, lng } = lastZoomCenterRef.current;
        mapInstance.setCenter(new Tmapv2.LatLng(lat, lng));
      }
    };

    // 드래그 시작 시 현재 위치 저장 (줌 시작과 유사한 기능)
    const handleDragStart = () => {
      console.log("드래그 시작");
      if (currentCoord) {
        lastZoomCenterRef.current = {
          lat: currentCoord.lat(),
          lng: currentCoord.lng(),
        };
      }
    };

    // 현재 마커 위치를 중심으로 설정하는 함수
    const centerOnCurrentMarker = () => {
      if (currentCoord) {
        mapInstance.setCenter(currentCoord);
      }
    };

    // 줌 이벤트에 센터링 함수 연결
    const handleZoomStart = () => {
      // 줌 시작 시 현재 좌표 저장
      console.log("줌 시작");
      if (currentCoord) {
        lastZoomCenterRef.current = {
          lat: currentCoord.lat(),
          lng: currentCoord.lng(),
        };
      }
    };

    const handleZoomEnd = () => {
      // 줌 종료 후 원래 센터로 복귀
      console.log("줌 종료");
      if (lastZoomCenterRef.current && currentCoord) {
        const { lat, lng } = lastZoomCenterRef.current;
        mapInstance.setCenter(new Tmapv2.LatLng(lat, lng));
      }
    };

    // 이벤트 리스너 등록 - 올바른 이벤트 이름 사용
    console.log("이벤트 리스너 등록 시도");
    //mapInstance.addListener("click", onClick);
    mapInstance.addListener("click", handleMapClick);
    mapInstance.addListener("zoom_changed", handleZoomChanged);
    mapInstance.addListener("dragstart", handleDragStart);
    mapInstance.addListener("dragend", () => console.log("드래그 종료"));

    return () => {
      //mapInstance.removeListener("click", onClick);
      mapInstance.removeListener("click", handleMapClick);
      mapInstance.removeListener("zoom_changed", handleZoomChanged);
      mapInstance.removeListener("dragstart", handleDragStart);
      mapInstance.removeListener("dragend", () => {});
    };
  }, [currentCoord, mapInstance]);

  // 마커 업데이트 함수
  const updateMarker = useCallback(
    (
      coord: { latitude: number | null; longitude: number | null },
      theme: "green" | "red" = "green"
    ) => {
      const { latitude, longitude } = coord;
      if (!(latitude && longitude) || !mapInstance || !TmapRef.current) {
        return;
      }

      // 같은 좌표면 중심만 이동 (무한 렌더링 방지)
      if (
        lastCoordRef.current &&
        lastCoordRef.current.latitude === latitude &&
        lastCoordRef.current.longitude === longitude
      ) {
        const Tmapv2 = TmapRef.current;
        mapInstance.setCenter(new Tmapv2.LatLng(latitude, longitude));
        return;
      }

      // 새 좌표 저장 (중복 렌더링 방지)
      lastCoordRef.current = { latitude, longitude };

      // 새 마커 생성 (makeMarker 함수가 기존 마커를 제거함)
      const Tmapv2 = TmapRef.current;
      const position = new Tmapv2.LatLng(latitude, longitude);

      const marker = makeMarker(position, theme);
      if (!marker) {
        console.error("마커 업데이트 실패");
        return;
      }

      // 좌표 상태 및 줌 센터 참조 업데이트
      setCurrentCoord(position);
      lastZoomCenterRef.current = {
        lat: position.lat(),
        lng: position.lng(),
      };

      // 지도 중심 이동
      mapInstance.setCenter(position);
    },
    [mapInstance, makeMarker]
  );

  // 좌표 설정 함수
  const setCoord = useCallback(
    (currCoord: { latitude: number; longitude: number }) => {
      if (!TmapRef.current || !mapInstance) return;

      const { latitude, longitude } = currCoord;

      // 같은 좌표면 무시 (무한 렌더링 방지)
      if (
        lastCoordRef.current &&
        lastCoordRef.current.latitude === latitude &&
        lastCoordRef.current.longitude === longitude
      ) {
        return;
      }

      try {
        const Tmapv2 = TmapRef.current;
        const position = new Tmapv2.LatLng(latitude, longitude);

        // 새 좌표 저장 (중복 렌더링 방지)
        lastCoordRef.current = { latitude, longitude };
        lastZoomCenterRef.current = {
          lat: latitude,
          lng: longitude,
        };

        setCurrentCoord(position);
        setCenterToSelectedCoord(position);
      } catch (error) {
        console.error("좌표 설정 오류:", error);
      }
    },
    [mapInstance, setCenterToSelectedCoord]
  );

  // 초기화 함수
  const initMapModal = useCallback(() => {
    // 기존 마커 제거 (ref 사용)
    if (currentMarkerRef.current) {
      currentMarkerRef.current.setMap(null);
      currentMarkerRef.current = null;
    }

    setCurrentCoord(null);
    lastCoordRef.current = null;
    lastZoomCenterRef.current = null;
  }, []);

  console.log("useMap--mapInstance: ", mapInstance);
  console.log("useMap--coord: ", coord);
  console.log("useMap--currentAddress: ", currentAddress);
  console.log("useMap--currentMarker: ", currentMarkerRef.current);

  return {
    mapInstance,
    updateMarker,
    coord,
    setCoord,
    currentAddress,
    initMapModal,
    currentMarker: currentMarkerRef.current, // 마커 참조 반환 (필요시 사용)
  };
};
