import { NextApiRequest, NextApiResponse } from "next";
import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import client from "@libs/client/client";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 관리자 권한 확인 (선택: 실제로는 role 필드가 필요)
  const user = req.session?.user;
  
  // GET: 모든 버전 조회
  if (req.method === "GET") {
    try {
      const releases = await client.appRelease.findMany({
        orderBy: { releasedAt: "desc" }
      });
      return res.status(200).json({ ok: true, data: releases });
    } catch (error) {
      console.error("버전 조회 오류:", error);
      return res.status(500).json({ ok: false, error: "버전 조회 실패" });
    }
  }

  // POST: 새 버전 추가
  if (req.method === "POST") {
    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    try {
      const { version, buildId, forceUpdate, message } = req.body;

      if (!version || !buildId) {
        return res.status(400).json({ ok: false, error: "필수 값이 누락되었습니다" });
      }

      // 중복 버전 확인
      const existing = await client.appRelease.findUnique({
        where: { version }
      });

      if (existing) {
        return res.status(400).json({ ok: false, error: "이미 존재하는 버전입니다" });
      }

      const newRelease = await client.appRelease.create({
        data: {
          version,
          buildId,
          forceUpdate: forceUpdate || false,
          message: message || "",
          releasedAt: new Date()
        }
      });

      return res.status(201).json({ ok: true, data: newRelease });
    } catch (error) {
      console.error("버전 생성 오류:", error);
      return res.status(500).json({ ok: false, error: "버전 생성 실패" });
    }
  }

  // PATCH: 버전 수정
  if (req.method === "PATCH") {
    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    try {
      const { id, version, buildId, forceUpdate, message } = req.body;

      if (!id) {
        return res.status(400).json({ ok: false, error: "ID가 필요합니다" });
      }

      const updated = await client.appRelease.update({
        where: { id: parseInt(id) },
        data: {
          ...(version && { version }),
          ...(buildId && { buildId }),
          ...(forceUpdate !== undefined && { forceUpdate }),
          ...(message !== undefined && { message })
        }
      });

      return res.status(200).json({ ok: true, data: updated });
    } catch (error) {
      console.error("버전 수정 오류:", error);
      return res.status(500).json({ ok: false, error: "버전 수정 실패" });
    }
  }

  // DELETE: 버전 삭제
  if (req.method === "DELETE") {
    if (!user?.id) {
      return res.status(401).json({ ok: false, error: "로그인이 필요합니다" });
    }

    try {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ ok: false, error: "ID가 필요합니다" });
      }

      await client.appRelease.delete({
        where: { id: parseInt(id) }
      });

      return res.status(200).json({ ok: true });
    } catch (error) {
      console.error("버전 삭제 오류:", error);
      return res.status(500).json({ ok: false, error: "버전 삭제 실패" });
    }
  }

  return res.status(405).json({ ok: false, error: "허용되지 않은 메서드" });
}

export default withApiSession(
  withHandler({
    methods: ["GET", "POST", "PATCH", "DELETE"],
    handler,
    isPrivate: true
  })
);
