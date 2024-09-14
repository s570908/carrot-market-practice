import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseType>
) {
  console.log(
    "---------------GET /api/product/[id]/checkReviewWirtable is called"
  );
  if (req.method === "GET") {
    const {
      query: { id },
      session: { user },
      body: { createdForId, reviewType },
    } = req;
    console.log("query: ", req.query);
    console.log("body: ", req.body);
    if (!id || !createdForId || !reviewType) {
      return res.status(404).end({ error: "request query is not given." });
    }

console.log("createdForId------------: ", createdForId)
console.log("user.id------------: ", user?.id)

if (+createdForId === user?.id) {
   return res.status(400).json({ok: false, error: "login user can't write review for himself."})
}

    // 해당 제품 정보 조회
    const product = await client.product.findUnique({
      where: { id: +id },
      select: { userId: true },
    });

console.log("product-----------------:", product)

    if (!product) {
      return res.status(400).end({ ok: false, error: "product is not found." }); // 제품이 존재하지 않으면 false 반환
    }

    // 제품 소유자와 로그인한 사용자가 동일한지 검사
    const isOwner = user?.id === product.userId;

    console.log("isOwner----------------: ", isOwner)
    // 리뷰 타입 검사
    if (
      (isOwner && reviewType !== "SellerReview") ||
      (!isOwner && reviewType !== "BuyerReview")
    ) {
      return res.status(400).json({
        error: "reviewType is not valid.",
        ok: false,
      }); // 조건 불만족 시 false 반환
    }

    // 해당 제품에 대한 기존 리뷰를 조회
    const existingReviews = await client.review.findMany({
      where: {
        productForId: +id,
        OR: [{ reviewType: "BuyerReview" }, { reviewType: "SellerReview" }],
      },
    });

console.log("existingReviews---------------------: ", existingReviews)

    // 리뷰 제한 조건 검사
    if (existingReviews.length > 2) {
      return res.status(400).json({
        error: "No more reviews can be added to this product.",
        ok: false,
      });
    }

    // 리뷰 타입에 따른 중복 검사
    if (existingReviews.some((review) => review.reviewType === reviewType)) {
      return res.status(400).json({
        error: `A ${reviewType} review already exists for this product.`,
        ok: false,
      });
    }

    return res.status(200).json({ok: true, message: "review is writable." })
  }
}

export default withApiSession(withHandler({ methods: ["GET"], handler }));
