import Invoice from "../models/Invoice.js";

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
