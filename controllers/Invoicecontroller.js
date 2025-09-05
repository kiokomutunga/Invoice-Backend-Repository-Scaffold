import Invoice from "../models/Invoice.js";
import { generateInvoicePDF } from "../utils/pdfGenerator.js";
import { sendInvoiceEmail } from "../utils/emailService.js";
import path from "path";
import { PassThrough } from "stream";

const __dirname = path.resolve();

// ✅ Create new invoice
export const createInvoice = async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
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
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  res.json(invoice);
};

// ✅ Copy invoice
export const copyInvoice = async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) return res.status(404).json({ error: "Invoice not found" });
  const newInvoice = new Invoice({ ...invoice.toObject(), _id: undefined });
  await newInvoice.save();
  res.status(201).json(newInvoice);
};

// ✅ Delete invoice
export const deleteInvoice = async (req, res) => {
  await Invoice.findByIdAndDelete(req.params.id);
  res.json({ message: "Invoice deleted" });
};

// ✅ Preview invoice (open in browser)
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

// ✅ Download invoice (PDF)
export const printInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const pdfBuffer = await generateInvoicePDF(invoice);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${invoice._id}.pdf`);

    const stream = new PassThrough();
    stream.end(pdfBuffer);
    stream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Email invoice with PDF
export const emailInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const pdfBuffer = await generateInvoicePDF(invoice);
    const filePath = path.join(__dirname, `invoice-${invoice._id}.pdf`);
    
    await sendInvoiceEmail(
      invoice.clientEmail,
      "Your Invoice",
      "Please find attached your invoice.",
      filePath,
      pdfBuffer
    );

    res.json({ message: "Invoice emailed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Share invoice via WhatsApp
export const shareInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    const pdfUrl = `${req.protocol}://${req.get("host")}/api/invoices/${invoice._id}/download`;
    const message = `Hello ${invoice.clientName}, here is your invoice of total KSH ${invoice.totalAmount.toLocaleString()}. Download it here: ${pdfUrl}`;

    const { phone } = req.body;
    const whatsappLink = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    res.json({ whatsappLink });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
