import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  //const { id } = req.query;

  const {
    query: { id }, // chatroom id
    session: { user }, // login user
  } = req;
  if (!id) {
    return res.status(404).end({ error: "request query is not given." });
  }
  if (!user) {
    return res.status(404).end({ error: "request user is not given." });
  }

  const appointmentId = Number(id);

  // 유효한 ID 확인
  if (isNaN(appointmentId)) {
    return res.status(400).json({ ok: false, error: "유효하지 않은 약속 ID입니다." });
  }

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다." });
  }

  const userId = user.id;

  try {
    // 약속 정보 조회
    const appointment = await client.appointment.findUnique({
      where: {
        id: appointmentId,
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        notifications: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "약속을 찾을 수 없습니다." });
    }

    // 접근 권한 확인 (주최자 또는 참여자만 접근 가능)
    const isOrganizer = appointment.organizerId === userId;
    const isParticipant = appointment.participants.some((p) => p.userId === userId);

    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ ok: false, error: "이 약속에 접근할 권한이 없습니다." });
    }

    if (req.method === "GET") {
      // 약속 상세 조회
      return res.json({
        ok: true,
        appointment,
        userRole: isOrganizer ? "organizer" : "participant",
        //user: { id: userId },
      });
    } else if (req.method === "PUT") {
      // 약속 수정
      if (!isOrganizer) {
        return res.status(403).json({ ok: false, error: "약속을 수정할 권한이 없습니다." });
      }

      const { title, description, date, startTime, endTime, location, status } = req.body;

      const updatedAppointment = await client.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(date && { date: new Date(date) }),
          ...(startTime && { startTime: new Date(startTime) }),
          ...(endTime && { endTime: new Date(endTime) }),
          ...(location && {
            locationName: location.name,
            locationAddress: location.address,
            roadAddress: location.roadAddress,
            latitude: location.latitude,
            longitude: location.longitude,
            zoomLevel: location.zoomLevel,
          }),
          ...(status && { status }),
        },
      });

      return res.json({
        ok: true,
        appointment: updatedAppointment,
      });
    } else {
      return res.status(405).json({ ok: false, error: "허용되지 않은 메서드입니다." });
    }
  } catch (error) {
    console.error("약속 처리 중 오류:", error);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다." });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "DELETE"], handler, isPrivate: true })
);
