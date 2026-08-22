# ExpiryGuard: Multi-Tenant Supermarket & Mall Expiry Tracking & POS SaaS

ExpiryGuard is an enterprise multi-tenant SaaS application designed to eliminate supermarket and shopping mall food waste, prevent the accidental sale of expired goods, and streamline daily checkout, clearance markdowns, and customer returns.

It provides an automated freshness monitoring system that tracks perishable goods by received lot, calculates shelf-life timelines, alerts staff to items approaching expiration (30, 14, and 7-day tiers), enforces immediate removal of expired stock, and provides an integrated POS checkout register with Ghana Cedi (`GH₵`) currency and receipt barcode return verification.

---

## 1. Key Capabilities & Features

### 🛒 Point of Sale (POS) Checkout & Returns Register
- **Dual-Mode Barcode Scanning**:
  - **Product SKUs / EAN Barcodes**: Rapid item addition to cart with automatic clearance discount calculations and expired item sale prevention.
  - **Receipt Barcodes (`INV-XXXXXX`)**: Scanning receipt barcodes instantly validates the original sale and opens the **Receipt Verification & Return Refund** interface.
- **Dynamic Cart & Pricing**: Computes gross subtotals, markdown savings, VAT/tax, and grand total in Ghana Cedi (`GH₵`).
- **Multi-Tender Payments**: Supports Cash, Card, and Mobile Money with instant printable receipt generation and Code128 barcodes.
- **Itemized Return & Refund Engine**: Cashiers and managers can select specific items from an authenticated receipt, specify return quantities, select return reason codes (Customer Return, Defective/Seal Broken, Expired Discovery, Wrong Variant), and authorize instant refunds.

### 🏢 Multi-Tenant Workspace & Branch Management
- **Tenant Isolation**: Separate inventory rosters, settings, and team rosters per supermarket branch or mall anchor.
- **Branch Management**: Create and switch between multiple branches (Flagship, Express, Hypermarket) with custom warning thresholds and clearance discount policies.
- **Staff & Cashier Management**: Invite cashiers and managers with role-based access control (RBAC).

### 🏷️ Perishable Product & Batch Lot Freshness Tracking
- **Lot-Based Tracking**: Tracks batch lot numbers, received dates, exact expiration dates, and aisle/shelf locations.
- **Automated Freshness Tiers**:
  - **Safe Stock**: Greater than 30 days of shelf life remaining.
  - **30-Day Warning**: Early visibility for first-in, first-out (FIFO) rotation.
  - **14-Day Alert**: Recommended for promotional endcap placement.
  - **7-Day Critical**: Triggers clearance markdown recommendations (-20%, -35%, -50%).
  - **Expired**: Blocked from sale immediately; designated for write-off disposal.

### 💰 Clearance Markdown & Waste Disposal Register
- **Clearance Engine**: Generates printable shelf markdown tags with dynamic percentage discounts.
- **Disposal & Write-Off Compliance**: Formal regulatory write-off logging with reason categorization (Expired, Spoiled, Packaging Damaged, Donated, Recalled) and financial cost-loss tracking.
- **Compliance Audit Reporting**: Exportable print-ready PDF-style audit reports and CSV lot exports for food safety inspectors.

---

## 2. Technology Stack & Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion animations.
- **Currency & Localization**: Ghana Cedi (`GH₵`) standardized formatting via `/src/utils/currency.ts`.
- **Iconography**: Exclusively `@heroicons/react` (`/24/outline`, `/20/solid`).
- **Backend Architecture**: Node.js, Express, with TypeScript server bundled via esbuild.
- **Endpoints**:
  - `/api/sales/receipts`: Create and list point-of-sale customer receipts.
  - `/api/sales/lookup/:receiptNumber`: Lookup and authenticate receipts by barcode.
  - `/api/sales/returns`: Process partial or full itemized refunds.
  - `/api/batches`, `/api/products`, `/api/alerts`: Inventory and alert management.
- **Database Readiness**: PostgreSQL schemas and Row-Level-Security (RLS) migrations ready in `/migrations/`.

---

## 3. Directory Structure

```text
/
|-- migrations/
|   |-- 001_initial_schema.sql         # PostgreSQL core schema, enums, indexes, and views
|   `-- 002_rls_policies.sql           # Supabase Row Level Security (RLS) policies
|-- server/
|   |-- db/
|   |   `-- supabaseClient.ts          # Database connector template
|   |-- middleware/
|   |   `-- auth.ts                    # Tenant context and RBAC middleware
|   |-- routes/
|   |   |-- alerts.ts                  # Expiry alert endpoints
|   |   |-- batches.ts                 # Batch lot queries and updates
|   |   |-- products.ts                # Master product catalog routes
|   |   `-- sales.ts                   # POS receipts, lookups, and return refunds
|   |-- app.ts                         # Express application setup
|   `-- types.ts                       # Backend contract interfaces
|-- src/
|   |-- components/
|   |   |-- AddBranchModal.tsx         # Multi-branch onboarding modal
|   |   |-- AddCashierModal.tsx        # Staff & cashier invitation modal
|   |   |-- AlertsView.tsx             # Expiry action dashboard (30d, 14d, 7d, expired)
|   |   |-- AuditReportModal.tsx       # Print and CSV compliance audit generator
|   |   |-- BatchesView.tsx            # Inventory batch lot roster with filtering
|   |   |-- CameraBarcodeScannerModal.tsx # Live camera video barcode scanner
|   |   |-- CategoriesView.tsx         # Department categories and standard shelf lives
|   |   |-- ClearanceView.tsx          # Clearance markdown tag generator
|   |   |-- DashboardView.tsx          # Executive freshness metrics and risk analysis
|   |   |-- DisposalModal.tsx          # Formal write-off modal with financial loss
|   |   |-- DisposalView.tsx           # Disposal logs and regulatory food waste table
|   |   |-- FastScannerView.tsx        # POS checkout register & receipt return scanner
|   |   |-- ForgotPasswordPage.tsx     # Self-service credential recovery
|   |   |-- Header.tsx                 # Branch switcher, role selector, alert indicator
|   |   |-- LandingHomePage.tsx        # Public marketing & feature overview page
|   |   |-- LoginPage.tsx              # Multi-tenant user login
|   |   |-- ProductEntryModal.tsx      # Batch lot & product intake modal
|   |   |-- ReceiptBarcode.tsx         # Code128 SVG barcode rendering component
|   |   |-- ReceiptVerificationModal.tsx # Itemized receipt return & refund modal
|   |   |-- Sidebar.tsx                # Main application navigation
|   |   |-- SignUpPage.tsx             # Tenant registration & store signup
|   |   |-- StatusBadge.tsx            # Standardized freshness status badge
|   |   `-- TenantSettingsView.tsx     # Store thresholds and operational parameters
|   |-- data/
|   |   |-- mockData.ts                # Realistic multi-tenant mock grocery datasets
|   |   `-- mockReceipts.ts            # Pre-seeded verified receipts for return demos
|   |-- types/
|   |   `-- index.ts                   # Core domain TypeScript interfaces
|   |-- utils/
|   |   `-- currency.ts                # Ghana Cedi (GH₵) currency formatter
|   |-- App.tsx                        # Root state coordinator and navigation
|   |-- index.css                      # Tailwind CSS v4 styling
|   `-- main.tsx                       # React application entry point
|-- AGENTS.md                          # Guidelines and project blueprint for AI agents
|-- Agent.md                           # Technical handover document
|-- README.md                          # Human developer overview
`-- metadata.json                      # AI Studio application metadata
```

---

## 4. How to Test & Demo

1. **POS Barcode Scanning**:
   - Go to **Checkout Register**.
   - Type or click demo product barcodes (e.g. `890123400101` for milk, `890123400201` for chicken) to ring up items.
   - Complete checkout to print a verified receipt with an `INV-XXXXXX` barcode.
2. **Receipt Verification & Returns**:
   - In the same scanner, enter a receipt number (e.g., `INV-482910` or `INV-918234`, or click **Lookup Returns**).
   - The scanner authenticates the receipt and opens the **Receipt Verification** modal.
   - Select items to return, adjust quantities, choose a return reason, and click **Authorize Refund**.
3. **Freshness & Markdowns**:
   - Navigate to **Expiry Alerts** or **Clearance Items** to inspect 7-day critical lots and apply proactive discounts.
