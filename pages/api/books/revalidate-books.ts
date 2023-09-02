import { NextApiRequest, NextApiResponse } from "next";

const SECRET_REVALIDATE_TOKEN = "nalnari";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;
  console.log("method, query, body: ", method, query, body);

  if (method !== "POST") {
    return res.status(400).json({ error: "Invalid HTTP method. Only POST method is allowed." });
  }

  // Unauthorized access as invalid token
  // if (query.secret !== process.env.SECRET_REVALIDATE_TOKEN) {
  //   return res.status(401).json({ message: "Invalid token" });
  // }

  // Unauthorized access as invalid token
  if (query.secret !== SECRET_REVALIDATE_TOKEN) {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (!body) {
    return res.status(400).send("Bad reqeust (no body)");
  }

  try {
    const idToRevalidate = body.id;

    if (idToRevalidate) {
      // this should be the actual path not a rewritten path
      // e.g. for "/blog/[slug]" this should be "/blog/post-1"
      await res.revalidate("/books");
      await res.revalidate(`/books/${idToRevalidate}`);
      return res.json({ revalidated: true });
    }
  } catch (err) {
    return res.status(500).send("Error while revalidating");
  }
}
