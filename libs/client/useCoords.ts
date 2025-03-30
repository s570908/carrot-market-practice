import { useEffect, useState } from "react";

interface UseCoordState {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error?: GeolocationPositionError | null;
}

export default function useCoords() {
  const [coords, setCoords] = useState<UseCoordState>({
    latitude: null,
    longitude: null,
    loading: true,
    error: null,
  });

  const onSuccess = ({ coords: { latitude, longitude } }: GeolocationPosition) => {
    setCoords({
      latitude,
      longitude,
      loading: false,
      error: null,
    });
  };

  const onError = (error: GeolocationPositionError) => {
    setCoords((prev) => ({
      ...prev,
      loading: false,
      error,
    }));
    console.error("위치 정보를 가져오는데 실패했습니다:", error.message);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setCoords((prev) => ({
        ...prev,
        loading: false,
        error: {
          code: 0,
          message: "지오로케이션이 지원되지 않는 브라우저입니다.",
        } as GeolocationPositionError,
      }));
      return;
    }

    const options = {
      enableHighAccuracy: false, // 높은 정확도 필요하지 않음 (배터리 절약)
      timeout: 5000, // 5초 타임아웃
      maximumAge: 0, // 캐시된 위치 사용 안함
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
  }, []);

  return coords;
}
