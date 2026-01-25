import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  copyInvoice,
  deleteInvoice,
  printInvoice,
  previewInvoice,
  emailInvoice,
  shareInvoice,
} from "../controllers/Invoicecontroller.js";

import { authenticateUser, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Create invoice
router.post("/", authenticateUser, createInvoice);

// Get all invoices
router.get("/", authenticateUser, requireAdmin, getInvoices);

// Get invoice by ID
router.get("/:id", authenticateUser, getInvoiceById);

// Update invoice
router.put("/:id", authenticateUser,requireAdmin, updateInvoice);

// Copy invoice
router.post("/:id/copy", authenticateUser, copyInvoice);

// Preview invoice PDF
router.get("/:id/preview", authenticateUser, previewInvoice);

// Delete invoice
router.delete("/:id", authenticateUser, requireAdmin, deleteInvoice);

// Print invoice
router.get("/:id/print", authenticateUser, printInvoice);


router.post("/:id/email", authenticateUser, emailInvoice);


router.get("/:id/share", authenticateUser, shareInvoice);

export default router;
