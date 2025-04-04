import { NextApiRequest, NextApiResponse } from "next";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({
      ok: false,
      error: "유효하지 않은 위치 ID입니다.",
    });
  }

  const locationId = +id;

  // 위치 상세 조회
  if (req.method === "GET") {
    try {
      const location = await client.locationTmap.findUnique({
        where: { id: locationId },
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              date: true,
              organizer: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!location) {
        return res.status(404).json({
          ok: false,
          error: "해당 위치 정보를 찾을 수 없습니다.",
        });
      }

      return res.status(200).json({
        ok: true,
        location,
      });
    } catch (error) {
      console.error("위치 정보 조회 중 오류 발생:", error);
      return res.status(500).json({
        ok: false,
        error: "서버 오류가 발생했습니다.",
      });
    }
  }

  // 위치 정보 수정
  if (req.method === "PUT") {
    const {
      body: updateData,
      session: { user },
    } = req;

    if (!user?.id) {
      return res.status(401).json({
        ok: false,
        error: "인증이 필요합니다.",
      });
    }

    try {
      // 위치 정보 존재 확인
      const existingLocation = await client.locationTmap.findUnique({
        where: { id: locationId },
        include: {
          appointment: {
            select: {
              organizerId: true,
            },
          },
        },
      });

      if (!existingLocation) {
        return res.status(404).json({
          ok: false,
          error: "해당 위치 정보를 찾을 수 없습니다.",
        });
      }

      // 약속 생성자만 위치 정보를 수정할 수 있음
      if (existingLocation.appointment && existingLocation.appointment.organizerId !== user.id) {
        return res.status(403).json({
          ok: false,
          error: "위치 정보를 수정할 권한이 없습니다.",
        });
      }

      const updatedLocation = await client.locationTmap.update({
        where: { id: locationId },
        data: updateData,
      });

      return res.status(200).json({
        ok: true,
        location: updatedLocation,
      });
    } catch (error) {
      console.error("위치 정보 업데이트 중 오류 발생:", error);
      return res.status(500).json({
        ok: false,
        error: "위치 정보를 업데이트하는 중에 오류가 발생했습니다.",
      });
    }
  }

  // 위치 정보 삭제
  if (req.method === "DELETE") {
    const {
      session: { user },
    } = req;

    if (!user?.id) {
      return res.status(401).json({
        ok: false,
        error: "인증이 필요합니다.",
      });
    }

    try {
      // 위치 정보 존재 확인
      const existingLocation = await client.locationTmap.findUnique({
        where: { id: locationId },
        include: {
          appointment: {
            select: {
              organizerId: true,
            },
          },
        },
      });

      if (!existingLocation) {
        return res.status(404).json({
          ok: false,
          error: "해당 위치 정보를 찾을 수 없습니다.",
        });
      }

      // 약속 생성자만 위치 정보를 삭제할 수 있음
      if (existingLocation.appointment && existingLocation.appointment.organizerId !== user.id) {
        return res.status(403).json({
          ok: false,
          error: "위치 정보를 삭제할 권한이 없습니다.",
        });
      }

      await client.locationTmap.delete({
        where: { id: locationId },
      });

      return res.status(200).json({
        ok: true,
        message: "위치 정보가 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      console.error("위치 정보 삭제 중 오류 발생:", error);
      return res.status(500).json({
        ok: false,
        error: "위치 정보를 삭제하는 중에 오류가 발생했습니다.",
      });
    }
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET", "PUT", "DELETE"],
    handler,
    isPrivate: true,
  })
);
