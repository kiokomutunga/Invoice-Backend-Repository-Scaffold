import axios from "axios";

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Invoice System",
          email: process.env.EMAIL_FROM,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    console.log(`Email sent to ${to}`, response.data);
    return response.data;
  } catch (error) {
    console.error(
      "Brevo Email Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send email");
  }
};

console.log(
  "Brevo API Key:",
  process.env.BREVO_API_KEY ? "Loaded" : "Not Loaded"
);
console.log("Email from:", process.env.EMAIL_FROM);
