import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import Image from "next/image";

const RandomCat = () => {
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [load, setLoad] = useState(false);
  const preventRef = useRef(true);
  const obsRef = useRef(null);

  useEffect(() => {
    getDog();
    const observer = new IntersectionObserver(obsHandler, { threshold: 0.5 });
    if (obsRef.current) observer.observe(obsRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    getDog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const obsHandler = (entries: any) => {
    const target = entries[0];
    if (target.isIntersecting && preventRef.current) {
      preventRef.current = false;
      setPage((prev) => prev + 1);
    }
  };

  const getDog = useCallback(async () => {
    //글 불러오기
    console.log("고양이 사진 불러오기");
    setLoad(true); //로딩 시작
    const res = await axios({ method: "GET", url: `https://api.thecatapi.com/v1/images/search` });
    if (res.data) {
      setList((prev) => [...prev, { ...res.data[0] }]); //리스트 추가
      preventRef.current = true;
    } else {
      console.log(res); //에러
    }
    setLoad(false); //로딩 종료
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <>
      <div className="wrap min-h-[100vh]">
        {list && (
          <>
            {list.map((li) => (
              <Image
                key={li.id}
                className="mx-auto mb-6 opacity-100"
                src={li.url}
                alt={li.dke}
                width={"500px"}
                height={"300px"}
              />
            ))}
          </>
        )}
        {load && <div className="bg-blue-500 py-3 text-center">로딩 중</div>}
        <div ref={obsRef} className="bg-red-500 py-3 text-center text-white">
          옵저버 Element
        </div>
      </div>
    </>
  );
};

export default RandomCat;
