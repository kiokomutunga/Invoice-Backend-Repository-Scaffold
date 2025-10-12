import nodemailer from "nodemailer";

export const sendInvoiceEmail = async (to, subject, text, pdfBuffer, invoiceNumber) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true, // true for port 465, false for 587
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 20000, // 20s timeout
    });

    const mailOptions = {
      from: `"Invoice System" <${process.env.EMAIL_USER}>`, // sender from .env
      to, // receiver from frontend input
      subject,
      text,
      attachments: [
        {
          filename: `invoice-${invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};
