import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query;
    const { user } = req.session;

    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ ok: false, error: "Invalid alarm ID" });
    }

    // 알림 정보 조회
    const alarm = await client.alarmSetting.findUnique({
      where: { 
        id: Number(id),
      },
      select: {
        id: true,
        userId: true,
        messageId: true,
        alarmTime: true,
        triggerAt: true,
        chatRoomId: true,
        chatMeetupId: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      // include: {
      //   chatRoom: true,
      // }
    }) as { 
      id: number;
      userId: number;
      messageId: number;
      alarmTime: string;
      triggerAt: Date;
      chatRoomId: number;
      chatMeetupId: number;
      status: string;
      createdAt: Date;
      updatedAt: Date;
      meta?: any;
    };

    if (!alarm) {
      return res.status(404).json({ ok: false, error: "Alarm not found" });
    }

    // 요청자가 알림의 소유자인지 확인 (테스트 목적이므로 제한 완화 가능)
    if (alarm.userId !== user.id) {
      return res.status(403).json({ ok: false, error: "Access denied to this alarm" });
    }

    // 메타 데이터 파싱
    let metaData = {};
    try {
      if (alarm.meta) {
        metaData = typeof alarm.meta === 'string' ? JSON.parse(alarm.meta) : alarm.meta;
      }
    } catch (e) {
      console.error("메타데이터 파싱 오류:", e);
      metaData = { error: "메타데이터 파싱 실패" };
    }

    // 현재 시간 기준 정보 계산
    const now = new Date();
    const triggerAt = new Date(alarm.triggerAt);
    const timeRemaining = Math.floor((triggerAt.getTime() - now.getTime()) / 1000);
    const isPast = timeRemaining < 0;
    
    // 알림 상태 추가 정보
    let statusInfo = "예약됨";
    switch (alarm.status) {
      case "SCHEDULED": statusInfo = "예약됨 (아직 발송되지 않음)"; break;
      case "TRIGGERED": statusInfo = "발송됨 (서버에서 처리됨)"; break;
      case "DELIVERED": statusInfo = "전달됨 (클라이언트에 도착)"; break;
      case "CANCELED": statusInfo = "취소됨"; break;
      case "FAILED": statusInfo = "실패함"; break;
      default: statusInfo = "알 수 없음";
    }

    // 시스템 메시지 조회 (추가 정보)
    const systemMessage = await client.sellerChat.findUnique({
      where: { id: alarm.messageId },
      select: { chatMsg: true, meta: true }
    });

    // 알림 상태 정보 반환
    return res.status(200).json({ 
      ok: true, 
      alarm: {
        id: alarm.id,
        status: alarm.status,
        statusInfo,
        triggerAt: alarm.triggerAt,
        alarmTime: alarm.alarmTime,
        createdAt: alarm.createdAt,
        updatedAt: alarm.updatedAt,
        messageId: alarm.messageId,
        chatRoomId: alarm.chatRoomId,
      },
      status: alarm.status,
      timeInfo: {
        now: now.toISOString(),
        triggerAt: triggerAt.toISOString(),
        timeRemaining,
        isPast,
        formattedRemaining: formatTimeRemaining(Math.abs(timeRemaining)),
        direction: isPast ? "지남" : "남음"
      },
      debug: {
        meta: metaData,
        message: systemMessage?.chatMsg,
        messageMetaPreview: typeof systemMessage?.meta === 'string' ? 
          systemMessage.meta.substring(0, 100) + (systemMessage.meta.length > 100 ? '...' : '') :
          systemMessage?.meta
      }
    });
  } catch (error) {
    console.error("Error fetching alarm status:", error);
    return res.status(500).json({ ok: false, error: "Failed to fetch alarm status" });
  }
}

// 시간 포맷팅 함수
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 ${seconds % 60}초`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 ${minutes % 60}분`;
  
  const days = Math.floor(hours / 24);
  return `${days}일 ${hours % 24}시간`;
}

export default withApiSession(
  withHandler({ methods: ["GET"], handler })
);
