import axios from "axios";

const _DEV_ = process.env.NODE_ENV === "development";

// __DEV__ 값을 통해 현재 환경이 개발 환경인지 아닌지 판단할 수 있습니다.
const baseURL = _DEV_ ? "http://localhost:3000" : "https://articles.example.com";

const client = axios.create({
  baseURL,
});

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
