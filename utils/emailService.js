import nodemailer from "nodemailer";

export const sendInvoiceEmail = async (to, subject, text, pdfBuffer, invoiceNumber) => {
  try {
    // Configure transporter (use your SMTP / Gmail / Mailtrap credentials)
    const transporter = nodemailer.createTransport({
      service: "gmail", // or "hotmail", "yahoo", or use host/port for custom SMTP
      auth: {
        user: process.env.EMAIL_USER, // from .env
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Invoice System" <${process.env.EMAIL_USER}>`,
      to,
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
    console.log(`📧 Invoice sent to ${to}`);
    return { success: true, message: "Email sent successfully" };
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw new Error("Failed to send email");
  }
};
