import withHandler, { ResponseType } from "@libs/server/withHandler";
import { NextApiHandler, NextApiRequest, NextApiResponse } from "next";
import client from "@libs/client/client";
import { sendTokenEmail } from "@libs/server/sendEmail";
//import twilio from "twilio";

//const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
// const nodemailer = require("nodemailer");
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.GMAIL_ID,
//     pass: process.env.GMAIL_PWD,
//   },
// });

interface reqBodyType {
  email?: string;
  phone?: string;
}

// NextApiResponse<ResponseType>에서 generic type, ResponseType, 을 주는 방식에 대해서는 다음의 url을 참조한다.
// https://nextjs.org/docs/api-routes/response-helpers
const handler: NextApiHandler = async (req: NextApiRequest, res: NextApiResponse<ResponseType>) => {
  const { email, phone }: reqBodyType = req.body;
  console.log("/api/users/enter--req.body: ", req.body);
  const userKey = phone ? { phone: phone } : { email: email };
  if (!userKey) return res.status(400).json({ ok: false });

  const payload = Math.floor(100000 + Math.random() * 900000) + "";

  const token = await client.token.create({
    data: {
      payload,
      user: {
        connectOrCreate: {
          where: {
            ...userKey,
          },
          create: {
            name: "Anonymous",
            ...userKey,
          },
        },
      },
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  if (phone) {
    console.log(`당신의 폰 로그인 토큰은 ${payload}입니다.`);
    // const messages = await twilioClient.messages.create({
    //   messagingServiceSid: process.env.TWILIO_MSID,
    //   to: process.env.MY_PHONE!, // 정상적으로는 req.phone을 써야 함
    //   body: `당신의 로그인 토큰은 ${payload}입니다.`,
    // });
    // console.log(messages);
  } else if (email) {
    console.log(`당신의 이메일 로그인 토큰은 ${payload}입니다.`);
    // const sendEmail = await transporter
    //   .sendMail({
    //     from: process.env.GMAIL_ID,
    //     to: process.env.GMAIL_ID,
    //     subject: "token",
    //     test: `your token is ${payload}`,
    //     html: `
    //       <div style="text-align: center;">
    //         <h3 style="color: #FA5882">ABC</h3>
    //         <br />
    //         <p>your login token is ${payload}</p>
    //       </div>
    //   `,
    //   })
    //   .then((result: any) => console.log(result))
    //   .catch((error: any) => console.log(error));
  }

  /***********************************************************
   *  아래의 과정으로 토큰을 사용자에게 전송한다. phone sms 는 twilio를 사용하였으나 정해진 한도를 넘으면 유료이다.
   *  naver sense를 사용할 수 있다. 한달에 50건이 무료이다. 개발 중에는 서버 로그를 보면 token.payload에 토큰이 들어 있다. 이것을 활용한다.
   */
  // if (phone) {
  //   const message = await twilioClient.messages.create({
  //     messagingServiceSid: process.env.TWILIO_MSID,
  //     // 원래라면 phone으로 보내야 하지만 -> dev process에서는 그냥 내 폰으로
  //     to: process.env.MY_PHONE!,
  //     body: `Your login token is ${payload}`,
  //   });

  //   //console.log(message);
  // } else if (email) {
  //   await sendTokenEmail(token.user.name, payload);
  // }
  res.status(200).json({ ok: true, payload });
};

export default withHandler({ methods: ["POST"], handler, isPrivate: false });
// withHandler(...)는 function이다. 이 function은 ...
// request method가 POST 가 아니면 res에 에러를 전송한다.
// ...이면, handler를 수행시킨다. handler 수행 시에 catch(error)를
// 할 수 있다.

// isPrivate 인자를 추가하자.  isPrivate:true이면 login을 한 user만이 fn을 수행할 수 있게 만든다.
// login하지 않은 user가 fn을 수행시킬 수 있게 하려면 isPrivate:false로 하면 된다. api enter, api confirm이 이것에 해당한다.

// login하지 않은 user도 사용할 수 있게 해준다: isPrivate:false
