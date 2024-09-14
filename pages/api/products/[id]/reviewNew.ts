import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  console.log("---------------Post /api/product/[id]/reviewNew is called" )
  if (req.method === "POST") {
    const {
      query: { id },
      session: { user },
      body: { createdForId, review, score, reviewType },
    } = req;
    console.log("query: ", req.query)
    console.log("body: ", req.body)
    if (!id || !createdForId) {
      return res.status(404).end({ error: "request query is not given." });
    }

// 해당 제품에 대한 기존 리뷰를 조회
const existingReviews = await client.review.findMany({
  where: {
    productForId: +id,
    OR: [
      { reviewType: 'BuyerReview' },
      { reviewType: 'SellerReview' }
    ]
  }
});

// 리뷰 제한 조건 검사
if (existingReviews.length > 2) {
  return res.status(400).json({
    error: 'No more reviews can be added to this product.',
    ok: false
  });
}

// 리뷰 타입에 따른 중복 검사
if (existingReviews.some(review => review.reviewType === reviewType)) {
  return res.status(400).json({
    error: `A ${reviewType} review already exists for this product.`,
    ok: false
  });
}

    const writtenReview = await client.review.create({
      data: {
        review,
        score: +score,
        reviewType,
        createdBy: {
          connect: {
            id: user?.id,
          },
        },
        createdFor: {
          connect: {
            id: +createdForId,
          },
        },
        productFor: {
          connect: {
            id: +id,
          },
        },
      },
    });
    res.json({ ok: true, writtenReview });
  }
}

export default withApiSession(withHandler({ methods: ["POST"], handler }));
