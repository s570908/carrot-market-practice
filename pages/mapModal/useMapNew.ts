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

// LocationData 인터페이스 추가 (위치 선택 기능에 필요)
export interface LocationData {
  name: string;
  address: string;
  fullAddressRoad: string;
  latitude: number;
  longitude: number;
  zoomLevel: number;
}

export const useMap = (mapRef: React.RefObject<HTMLDivElement>) => {
  const [mapInstance, setMapInstance] = useState<TMap | null>(null);
  const [currentCoord, setCurrentCoord] = useState<TMapLatLng | null>(null);
  // 위치 선택 기능에 필요한 상태 추가
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);

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
      if (!Tmapv2) return;

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

      // 현재 위치 가져오기 추가
      getCurrentLocation(map);
    } catch (error) {
      console.error("맵 초기화 오류:", error);
    }
  }, [mapRef]);

  // 현재 위치 가져오기 함수 추가
  const getCurrentLocation = useCallback((mapInstance: any) => {
    if (!TmapRef.current || !mapInstance) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const Tmapv2 = TmapRef.current;
          if (!Tmapv2) return;

          const currentPos = new Tmapv2.LatLng(position.coords.latitude, position.coords.longitude);
          mapInstance.setCenter(currentPos);

          // 현재 위치 역지오코딩
          reverseGeocode(position.coords.latitude, position.coords.longitude)
            .then((addressInfo) => {
              const locationData: LocationData = {
                name: "현재 위치",
                address: addressInfo.fullAddress || "",
                fullAddressRoad: addressInfo.roadAddress || "",
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                zoomLevel: DEFAULT_ZOOM_LEVEL, // Replace with a valid zoom level or a constant
              };
              // 위치 선택용 마커 추가
              addLocationMarker(locationData, mapInstance);
            })
            .catch((err) => {
              console.error("주소 변환에 실패했습니다:", err);
            });
        },
        (err) => {
          console.error("현재 위치를 가져오는데 실패했습니다:", err);
        }
      );
    }
  }, []);

  // 역지오코딩 함수 추가
  const reverseGeocode = async (lat: number, lng: number) => {
    const url = `https://apis.openapi.sk.com/tmap/geo/reversegeocoding?version=1&lat=${lat}&lon=${lng}&coordType=WGS84GEO&addressType=A10`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          appKey: process.env.NEXT_PUBLIC_TMAP_API_KEY || "",
        },
      });
      const data = await response.json();

      return {
        fullAddress: data.addressInfo?.fullAddress || "",
        roadAddress: data.addressInfo?.roadAddress || "",
      };
    } catch (error) {
      console.error("역지오코딩 오류:", error);
      return { fullAddress: "", roadAddress: "" };
    }
  };

  // 위치 선택용 마커 추가 함수
  const addLocationMarker = useCallback(
    (locationData: LocationData, mapInstance: any) => {
      if (!TmapRef.current || !mapInstance) return;

      const Tmapv2 = TmapRef.current;

      // 기존 마커 제거
      markers.forEach((marker) => marker.setMap(null));

      const position = new Tmapv2.LatLng(locationData.latitude, locationData.longitude);

      const marker = new Tmapv2.Marker({
        position: position,
        icon: "https://apis.openapi.sk.com/tmap/resources/images/markers/pin_r_m_a.png",
        map: mapInstance,
      });

      const infoWindow = new Tmapv2.InfoWindow({
        position: position,
        content: `<div style="padding:5px;font-size:12px;white-space:nowrap;">${locationData.name}</div>`,
        type: 2,
        map: mapInstance,
      });

      // 마커 클릭시 정보창 토글
      marker.addListener("click", function () {
        if (infoWindow.getMap()) {
          infoWindow.setMap(null);
        } else {
          infoWindow.setMap(mapInstance);
        }
      });

      setMarkers([marker]);
      mapInstance.setCenter(position);
      setSelectedLocation(locationData);
    },
    [markers]
  );

  // 맵 이벤트 처리
  useEffect(() => {
    if (!mapInstance || !TmapRef.current) {
      return;
    }

    const Tmapv2 = TmapRef.current;

    const handleMapClick = (e: TMapEvent) => {
      //console.log("맵 클릭 이벤트:");
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
    //console.log("이벤트 리스너 등록 시도");
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

  // 장소 검색 함수 추가
  const searchPlaces = useCallback(
    async (searchKeyword: string) => {
      if (!mapInstance || !searchKeyword.trim()) return [];

      try {
        const url = new URL("https://apis.openapi.sk.com/tmap/pois");
        url.searchParams.append("version", "1");
        url.searchParams.append("format", "json");
        url.searchParams.append("callback", "result");
        url.searchParams.append("searchKeyword", searchKeyword);
        url.searchParams.append("resCoordType", "WGS84GEO");
        url.searchParams.append("reqCoordType", "WGS84GEO");
        url.searchParams.append("count", "20");

        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            appKey: process.env.NEXT_PUBLIC_TMAP_API_KEY || "",
          },
        });

        const data = await response.json();

        if (data?.searchPoiInfo?.pois?.poi && data.searchPoiInfo.pois.poi.length > 0) {
          const results = data.searchPoiInfo.pois.poi.map((item: any) => ({
            place_name: item.name,
            address_name: item.upperAddrName + " " + item.middleAddrName + " " + item.lowerAddrName,
            road_address_name: item.upperAddrName + " " + item.roadName + " " + item.buildingNo1,
            x: parseFloat(item.noorLon),
            y: parseFloat(item.noorLat),
          }));

          setSearchResults(results);

          // 검색 결과 중 첫 번째 항목 자동 선택
          if (results.length > 0) {
            selectPlace(results[0]);
          }

          return results;
        } else {
          setSearchResults([]);
          return [];
        }
      } catch (error) {
        console.error("POI 검색 오류:", error);
        setSearchResults([]);
        return [];
      }
    },
    [mapInstance]
  );

  // 장소 선택 함수 추가
  const selectPlace = useCallback(
    (place: any) => {
      if (!mapInstance) return;

      const locationData: LocationData = {
        name: place.place_name,
        address: place.address_name || "",
        fullAddressRoad: place.road_address_name || "",
        latitude: place.y,
        longitude: place.x,
        zoomLevel: DEFAULT_ZOOM_LEVEL, // Replace with a valid zoom level or constant
      };

      addLocationMarker(locationData, mapInstance);
    },
    [mapInstance, addLocationMarker]
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

  // 맵 컨테이너 초기화용 함수 (MapLocation 컴포넌트용)
  const initializeMap = useCallback(() => {
    if (isMapInitializedRef.current || typeof window === "undefined") {
      return () => {};
    }

    try {
      // Tmapv2 가져오기
      const Tmapv2 = window.Tmapv2;
      if (!Tmapv2) {
        console.error("TMap API가 로드되지 않았습니다. _app.tsx에서 TMap 스크립트를 로드하세요.");
        return () => {};
      }

      TmapRef.current = Tmapv2;

      // 맵 컨테이너 ID 확인
      const containerId = mapRef.current?.id || "map";

      // 맵 인스턴스 생성
      const map = new Tmapv2.Map(containerId, {
        width: "100%",
        height: "100%",
        zoom: DEFAULT_ZOOM_LEVEL,
        zoomControl: true,
      });

      setMapInstance(map);
      isMapInitializedRef.current = true;

      // 현재 위치 가져오기
      getCurrentLocation(map);

      return () => {
        // 정리 작업
        markers.forEach((marker) => marker.setMap(null));
        isMapInitializedRef.current = false;
      };
    } catch (error) {
      console.error("맵 초기화 오류:", error);
      return () => {};
    }
  }, [mapRef, markers, getCurrentLocation]);

  return {
    mapInstance,
    updateMarker,
    coord,
    setCoord,
    currentAddress,
    initMapModal,
    currentMarker: currentMarkerRef.current,
    // 위치 선택 기능을 위한 추가 반환값
    mapRef,
    selectedLocation,
    searchResults,
    initializeMap,
    searchPlaces,
    selectPlace,
  };
};
