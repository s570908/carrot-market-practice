// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\api\appointments\[id]\participants.ts
// import { NextApiRequest, NextApiResponse } from "next";
// import { withApiSession } from "@/lib/withSession";
// import client from "@/lib/client";

import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id },
    session: { user },
  } = req;

  if (!user?.id) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다." });
  }

  const appointmentId = Number(id);
  if (isNaN(appointmentId)) {
    return res.status(400).json({ ok: false, error: "유효하지 않은 약속 ID입니다." });
  }

  try {
    // 약속 정보 조회
    const appointment = await client.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        participants: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "약속을 찾을 수 없습니다." });
    }

    if (req.method === "POST") {
      // 참가자 추가 (주최자만 가능)
      if (appointment.organizerId !== user.id) {
        return res.status(403).json({ ok: false, error: "참가자를 추가할 권한이 없습니다." });
      }

      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ ok: false, error: "사용자 ID가 필요합니다." });
      }

      // 이미 참가자인지 확인
      const existingParticipant = appointment.participants.find((p) => p.userId === userId);

      if (existingParticipant) {
        return res.status(400).json({ ok: false, error: "이미 참가자로 등록되어 있습니다." });
      }

      // 참가자 추가
      const participant = await client.appointmentParticipant.create({
        data: {
          appointment: {
            connect: {
              id: appointmentId,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      return res.json({
        ok: true,
        participant,
      });
    } else if (req.method === "DELETE") {
      // 참가자 제거 (주최자만 가능)
      if (appointment.organizerId !== user.id) {
        return res.status(403).json({ ok: false, error: "참가자를 제거할 권한이 없습니다." });
      }

      const { participantId } = req.body;

      if (!participantId) {
        return res.status(400).json({ ok: false, error: "참가자 ID가 필요합니다." });
      }

      // 참가자 제거
      await client.appointmentParticipant.delete({
        where: {
          id: participantId,
        },
      });

      return res.json({
        ok: true,
      });
    } else if (req.method === "PUT") {
      // 참가 상태 업데이트 (참가자 본인만 가능)
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ ok: false, error: "상태 정보가 필요합니다." });
      }

      // 참가자 정보 확인
      const participant = appointment.participants.find((p) => p.userId === user.id);

      if (!participant) {
        return res.status(404).json({ ok: false, error: "참가자 정보를 찾을 수 없습니다." });
      }

      // 상태 업데이트
      const updatedParticipant = await client.appointmentParticipant.update({
        where: {
          id: participant.id,
        },
        data: {
          status,
          responseTime: new Date(),
        },
      });

      return res.json({
        ok: true,
        participant: updatedParticipant,
      });
    } else {
      return res.status(405).end();
    }
  } catch (error) {
    console.error("약속 참가자 API 오류:", error);
    return res.status(500).json({ ok: false, error: "참가자 처리 중 오류가 발생했습니다." });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "DELETE"], handler, isPrivate: true })
);
