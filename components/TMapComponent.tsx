import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries";
import { useMap } from "@/libs/client/useMap";

interface TMapComponentProps {
  onLocationSelect?: (lat: number, lng: number, address: string) => void;
}

const TMapComponent: React.FC<TMapComponentProps> = ({ onLocationSelect }) => {
  const [searchKeyword, setSearchKeyword] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);

  const { coord, updateMarker, currentAddress, initMapModal } = useMap(mapRef);

  // 주소 검색 쿼리
  const { data: tmapResponse } = useQuery({
    queryKey: ["searchAddress", searchKeyword],
    queryFn: () =>
      queryKeys.tmap.searchAddress({
        searchKeyword,
      }),
    enabled: !!searchKeyword && searchKeyword.length > 1,
  });

  // 주소 데이터
  const addressData = tmapResponse?.searchPoiInfo?.pois?.poi || [];

  // 주소 목록 아이템 클릭 처리
  const handleAddressItemClick = (e: React.MouseEvent<HTMLLIElement>) => {
    const latitude = Number(e.currentTarget.getAttribute("data-lat"));
    const longitude = Number(e.currentTarget.getAttribute("data-lon"));
    const address = e.currentTarget.getAttribute("data-address") || "";

    // 마커 업데이트
    updateMarker({ latitude, longitude }, "red");

    // 상위 컴포넌트로 선택한 위치 전달
    onLocationSelect?.(latitude, longitude, address);
  };

  // 지도 클릭 이벤트 핸들러
  useEffect(() => {
    if (coord.latitude && coord.longitude && currentAddress) {
      onLocationSelect?.(coord.latitude, coord.longitude, currentAddress);
    }
  }, [coord.latitude, coord.longitude, currentAddress, onLocationSelect]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initMapModal();
  }, [initMapModal]);

  return (
    <div className="flex h-full w-full">
      {/* 검색 입력 필드 */}
      <div className="p-2">
        <input
          type="text"
          placeholder="주소 또는 장소를 검색하세요"
          className="w-full rounded-md border border-gray-300 p-2 text-sm"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
        />
      </div>

      {/* 검색 결과와 지도 컨테이너 */}
      <div className="relative flex flex-grow flex-col md:flex-row">
        {/* 검색 결과 목록 */}
        {addressData.length > 0 && (
          <ul className="max-h-48 overflow-y-auto border-b md:w-1/3 md:border-b-0 md:border-r">
            {addressData.map((address) => {
              const fullAddress =
                address.newAddressList?.newAddress[0]?.fullAddressRoad || "";
              const addressName = address.name || "";
              const { noorLat: lat, noorLon: lon } = address;

              return (
                <li
                  key={address.pkey}
                  className="cursor-pointer border-b p-2 hover:bg-gray-100"
                  data-lat={lat}
                  data-lon={lon}
                  data-address={`${fullAddress} ${addressName}`}
                  onClick={handleAddressItemClick}
                >
                  <span className="block text-sm font-semibold">
                    {addressName}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {fullAddress}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {/* 지도 컨테이너 */}
        <div className="flex-grow">
          <div id="map" ref={mapRef} className="h-full min-h-[300px] w-full" />
        </div>
      </div>
    </div>
  );
};

// 전역 마커 타입 정의
declare global {
  interface Window {
    Tmapv2: any;
    currentMarker?: any;
  }
}

export default TMapComponent;
