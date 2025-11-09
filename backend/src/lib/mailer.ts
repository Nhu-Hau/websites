// src/lib/mailer.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export function sendMail(opts: { to: string; subject: string; html: string }) {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || '"Support" <no-reply@your.app>',
    ...opts,
  });
}

export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER, // ví dụ: "toeic.app@gmail.com"
    pass: process.env.SMTP_PASS, // app password
  },
});
