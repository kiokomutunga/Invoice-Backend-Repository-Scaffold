// utils/pdfGenerator.js
import PDFDocument from "pdfkit";
import path from "path";

export const generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 40 });
      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      const pageWidth = doc.page.width;
      const leftMargin = 40;

      // ---------- LOGO + COMPANY ----------
      try {
        const logoPath = path.resolve("images", "elevate-logoo.png");
        doc.image(logoPath, leftMargin, 40, { width: 65, fit: [65, 50] }); // smaller logo
      } catch (err) {
        // fallback: just text if no logo
      }

      // Company name stacked (closer to logo)
      doc.font("Helvetica-Bold").fontSize(16).fillColor("#1E3A8A")
        .text("Elevate", leftMargin + 80, 50);
      doc.fontSize(12).fillColor("#1E3A8A")
        .text("Cleaning Co.", leftMargin + 80, 70);

      // ---------- INVOICE BADGE ----------
      const badgeWidth = 120;
      const badgeHeight = 34;
      const badgeX = pageWidth - badgeWidth - leftMargin;
      const badgeY = 55;
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 4).fill("#1E3A8A");
      doc.fillColor("white").font("Helvetica-Bold").fontSize(16)
        .text("INVOICE", badgeX, badgeY + 8, { width: badgeWidth, align: "center" });

      // ---------- SEPARATOR LINE ----------
      doc.moveTo(leftMargin, 120).lineTo(pageWidth - leftMargin, 120)
        .strokeColor("#e6e6e6").lineWidth(1).stroke();

      // ---------- CLIENT INFO + INVOICE META ----------
      const sectionTop = 135;

      // Invoice To (left)
      doc.font("Helvetica").fontSize(11).fillColor("#1E3A8A")
        .text("Invoice To :", leftMargin, sectionTop);
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#000")
        .text(invoice.clientName || "Unnamed Client", leftMargin, sectionTop + 18);
      if (invoice.email) {
        doc.font("Helvetica").fontSize(10).fillColor("#000")
          .text(`Email: ${invoice.email}`, leftMargin, sectionTop + 38);
      }

      // Invoice Meta (right side, aligned with Invoice To)
      const metaX = pageWidth / 2 + 40; // shift to right half
      const dateObj = invoice.date ? new Date(invoice.date) : new Date();
      const formattedDate = dateObj.toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
      });

      doc.font("Helvetica").fontSize(10).fillColor("#000")
        .text(`Invoice No: ${invoice.invoiceNumber || "N/A"}`, metaX, sectionTop + 5);
      doc.text(`Date: ${formattedDate}`, metaX, sectionTop + 20);

      // ---------- SERVICES TABLE ----------
      let tableTop = 220;
      const colNoX = leftMargin + 10;
      const colDescX = leftMargin + 50;
      const colPriceX = leftMargin + 330;
      const colTotalX = leftMargin + 440;

      // Header background (wider so TOTAL isn't cut off)
      doc.rect(leftMargin, tableTop, pageWidth - leftMargin - 20, 24).fill("#1E3A8A");

      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(10);
      doc.text("NO", colNoX, tableTop + 7);
      doc.text("DESCRIPTION", colDescX, tableTop + 7);
      doc.text("PRICE", colPriceX, tableTop + 7, { width: 80, align: "right" });
      doc.text("TOTAL", colTotalX, tableTop + 7, { width: 80, align: "right" });

      // Reset for rows
      doc.fillColor("#000").font("Helvetica").fontSize(10);
      doc.moveTo(leftMargin, tableTop + 24).lineTo(pageWidth - leftMargin, tableTop + 24)
        .strokeColor("#cccccc").lineWidth(0.5).stroke();

      // Rows
      let y = tableTop + 32;
      const services = Array.isArray(invoice.services) ? invoice.services : [];
      services.forEach((s, i) => {
        const description = s.description || "No description";
        const price = Number(s.price) || 0;

        doc.text(String(i + 1), colNoX, y);
        doc.text(description, colDescX, y, { width: colPriceX - colDescX - 10 });
        doc.text(`KSH ${price.toLocaleString()}`, colPriceX, y, { width: 90, align: "right" });
        doc.text(`KSH ${price.toLocaleString()}`, colTotalX, y, { width: 90, align: "right" });

        y += 24;
        doc.moveTo(leftMargin, y - 6).lineTo(pageWidth - leftMargin, y - 6)
          .strokeColor("#f0f0f0").lineWidth(0.5).stroke();
      });

      // ---------- PAYMENT + GRAND TOTAL ----------
      const paymentsTop = y + 20;
      const paymentBoxWidth = 260;
      const totalBoxX = leftMargin + 300;
      const totalBoxWidth = pageWidth - leftMargin - totalBoxX;

      // Payment Method Box
      doc.roundedRect(leftMargin, paymentsTop, paymentBoxWidth, 54, 4)
        .fillAndStroke("#f1f6fb", "#e6eef8");
      doc.fillColor("#1E3A8A").font("Helvetica-Bold").fontSize(11)
        .text("PAYMENT METHOD :", leftMargin + 10, paymentsTop + 8);
      doc.font("Helvetica").fontSize(10).fillColor("#000")
        .text(invoice.bankName || "COOPERATIVE BANK", leftMargin + 10, paymentsTop + 26);
      doc.text(invoice.accountNumber || "01108111046300", leftMargin + 10, paymentsTop + 40);

      // Grand Total Box
      doc.roundedRect(totalBoxX, paymentsTop, totalBoxWidth, 54, 4).fill("#1E3A8A");
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11)
        .text("GRAND TOTAL :", totalBoxX + 10, paymentsTop + 8);
      const totalValue = Number(invoice.total) || services.reduce((s, it) => s + (Number(it.price) || 0), 0);
      doc.font("Helvetica-Bold").fontSize(13)
        .text(`KSH ${totalValue.toLocaleString()}`, totalBoxX + 10, paymentsTop + 28);

      // ---------- FOOTER ----------
      const footerLineY = paymentsTop + 100;
      doc.moveTo(leftMargin, footerLineY).lineTo(pageWidth - leftMargin, footerLineY)
        .strokeColor("#e6e6e6").lineWidth(1).stroke();

      // Terms
      const footerTextY = footerLineY + 12;
      doc.font("Helvetica").fontSize(10).fillColor("#000")
        .text("Thank you for doing business with us!", leftMargin, footerTextY);
      doc.font("Helvetica-Bold").fontSize(10)
        .text("Terms and Conditions :", leftMargin, footerTextY + 20);
      doc.font("Helvetica").fontSize(9)
        .text(invoice.terms || "Please send payment at least 7 days before the event.\n(Grand Total is inclusive of VAT)", leftMargin, footerTextY + 34);

      // Signature
      const signatureY = footerTextY + 80;
      doc.font("Helvetica-Bold").fontSize(11)
        .text(invoice.administrator || "Kennedy Kechula", totalBoxX, signatureY, { align: "right" });
      doc.font("Helvetica").fontSize(10)
        .text("Administrator", totalBoxX, signatureY + 18, { align: "right" });

      // Contact Info (bottom line)
      const contactY = doc.page.height - 70;
      doc.font("Helvetica").fontSize(9).fillColor("#000")
        .text(`Phone: ${invoice.phone || ""}`, leftMargin, contactY);
      doc.text(`Email: ${invoice.email || ""}`, leftMargin + 180, contactY);
      doc.text(`Address: ${invoice.address || ""}`, leftMargin + 340, contactY);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
