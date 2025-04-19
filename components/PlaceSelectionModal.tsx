import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMap } from "@libs/client/useMap";
import { useQuery } from "react-query";
import { tmap } from "@/services";

interface PlaceSelectionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onLocationSelect: (
    latitude: number,
    longitude: number,
    address: string
  ) => void;
  initialLocation?: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

interface SelectedPlace {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

// Input 컴포넌트
interface InputProps {
  label?: string;
  errorMessage?: string;
  value?: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  [key: string]: any;
}

function Input({ label = "", errorMessage = "", ...rest }: InputProps) {
  const { value, maxLength, disabled, required } = rest;

  return (
    <div
      className={`mb-2 rounded border p-2 ${
        errorMessage ? "border-red-500" : "border-gray-300"
      } ${disabled ? "cursor-not-allowed bg-gray-100" : ""}`}
    >
      {label && (
        <div className="mb-1 flex items-center justify-between">
          <FieldLabel label={label} required={required} />
          {maxLength && (
            <span className="text-xs text-gray-500">
              {value?.toString()?.length || 0}/{maxLength}
            </span>
          )}
        </div>
      )}
      <input
        className="w-full rounded border p-2"
        disabled={disabled}
        maxLength={maxLength}
        {...rest}
      />
      {!disabled && errorMessage && (
        <p className="mt-1 text-xs text-red-500">{errorMessage}</p>
      )}
    </div>
  );
}

// FieldLabel 컴포넌트
function FieldLabel({ label, required = false }: InputProps) {
  return (
    <span className="font-bold">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>
  );
}

// useDebounce 훅
function useDebounce(value: string, delay: number = 300): string {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// AddressList 컴포넌트
const AddressList = React.memo(
  ({
    addressData,
    onClickAddressListItem,
  }: {
    addressData: any[];
    onClickAddressListItem: (e: React.MouseEvent | React.KeyboardEvent) => void;
  }) => {
    if (!addressData?.length) return null;

    return (
      <div className="h-full overflow-y-auto rounded-md border border-gray-300 p-2">
        <ul className="space-y-2">
          {addressData.map((address) => {
            const fullAddress =
              address.newAddressList.newAddress[0].fullAddressRoad;
            const addressName = address.name;
            const { noorLat: lat, noorLon: lon } = address;
            return (
              <li
                role="option"
                aria-selected={false}
                className="cursor-pointer rounded border p-2 hover:bg-gray-100"
                key={address.pkey}
                value={`${fullAddress} ${addressName}`}
                data-lat={lat}
                data-lon={lon}
                onClick={onClickAddressListItem}
              >
                <span className="block text-sm font-bold">{addressName}</span>
                <span className="block text-xs font-normal">{fullAddress}</span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
);

AddressList.displayName = "AddressList";

const PlaceSelectionModal: React.FC<PlaceSelectionModalProps> = ({
  isVisible,
  onClose,
  onLocationSelect,
  initialLocation,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const debouncedSearchKeyword = useDebounce(searchKeyword);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null
  );

  const {
    coord,
    updateMarker,
    currentAddress,
    initMapModal,
    getCurrentPosition,
    setCoord,
  } = useMap(mapRef);

  // 주소 검색 쿼리
  const { data: tmapResponse } = useQuery(
    ["tmap", "searchAddress", { searchKeyword: debouncedSearchKeyword }],
    () => tmap.searchAddress({ searchKeyword: debouncedSearchKeyword }),
    {
      enabled: !!debouncedSearchKeyword,
      placeholderData: undefined,
    }
  );

  // 주소 데이터 메모이제이션
  const addressData = useMemo(() => {
    return tmapResponse?.searchPoiInfo?.pois?.poi || [];
  }, [tmapResponse]);

  // 위치 선택 핸들러
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setSelectedAddress(address);

    // 선택한 장소 정보 저장
    setSelectedPlace({
      name: address.split(" ").slice(-2).join(" "), // 건물명 또는 도로명 주소 끝부분
      address: address,
      latitude: lat.toString(),
      longitude: lng.toString(),
    });
  };

  // currentAddress가 변경되면 자동으로 선택된 위치 업데이트
  useEffect(() => {
    if (coord.latitude && coord.longitude && currentAddress) {
      handleLocationSelect(coord.latitude, coord.longitude, currentAddress);
    }
  }, [coord.latitude, coord.longitude, currentAddress]);

  // 컴포넌트 마운트 시 지도 초기화
  useEffect(() => {
    if (isVisible) {
      initMapModal();

      // 이전에 선택한 위치가 있으면 그 위치를 사용
      if (initialLocation?.latitude && initialLocation?.longitude) {
        console.log("이전에 선택한 위치로 초기화:", initialLocation);
        updateMarker(
          {
            latitude: initialLocation.latitude,
            longitude: initialLocation.longitude,
          },
          "red"
        );
        setSelectedAddress(initialLocation.address);
      } else {
        // 초기 위치가 없으면 현재 위치 가져오기
        const fetchCurrentPosition = async () => {
          try {
            if (typeof getCurrentPosition === "function") {
              const currentPosition = await getCurrentPosition();
              updateMarker(currentPosition, "red");
              console.log("현재 위치로 지도 초기화:", currentPosition);
            }
          } catch (error) {
            console.error("현재 위치를 가져오지 못했습니다:", error);
            // 위치 정보를 가져오지 못한 경우 기본 위치 사용 (서울시청)
            updateMarker(
              {
                latitude: 37.5666805,
                longitude: 126.9784147,
              },
              "red"
            );
          }
        };

        fetchCurrentPosition();
      }
    }
    initMapModal();

    // 이전에 선택한 위치가 있으면 그 위치를 사용
    if (initialLocation?.latitude && initialLocation?.longitude) {
      console.log("이전에 선택한 위치로 초기화:", initialLocation);
      updateMarker(
        {
          latitude: initialLocation.latitude,
          longitude: initialLocation.longitude,
        },
        "red"
      );
      setSelectedAddress(initialLocation.address);
    } else {
      // 초기 위치가 없으면 현재 위치 가져오기
      const fetchCurrentPosition = async () => {
        try {
          if (typeof getCurrentPosition === "function") {
            const currentPosition = await getCurrentPosition();
            updateMarker(currentPosition, "red");
            console.log("현재 위치로 지도 초기화:", currentPosition);
          }
        } catch (error) {
          console.error("현재 위치를 가져오지 못했습니다:", error);
          // 위치 정보를 가져오지 못한 경우 기본 위치 사용 (서울시청)
          updateMarker(
            {
              latitude: 37.5666805,
              longitude: 126.9784147,
            },
            "red"
          );
        }
      };

      fetchCurrentPosition();
    }
  }, [
    isVisible,
    initMapModal,
    getCurrentPosition,
    updateMarker,
    initialLocation,
  ]);

  // 검색 결과 항목 클릭 핸들러
  const onClickAddressListItem = (
    e: React.MouseEvent | React.KeyboardEvent
  ) => {
    const coordinate = {
      latitude: Number(e.currentTarget.getAttribute("data-lat")),
      longitude: Number(e.currentTarget.getAttribute("data-lon")),
    };

    // 기존 마커 업데이트
    updateMarker(coordinate, "red");
  };

  // 현재 위치 버튼 핸들러
  const handleMyLocationClick = async () => {
    try {
      if (typeof getCurrentPosition === "function") {
        const currentPosition = await getCurrentPosition();
        updateMarker(currentPosition, "red");
      }
    } catch (error) {
      alert("현재 위치를 가져오지 못했습니다. 권한을 확인해주세요.");
    }
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    if (coord.latitude && coord.longitude && currentAddress) {
      onLocationSelect(coord.latitude, coord.longitude, currentAddress);
      onClose();
    } else {
      alert("위치를 선택해주세요.");
    }
  };

  // 오버레이 클릭 핸들러
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 취소 핸들러
  // const handleCancel = () => {
  //   closeWithError(new Error("장소 선택이 취소되었습니다."));
  // };

  // TMap 스크립트 로드
  useEffect(() => {
    if (isVisible && typeof window !== "undefined" && !window.Tmapv2) {
      const script = document.createElement("script");
      script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_APP_KEY}`;
      script.async = true;
      script.onload = () => {
        console.log("TMap API 로드 완료");
      };
      document.head.appendChild(script);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={handleOverlayClick}
    >
      <div className="flex w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        {/* 헤더 영역 */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold">장소 선택</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
          >
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

        <div className="p-4 text-sm text-gray-600">
          <p>만날 때는 누구나 쉬운 공공장소가 좋아요.</p>
        </div>

        {/* 검색창과 지도 영역 */}
        <div className="flex h-[400px] space-x-4 p-4">
          {/* 검색창과 결과 목록을 포함하는 좌측 영역 */}
          <div className="flex w-[260px] flex-shrink-0 flex-col">
            {/* 검색창 */}
            <div className="mb-4">
              <Input
                label="장소 검색"
                value={searchKeyword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchKeyword(e.currentTarget.value)
                }
                placeholder="주소나 장소를 검색하세요"
              />
            </div>

            {/* 검색 결과 컨테이너 */}
            <div className="flex h-full flex-col overflow-hidden">
              <h3 className="mb-2 text-sm font-medium">검색 결과</h3>

              {/* 스크롤 가능한 영역 */}
              <div className="h-[300px] overflow-y-auto">
                {addressData.length > 0 ? (
                  <AddressList
                    addressData={addressData}
                    onClickAddressListItem={onClickAddressListItem}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-md border border-gray-300 p-2">
                    <p className="text-center text-sm text-gray-500">
                      {debouncedSearchKeyword
                        ? "검색 결과가 없습니다"
                        : "검색어를 입력하세요"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 지도 컨테이너 */}
          <div className="relative h-full flex-grow">
            <div id="map" className="h-full w-full rounded" ref={mapRef} />

            {/* 현재 위치 버튼 */}
            <button
              onClick={handleMyLocationClick}
              className="absolute bottom-6 right-4 rounded-full bg-white p-2 shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 선택한 주소 표시 */}
        <div className="bg-gray-50 px-4 text-center">
          <span className="mr-2 inline-block text-sm">선택한 주소: </span>
          <span className="inline-block flex-grow text-sm font-bold">
            {selectedAddress}
          </span>
        </div>

        <div className="flex justify-end space-x-2 p-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleConfirm}
            className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            disabled={!selectedPlace}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlaceSelectionModal;
