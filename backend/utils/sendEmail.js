import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 30000, // 30 seconds
  socketTimeout: 30000,     // 30 seconds
  greetingTimeout: 30000,   // 30 seconds
});

export default transporter;