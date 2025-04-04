import { useEffect, useRef, useState, ReactNode, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries";
import { useMap } from "@libs/client/useMap";
import { TmapAddressInfo } from "@/types";

// Input 컴포넌트
function Input({ label = "", errorMessage = "", ...rest }: InputProps) {
  const { value, maxLength, disabled, required } = rest;

  return (
    <div
      className={`mb-2 rounded border p-2 ${errorMessage ? "border-red-500" : "border-gray-300"} ${
        disabled ? "cursor-not-allowed bg-gray-100" : ""
      }`}
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
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...rest}
      />
      {!disabled && errorMessage && <p className="mt-1 text-xs text-red-500">{errorMessage}</p>}
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

// InputProps 타입 정의
interface InputProps {
  label?: string;
  errorMessage?: string;
  value?: string;
  maxLength?: number;
  disabled?: boolean;
  required?: boolean;
  [key: string]: any;
}

// Button 컴포넌트
function Button({
  children,
  onClick,
  type = "button",
  theme,
  size,
  shape,
  fullWidth,
}: ButtonProps) {
  const buttonClass = `button ${theme || ""} ${size || ""} ${shape || ""} ${
    fullWidth ? "w-full" : ""
  }`;

  return (
    <button type={type} className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
}

// ButtonProps 타입 정의
interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  theme?: string;
  size?: string;
  shape?: string;
  fullWidth?: boolean;
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

// AddressList 컴포넌트를 스크롤 가능한 창으로 수정

// AddressList 컴포넌트 분리 (불필요한 렌더링 방지)
// memo는 이전 props와 새 props를 얕은 비교(shallow comparison)합니다.
// props가 변경되지 않았다면 컴포넌트를 재렌더링하지 않고 이전 렌더링 결과를 재사용합니다.
// props가 변경되었을 때만 재렌더링합니다.
const AddressList = memo(
  ({
    addressData,
    onClickAddressListItem,
  }: {
    addressData: any[];
    onClickAddressListItem: (e: React.MouseEvent | React.KeyboardEvent) => void;
  }) => {
    // 데이터가 없을 때 컴포넌트가 아무것도 렌더링하지 않도록 합니다.
    // 불필요한 빈 목록 렌더링을 방지합니다.
    if (!addressData?.length) return null;

    return (
      <div className="h-full overflow-y-auto rounded-md border border-gray-300 p-2">
        <ul className="space-y-2">
          {addressData.map((address) => {
            const fullAddress = address.newAddressList.newAddress[0].fullAddressRoad;
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

// MapModal 컴포넌트 수정
// Define the MapModalProps interface
interface MapModalProps {
  isOpen: boolean;
  onClose: (selectedLocation?: null) => void;
  //onLocationSelect: (latitude: number, longitude: number, address: string) => void;
  onLocationSelectAddressInfo: (
    latitude: number,
    longitude: number,
    addressInfo: TmapAddressInfo | null
  ) => void;
}

export function MapModal({
  isOpen,
  onClose,
  //onLocationSelect,
  onLocationSelectAddressInfo,
}: MapModalProps) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const debouncedSearchKeyword = useDebounce(searchKeyword);
  const mapRef = useRef<HTMLDivElement>(null);

  const {
    coord,
    setCoord,
    updateMarker,
    currentAddress: selectedAddress,
    addressInfo,
    initMapModal,
  } = useMap(mapRef);

  const isFirstRender = useRef(true);
  const isMarkerUpdated = useRef(false);

  /* 
	queryKeys는 아래와 같이 구성될 것입니다.
	{
		tmap: {
			searchAddress: (filters: { searchKeyword: string }) => ({
				queryKey: [{ filters }],
				queryFn: () => tmap.searchAddress(filters),
			}),
			getAddressFromCoord: (filters: { latitude: number; longitude: number }) => ({
				queryKey: [{ filters }],
				queryFn: () => tmap.getAddressFromCoord(filters),
			}),
		}
	}
 */
  // 주소 검색 쿼리 - staleTime을 30초로 설정하여 불필요한 재요청 방지
  const { data: tmapResponse } = useQuery({
    ...queryKeys.tmap.searchAddress({
      searchKeyword: debouncedSearchKeyword,
    }),
    enabled: !!debouncedSearchKeyword,
    placeholderData: undefined,
    //staleTime: 3000, // 3초간 캐시 유지
  });

  // 주소 데이터 메모이제이션 - 불필요한 연산 방지
  // useMemo는 의존성 배열([tmapResponse])의 값이 변경될 때만 새로운 값을 계산합니다.
  // tmapResponse가 동일하다면 이전과 동일한 addressData 참조를 반환합니다.
  // 이로 인해 AddressList의 props가 변경되지 않아 리렌더링이 발생하지 않습니다.
  const addressData = useMemo(() => {
    return tmapResponse?.searchPoiInfo?.pois?.poi || [];
  }, [tmapResponse]);

  const resetSearchKeyword = () => {
    setSearchKeyword("");
  };

  const closeModal = () => {
    resetSearchKeyword();
    onClose(null); // null 값을 반환하여 선택된 위치를 초기화
  };

  const onClickConfirm = () => {
    const { latitude, longitude } = coord;
    if (!(latitude && longitude)) return;
    console.log("선택한 주소:", selectedAddress);
    console.log("latitude:", latitude);
    console.log("longitude:", longitude);
    //onLocationSelect(latitude, longitude, selectedAddress); // 선택된 위치를 부모에게 전달
    //if (addressInfo) {
    onLocationSelectAddressInfo(latitude, longitude, addressInfo ?? null); // 선택된 위치를 부모에게 전달
    //}

    onClose(); // 모달 닫기
  };

  const onClickAddressListItem = <Event extends React.MouseEvent | React.KeyboardEvent>(
    e: Event
  ) => {
    const coordinate = {
      latitude: Number(e.currentTarget.getAttribute("data-lat")),
      longitude: Number(e.currentTarget.getAttribute("data-lon")),
    };

    //console.log("onClickAddressListItem--coordinate: ", coordinate);

    // 기존 마커 업데이트 (제거 후 새로 생성)
    updateMarker(coordinate, "red");

    // 마커 즉시 업데이트를 위해 플래그 재설정
    isMarkerUpdated.current = true;
  };

  // 마커 업데이트 로직 수정 - 마운트 시 한 번만 실행
  // !isMarkerUpdated.current: 아직 마커가 생성되지 않았는지 확인
  // coord.latitude && coord.longitude: 유효한 좌표가 있는지 확인
  // 두 조건이 모두 충족되면 빨간색 마커를 지도에 표시합니다.
  // isMarkerUpdated.current = true로 설정하여 이후 렌더링에서는 마커를 다시 생성하지 않습니다.
  // 의존성 배열: [coord, coord.latitude, coord.longitude, updateMarker]
  //   좌표 객체 또는 좌표 값이 변경될 때 useEffect가 재실행됩니다.
  //   단, isMarkerUpdated.current가 true인 경우 실제 마커 업데이트는 실행되지 않습니다.
  useEffect(() => {
    if (!isMarkerUpdated.current && coord.latitude && coord.longitude) {
      updateMarker(coord, "red");
      isMarkerUpdated.current = true;
    }
  }, [coord, coord.latitude, coord.longitude, updateMarker]);

  // 컴포넌트 마운트 시 초기화
  useEffect(() => {
    initMapModal();
    // 컴포넌트 언마운트 시 정리
    return () => {
      isFirstRender.current = true;
      isMarkerUpdated.current = false;
    };
  }, [initMapModal]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm font-normal">선택한 주소: </span>
            <span className="text-sm font-bold">{selectedAddress}</span>
          </div>

          {/* 수직 레이아웃 조정 */}
          <div className="flex h-[400px] space-x-4">
            {/* 검색창과 목록을 포함하는 좌측 영역 */}
            <div className="flex w-[260px] flex-shrink-0 flex-col">
              {/* 검색창 - 고정 높이 */}
              <div className="mb-2">
                <Input
                  label="장소 검색"
                  list="address-input"
                  value={searchKeyword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearchKeyword(e.currentTarget.value)
                  }
                />
              </div>

              {/* 검색 결과 컨테이너 - 수정된 부분 */}
              <div className="flex h-full flex-col overflow-hidden">
                <h3 className="mb-2 text-sm font-medium">검색 결과</h3>

                {/* 스크롤 가능한 영역 */}
                <div className="flex-grow overflow-y-auto">
                  {addressData.length > 0 ? (
                    <AddressList
                      addressData={addressData}
                      onClickAddressListItem={onClickAddressListItem}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-md border border-gray-300 p-2">
                      <p className="text-center text-sm text-gray-500">검색 결과가 없습니다</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 지도 영역 */}
            <div id="map" className="h-full flex-grow" ref={mapRef} />
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              theme="primary"
              size="medium"
              shape="line"
              onClick={closeModal}
              fullWidth
            >
              취소
            </Button>
            <Button
              type="button"
              theme="primary"
              size="medium"
              shape="fill"
              fullWidth
              onClick={onClickConfirm}
            >
              확인
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapModal;
