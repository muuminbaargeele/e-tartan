import nodemailer from "nodemailer";

export async function sendOtpEmail(email: string, code: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Baargeele" <baargeele.api@gmail.com>',
    to: email,
    subject: "Your OTP Code",
    html: `<p>Your OTP code is: <b>${code}</b></p>`,
  });
}