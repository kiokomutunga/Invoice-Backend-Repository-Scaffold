import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  description: { type: String, required: true },
  price: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  clientName: { type: String, required: true },
  services: [serviceSchema],
  total: { type: Number, required: true },

  // Payment & Footer Details
  bankName: { type: String },
  accountNumber: { type: String },
  administrator: { type: String },
  phone: { type: String },
  email: { type: String },
  address: { type: String },
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);
