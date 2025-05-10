import { useEffect, useRef } from "react";

export default function Home() {
  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null); // 맵 인스턴스를 저장할 ref

  useEffect(() => {
    const appKey = "I8JdvDcQP480swvJQQqHX64CpePvw4rb3bz9OWAr"; // 여기에 실제 발급받은 AppKey를 입력하세요.

    const loadTmap = () => {
      if (document.getElementById("tmap-script")) {
        // 이미 로드된 경우 바로 실행
        waitForTmap();
        return;
      }

      const script = document.createElement("script");
      script.id = "tmap-script";
      script.src = `https://apis.openapi.sk.com/tmap/vectorjs?version=1&appKey=${appKey}`;
      script.async = true;
      script.onload = () => waitForTmap();
      document.head.appendChild(script);
    };

    const waitForTmap = () => {
      const checkTmap = setInterval(() => {
        if (window.Tmapv3) {
          clearInterval(checkTmap);
          initTmap();
        }
      }, 1000);
    };

    const initTmap = () => {
      if (mapDivRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = new window.Tmapv3.Map(mapDivRef.current, {
          center: new window.Tmapv3.LatLng(37.5652045, 126.98702028),
          width: "100%",
          height: "400px",
          zoom: 16,
        });
      }
    };

    loadTmap();

    return () => {
      mapInstanceRef.current = null; // 언마운트 시 참조 초기화
    };
  }, []);

  return <div ref={mapDivRef} style={{ width: "100%", height: "400px" }} />;
}
