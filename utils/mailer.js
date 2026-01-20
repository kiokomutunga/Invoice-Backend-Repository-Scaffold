import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true only for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    return await transporter.sendMail({
      from: `"Invoice System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error("SMTP Email Error:", error);
    throw error;
  }
};


console.log("Email user:", process.env.EMAIL_USER);
console.log(
  "Email pass:",
  process.env.EMAIL_PASS ? "Loaded" : "Not Loaded"
);
