export const emailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const { email } = req.body; //  from frontend input
    if (!email) return res.status(400).json({ error: "Recipient email is required" });

    
    const pdfBuffer = await generateInvoicePDF(invoice);

  
    await sendInvoiceEmail(
      email, 
      "Your new invoice from elevate Cleaning co.",
      "Thank you for your business! Please find your invoice attached.",
      pdfBuffer,
      invoice.invoiceNumber
    );

    res.json({ message: `Invoice emailed successfully to ${email}` });
  } catch (err) {
    console.error(" Error sending email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};
