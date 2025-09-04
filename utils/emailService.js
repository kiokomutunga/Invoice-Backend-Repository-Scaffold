import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendInvoiceEmail = async (to, subject, text, attachmentPath) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
    attachments: attachmentPath
      ? [{ filename: "invoice.pdf", path: attachmentPath }]
      : [],
  };

  return transporter.sendMail(mailOptions);
};
