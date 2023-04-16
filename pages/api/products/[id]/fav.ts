import withHandler from "@libs/server/withHandler";
import { withApiSession } from "@libs/server/withSession";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse) => {
  const id = req.query.id ? (req.query.id as String) : ""; // product id
  const { user } = req.session;

  const alreadyEx = await client.fav.findFirst({
    where: {
      productId: +id,
      userId: user?.id,
    },
  });

  console.log("alreadyEx: ", alreadyEx);

  if (alreadyEx) {
    // delete: unique한 속성으로만 삭제가 가능하게 설계되어 있습니다.
    // deleteMany: unique하지 않은 값을 없애고 싶을 때는 deleteMany를 사용하면 됩니다.
    await client.fav.delete({
      where: { id: alreadyEx.id },
    });
  } else {
    // create
    await client.fav.create({
      data: {
        user: {
          connect: {
            id: user?.id,
          },
        },
        product: {
          connect: {
            id: +id,
          },
        },
      },
    });
  }

  res.status(200).json({ ok: true });
};

export default withApiSession(withHandler({ methods: ["POST"], handler, isPrivate: true }));
