export interface TenantContext {
  tenantId: string;
  userId: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'STORE_MANAGER' | 'CASHIER' | 'INVENTORY_CLERK';
  email: string;
  name: string;
}

export type ExpiryStatus = 'SAFE' | 'WARNING' | 'CRITICAL' | 'EXPIRED' | 'DISPOSED' | 'DISCOUNTED';

export interface BatchPayload {
  productId: string;
  batchNumber: string;
  quantityReceived: number;
  currentQuantity: number;
  unitCost: number;
  unitPrice: number;
  dateReceived: string;
  expiryDate: string;
  locationAisle?: string;
  locationShelf?: string;
  supplierName?: string;
  notes?: string;
}

export interface DisposalPayload {
  batchId: string;
  quantity: number;
  reason: 'EXPIRED' | 'SPOILED' | 'DAMAGED_PACKAGING' | 'RECALLED' | 'DONATED' | 'OTHER';
  witnessName?: string;
  notes?: string;
}
