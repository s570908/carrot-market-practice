import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios"; // axios import 추가

interface UseFetchState<T> {
  loading: boolean;
  data?: T;
  error?: object;
}

interface UseFetchResult<T> extends UseFetchState<T> {
  mutate: (data?: MutateData) => void;
  refetch: () => void; // refetch 기능 추가
}

// 새로 추가: mutate 함수의 파라미터 타입 정의
interface MutateData {
  url?: string;
  options?: UseFetchOptions;
}

// API 호출을 위한 기본 fetcher 함수 (fetch 방식)
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data = await response.json();
  return data as T; // 명시적으로 T 타입으로 반환
}

// API 호출을 위한 추가 fetcher 함수 (axios 방식)
async function axiosFetcher<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await axios({
      url,
      method: options?.method || "GET",
      headers: options?.headers ? Object.fromEntries(new Headers(options.headers)) : undefined,
      data: options?.body,
    });

    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`HTTP error! Status: ${error.response.status}`);
    }
    throw error;
  }
}

// useFetch의 인터페이스에 fetcherType 옵션 추가
interface UseFetchOptions extends RequestInit {
  fetcherType?: "fetch" | "axios";
}

export default function useFetch<T = any>(
  url: string,
  options?: UseFetchOptions
): UseFetchResult<T> {
  const [reqUrl, setReqUrl] = useState(url);
  const [reqOptions, setReqOptions] = useState(options);
  const fetcherType = options?.fetcherType || "fetch";

  // React Query v5 형식으로 데이터 요청
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [reqUrl, JSON.stringify(reqOptions)],
    queryFn: () =>
      fetcherType === "fetch"
        ? fetcher<T>(reqUrl, reqOptions)
        : axiosFetcher<T>(reqUrl, reqOptions),
    enabled: !!reqUrl, // URL이 있을 때만 요청 실행
  });

  // mutate 함수: 데이터 갱신을 위해 사용 (타입 적용)
  const mutate = (newData?: MutateData) => {
    if (newData) {
      // 새로운 URL이나 옵션으로 요청 갱신
      if (typeof newData.url === "string") setReqUrl(newData.url);
      if (newData.options) setReqOptions(newData.options);
    }
    refetch(); // 데이터 다시 가져오기 요청
  };

  return {
    loading: isLoading,
    data,
    error: error as object | undefined,
    mutate,
    refetch, // refetch 반환
  };
}
