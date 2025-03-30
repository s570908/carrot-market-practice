import React, { useEffect, useState, useRef, memo } from "react";
import ModButton from "./ModButton";
import { LocationData, useMap } from "@/pages/mapModal/useMapNew";
//import { useMap, LocationData } from "../pages/mapModal/useMapNew";

interface MapLocationProps {
  onClose: () => void;
  onSelect: (locationData: LocationData) => void;
}

declare global {
  interface Window {
    Tmapv2: any;
  }
}

export default function MapLocation({ onClose, onSelect }: MapLocationProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // useMap 훅 사용 (mapRef 전달)
  const { selectedLocation, searchResults, initializeMap, searchPlaces, selectPlace } =
    useMap(mapContainerRef);

  // TMAP 초기화
  useEffect(() => {
    // 정적으로 로드된 TMap API를 확인
    if (typeof window !== "undefined" && !window.Tmapv2) {
      console.error(
        "TMap API가 로드되지 않았습니다. _app.tsx 또는 Layout 컴포넌트에서 TMap 스크립트를 정적으로 로드하세요."
      );
    }

    const cleanup = initializeMap();
    return cleanup;
  }, [initializeMap]);

  // 장소 검색 함수
  const handleSearch = async () => {
    if (!searchKeyword.trim()) return;
    const results = await searchPlaces(searchKeyword);

    if (results.length === 0) {
      alert("검색 결과가 없습니다.");
    }
  };

  // 선택 완료 함수
  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium">위치 선택</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4 flex items-center">
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="장소를 검색하세요"
            className="mr-2 flex-1 rounded-md border border-gray-300 px-3 py-2"
          />
          <ModButton onClick={handleSearch} variant="primary">
            검색
          </ModButton>
          {/* <Input
            label="장소 검색"
            list="address-input"
            value={searchKeyword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchKeyword(e.currentTarget.value)
            }
          /> */}
          {/* 별도 컴포넌트로 분리한 주소 목록 */}
          {/* <AddressList addressData={addressData} onClickAddressListItem={onClickAddressListItem} /> */}
        </div>

        <div className="flex h-96 space-x-4">
          {/* 지도 영역 - id 속성 추가 */}
          <div
            id="map"
            ref={mapContainerRef}
            className="h-full w-2/3 rounded-md border border-gray-300"
          ></div>

          {/* 검색 결과 목록 */}
          <div className="flex w-1/3 flex-col">
            <h3 className="mb-2 text-sm font-medium">검색 결과</h3>
            <div className="flex-1 overflow-y-auto rounded-md border border-gray-300 p-2">
              {searchResults.length > 0 ? (
                <ul className="space-y-2">
                  {searchResults.map(
                    (
                      place: {
                        place_name:
                          | string
                          | number
                          | boolean
                          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                          | Iterable<React.ReactNode>
                          | React.ReactPortal
                          | null
                          | undefined;
                        address_name:
                          | string
                          | number
                          | boolean
                          | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                          | Iterable<React.ReactNode>
                          | React.ReactPortal
                          | null
                          | undefined;
                      },
                      index: React.Key | null | undefined
                    ) => (
                      <li
                        key={index}
                        onClick={() => selectPlace(place)}
                        className="cursor-pointer rounded-md p-2 hover:bg-gray-100"
                      >
                        <p className="font-medium">{place.place_name}</p>
                        <p className="text-sm text-gray-600">{place.address_name}</p>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-center text-sm text-gray-500">검색 결과가 없습니다</p>
              )}
            </div>
          </div>
        </div>

        {selectedLocation && (
          <div className="mt-4 rounded-md bg-gray-50 p-4">
            <h4 className="font-medium">{selectedLocation.name}</h4>
            <p className="text-sm text-gray-600">{selectedLocation.address}</p>
            {selectedLocation.fullAddressRoad && (
              <p className="text-sm text-gray-600">도로명: {selectedLocation.fullAddressRoad}</p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end space-x-2">
          <ModButton onClick={onClose} variant="outline">
            취소
          </ModButton>
          <ModButton onClick={handleConfirm} variant="primary" disabled={!selectedLocation}>
            선택 완료
          </ModButton>
        </div>
      </div>
    </div>
  );
}
