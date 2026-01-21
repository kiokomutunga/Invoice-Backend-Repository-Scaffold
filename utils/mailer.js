import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    await sgMail.send({
      to,
      from: {
        email: process.env.EMAIL_FROM,
        name: "Invoice System",
      },
      subject,
      text,
      html,
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(
      "SendGrid Email Error:",
      error.response?.body || error.message
    );
    throw error;
  }
};

console.log("SendGrid API Key:", process.env.SENDGRID_API_KEY ? "Loaded" : "Not Loaded");
console.log("Email from:", process.env.EMAIL_FROM);
