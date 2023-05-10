import { withApiSession } from "@libs/server/withSession";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";

const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  console.log(`/api/users/me--req.cookies: ${JSON.stringify(req.cookies, null, 2)}`);
  console.log("/api/users/me--req.session: ", req.session);

  if (req.method === "GET") {
    const profile = await client.user.findUnique({
      where: {
        id: req.session.user?.id,
      },
    });
    // console.log("api/users/me--profile: ", profile);
    res.status(200).json({ ok: true, profile });
  }

  // session에서 user를 가져오고, body에서 ...를 가져오고,
  // user를 db에서 찾아오고,
  // email/phone이 있으면 기존 것과 비교하여 다르면, 이것을 사용하는 다른 사용자가 있는지를 체크한다.
  // 이미 다른 사용자가 사용하고 있으면 email uniqueness에 위배되므로 ok:false.
  // 사용하고 있지 않으면 user의 email/phone을 수정하고,
  // response에 ok:true를 내보낸다.
  // 같거나 없으면 아무것도 안하고....
  // name에 대해서도 동일하게 수행한다. 차이는 name의 uniqueness는 검사하지 않는다. 동일한 이름을 허용한다.

  if (req.method === "POST") {
    const {
      session: { user },
      body: { email, name, phone },
    } = req;
    console.log("api/users/me--user, email, name, phone: ", user, email, name, phone);
    const currentUser = await client.user.findUnique({
      where: {
        id: user?.id,
      },
    });
    if (email && email !== currentUser?.email) {
      const alreadyExists = Boolean(
        await client.user.findUnique({
          where: {
            email: email,
          },
          select: {
            id: true,
          },
        })
      );
      if (alreadyExists) {
        return res.json({ ok: false, error: "Email already taken." });
      }
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: {
          email: email,
        },
      });
    }
    if (phone && phone !== currentUser?.phone) {
      const alreaadyExists = Boolean(
        await client.user.findUnique({
          where: {
            phone: phone,
          },
          select: {
            id: true,
          },
        })
      );
      if (alreaadyExists) {
        return res.json({ ok: false, error: "Phone already taken." });
      }
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: {
          phone: phone,
        },
      });
    }
    if (name && name !== currentUser?.name) {
      await client.user.update({
        where: {
          id: user?.id,
        },
        data: {
          name: name,
        },
      });
    }
    res.status(200).json({ ok: true });
  }
};

export default withApiSession(withHandler({ methods: ["GET", "POST"], handler, isPrivate: true }));
