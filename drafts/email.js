export const emailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const { email } = req.body; //  from frontend input
    if (!email) return res.status(400).json({ error: "Recipient email is required" });

    // Generate the invoice PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // Send email using Brevo (or Nodemailer, etc.)
    await sendInvoiceEmail(
      email, //  this is the user-typed email
      "Your new invoice from elevate Cleaning co.",
      "Thank you for your business! Please find your invoice attached.",
      pdfBuffer,
      invoice.invoiceNumber
    );

    res.json({ message: `Invoice emailed successfully to ${email}` });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};
