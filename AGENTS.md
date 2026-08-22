# ExpiryGuard: AI Agent Technical Blueprint & Architecture Guidelines

This file is the official operational blueprint for AI agents working on the ExpiryGuard codebase.

---

## 1. Core Mission & Business Logic

ExpiryGuard is a multi-tenant SaaS application that solves grocery food waste, prevents the illegal/accidental sale of expired inventory, and handles daily supermarket POS checkout operations:

1. **Lot-Based Expiry Lifecycle**:
   - Every product lot belongs to a `Batch` with a `dateReceived`, `expiryDate`, and calculated `daysRemaining`.
   - **Tiers**:
     - `SAFE_30`: >30 days remaining.
     - `WARNING_30`: 15–30 days remaining.
     - `ALERT_14`: 8–14 days remaining.
     - `CRITICAL_7`: 1–7 days remaining (suggests clearance markdown).
     - `EXPIRED`: 0 or negative days remaining (strictly prohibited from sale).
     - `DISPOSED`: Written off via the regulatory waste register.

2. **Point of Sale (POS) & Dual Barcode Scanner**:
   - Scanning an **Inventory Barcode / SKU** (e.g. `890123400101`): Rings up the item, automatically calculates clearance discounts if marked down, and halts the sale if expired.
   - Scanning a **Receipt Barcode** (e.g. `INV-482910`): Automatically validates the original transaction in the receipts store and opens `ReceiptVerificationModal.tsx` for itemized returns and refunds.

3. **Currency & Localization Standard**:
   - Currency is **Ghana Cedi (`GH₵`)**.
   - Always import and use `formatCedi(amount)` from `src/utils/currency.ts` to ensure consistent formatting (e.g. `GH₵19.47`). Do not hardcode `$` symbols.

4. **Multi-Tenancy & RBAC**:
   - Multi-tenant data isolation via `tenantId` (e.g. `tenant-greenmart-flagship`).
   - Role switching between `STORE_MANAGER` (full admin, markdowns, write-offs, reports) and `CASHIER` (POS checkout, barcode scanner, return verification).

---

## 2. Design System & Frontend Constraints

- **Theme**: High-contrast, clean green and white enterprise palette (`emerald-700`, `emerald-800`, `emerald-900`, `emerald-950`, `stone-50`, `stone-100`, `stone-200`, `stone-900`).
- **Icons**: Exclusively `@heroicons/react` (`/24/outline`, `/20/solid`). Do NOT use Lucide icons.
- **Copywriting**: Clean, professional, and clear. Avoid decorative emoji prefixes in automated system banners, table logs, and status lines.

---

## 3. Backend Endpoints (`/server/routes/`)

- `GET /api/sales/receipts`: Lists saved customer receipts for the active tenant.
- `POST /api/sales/receipts`: Saves a newly completed POS checkout receipt.
- `GET /api/sales/lookup/:receiptNumber`: Authenticates and retrieves receipt details by receipt number or barcode.
- `POST /api/sales/returns`: Validates and records partial or full refunds against an authenticated receipt.
- `GET /api/batches`, `POST /api/batches`: Batch lot CRUD operations.
- `GET /api/alerts`: Multi-tiered expiry alert queries.

---

## 4. Key Component Mapping

| Component | Path | Responsibility |
|---|---|---|
| `FastScannerView` | `/src/components/FastScannerView.tsx` | POS register, dual product & receipt barcode scanner, cart calculations |
| `ReceiptVerificationModal` | `/src/components/ReceiptVerificationModal.tsx` | Itemized receipt return selection, refund calculation, reason code logging |
| `ReceiptBarcode` | `/src/components/ReceiptBarcode.tsx` | Code128 barcode generator for customer receipts |
| `CameraBarcodeScannerModal` | `/src/components/CameraBarcodeScannerModal.tsx` | Live camera video barcode recognition |
| `DashboardView` | `/src/components/DashboardView.tsx` | Executive metrics, loss-at-risk calculations, urgency queues |
| `BatchesView` | `/src/components/BatchesView.tsx` | Full lot inventory table, search, and department filters |
| `ClearanceView` | `/src/components/ClearanceView.tsx` | Markdown discounting and shelf tag generator |
| `DisposalView` / `DisposalModal` | `/src/components/DisposalView.tsx` | Regulatory food waste register and write-off logs |
| `AuditReportModal` | `/src/components/AuditReportModal.tsx` | Print-ready compliance audit report & CSV export |
| `AddBranchModal` / `AddCashierModal` | `/src/components/` | Multi-branch and staff management modals |

---

## 5. Development & Testing Instructions

- Run the dev server with `npm run dev`.
- Verify the build with `npm run build`.
- To test the returns flow:
  1. Go to the **Checkout Register**.
  2. Click **Lookup Returns** or type/scan `INV-482910`.
  3. Select items to return and click **Authorize Refund**.
