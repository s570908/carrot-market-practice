import { NextApiRequest, NextApiResponse } from "next";
import withHandler, { ResponseType } from "@libs/server/withHandler";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";

async function handler(req: NextApiRequest, res: NextApiResponse<ResponseType>) {
  if (req.method === "POST") {
    const {
      body: { question, latitude, longitude },
      session: { user },
    } = req;
    const post = await client.post.create({
      data: {
        question,
        latitude,
        longitude,
        user: {
          connect: {
            id: user?.id,
          },
        },
      },
    });
    await res.revalidate("/community");
    res.json({
      ok: true,
      post,
    });
  }
  if (req.method === "GET") {
    const {
      query: { latitude, longitude, page },
      session: { user },
    } = req;
    // const parseLatitude = parseFloat(latitude.toString());
    // const parseLongitude = parseFloat(longitude.toString());
    const limit = 10;
    const posts = await client.post.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        wonderings: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            wonderings: true,
            answers: true,
          },
        },
      },
      // where: {
      //   latitude: {
      //     gte: parseLatitude - 0.01,
      //     lte: parseLatitude + 0.01,
      //   },
      //   longitude: {
      //     gte: parseLongitude - 0.01,
      //     lte: parseLongitude + 0.01,
      //   },
      // },
      orderBy: {
        id: "desc",
      },
      take: limit,
      // skip: (+page - 1) * limit,
    });
    res.json({
      ok: true,
      posts,
    });
  }
}

export default withApiSession(withHandler({ methods: ["POST", "GET"], handler, isPrivate: true }));
