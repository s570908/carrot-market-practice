// import dotenv from "dotenv";
// dotenv.config();
import Mailgun from "mailgun-js";

const mailGunClient = new Mailgun({
  apiKey: process.env.MAILGUN_API_KEY || "",
  domain: process.env.MAILGUN_DOMAIN || "",
});

const sendEmail = (subject: string, html: string) => {
  const emailData = {
    from: "songohyoung@gmail.com", // 본인의 이메일로 변경
    to: "songohyoung@gmail.com", // 본인의 이메일로 변경
    subject,
    html,
  };
  return mailGunClient.messages().send(emailData);
};

export const sendVerificationEmail = (fullName: string, key: string) => {
  const emailSubject = `Hello~ ${fullName}, please verify your email`;
  const emailBody = `Verify your email by clicking <a href="http://number.com/verification/${key}/">here</a>`;
  return sendEmail(emailSubject, emailBody);
};

export const sendTokenEmail = (fullName: string, key: string) => {
  const emailSubject = `Hello~ ${fullName}, please let me show the token for carrot-market`;
  //const emailBody = `Read your token and confirm it. Token: ${key}`;
  const emailBody = `<main>
  <h1>Token을 보내드립니다.</h1>
  <div>Token: ${key}</div>
  <label for="enter">Enter로 가려면 여기를 누르세요</label>
  <a id="enter" href=http://localhost:3000/enter>Enter</a>
  </main>`;
  return sendEmail(emailSubject, emailBody);
};
