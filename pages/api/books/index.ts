import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;
  console.log("method, query, body: ", method, query, body);

  if (method !== "POST") {
    return res.status(400).json({ error: "Invalid HTTP method. Only POST method is allowed." });
  }

  if (!body) {
    return res.status(400).send("Bad reqeust (no body)");
  }

  const { id, title, description } = body;

  try {
    await axios.post(`http://localhost:4000/books`, {
      id: id,
      title: title,
      description: description,
    });

    const idToRevalidate = body.id;

    if (idToRevalidate) {
      // this should be the actual path not a rewritten path
      // e.g. for "/blog/[slug]" this should be "/blog/post-1"
      await res.revalidate("/books");
      await res.revalidate(`/books/${idToRevalidate}`);
    }

    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).send("Error while revalidating");
  }
}
