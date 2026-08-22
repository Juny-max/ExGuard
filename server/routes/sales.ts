import { Router, Request, Response } from 'express';
import { requireTenant } from '../middleware/auth.js';

export const salesRouter = Router();
salesRouter.use(requireTenant);

// In-memory or database receipts store
const receiptsStore: any[] = [];

// List receipts for current tenant
salesRouter.get('/', (req: Request, res: Response) => {
  const tenantId = req.tenantContext?.tenantId;
  const tenantReceipts = receiptsStore.filter((r) => !tenantId || r.tenantId === tenantId);

  res.json({
    status: 'success',
    tenantId,
    count: tenantReceipts.length,
    data: tenantReceipts,
  });
});

// Process POS checkout sale & generate receipt with barcode
salesRouter.post('/checkout', (req: Request, res: Response) => {
  const tenantId = req.tenantContext?.tenantId || 'tenant-main';
  const { items, paymentMethod, cashierName, subtotal, savings, tax, total } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Checkout requires at least one cart item.',
    });
  }

  // Generate unique receipt number & barcode
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const receiptNumber = `INV-${randomSuffix}`;
  const barcodeValue = `INV${randomSuffix}`;

  const receipt = {
    id: `rcpt-${Date.now()}-${randomSuffix}`,
    receiptNumber,
    barcodeValue,
    tenantId,
    cashierName: cashierName || 'Cashier Terminal',
    items,
    subtotal: subtotal || 0,
    savings: savings || 0,
    tax: tax || 0,
    total: total || 0,
    paymentMethod: paymentMethod || 'CARD',
    timestamp: new Date().toLocaleString(),
    createdAt: new Date().toISOString(),
  };

  receiptsStore.unshift(receipt);

  res.status(201).json({
    status: 'success',
    message: 'Sale successfully completed and receipt logged.',
    data: receipt,
  });
});

// Lookup receipt by barcode or receiptNumber (for returns / verification)
salesRouter.get('/lookup/:code', (req: Request, res: Response) => {
  const { code } = req.params;
  const normalized = (code || '').trim().toUpperCase();

  const found = receiptsStore.find(
    (r) =>
      r.receiptNumber.toUpperCase() === normalized ||
      (r.barcodeValue && r.barcodeValue.toUpperCase() === normalized) ||
      r.id === code
  );

  if (!found) {
    return res.status(404).json({
      status: 'error',
      message: `Receipt with barcode/number "${code}" not found.`,
    });
  }

  res.json({
    status: 'success',
    data: found,
  });
});

// Process Return / Refund for a receipt item
salesRouter.post('/returns', (req: Request, res: Response) => {
  const tenantId = req.tenantContext?.tenantId || 'tenant-main';
  const { receiptNumber, returnItems, refundTotal, reason, processedBy } = req.body;

  if (!receiptNumber || !returnItems || !Array.isArray(returnItems) || returnItems.length === 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Return request requires a valid receipt number and at least one item.',
    });
  }

  const normalized = (receiptNumber || '').trim().toUpperCase();
  const receipt = receiptsStore.find(
    (r) =>
      r.receiptNumber.toUpperCase() === normalized ||
      (r.barcodeValue && r.barcodeValue.toUpperCase() === normalized)
  );

  const returnRecord = {
    id: `ret-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    receiptNumber: receipt ? receipt.receiptNumber : receiptNumber,
    tenantId,
    returnItems,
    refundTotal: refundTotal || 0,
    currency: 'GHS',
    reason: reason || 'CUSTOMER_RETURN',
    processedBy: processedBy || 'Store Cashier',
    processedAt: new Date().toLocaleString(),
  };

  // Mark returned status on receipt if found
  if (receipt) {
    receipt.hasReturns = true;
    receipt.returnHistory = receipt.returnHistory || [];
    receipt.returnHistory.push(returnRecord);
  }

  res.status(201).json({
    status: 'success',
    message: `Return processed successfully. Refund amount: GH₵${Number(refundTotal || 0).toFixed(2)}`,
    data: returnRecord,
  });
});
