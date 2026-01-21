import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

    await sgMail.send({
      to,
      from: {
        email: process.env.EMAIL_FROM,
        name: "Elevate Cleaning Co.",
      },
      subject,
      text,
      html: `
        <p>${text}</p>
        <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
        <p>Please find your invoice attached.</p>
      `,
      attachments: [
        {
          content: pdfBase64,
          filename: `invoice-${invoiceNumber}.pdf`,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    });

    console.log(
      "Invoice email sent successfully. If not in inbox, check spam."
    );
  } catch (error) {
    console.error(
      "SendGrid email sending failed:",
      error.response?.body || error.message
    );
    throw new Error(
      error.response?.body?.errors?.[0]?.message || error.message
    );
  }
};
