import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseType>
) {
  if (req.method === "PUT") {
    const {
      body: { imageIds },
    } = req;
    console.log("imageIds: ", imageIds);
    try {
      // 모든 이미지 ID에 대해 병렬로 DELETE 요청
      const results = await Promise.all(
        imageIds.map(async (imageId: string) => {
          const response = await axios.delete(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ID}/images/v1/${imageId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.CF_IMAGE_TOKEN}`,
              },
            }
          );
          console.log("response.data: ", response.data);
          // 성공 여부 확인
          if (response.data.success) {
            return { imageId, success: true };
          } else {
            return { imageId, success: false, error: response.data.errors };
          }
        })
      );

      // 성공 및 실패 결과를 반환
      return {
        ok: true,
        results,
      };
    } catch (error) {
      console.error("Cloudflare 이미지 삭제 중 오류:", error);
      return {
        ok: false,
        error: "Failed to delete images from Cloudflare.",
      };
    }
  }
}

export default withApiSession(
  withHandler({ methods: ["PUT"], handler, isPrivate: true })
);
