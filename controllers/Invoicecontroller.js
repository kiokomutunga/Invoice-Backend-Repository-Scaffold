import Invoice from "../models/Invoice.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import { sendInvoiceEmail } from "../utils/emailService.js";
import path from "path";
import Counter from "../models/counter.js";
import { PassThrough } from "stream";

const __dirname = path.resolve();

// Generate next invoice number
const generateInvoiceNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `INV-${String(counter.seq).padStart(5, "0")}`;
};

//  Create new invoice
export const createInvoice = async (req, res) => {
  try {
    console.log("Incoming invoice payload:", req.body);

    const invoiceNumber = await generateInvoiceNumber();

    const invoiceData = {
      ...req.body,
      invoiceNumber,
      date: req.body.date || new Date(),
      total:
        req.body.services?.reduce(
          (sum, s) => sum + (Number(s.price) || 0),
          0
        ) || 0,
    };

    console.log("Processed invoiceData before save:", invoiceData);

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    console.log("Invoice saved:", invoice);

    res.status(201).json(invoice);
  } catch (err) {
    console.error(" Error creating invoice:", err);

    res.status(400).json({
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};


// Get all invoices
export const getInvoices = async (req, res) => {
  const invoices = await Invoice.find();
  res.json(invoices);
};

// Get single invoice
export const getInvoiceById = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
};

// Update invoice
export const updateInvoice = async (req, res) => {
  const updatedData = {
    ...req.body,
    total:
      req.body.services?.reduce((sum, s) => sum + (Number(s.price) || 0), 0) || 0,
  };

  const invoice = await Invoice.findByIdAndUpdate(req.params.id, updatedData, { new: true });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
};

// Copy invoice
export const copyInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });

  const invoiceNumber = await generateInvoiceNumber();

  const newInvoice = new Invoice({
    ...invoice.toObject(),
    _id: undefined,
    invoiceNumber,
    date: new Date(),
  });

  await newInvoice.save();
  res.status(201).json(newInvoice);
};

// Delete invoice
export const deleteInvoice = async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ message: "Invoice deleted" });
};

//  Preview invoice
export const previewInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const pdfBuffer = await generateInvoicePDF(invoice);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=invoice.pdf");

    const stream = new PassThrough();
    stream.end(pdfBuffer);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Download invoice
export const printInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const pdfBuffer = await generateInvoicePDF(invoice);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);

    const stream = new PassThrough();
    stream.end(pdfBuffer);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const emailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const { email } = req.body; // recipient email from frontend
    if (!email) return res.status(400).json({ error: "Recipient email is required" });

    // Generate invoice PDF
    const pdfBuffer = await generateInvoicePDF(invoice);

    // HTML email template — polished & branded
    const htmlContent = `
      <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f4f7fb; padding: 30px;">
        <div style="max-width: 650px; background: #ffffff; border-radius: 12px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #007bff, #00bcd4); padding: 25px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Elevate Cleaning Co.</h1>
            <p style="color: #e0f7fa; margin-top: 5px; font-size: 15px;">Professional Cleaning Services You Can Trust</p>
          </div>

          <!-- Body -->
          <div style="padding: 30px;">
            <h2 style="color: #333;">Hello,</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6;">
              Thank you for choosing <strong>Elevate Cleaning Co.</strong>!<br/>
              Please find attached your invoice <strong>#${invoice.invoiceNumber}</strong> for the recent service provided.
            </p>
            <p style="color: #555; font-size: 15px; line-height: 1.6; margin-top: 25px;">
              Kindly review the attached invoice and contact us if you have any questions or clarifications.
            </p>

            <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:info@elevatecleaningco.com"
                 style="background: #007bff; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 8px; font-size: 16px;">
                Contact Our Team
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: #f8fafc; padding: 15px; text-align: center; color: #777; font-size: 13px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Elevate Cleaning Co.<br/>
            info@elevatecleaningco.com | Nairobi, Kenya</p>
          </div>
        </div>
      </div>
    `;

    // Send email
    await sendInvoiceEmail(
      email, // recipient (typed in frontend)
      `Invoice #${invoice.invoiceNumber} - Elevate Cleaning Co.`,
      htmlContent,
      pdfBuffer,
      invoice.invoiceNumber
    );

    res.json({ message: `Invoice emailed successfully to ${email}` });
  } catch (err) {
    console.error(" Error sending email:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
};


// Share invoice via WhatsApp
export const shareInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const pdfUrl = `${req.protocol}://${req.get("host")}/api/invoices/${invoice._id}/download`;
    const message = `Hello ${invoice.clientName}, here is your invoice of total KSH ${(invoice.total || 0).toLocaleString()}. Download it here: ${pdfUrl}`;

    const { phone } = req.body;
    const whatsappLink = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    res.json({ whatsappLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
