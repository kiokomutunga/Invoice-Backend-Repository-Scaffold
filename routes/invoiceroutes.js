import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  copyInvoice,
  deleteInvoice,
} from "../controllers/Invoicecontroller.js";

const router = express.Router();

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoice);
router.post("/:id/copy", copyInvoice);
router.delete("/:id", deleteInvoice);

export default router;
