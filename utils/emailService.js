import axios from "axios";

export const sendInvoiceEmail = async (
  to,
  subject,
  text,
  pdfBuffer,
  invoiceNumber
) => {
  try {
    // Convert PDF buffer to Base64
    const pdfBase64 = pdfBuffer.toString("base64");

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Elevate Cleaning Co.",
          email: process.env.EMAIL_FROM,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: `
          <p>${text}</p>
          <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
          <p>Please find your invoice attached.</p>
        `,
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
        timeout: 15000,
      }
    );

    console.log(
      "Invoice email sent successfully via Brevo. Check spam if not in inbox.",
      response.data
    );
  } catch (error) {
    console.error(
      "Brevo email sending failed:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.message || "Failed to send invoice email"
    );
  }
};
