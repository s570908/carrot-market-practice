import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import { ParticipantStatus } from "@prisma/client";
import { NextApiResponseServerIo } from "types/types";

const workspace = "market"; // 소켓 네임스페이스

async function handler(req: NextApiRequest, res: NextApiResponseServerIo) {
  if (req.method !== "PUT") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { status } = req.body;
  const { id } = req.query;
  const appointmentId = parseInt(id as string);

  // 사용자 인증
  const {
    session: { user },
  } = req;
  if (!user) {
    return res.status(401).json({ ok: false, error: "Unauthorized" });
  }

  console.log(
    "pages/api/appointments/[id]/status.ts--id, user, status",
    appointmentId,
    user.id,
    status
  );

  try {
    // 약속 정보 조회
    const appointment = await client.appointment.findUnique({
      where: { id: appointmentId },
      select: { organizerId: true, status: true },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }

    // 주최자인 경우: 약속 자체의 상태 변경
    if (appointment.organizerId === user.id) {
      await client.appointment.update({
        where: { id: appointmentId },
        data: { status },
      });

      // 주최자의 이름 조회
      const organizer = await client.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });

      // 소켓 이벤트 발생 - 약속 상태 변경
      const channel = `appointment-${appointmentId}`;
      res?.socket?.server?.io?.of(`ws-${workspace}`).to(channel).emit("appointmentUpdated", {
        appointmentId,
        updatedBy: user.id,
        updaterName: organizer?.name,
        newStatus: status,
        timestamp: new Date().toISOString(),
      });

      console.log(`약속 상태 변경 이벤트 발생: ${channel}, 상태: ${status}`);

      return res.json({ ok: true, message: "Appointment status updated" });
    }
    // 참가자인 경우: 참가자 응답 상태 변경
    else {
      // 현재 사용자가 실제 참가자인지 확인
      const participant = await client.appointmentParticipant.findFirst({
        where: {
          appointmentId,
          userId: user.id,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!participant) {
        return res.status(403).json({ ok: false, error: "Not a participant" });
      }

      // 참가자의 응답 상태 업데이트
      const updateParticipant = await client.appointmentParticipant.update({
        where: { id: participant.id },
        data: { status: status as ParticipantStatus },
      });

      // 소켓 이벤트 발생 - 참가자 응답 변경
      const channel = `appointment-${appointmentId}`;
      res?.socket?.server?.io?.of(`ws-${workspace}`).to(channel).emit("participantStatusChanged", {
        appointmentId,
        participantId: user.id,
        participantName: participant.user.name,
        newStatus: status,
        timestamp: new Date().toISOString(),
      });

      console.log(
        `참가자 응답 이벤트 발생--"participantStatusChanged: ": ${channel}, 참가자: ${participant.user.name}, 상태: ${status}`
      );

      return res.json({
        ok: true,
        message: "Participant response updated",
        status: status,
      });
    }
  } catch (error) {
    console.error("상태 업데이트 오류:", error);
    return res.status(500).json({ ok: false, error: "Failed to update status" });
  }
}

export default withApiSession(withHandler({ methods: ["PUT"], handler, isPrivate: true }));
