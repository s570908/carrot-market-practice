// c:\Users\Song\Documents\DebugJS\appointment-nextjs\pages\api\appointments\index.ts
//import { NextApiRequest, NextApiResponse } from "next";
//import { getSession } from "next-auth/react";
//import prisma from "@/lib/prisma";

import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
//import { AppointmentCreateRequest } from "@/pages/appointments/create";
import { convertTmapAddressToLocationInput } from "@/apiLibs/locations";
import { AppointmentCreateRequest } from "@/types";

// 유효한 알림 타입인지 확인하는 함수
function isValidNotificationType(type: string): type is "PUSH" | "EMAIL" | "SMS" {
  return ["PUSH", "EMAIL", "SMS"].includes(type);
}

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
            locationTmap: true, // locationTmap 데이터 포함
          },
        });

        // type === "organized"일 때
        return res.json({
          ok: true,
          organized: appointments,
          participating: [], // 빈 배열 추가
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
                locationTmap: true, // locationTmap 데이터 포함
              },
            },
          },
        });

        // type === "participating"일 때
        return res.json({
          ok: true,
          organized: [], // 빈 배열 추가
          participating: participations.map((p) => p.appointment),
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
              locationTmap: true, // locationTmap 데이터 포함
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
                  locationTmap: true, // locationTmap 데이터 포함
                },
              },
            },
          }),
        ]);

        const participating_appointments = participating.map((p) => p.appointment);

        return res.json({
          ok: true,
          organized,
          participating: participating_appointments,
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
    const body = req.body as AppointmentCreateRequest;
    console.log("약속 생성 요청 api/appointment--Post body:", body);
    const { title, description, startTime, endTime, location, participants, notifications } = body;

    if (!title || !startTime || !endTime || !location) {
      return res.status(400).json({ ok: false, error: "필수 정보가 누락되었습니다." });
    }

    try {
      // Prisma 트랜잭션 사용하여 약속과 위치 정보를 원자적으로 생성
      const result = await client.$transaction(async (tx) => {
        // 1. 약속 기본 정보 생성
        const appointment = await tx.appointment.create({
          data: {
            title,
            description: description || "",
            //date: new Date(date),
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            // status는 기본값 PENDING 사용
            organizer: {
              connect: {
                id: userId,
              },
            },
          },
        });

        // 2. 위치 정보 저장 (LocationTmap 모델 사용)
        if (location && location.addressInfo) {
          // 위치 정보 입력 형식으로 변환
          const locationInput = convertTmapAddressToLocationInput(location.addressInfo, {
            locationName: location.addressInfo?.buildingName || "선택한 장소",
            latitude: location.latitude,
            longitude: location.longitude,
            selectedAddress: location.selectedAddress || "",
          });

          // LocationTmap 생성시 appointmentId 속성이 들어가지 않도록 처리
          const { appointmentId, ...locationDataWithoutAppointmentId } = locationInput;

          // LocationTmap 생성
          await tx.locationTmap.create({
            data: {
              ...locationDataWithoutAppointmentId,
              appointment: {
                connect: {
                  id: appointment.id,
                },
              },
            },
          });
          console.log("api/appointment--POST 위치 정보 저장 완료:", locationInput);
        }

        // 3. 참가자 추가
        if (participants && participants.length > 0) {
          await Promise.all(
            participants.map((participantId: number) =>
              tx.appointmentParticipant.create({
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
                  status: "PENDING", // 기본 상태 설정
                },
              })
            )
          );
        }

        // 4. 알림 설정 추가
        if (notifications && notifications.length > 0) {
          await Promise.all(
            notifications.map((notification) =>
              tx.appointmentNotification.create({
                data: {
                  appointment: {
                    connect: {
                      id: appointment.id,
                    },
                  },
                  title: notification.title || `${title} 약속 알림`,
                  message: "", // 기본값 설정
                  // 타입 검증 후 사용
                  type: isValidNotificationType(notification.type) ? notification.type : "PUSH",
                  minutesBefore: notification.minutesBefore,
                },
              })
            )
          );
        }

        return appointment;
      });

      return res.status(201).json({
        ok: true,
        appointment: result,
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
