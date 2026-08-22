export type UserRole = 'STORE_MANAGER' | 'CASHIER' | 'TENANT_ADMIN';

export type BatchStatus = 'SAFE' | 'WARNING_30' | 'WARNING_14' | 'CRITICAL_7' | 'EXPIRED' | 'DISPOSED' | 'DISCOUNTED';

export type DisposalReason = 'EXPIRED' | 'SPOILED' | 'DAMAGED_PACKAGING' | 'RECALLED' | 'DONATED' | 'OTHER';

export interface Tenant {
  id: string;
  name: string;
  code: string;
  branchType: string;
  address: string;
  city: string;
  contactEmail: string;
  contactPhone: string;
  warningThresholdDays: number;
  criticalThresholdDays: number;
  defaultClearanceDiscount: number;
}

export interface User {
  id: string;
  tenantId: string;
  fullName: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeCode: string;
  lastLogin: string;
}

export interface Category {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description: string;
  defaultShelfLifeDays: number;
  colorBadge: string;
}

export interface Product {
  id: string;
  tenantId: string;
  categoryId: string;
  name: string;
  brand: string;
  sku: string;
  barcode: string;
  unit: string;
  standardPrice: number;
  costPrice: number;
  isPerishable: boolean;
}

export interface Batch {
  id: string;
  tenantId: string;
  productId: string;
  productName: string;
  categoryName: string;
  brand: string;
  sku: string;
  barcode: string;
  batchNumber: string;
  quantityReceived: number;
  currentQuantity: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
  dateReceived: string; // YYYY-MM-DD
  expiryDate: string;   // YYYY-MM-DD
  daysRemaining: number;
  status: BatchStatus;
  discountPercentage: number;
  discountedPrice?: number;
  locationAisle: string;
  locationShelf: string;
  supplierName: string;
  notes?: string;
  lastAuditedAt?: string;
  lastAuditedBy?: string;
}

export interface DisposalLog {
  id: string;
  tenantId: string;
  batchId: string;
  productName: string;
  batchNumber: string;
  quantityDisposed: number;
  unit: string;
  unitCost: number;
  totalLoss: number;
  reason: DisposalReason;
  disposedBy: string;
  witnessName: string;
  disposedAt: string;
  notes: string;
}

export interface ExpiryAlert {
  id: string;
  tenantId: string;
  batchId: string;
  productName: string;
  batchNumber: string;
  daysRemaining: number;
  severity: 'THIRTY_DAYS' | 'FOURTEEN_DAYS' | 'SEVEN_DAYS' | 'EXPIRED';
  isAcknowledged: boolean;
  actionTaken?: string;
  createdAt: string;
}

export interface CartItem {
  batch: Batch;
  quantity: number;
  unitPrice: number;
  originalPrice: number;
  discountPercent: number;
  isClearance: boolean;
}

export interface SaleReceipt {
  id: string;
  receiptNumber: string;
  barcodeValue?: string;
  tenantId: string;
  cashierName: string;
  items: CartItem[];
  subtotal: number;
  savings: number;
  tax: number;
  total: number;
  timestamp: string;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_PAY';
}

export type ActiveNavTab =
  | 'DASHBOARD'
  | 'INVENTORY'
  | 'ALERTS'
  | 'CASHIER_SCAN'
  | 'CLEARANCE'
  | 'DISPOSAL'
  | 'CATEGORIES'
  | 'SETTINGS';

