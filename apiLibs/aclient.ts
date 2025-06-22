import axios from "axios";

const _DEV_ = process.env.NODE_ENV === "development";

// __DEV__ 값을 통해 현재 환경이 개발 환경인지 아닌지 판단할 수 있습니다.
const baseURL = _DEV_ ? "http://localhost:3000" : "https://articles.example.com";

const client = axios.create({
  baseURL,
  withCredentials: true, // 쿠키 기반 세션 인증을 위해 추가
});

// 응답 인터셉터 설정: 401 에러 시 자동 리다이렉트
client.interceptors.response.use(
  (response) => response, // 정상 응답은 그대로 반환
  (error) => {
    // 401 Unauthorized 에러 처리
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // /enter 페이지나 공개 API가 아닌 경우에만 리다이렉트
      const isEnterPage = window.location.pathname === '/enter';
      const isPublicApi = error.config?.url?.includes('/api/enter') || 
                          error.config?.url?.includes('/api/push/verify');
      
      if (!isEnterPage && !isPublicApi) {
        console.warn('🔄 Authentication required. Redirecting to login page...');
        
        // 현재 URL 저장 (로그인 후 돌아오기 위함)
        if (window.location.pathname !== '/') {
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        }
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/enter';
      }
    }
    
    // 에러를 다시 throw하여 호출하는 쪽에서 처리할 수 있도록 함
    return Promise.reject(error);
  }
);

const videoDeliveryUrl = "https://videodelivery.net";
export const videoClient = axios.create({
  baseURL: videoDeliveryUrl,
});

export function applyToken(jwt: string) {
  client.defaults.headers.Authorization = `Bearer ${jwt}`;
}

export function clearToken() {
  delete client.defaults.headers.Authorization;
}

export default client;
