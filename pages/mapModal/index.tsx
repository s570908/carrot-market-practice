import { useEffect, useRef, useState, ReactNode, useMemo, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries";
import { useMap } from "./useMap"; // useMap 훅을 임포트

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
      <ul id="address-input" className="space-y-2">
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
              //onKeyDown={onClickAddressListItem}
            >
              <span className="text-sm font-bold">{addressName}</span>
              <span className="text-xs font-normal">{fullAddress}</span>
            </li>
          );
        })}
      </ul>
    );
  }
);

AddressList.displayName = "AddressList";

// MapModal 컴포넌트 수정
export function MapModal() {
  //const [open, setOpen] = useModalAtom();
  const [searchKeyword, setSearchKeyword] = useState("");
  const debouncedSearchKeyword = useDebounce(searchKeyword);
  const mapRef = useRef<HTMLDivElement>(null);

  const {
    coord,
    setCoord,
    updateMarker,
    currentAddress: selectedAddress,
    initMapModal,
  } = useMap(mapRef);

  const isFirstRender = useRef(true);
  const isMarkerUpdated = useRef(false);

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

  //console.log("addressData: ", addressData);

  const resetSearchKeyword = () => {
    setSearchKeyword("");
  };

  // const closeModal = () => {
  //   resetSearchKeyword();
  //   setOpen(false);
  // };

  const onClickConfirm = () => {
    const { latitude, longitude } = coord;
    if (!(latitude && longitude)) return;
    console.log("선택한 주소:", selectedAddress);
    console.log("latitude:", latitude);
    console.log("longitude:", longitude);
    //closeModal();
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

  return (
    <dialog className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-lg" open>
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm font-normal">선택한 주소: </span>
          <span className="text-sm font-bold">{selectedAddress}</span>
        </div>
        <div className="flex max-h-[calc(100%-5.7rem)] flex-1 flex-col space-x-2 md:flex-row">
          <div className="flex min-w-[140px] flex-col space-y-2">
            <Input
              label="장소 검색"
              list="address-input"
              value={searchKeyword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchKeyword(e.currentTarget.value)
              }
            />
            {/* 별도 컴포넌트로 분리한 주소 목록 */}
            <AddressList
              addressData={addressData}
              onClickAddressListItem={onClickAddressListItem}
            />
          </div>
          <div id="map" className="h-full min-h-[300px] w-full" ref={mapRef} />
        </div>
        <div className="flex space-x-2">
          <Button
            type="button"
            theme="primary"
            size="medium"
            shape="line"
            //onClick={closeModal}
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
    </dialog>
  );
}

export default MapModal;
