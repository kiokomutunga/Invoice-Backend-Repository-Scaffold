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

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoice);
router.post("/:id/copy", copyInvoice);
router.delete("/:id", deleteInvoice);

// New
router.get("/:id/print", printInvoice);
router.post("/:id/email", emailInvoice);
router.get("/:id/share", shareInvoice);

export default router;
