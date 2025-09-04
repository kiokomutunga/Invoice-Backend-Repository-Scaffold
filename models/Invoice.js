import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
  description: String,
  amount: Number,
});

const invoiceSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  logo: { type: String }, // store URL or base64
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  services: [serviceSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
}, { timestamps: true });

export default mongoose.model("Invoice", invoiceSchema);
