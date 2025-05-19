import nodemailer from "nodemailer";
import { User } from "../../user/entities/user.entity"; // Adjust path if needed

export async function sendOtpEmail(email: string, code: string, user?: User) {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Use public URL for the logo, fallback to local image path
  // const logoUrl = "https://raw.githubusercontent.com/muuminbaargeele/images/refs/heads/main/e-tartan/e_tartan_logo.png";

  const subject = "Your OTP Code for e-tartan";
  const html = `
  <div style="max-width:400px;margin:40px auto;padding:24px 20px;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);font-family:'Segoe UI',Roboto,sans-serif;color:#1a2233;">
    <div style="text-align:center;margin-bottom:18px;">
      <img src="https://raw.githubusercontent.com/muuminbaargeele/images/refs/heads/main/e-tartan/e_tartan_logo.png" alt="e-tartan" style="height:48px;margin-bottom:4px;">
      <h2 style="margin:10px 0 0 0;font-size:22px;font-weight:600;">e-tartan Verification</h2>
    </div>
    <p style="font-size:16px;margin:28px 0 14px 0;">
      Hello${user?.firstName ? ' ' + user.firstName : ''},<br>
      Please use the following one-time password (OTP) to complete your action on <strong>e-tartan</strong>:
    </p>
    <div style="text-align:center;">
      <span style="display:inline-block;background:#f4f6fb;padding:18px 36px;border-radius:8px;font-size:32px;letter-spacing:6px;font-weight:700;color:#004c97;margin:12px 0 24px 0;">
        ${code}
      </span>
    </div>
    <p style="font-size:15px;margin:12px 0 0 0;color:#455a64;">
      This code will expire in 10 minutes.<br>
      If you did not request this, please ignore this email.
    </p>
    <div style="margin-top:32px;text-align:center;color:#bbb;font-size:13px;">
      &copy; ${new Date().getFullYear()} Baargeele &bull; <strong>e-tartan</strong>
    </div>
  </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"Baargeele" <baargeele.api@gmail.com>',
    to: email,
    subject,
    html,
  });
}