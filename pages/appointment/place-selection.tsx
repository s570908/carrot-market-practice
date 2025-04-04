import { useState, useEffect, useRef } from "react";
import Layout from "@components/Layout";
import { useRouter } from "next/router";
import useUser from "@libs/client/useUser";
import TMapComponent from "@components/TMapComponent";
import { useMap } from "@libs/client/useMap";

interface SelectedPlace {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
}

const PlaceSelection = () => {
  const { user } = useUser();
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null); // 지도를 표시할 div에 대한 ref 생성
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(
    null
  );

  const { coord, updateMarker, currentAddress, initMapModal } = useMap(mapRef);

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

    // 콘솔에 선택된 주소 출력
    console.log("선택된 주소:", address);
    console.log("위도:", lat, "경도:", lng);
  };

  // 선택 완료 핸들러
  const handleConfirm = () => {
    if (!selectedPlace) {
      alert("장소를 선택해주세요.");
      return;
    }

    // 선택한 장소 정보를 로컬 스토리지에 저장
    localStorage.setItem("selectedPlace", JSON.stringify(selectedPlace));

    // 콘솔에 확정된 주소 출력
    console.log("선택 완료한 장소:", selectedPlace);

    // 이전 페이지로 돌아가기
    router.back();
  };

  // currentAddress가 변경되면 자동으로 선택된 위치 업데이트
  useEffect(() => {
    if (coord.latitude && coord.longitude && currentAddress) {
      console.log("현재 주소 변경됨:", currentAddress);
      console.log("현재 좌표:", coord.latitude, coord.longitude);
      handleLocationSelect(coord.latitude, coord.longitude, currentAddress);
    }
  }, [coord.latitude, coord.longitude, currentAddress]);

  // 컴포넌트 마운트 시 지도 초기화
  useEffect(() => {
    initMapModal();
  }, [initMapModal]);

  // TMap 스크립트 로드
  useEffect(() => {
    // 이미 스크립트가 로드되었는지 확인
    if (window.Tmapv2) return;

    const script = document.createElement("script");
    script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${process.env.NEXT_PUBLIC_TMAP_APP_KEY}`;
    script.async = true;
    script.onload = () => {
      console.log("TMap API 로드 완료");
    };
    document.head.appendChild(script);

    return () => {
      // 페이지를 나갈 때 필요한 정리 작업
    };
  }, []);

  console.log("currentAddress: ", currentAddress);

  return (
    <Layout seoTitle="장소 선택" title="장소 선택" canGoBack backUrl="back">
      <div className="flex h-screen flex-col bg-white">
        {/* 안내 텍스트 */}
        <div className="px-4 py-3">
          <p className="text-sm font-semibold text-gray-700">
            이웃과 만나고 싶은
          </p>
          <p className="text-sm font-semibold text-gray-700">
            장소를를 선택해주세요.
          </p>
          <p className="mt-1 text-xs font-medium text-gray-500">
            만날 때는 누구나 쉬운 공공장소가 좋아요.
          </p>
        </div>

        {/* 지도 컴포넌트 */}
        <div className="relative flex-grow">
          {/* <TMapComponent onLocationSelect={handleLocationSelect} /> */}
          <div id="map" className="h-full min-h-[300px] w-full" ref={mapRef} />
          {/* 선택한 주소 표시 */}
          {selectedAddress && (
            <div className="absolute bottom-24 left-1/2 w-11/12 -translate-x-1/2 rounded-md bg-white p-3 shadow-lg">
              <p className="text-center text-sm font-medium">
                {selectedAddress}
              </p>
            </div>
          )}
        </div>

        {/* 완료 버튼 */}
        <div className="p-4">
          <button
            onClick={handleConfirm}
            className="w-full rounded-md bg-orange-500 py-3 font-medium text-white hover:bg-orange-600"
            disabled={!selectedPlace}
          >
            선택 완료
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default PlaceSelection;
