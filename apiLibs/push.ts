import aclient from './aclient';

interface VapidKeyResponse {
  vapidPublicKey: string;
  ok: boolean;
}

interface PushSubscribeResponse {
  ok: boolean;
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
