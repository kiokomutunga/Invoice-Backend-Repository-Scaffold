import PDFDocument from "pdfkit";
import fs from "fs";

export const generateInvoicePDF = (invoice, filePath) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(20).text(invoice.companyName, { align: "center" });
      if (invoice.logo) {
        try {
          doc.image(invoice.logo, 50, 45, { width: 100 });
        } catch {
          console.log("⚠️ Logo could not be loaded, skipping...");
        }
      }
      doc.moveDown();

      // Client Info
      doc.fontSize(12).text(`Client: ${invoice.clientName}`);
      doc.text(`Email: ${invoice.clientEmail}`);
      doc.moveDown();

      // Services Table
      doc.text("Services:", { underline: true });
      invoice.services.forEach((s, i) => {
        doc.text(`${i + 1}. ${s.description} - ${s.amount}`);
      });

      // Total
      doc.moveDown();
      doc.fontSize(14).text(`Total: ${invoice.totalAmount}`, { align: "right" });

      doc.end();
      stream.on("finish", () => resolve(filePath));
    } catch (err) {
      reject(err);
    }
  });
};
