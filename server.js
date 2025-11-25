import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import invoiceRoutes from "./routes/invoiceroutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log(" MongoDB Connected"))
  .catch(err => console.log(" MongoDB Error:", err));

// Routes
app.use("/api/invoices", invoiceRoutes);
app.use("api/auth", authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on https://invoice-backend-repository-scaffold.onrender.com:${PORT}`));
