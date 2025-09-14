import { NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { withApiSession } from "@libs/server/withSession";
import withHandler from "@libs/server/withHandler";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // PATCH /api/chat-meetups/:id/alarm-time
  if (req.method !== "PATCH") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const chatMeetupId = Number(req.query.id);
  const { alarmTime } = req.body;

  console.log("chatMeetup, alarmTime:", chatMeetupId, alarmTime);

  if (!chatMeetupId) {
    return res
      .status(400)
      .json({ ok: false, error: "chatMeetupId is required" });
  }

  try {
    const updated = await client.chatMeetup.update({
      where: { id: chatMeetupId },
      data: { alarmTime },
    });
    console.log(
      "chatMeetup, alarmTime, messageId:",
      chatMeetupId,
      alarmTime,
      updated.messageId
    );
    return res.status(200).json({ ok: true, chatMeetup: updated });
  } catch (error) {
    return res
      .status(500)
      .json({ ok: false, error: "Failed to update alarmTime" });
  }
}

export default withApiSession(
  withHandler({
    methods: ["PATCH"],
    handler,
    isPrivate: true,
  })
);
