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
      const rightMargin = pageWidth - 40;

      // ---------- LOGO + COMPANY ----------
      try {
        const logoPath = path.resolve("images", "elevate-logo.png"); // your logo location
        doc.image(logoPath, leftMargin, 45, { width: 90, height: 60, fit: [90, 60] });
      } catch (err) {
        // fallback: nothing — company name will be printed
        // console.warn("Logo not found", err);
      }

      // Company name near logo
      doc.font("Helvetica-Bold").fontSize(14).fillColor("#000")
        .text(invoice.companyName || "ELEVATE CLEANING CO.", leftMargin + 110, 50);

      // ---------- INVOICE BADGE (blue box containing 'INVOICE') ----------
      const badgeWidth = 130;
      const badgeHeight = 34;
      const badgeX = pageWidth - rightMargin - badgeWidth + 20; // ~right aligned
      const badgeY = 45;
      doc.roundedRect(pageWidth - badgeWidth - leftMargin, badgeY, badgeWidth, badgeHeight, 4)
        .fill("#1E3A8A");
      doc.fillColor("white").font("Helvetica-Bold").fontSize(18)
        .text("INVOICE", pageWidth - badgeWidth - leftMargin, badgeY + 6, { width: badgeWidth, align: "center" });

      // ---------- small horizontal line under header ----------
      doc.moveTo(leftMargin, 120).lineTo(pageWidth - leftMargin, 120).strokeColor("#e6e6e6").lineWidth(1).stroke();

      // ---------- META (Invoice no + date) ----------
      const metaX = pageWidth - 250;
      doc.font("Helvetica").fontSize(10).fillColor("#000");
      doc.text(`Invoice no : ${invoice.invoiceNumber || "N/A"}`, metaX, 100, { align: "left" });
      const dateObj = invoice.date ? new Date(invoice.date) : new Date();
      const formattedDate = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
      doc.text(`Date : ${formattedDate}`, metaX, 116, { align: "left" });

      // ---------- CLIENT INFO ----------
      doc.font("Helvetica").fontSize(11).fillColor("#1E3A8A").text("Invoice to :", leftMargin, 135);
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#000").text(invoice.clientName || "Unnamed Client", leftMargin, 153);
      if (invoice.email) doc.font("Helvetica").fontSize(10).fillColor("#000").text(`Email: ${invoice.email}`, leftMargin, 170);

      // ---------- SERVICES TABLE HEADER ----------
      let tableTop = 200;
      const colNoX = leftMargin + 10;
      const colDescX = leftMargin + 50;
      const colPriceX = leftMargin + 330;
      const colTotalX = leftMargin + 440;

      // header background
      doc.rect(leftMargin, tableTop, pageWidth - leftMargin * 2, 22).fill("#1E3A8A");
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(10);
      doc.text("NO", colNoX, tableTop + 6);
      doc.text("DESCRIPTION", colDescX, tableTop + 6);
      doc.text("PRICE", colPriceX, tableTop + 6, { width: 80, align: "right" });
      doc.text("TOTAL", colTotalX, tableTop + 6, { width: 80, align: "right" });

      // Reset fill for rows
      doc.fillColor("#000").font("Helvetica").fontSize(10);

      // draw a thin line below header
      doc.moveTo(leftMargin, tableTop + 22).lineTo(pageWidth - leftMargin, tableTop + 22)
        .strokeColor("#cccccc").lineWidth(0.5).stroke();

      // ---------- TABLE ROWS ----------
      let y = tableTop + 30;
      const services = Array.isArray(invoice.services) ? invoice.services : [];
      services.forEach((s, i) => {
        const description = s.description || "No description";
        const price = Number(s.price) || 0;
        const totalLine = price; // you can support quantity later

        doc.text(String(i + 1), colNoX, y);
        doc.text(description, colDescX, y, { width: colPriceX - colDescX - 10 });
        doc.text(`KSH ${price.toLocaleString()}`, colPriceX, y, { width: 90, align: "right" });
        doc.text(`KSH ${totalLine.toLocaleString()}`, colTotalX, y, { width: 90, align: "right" });

        // separator line under each row
        y += 24;
        doc.moveTo(leftMargin, y - 6).lineTo(pageWidth - leftMargin, y - 6).strokeColor("#f0f0f0").lineWidth(0.5).stroke();
      });

      // ---------- PAYMENT METHOD (left) and GRAND TOTAL (right) aligned ----------
      const paymentsTop = y + 20;
      const paymentBoxWidth = 260;
      const totalBoxX = leftMargin + 300;
      const totalBoxWidth = pageWidth - leftMargin - totalBoxX;

      // Payment box (light background)
      doc.roundedRect(leftMargin, paymentsTop, paymentBoxWidth, 54, 4).fillAndStroke("#f1f6fb", "#e6eef8");
      doc.fillColor("#1E3A8A").font("Helvetica-Bold").fontSize(11).text("PAYMENT METHOD :", leftMargin + 10, paymentsTop + 8);
      doc.font("Helvetica").fontSize(10).fillColor("#000").text(invoice.bankName || "COOPERATIVE BANK", leftMargin + 10, paymentsTop + 26);
      doc.font("Helvetica").fontSize(10).text(invoice.accountNumber || "01108111046300", leftMargin + 10, paymentsTop + 40);

      // Grand total box (blue background)
      doc.roundedRect(totalBoxX, paymentsTop, totalBoxWidth, 54, 4).fill("#1E3A8A");
      doc.fillColor("#fff").font("Helvetica-Bold").fontSize(11).text("GRAND TOTAL :", totalBoxX + 10, paymentsTop + 8);
      const totalValue = Number(invoice.total) || services.reduce((s, it) => s + (Number(it.price) || 0), 0);
      doc.font("Helvetica-Bold").fontSize(13).text(`KSH ${totalValue.toLocaleString()}`, totalBoxX + 10, paymentsTop + 28);

      // ---------- horizontal separator before addresses/footer ----------
      const footerLineY = paymentsTop + 100;
      doc.moveTo(leftMargin, footerLineY).lineTo(pageWidth - leftMargin, footerLineY).strokeColor("#e6e6e6").lineWidth(1).stroke();

      // Footer text (terms & signature)
      const footerTextY = footerLineY + 12;
      doc.font("Helvetica").fontSize(10).fillColor("#000").text("Thank you for doing business with us!", leftMargin, footerTextY);
      doc.font("Helvetica-Bold").fontSize(10).text("Term and Conditions :", leftMargin, footerTextY + 20);
      doc.font("Helvetica").fontSize(9).text(invoice.terms || "Please send payment at least 7 days before the event.\n(Grand Total is inclusive of VAT)", leftMargin, footerTextY + 34);

      // Signature block (right)
      const signatureY = footerTextY + 80;
      doc.font("Helvetica-Bold").fontSize(11).text(invoice.administrator || "Kennedy Kechula", totalBoxX, signatureY, { align: "right" });
      doc.font("Helvetica").fontSize(10).text("Administrator", totalBoxX, signatureY + 18, { align: "right" });

      // Bottom contact line (icons unicode)
      const contactY = doc.page.height - 70;
      doc.font("Helvetica").fontSize(9).text(`📞 ${invoice.phone || ""}`, leftMargin, contactY);
      doc.text(`✉️ ${invoice.email || ""}`, leftMargin + 180, contactY);
      doc.text(`📍 ${invoice.address || ""}`, leftMargin + 340, contactY);

      // Finalize PDF
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
