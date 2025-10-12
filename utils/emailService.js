import axios from "axios";

export const sendInvoiceEmail = async (to, subject, text, pdfBuffer, invoiceNumber) => {
  try {
    // Convert the PDF buffer to base64 for the API
    const pdfBase64 = pdfBuffer.toString("base64");

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Invoice System", email: process.env.EMAIL_USER },
        to: [{ email: to }],
        subject,
        textContent: text,
        attachment: [
          {
            content: pdfBase64,
            name: `invoice-${invoiceNumber}.pdf`,
          },
        ],
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email sent successfully:", response.data);
  } catch (error) {
    console.error(
      "❌ Email sending failed:",
      error.response?.data || error.message
    );
    throw new Error(error.response?.data?.message || error.message);
  }
};
