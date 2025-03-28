// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\api\appointments\index.ts
//import { NextApiRequest, NextApiResponse } from "next";
//import { getSession } from "next-auth/react";
//import prisma from "@/lib/prisma";

import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 사용자 세션 확인
  const {
    session: { user }, // login user
  } = req;
  if (!user) {
    return res.status(404).end({ error: "request user is not given." });
  }

  const userId = user.id;

  if (req.method === "GET") {
    // 약속 목록 조회
    const { type } = req.query;

    try {
      // 타입에 따라 다른 약속 목록 반환
      if (type === "organized") {
        // 내가 만든 약속
        const appointments = await client.appointment.findMany({
          where: {
            organizerId: userId,
          },
          include: {
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
          },
          orderBy: {
            date: "asc",
          },
        });

        return res.json({
          ok: true,
          appointments,
        });
      } else if (type === "participating") {
        // 내가 참여하는 약속
        const participations = await client.appointmentParticipant.findMany({
          where: {
            userId,
          },
          include: {
            appointment: {
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
              },
            },
          },
        });

        return res.json({
          ok: true,
          appointments: participations.map((p) => p.appointment),
        });
      } else {
        // 모든 관련 약속
        const [organized, participating] = await Promise.all([
          client.appointment.findMany({
            where: {
              organizerId: userId,
            },
            include: {
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
            },
          }),
          client.appointmentParticipant.findMany({
            where: {
              userId,
            },
            include: {
              appointment: {
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
                },
              },
            },
          }),
        ]);

        const participating_appointments = participating.map((p) => p.appointment);

        return res.json({
          ok: true,
          appointments: {
            organized,
            participating: participating_appointments,
          },
        });
      }
    } catch (error) {
      console.error("약속 목록 조회 오류:", error);
      return res
        .status(500)
        .json({ ok: false, error: "약속 목록을 조회하는 중 오류가 발생했습니다." });
    }
  } else if (req.method === "POST") {
    // 약속 생성
    const { title, description, date, startTime, endTime, location, participants, notifications } =
      req.body;

    if (!title || !date || !startTime || !endTime || !location) {
      return res.status(400).json({ ok: false, error: "필수 정보가 누락되었습니다." });
    }

    try {
      // 약속 생성
      const appointment = await client.appointment.create({
        data: {
          title,
          description,
          date: new Date(date),
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          locationName: location.name,
          locationAddress: location.address,
          roadAddress: location.fullAddressRoad,
          latitude: location.latitude,
          longitude: location.longitude,
          zoomLevel: location.zoomLevel || 15,
          organizer: {
            connect: {
              id: userId,
            },
          },
        },
      });

      // 참가자 추가
      if (participants && participants.length > 0) {
        await Promise.all(
          participants.map((participantId: number) =>
            client.appointmentParticipant.create({
              data: {
                appointment: {
                  connect: {
                    id: appointment.id,
                  },
                },
                user: {
                  connect: {
                    id: participantId,
                  },
                },
              },
            })
          )
        );
      }

      // 알림 설정 추가
      if (notifications && notifications.length > 0) {
        await Promise.all(
          notifications.map((notification: any) =>
            client.appointmentNotification.create({
              data: {
                appointment: {
                  connect: {
                    id: appointment.id,
                  },
                },
                title: notification.title || `${title} 약속 알림`,
                message: notification.message,
                type: notification.type || "PUSH",
                minutesBefore: notification.minutesBefore,
              },
            })
          )
        );
      }

      return res.status(201).json({
        ok: true,
        appointment,
      });
    } catch (error) {
      console.error("약속 생성 오류:", error);
      return res.status(500).json({ ok: false, error: "약속을 생성하는 중 오류가 발생했습니다." });
    }
  } else {
    return res.status(405).end();
  }
}

export default withApiSession(
  withHandler({ methods: ["GET", "POST", "DELETE"], handler, isPrivate: true })
);
