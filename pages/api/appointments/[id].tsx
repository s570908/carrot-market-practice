import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const {
    query: { id }, // appointment id
    session: { user }, // login user
  } = req;

  if (!id) {
    return res.status(404).json({ ok: false, error: "약속 ID가 필요합니다." });
  }

  if (!user) {
    return res.status(401).json({ ok: false, error: "로그인이 필요합니다." });
  }

  const appointmentId = Number(id);

  // 유효한 ID 확인
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
        locationTmap: true, // LocationTmap 관계 포함
        notifications: true,
      },
    });

    if (!appointment) {
      return res.status(404).json({ ok: false, error: "약속을 찾을 수 없습니다." });
    }

    // 접근 권한 확인 (주최자 또는 참여자만 접근 가능)
    const isOrganizer = appointment.organizerId === user.id;
    const isParticipant = appointment.participants.some((p) => p.userId === user.id);

    if (!isOrganizer && !isParticipant) {
      return res.status(403).json({ ok: false, error: "이 약속에 접근할 권한이 없습니다." });
    }

    // HTTP 메서드 처리
    if (req.method === "GET") {
      try {
        // 약속 상세 조회
        return res.json({
          ok: true,
          appointment,
          userRole: isOrganizer ? "organizer" : "participant",
        });
      } catch (error) {
        console.error("약속 조회 중 오류 발생:", error);
        return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다." });
      }
    } else if (req.method === "PUT") {
      // 약속 수정
      if (!isOrganizer) {
        return res.status(403).json({ ok: false, error: "약속을 수정할 권한이 없습니다." });
      }

      console.log("약속 수정 api/appointment/[id]--Put body:", req.body);
      const {
        title,
        description,
        date,
        startTime,
        endTime,
        location,
        status,
        participants,
        notifications,
      } = req.body;

      try {
        // 트랜잭션으로 약속 정보와 관련 데이터를 함께 업데이트
        const updatedAppointment = await client.$transaction(async (tx) => {
          // 1. 약속 기본 정보 업데이트
          const appointment = await tx.appointment.update({
            where: { id: appointmentId },
            data: {
              ...(title && { title }),
              ...(description !== undefined && { description }),
              ...(date && { date: new Date(date) }),
              ...(startTime && { startTime: new Date(startTime) }),
              ...(endTime && { endTime: new Date(endTime) }),
              ...(status && { status }),
            },
            include: {
              locationTmap: true,
              organizer: {
                select: { id: true, name: true, avatar: true },
              },
              participants: {
                include: {
                  user: {
                    select: { id: true, name: true, avatar: true },
                  },
                },
              },
              notifications: true,
            },
          });

          // 2. 위치 정보 업데이트
          if (location && location.addressInfo) {
            const addressInfo = location.addressInfo;
            const locationData = {
              locationName: addressInfo.buildingName || "선택한 장소",
              latitude: location.latitude,
              longitude: location.longitude,
              fullAddress: addressInfo.fullAddress || "",
              city_do: addressInfo.city_do || "",
              gu_gun: addressInfo.gu_gun || "",
              eup_myun: addressInfo.eup_myun || "",
              bunji: addressInfo.bunji || "",
              roadName: addressInfo.roadName || "",
              buildingIndex: addressInfo.buildingIndex || "",
              buildingName: addressInfo.buildingName || "",
              adminDong: addressInfo.adminDong || "",
              adminDongCode: addressInfo.adminDongCode || "",
              legalDong: addressInfo.legalDong || "",
              legalDongCode: addressInfo.legalDongCode || "",
              mappingDistance: addressInfo.mappingDistance || "",
              addressType: addressInfo.addressType || "",
              roadCode: addressInfo.roadCode || "",
            };

            if (appointment.locationTmap) {
              // 기존 위치 정보 업데이트
              await tx.locationTmap.update({
                where: { id: appointment.locationTmap.id },
                data: locationData,
              });
            } else {
              // 새 위치 정보 생성
              await tx.locationTmap.create({
                data: {
                  ...locationData,
                  appointment: { connect: { id: appointmentId } },
                },
              });
            }
          }

          // 3. 참가자 처리
          if (participants && Array.isArray(participants)) {
            // 기존 참가자 목록 조회
            const existingParticipants = await tx.appointmentParticipant.findMany({
              where: { appointmentId },
            });

            const existingUserIds = existingParticipants.map((p) => p.userId);
            const newUserIds = participants.filter((id) => !existingUserIds.includes(id));

            // 새 참가자 추가
            await Promise.all(
              newUserIds.map((userId) =>
                tx.appointmentParticipant.create({
                  data: {
                    appointment: { connect: { id: appointmentId } },
                    user: { connect: { id: userId } },
                    status: "PENDING",
                  },
                })
              )
            );

            // 제거된 참가자 삭제 (클라이언트에서 보낸 목록에 없는 기존 참가자)
            const toRemoveUserIds = existingUserIds.filter(
              (id) => !participants.includes(id) && id !== appointment.organizerId
            );

            if (toRemoveUserIds.length > 0) {
              await tx.appointmentParticipant.deleteMany({
                where: {
                  appointmentId,
                  userId: { in: toRemoveUserIds },
                },
              });
            }
          }

          // 4. 알림 처리
          if (notifications && Array.isArray(notifications)) {
            // 기존 알림 삭제 (완전히 새로 설정)
            await tx.appointmentNotification.deleteMany({
              where: { appointmentId },
            });

            // 새 알림 생성
            await Promise.all(
              notifications.map((notification) =>
                tx.appointmentNotification.create({
                  data: {
                    appointment: { connect: { id: appointmentId } },
                    title: notification.title || `${title} 약속 알림`,
                    message: notification.message || "",
                    type: notification.type || "PUSH",
                    minutesBefore: notification.minutesBefore,
                  },
                })
              )
            );
          }

          // 최종 업데이트된 약속 정보 조회 (관계 데이터 포함)
          return await tx.appointment.findUnique({
            where: { id: appointmentId },
            include: {
              locationTmap: true,
              organizer: {
                select: { id: true, name: true, avatar: true },
              },
              participants: {
                include: {
                  user: {
                    select: { id: true, name: true, avatar: true },
                  },
                },
              },
              notifications: true,
            },
          });
        });

        return res.json({
          ok: true,
          appointment: updatedAppointment,
        });
      } catch (error) {
        console.error("약속 수정 중 오류:", error);
        return res
          .status(500)
          .json({ ok: false, error: "약속을 수정하는 중 오류가 발생했습니다." });
      }
    } else if (req.method === "DELETE") {
      // 약속 삭제
      if (!isOrganizer) {
        return res.status(403).json({ ok: false, error: "약속을 삭제할 권한이 없습니다." });
      }

      // CASCADE 설정으로 관련 레코드도 함께 삭제됨
      await client.appointment.delete({
        where: { id: appointmentId },
      });

      return res.status(200).json({
        ok: true,
        message: "약속이 성공적으로 삭제되었습니다.",
      });
    } else {
      return res.status(405).json({ ok: false, error: "지원되지 않는 메서드입니다." });
    }
  } catch (error) {
    console.error("약속 처리 중 오류:", error);
    return res.status(500).json({ ok: false, error: "서버 오류가 발생했습니다." });
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "PUT", "DELETE"], handler, isPrivate: true })
);
