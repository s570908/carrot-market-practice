export type MapOptions = {
  zoomControl?: boolean;
};

export type NewAddress = {
  centerLat: string;
  centerLon: string;
  frontLat: string;
  frontLon: string;
  fullAddressRoad: string;
};

export type NewAddressList = {
  newAddress: NewAddress[];
};

export type Poi = {
  newAddressList: NewAddressList;
  id: string;
  pkey: string;
  name: string;
  noorLat: string;
  noorLon: string;
};

export type Pois = {
  poi: Poi[];
};

export type SearchPoiInfo = {
  totalCount: string;
  count: string;
  page: string;
  pois: Pois;
};

export type TMap = {
  setCenter: (latLng: TMapLatLng) => void;
  setZoomLimit: (minZoom: number, maxZoom: number) => void;
  setZoom: (zoomLevel: number) => void;
  setOptions: ({ zoomControl }: MapOptions) => void;
  destroy: () => void;
  addListener: (eventType: EventType, listener: (event: TMapEvent) => void) => void;
  // removeListener 메서드 추가
  removeListener: (eventType: EventType, listener: (event: TMapEvent) => void) => void;
  getPixelToCoord: ({ x, y }: { x: number; y: number }) => TMapLatLng;
};
type EventType =
  | "click"
  | "zoom_changed"
  | "dragstart"
  | "dragend"
  | "zoomstart"
  | "zoomend"
  | "mousewheel";
export type TMapEvent = {
  latLng: TMapLatLng;
};
export type TMapLatLng = {
  lat: () => number;
  lng: () => number;
};

export type TMapMarker = {
  setMap: (map: TMap | null) => void;
  getPosition: () => TMapLatLng;
  setPosition: (latLng: TMapLatLng) => void;
  setLabel: (HTML: string) => void;
};
export type TMapSize = {
  _width: number;
  _height: number;
};
export type TmapFullAddress = {
  fullAddress: string;
};
export type TmapResponse = {
  searchPoiInfo: SearchPoiInfo;
};
export type TmapReverseGeocodingResponse = {
  addressInfo: TmapAddressInfo;
};

export interface TmapAddressInfo {
  addressType: string; // 주소 유형 (예: "A04")
  adminDong: string; // 행정동
  adminDongCode: string; // 행정동 코드
  buildingIndex: string; // 건물 인덱스
  buildingName: string; // 건물 이름
  bunji: string; // 번지
  city_do: string; // 시/도 (예: "서울특별시")
  eup_myun: string; // 읍/면
  fullAddress: string; // 전체 주소
  gu_gun: string; // 구/군 (예: "중구")
  legalDong: string; // 법정동
  legalDongCode: string; // 법정동 코드
  mappingDistance: string; // 매핑 거리 (예: "21.32")
  ri: string; // 리
  roadCode: string; // 도로 코드
  roadName: string; // 도로명 (예: "남대문로")
}

// AddressInfo의 예제 데이터
export const exampleAddressInfo: TmapAddressInfo = {
  addressType: "A04",
  adminDong: "",
  adminDongCode: "",
  buildingIndex: "73",
  buildingName: "AVENUEL",
  bunji: "",
  city_do: "서울특별시",
  eup_myun: "",
  fullAddress: "서울특별시 중구 남대문로 73 AVENUEL",
  gu_gun: "중구",
  legalDong: "",
  legalDongCode: "",
  mappingDistance: "21.32",
  ri: "",
  roadCode: "111403101001",
  roadName: "남대문로",
};
