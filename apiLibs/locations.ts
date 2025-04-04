import { LocationTmap } from "@prisma/client";
import aclient from "./aclient";
import { TmapAddressInfo } from "@/types";

// 위치 정보 응답 타입들
export interface LocationsResponse {
  ok: boolean;
  locations?: LocationTmap[];
  error?: string;
}

export interface LocationResponse {
  ok: boolean;
  location?: LocationTmap & {
    appointment?: {
      id: number;
      title: string;
      date: Date;
      organizer?: {
        id: number;
        name: string;
        avatar?: string;
      };
      status?: string;
    };
  };
  error?: string;
}

export interface CreateLocationResponse {
  ok: boolean;
  location?: LocationTmap;
  error?: string;
}

export interface DeleteLocationResponse {
  ok: boolean;
  message?: string;
  error?: string;
}

// 위치 정보 생성/수정을 위한 데이터 타입 - 실제 API 요구사항과 일치하도록 수정
export interface LocationInput {
  appointmentId?: number;
  locationName: string;
  latitude: number;
  longitude: number;
  // 실제 API에서는 이렇게 묶여서 처리되지 않음
  // TMap API 특화 필드들 - 직접 개별 필드로 포함
  addressType?: string;
  adminDong?: string;
  adminDongCode?: string;
  buildingIndex?: string;
  buildingName?: string;
  bunji?: string;
  city_do?: string;
  eup_myun?: string;
  fullAddress?: string;
  gu_gun?: string;
  legalDong?: string;
  legalDongCode?: string;
  mappingDistance?: string;
  ri?: string;
  roadCode?: string;
  roadName?: string;
}

// Helper function for converting TmapAddressInfo to LocationInput format
// TMap API에서 받아온 주소 정보를 애플리케이션에서 사용하는 내부 데이터 형식으로 변환하는 헬퍼(유틸리티) 함수입니다.
// 이 함수는 TMap API에서 제공하는 주소 정보를 LocationInput 형식으로 변환하여 반환합니다.
// 데이터 통합: TMap API의 주소 정보(행정구역, 도로명, 지번 등)에 사용자 정의 정보(장소명, 위도/경도, 약속 ID)를 결합

// 실제 사용 시나리오: 사용자가 장소 검색 후 선택
// //TMap API 호출 결과
// const tmapSearchResult = await searchAddressFromTmap("서울역");

// // 사용자 입력 정보
// const userInput = {
//   locationName: "미팅 장소",
//   latitude: 37.5536,
//   longitude: 126.9696,
//   appointmentId: 123
// };

// // 데이터 변환
// const locationForSaving = convertTmapAddressToLocationInput(
//   tmapSearchResult,
//   userInput
// );

// // 변환된 데이터로 저장 API 호출
// await createLocation(locationForSaving);

//
export function convertTmapAddressToLocationInput(
  tmapAddress: TmapAddressInfo,
  additionalData: {
    locationName: string;
    latitude: number;
    longitude: number;
    appointmentId?: number;
  }
): LocationInput {
  return {
    ...additionalData,
    addressType: tmapAddress.addressType,
    adminDong: tmapAddress.adminDong,
    adminDongCode: tmapAddress.adminDongCode,
    buildingIndex: tmapAddress.buildingIndex,
    buildingName: tmapAddress.buildingName,
    bunji: tmapAddress.bunji,
    city_do: tmapAddress.city_do,
    eup_myun: tmapAddress.eup_myun,
    fullAddress: tmapAddress.fullAddress,
    gu_gun: tmapAddress.gu_gun,
    legalDong: tmapAddress.legalDong,
    legalDongCode: tmapAddress.legalDongCode,
    mappingDistance: tmapAddress.mappingDistance,
    ri: tmapAddress.ri,
    roadCode: tmapAddress.roadCode,
    roadName: tmapAddress.roadName,
  };
}

// 모든 위치 목록 가져오기
export async function getLocations(appointmentId?: number) {
  const queryParams = appointmentId ? `?appointmentId=${appointmentId}` : "";
  const response = await aclient.get<LocationsResponse>(`/api/locations${queryParams}`);
  return response.data;
}

// 특정 위치 정보 가져오기
export async function getLocation(id: number) {
  const response = await aclient.get<LocationResponse>(`/api/locations/${id}`);
  return response.data;
}

// 새 위치 정보 생성하기
export async function createLocation(locationData: LocationInput) {
  const response = await aclient.post<CreateLocationResponse>("/api/locations", locationData);
  return response.data;
}

// 위치 정보 업데이트하기
export async function updateLocation(id: number, locationData: Partial<LocationInput>) {
  const response = await aclient.put<LocationResponse>(`/api/locations/${id}`, locationData);
  return response.data;
}

// 위치 정보 삭제하기
export async function deleteLocation(id: number) {
  const response = await aclient.delete<DeleteLocationResponse>(`/api/locations/${id}`);
  return response.data;
}
