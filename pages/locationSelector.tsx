import React, { useState } from "react";
import { NextPage } from "next";
import MapModal from "../components/MapModal";
import ModButton from "../components/ModButton";
import Layout from "../components/Layout";
import { useAwaitableModal } from "@libs/client/useAwaitableModal";

const LocationSelectorPage: NextPage = () => {
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

  const { openModal: openMapModal, renderModal } = useAwaitableModal(
    (modal, params) => {
      return (
        <MapModal
          isOpen={modal.isVisible}
          onClose={() => modal.closeWithResult(null)} // null 값을 반환하여 선택된 위치를 초기화
          onLocationSelect={(
            latitude: number,
            longitude: number,
            address: string
          ) => modal.closeWithResult({ latitude, longitude, address })}
        />
      );
    }
  );

  const handleOpenModal = async () => {
    try {
      const result = await openMapModal(null);
      console.log("Modal closed--result: ", result);
      if (result) {
        const { latitude, longitude, address } = result;
        setSelectedLocation({ latitude, longitude, address });
      } else {
        console.log("Modal closed without selecting a location.");
        setSelectedLocation(null); // 선택된 위치를 초기화
      }
    } catch (error) {
      console.error("Error opening modal:", error);
    }
  };

  return (
    <>
      {renderModal()}
      <Layout title="위치 선택" seoTitle="위치 선택 페이지" hasTabBar>
        <div className="px-4 py-10">
          <h1 className="text-2xl font-bold text-gray-900">위치 선택 테스트</h1>

          <div className="mt-5">
            <p className="text-gray-700">
              아래 버튼을 클릭하여 지도에서 위치를 선택하세요.
            </p>

            {/* 팝업 열기 버튼 */}
            <div className="mt-4">
              <ModButton onClick={handleOpenModal} variant="primary">
                위치 선택하기
              </ModButton>
            </div>

            {/* 선택된 위치 표시 */}
            {selectedLocation === null ? (
              <div className="mt-6 rounded-md bg-gray-50 p-4">
                <h3 className="text-lg font-medium">선택된 위치가 없습니다.</h3>
              </div>
            ) : (
              <div className="mt-6 rounded-md bg-gray-50 p-4">
                <h3 className="text-lg font-medium">선택된 위치</h3>
                <p className="mt-2 text-sm text-gray-600">
                  주소: {selectedLocation.address}
                </p>
                <p className="text-sm text-gray-600">
                  좌표: {selectedLocation.latitude?.toFixed(6)},{" "}
                  {selectedLocation.longitude?.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default LocationSelectorPage;
