import aclient from './aclient';

interface VapidKeyResponse {
  vapidPublicKey: string;
  ok: boolean;
}

interface PushSubscribeResponse {
  ok: boolean;
}

interface PushVerifyResponse {
  isValid: boolean;
  subscriptionId?: number;
}

export async function getVapidKey() {
  const response = await aclient.get<VapidKeyResponse>('/api/push/vapid-key');
  return response.data;
}

export async function subscribePush(params: {
  endpoint: string;
  p256dh: string;
  auth: string;
  browserId: string;
}) {
  const response = await aclient.post<PushSubscribeResponse>('/api/push/subscribe', params);
  return response.data;
}

/**
 * 서버에 푸시 구독의 유효성을 확인하는 함수
 * @param endpoint 구독의 endpoint URL
 * @returns 구독 유효성 응답 객체
 */
export async function verifyPushSubscription(endpoint: string): Promise<PushVerifyResponse> {
  try {
    const response = await aclient.post<PushVerifyResponse>('/api/push/verify', { endpoint });
    return response.data;
  } catch (error) {
    console.error('Error verifying push subscription:', error);
    return { isValid: false };
  }
}
