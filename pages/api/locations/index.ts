import { NextApiRequest, NextApiResponse } from "next";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";
import client from "@libs/client/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    // 쿼리 파라미터 처리 (필터링 등을 위해)
    const {
      query: { appointmentId },
    } = req;

    try {
      // appointmentId 기준으로 필터링하거나 전체 목록 조회
      const locations = await client.locationTmap.findMany({
        where: appointmentId ? { appointmentId: +appointmentId } : {},
        include: {
          appointment: {
            select: {
              id: true,
              title: true,
              date: true,
              status: true,
            },
          },
        },
      });

      return res.status(200).json({
        ok: true,
        locations,
      });
    } catch (error) {
      console.error("위치 정보 조회 중 오류 발생:", error);
      return res.status(500).json({
        ok: false,
        error: "서버 오류가 발생했습니다.",
      });
    }
  }

  if (req.method === "POST") {
    const {
      body: locationData,
      session: { user },
    } = req;

    if (!user?.id) {
      return res.status(401).json({
        ok: false,
        error: "인증이 필요합니다.",
      });
    }

    try {
      // 필수 필드 검증
      if (!locationData.latitude || !locationData.longitude || !locationData.locationName) {
        return res.status(400).json({
          ok: false,
          error: "필수 정보(위도, 경도, 장소명)가 누락되었습니다.",
        });
      }

      const location = await client.locationTmap.create({
        data: locationData,
      });

      return res.status(201).json({
        ok: true,
        location,
      });
    } catch (error) {
      console.error("위치 정보 생성 중 오류 발생:", error);
      return res.status(500).json({
        ok: false,
        error: "위치 정보를 생성하는 중에 오류가 발생했습니다.",
      });
    }
  }
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST"],
    handler,
    isPrivate: false,
  })
);
