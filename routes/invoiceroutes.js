import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  copyInvoice,
  deleteInvoice,
  printInvoice,
  emailInvoice,
  shareInvoice,
} from "../controllers/invoiceController.js";

const router = express.Router();

// 🔹 Create new invoice
router.post("/", createInvoice);

// 🔹 Get all invoices
router.get("/", getInvoices);

// 🔹 Get single invoice by ID
router.get("/:id", getInvoiceById);

// 🔹 Update invoice
router.put("/:id", updateInvoice);

// 🔹 Copy invoice
router.post("/:id/copy", copyInvoice);

// 🔹 Delete invoice
router.delete("/:id", deleteInvoice);

// 🔹 Download invoice PDF
router.get("/:id/print", printInvoice);

// 🔹 Email invoice (asks for clientEmail in body if not stored)
router.post("/:id/email", emailInvoice);

// 🔹 Share invoice (WhatsApp link)
router.get("/:id/share", shareInvoice);

export default router;
