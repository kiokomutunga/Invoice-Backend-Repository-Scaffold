# Invoice Backend — Repository Scaffold

This document is a professional, ready-to-use scaffold for an **Invoice Backend** repository you can push to GitHub. It includes a recommended file structure, key files (full code snippets), CI workflow, API documentation, and instructions to initialize and publish the repo.

---

## 1. Project summary

A Node.js + Express + MongoDB backend for creating and managing invoices. Features:

* Create, read, update, delete invoices (CRUD)
* Copy invoice (duplicate with new invoice number)
* Edit invoice
* Print/generate PDF of an invoice (PDF generation service)
* Share invoice (WhatsApp share link & email attachments)
* Authentication-ready (JWT skeleton)
* Input validation, logging, and basic error handling
* CI via GitHub Actions and linting

---
## 3. File structure

```
invoice-backend/
├─ .github/
│  └─ workflows/
│     └─ nodejs.yml
├─ src/
│  ├─ config/
│  │  └─ db.js
│  ├─ controllers/
│  │  └─ invoiceController.js
│  ├─ models/
│  │  └─ invoiceModel.js
│  ├─ routes/
│  │  └─ invoiceRoutes.js
│  ├─ services/
│  │  ├─ pdfService.js
│  │  └─ whatsappService.js
│  ├─ middleware/
│  │  ├─ auth.js
│  │  ├─ errorHandler.js
│  │  └─ validate.js
│  ├─ utils/
│  │  └─ invoiceNumber.js
│  └─ index.js
├─ tests/
│  └─ invoice.test.js
├─ .env.example
├─ .eslintrc.json
├─ .prettierrc
├─ package.json
└─ README.md
```

---

## 4. Key files (copy these into your repo)

### `package.json` (starter)

```json
{
  "name": "invoice-backend",
  "version": "0.1.0",
  "private": true,
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "lint": "eslint . --ext .js",
    "test": "jest --runInBand"
  },
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "express-validator": "^6.15.0",
    "jsonwebtoken": "^9.0.0",
    "pdfkit": "^0.14.0",
    "nodemailer": "^6.9.0",
    "dayjs": "^1.11.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "eslint": "^8.0.0",
    "jest": "^29.0.0",
    "supertest": "^6.4.0",
    "prettier": "^2.8.0"
  }
}
```

---

### `.env.example`

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/invoice_db
JWT_SECRET=replace_with_a_secret
FROM_EMAIL=no-reply@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
```

---

### `src/config/db.js`

```js
const mongoose = require('mongoose');

const connectDB = async (uri) => {
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

module.exports = connectDB;
```

---

### `src/models/invoiceModel.js`

```js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 }
});

const InvoiceSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String
  },
  date: { type: Date, default: Date.now },
  dueDate: { type: Date },
  items: [ItemSchema],
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, enum: ['Draft','Sent','Paid','Cancelled'], default: 'Draft' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  metadata: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
```

---

### `src/utils/invoiceNumber.js`

```js
const dayjs = require('dayjs');

function generateInvoiceNumber(prefix = 'INV') {
  const date = dayjs().format('YYYYMMDD');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${date}-${rand}`;
}

module.exports = generateInvoiceNumber;
```

---

### `src/controllers/invoiceController.js`

```js
const Invoice = require('../models/invoiceModel');
const generateInvoiceNumber = require('../utils/invoiceNumber');
const pdfService = require('../services/pdfService');

// Helper to compute totals
function computeTotals(invoice) {
  let subtotal = 0;
  let tax = 0;
  invoice.items.forEach(i => {
    const line = i.quantity * i.unitPrice;
    subtotal += line;
    tax += (line * (i.taxRate || 0)) / 100;
  });
  invoice.subtotal = subtotal;
  invoice.tax = tax;
  invoice.total = subtotal + tax;
}

exports.createInvoice = async (req, res, next) => {
  try {
    const payload = req.body;
    payload.invoiceNumber = generateInvoiceNumber();
    computeTotals(payload);
    const inv = await Invoice.create(payload);
    res.status(201).json(inv);
  } catch (err) { next(err); }
};

exports.getInvoice = async (req, res, next) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json(inv);
  } catch (err) { next(err); }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const payload = req.body;
    if (payload.items) computeTotals(payload);
    const inv = await Invoice.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json(inv);
  } catch (err) { next(err); }
};

exports.deleteInvoice = async (req, res, next) => {
  try {
    const inv = await Invoice.findByIdAndDelete(req.params.id);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.status(204).end();
  } catch (err) { next(err); }
};

exports.copyInvoice = async (req, res, next) => {
  try {
    const inv = await Invoice.findById(req.params.id).lean();
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    delete inv._id; delete inv.__v; inv.invoiceNumber = generateInvoiceNumber();
    const copy = await Invoice.create(inv);
    res.status(201).json(copy);
  } catch (err) { next(err); }
};

exports.printInvoice = async (req, res, next) => {
  try {
    const inv = await Invoice.findById(req.params.id).lean();
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    const pdfBuffer = await pdfService.generateInvoicePdf(inv);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${inv.invoiceNumber}.pdf"` });
    res.send(pdfBuffer);
  } catch (err) { next(err); }
};
```

---

### `src/routes/invoiceRoutes.js`

```js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/invoiceController');

router.post('/', controller.createInvoice);
router.get('/:id', controller.getInvoice);
router.put('/:id', controller.updateInvoice);
router.delete('/:id', controller.deleteInvoice);
router.post('/:id/copy', controller.copyInvoice);
router.get('/:id/print', controller.printInvoice);

module.exports = router;
```

---

### `src/services/pdfService.js` (simple PDF generation using PDFKit)

```js
const PDFDocument = require('pdfkit');

exports.generateInvoicePdf = (invoice) => {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    doc.fontSize(20).text(invoice.companyName || 'Company', { align: 'left' });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice: ${invoice.invoiceNumber}`);
    doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`);

    doc.moveDown();
    invoice.items.forEach((it, i) => {
      doc.text(`${i+1}. ${it.description} — ${it.quantity} x ${it.unitPrice} = ${it.quantity * it.unitPrice}`);
    });

    doc.moveDown();
    doc.text(`Subtotal: ${invoice.subtotal}`);
    doc.text(`Tax: ${invoice.tax}`);
    doc.text(`Total: ${invoice.total}`);

    doc.end();
  });
};
```

---

### `src/index.js` (app entry)

```js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const connectDB = require('./config/db');
const invoiceRoutes = require('./routes/invoiceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

app.use('/api/invoices', invoiceRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
(async function start(){
  await connectDB(process.env.MONGODB_URI);
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();
```

---

### `src/middleware/errorHandler.js`

```js
module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
};
```

---

## 5. API Endpoints (summary)

* `POST /api/invoices` — Create invoice. Body: `companyName, customer, items, dueDate, ...`.
* `GET /api/invoices/:id` — Get invoice by id.
* `PUT /api/invoices/:id` — Update invoice.
* `DELETE /api/invoices/:id` — Delete invoice.
* `POST /api/invoices/:id/copy` — Duplicate invoice with new number.
* `GET /api/invoices/:id/print` — Returns a PDF.

Example `POST /api/invoices` body:

```json
{
  "companyName": "Acme Ltd",
  "customer": { "name": "John Doe", "email": "john@example.com" },
  "items": [{ "description": "Service A", "quantity": 2, "unitPrice": 100, "taxRate": 16 }],
  "dueDate": "2025-09-30"
}
```

---

## 6. GitHub: CI workflow (basic)

Create `.github/workflows/nodejs.yml`:

```yaml
name: Node CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run lint
      - run: npm test
```

---

## 7. Recommended repo extras

* `README.md` with usage and API examples (you get a starter below)
* `.env.example` (already included)
* `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` if open-source
* `LICENSE` (MIT if open)
* Issue templates and PR templates for consistent contributions
* GitHub project board for task tracking

---

## 8. README (starter content)

````md
# Invoice Backend

Node.js + Express backend for creating and sharing invoices.

## Quick start

1. Clone repo
```bash
git clone git@github.com:yourusername/invoice-backend.git
cd invoice-backend
````

2. Install and configure

```bash
cp .env.example .env
npm install
npm run dev
```

3. Open `http://localhost:4000/api/invoices`

## API

See routes in `src/routes/invoiceRoutes.js`.

## Contributing

Open an issue or PR. Follow code style (Prettier + ESLint).

````

---

## 9. Steps to create & publish on GitHub (commands)

```bash
# create local repo
mkdir invoice-backend && cd invoice-backend
git init
# create files (copy scaffold above into files)
# then
git add .
git commit -m "chore: initial invoice-backend scaffold"
# create remote repo on GitHub and then:
git remote add origin git@github.com:YOUR_USERNAME/invoice-backend.git
git branch -M main
git push -u origin main
````

---

## 10. Future improvements (roadmap suggestions)

* Add user model & proper auth flows (register/login, RBAC)
* Add pagination and search for invoice lists
* Add uploads/attachments (receipts) to S3 / Blob storage
* Add webhooks for payment confirmation (e.g., M-Pesa or Stripe)
* Add front-end (React) and mobile offline support using Progressive Web App + local DB sync
* Add automated invoice numbering sequences per company
* Add audit logs and activity timeline

---
