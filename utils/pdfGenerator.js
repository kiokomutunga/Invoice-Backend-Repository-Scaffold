import PDFDocument from "pdfkit";

export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // ---------- HEADER ----------
      doc
        .rect(0, 0, doc.page.width, 80)
        .fill("#1E3A8A"); // navy blue bar
      doc.fillColor("white").fontSize(24).text("INVOICE", 50, 25);
      doc.fillColor("white").fontSize(12).text(invoice.companyName || "My Company", 50, 55);

      // ---------- INVOICE META ----------
      doc.moveDown(3);
      doc.fillColor("black").fontSize(12);
      doc.text(`Invoice No: ${invoice.invoiceNumber}`, { align: "right" });
      doc.text(`Date: ${invoice.date || new Date().toLocaleDateString()}`, { align: "right" });

      // ---------- CLIENT INFO ----------
      doc.moveDown(2);
      doc.fontSize(14).fillColor("#1E3A8A").text("Invoice To:", { underline: true });
      doc.moveDown(0.5);
      doc.fillColor("black").fontSize(12);
      doc.text(`${invoice.clientName}`);
      if (invoice.clientEmail) doc.text(`Email: ${invoice.clientEmail}`);

      // ---------- SERVICES TABLE ----------
      doc.moveDown(2);
      doc.fillColor("#1E3A8A").fontSize(14).text("Services", { underline: true });
      doc.moveDown(0.5);

      // Table header
      doc.fontSize(12).fillColor("black");
      doc.text("Description", 50, doc.y, { continued: true });
      doc.text("Amount", { align: "right" });
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

      // Table rows
      invoice.services.forEach((s, i) => {
        doc.text(`${i + 1}. ${s.description}`, 50, doc.y + 5, { continued: true });
        doc.text(`KSH ${s.amount.toLocaleString()}`, { align: "right" });
      });

      // ---------- TOTAL ----------
      doc.moveDown(2);
      doc.fontSize(14).fillColor("black").text(`Total: KSH ${invoice.totalAmount.toLocaleString()}`, { align: "right" });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
