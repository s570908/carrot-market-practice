// pages/api/push/verify.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import client from '@/libs/client/client';

interface VerifyResponse {
  isValid: boolean;
  subscriptionId?: number;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>
) {
  // POST 메소드만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ isValid: false, error: 'Method not allowed' });
  }

  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      return res.status(400).json({ isValid: false, error: 'Endpoint is required' });
    }

    // DB에서 해당 endpoint의 구독 정보 확인
    const subscription = await client.pushSubscription.findFirst({
      where: {
        endpoint: endpoint,
        status: 'ACTIVE' // 활성 구독만 유효하다고 간주
      }
    });

    return res.status(200).json({
      isValid: !!subscription,
      subscriptionId: subscription?.id
    });
  } catch (error) {
    console.error('Push verification error:', error);
    return res.status(500).json({ isValid: false, error: 'Internal server error' });
  }
}