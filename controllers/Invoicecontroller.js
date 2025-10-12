import Invoice from "../models/Invoice.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import { sendInvoiceEmail } from "../utils/emailService.js";
import path from "path";
import Counter from "../models/counter.js";
import { PassThrough } from "stream";

const __dirname = path.resolve();

// ✅ Generate next invoice number
const generateInvoiceNumber = async () => {
  const counter = await Counter.findOneAndUpdate(
    { name: "invoice" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `INV-${String(counter.seq).padStart(5, "0")}`;
};

// ✅ Create new invoice (with debugging)
export const createInvoice = async (req, res) => {
  try {
    console.log("📥 Incoming invoice payload:", req.body);

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

    console.log("🛠 Processed invoiceData before save:", invoiceData);

    const invoice = new Invoice(invoiceData);
    await invoice.save();

    console.log("✅ Invoice saved:", invoice);

    res.status(201).json(invoice);
  } catch (err) {
    console.error("❌ Error creating invoice:", err);

    res.status(400).json({
      error: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};


// ✅ Get all invoices
export const getInvoices = async (req, res) => {
  const invoices = await Invoice.find();
  res.json(invoices);
};

// ✅ Get single invoice
export const getInvoiceById = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
};

// ✅ Update invoice
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

// ✅ Copy invoice
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

// ✅ Delete invoice
export const deleteInvoice = async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ message: "Invoice deleted" });
};

// ✅ Preview invoice
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

// ✅ Download invoice
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

    // ✅ Generate PDF buffer
    const pdfBuffer = await generateInvoicePDF(invoice);

    // ✅ Send email to the client email (from frontend)
    await sendInvoiceEmail(
      invoice.clientEmail,                // Receiver email
      "Your Invoice",
      "Please find attached your invoice.",
      pdfBuffer,                          // The actual PDF buffer
      invoice.invoiceNumber               // Filename part
    );

    res.json({ message: "Invoice emailed successfully" });
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Share invoice via WhatsApp
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
