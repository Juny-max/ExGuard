# ExpiryGuard: Multi-Tenant Supermarket & Mall Expiry Tracking SaaS

ExpiryGuard is a multi-tenant SaaS application designed to solve the critical problem of supermarket and mall food waste and accidental sale of expired goods. It provides an automated inventory freshness monitoring system that tracks perishable goods by received lot, calculates shelf-life timelines, alerts staff to items approaching expiration (30, 14, and 7-day tiers), and enforces immediate removal of expired stock.

---

## 1. Key Features

- **Multi-Tenant Workspace Architecture**:
  - Independent store and mall inventory isolation.
  - Dedicated tenant settings, custom alert thresholds, and department shelf-life policies.
  - Instant tenant switching for chain managers and franchise operators.

- **Perishable Product & Batch Lot Tracking**:
  - Full product catalog management (SKU, EAN/UPC barcode, brand, category, unit pricing).
  - Lot-based tracking (batch numbers, receive dates, exact expiration dates, aisle and shelf locations).
  - Real-time days-remaining computation and automated status assignment.

- **Visual Expiry Status Hierarchy**:
  - **Safe Stock**: Greater than 30 days of shelf life.
  - **30-Day Warning (Warning Tier 1)**: Early visibility for steady rotation.
  - **14-Day Alert (Warning Tier 2)**: Candidate for promotional placement.
  - **7-Day Critical**: High urgency; triggers clearance markdown recommendations.
  - **Expired**: Prohibited from sale; immediate removal and write-off.

- **Role-Based Access Control (RBAC)**:
  - **Store Manager Mode**: Full inventory management, dynamic clearance discount engine (-20%, -35%, -50%), write-off authorization, and official audit export.
  - **Cashier & Floor Staff Mode**: Point-of-sale rapid barcode verification, shelf inspection logging, and instant product safety checks.

- **Cashier POS & Shelf Barcode Verification Simulator**:
  - Rapid scanner tool to test barcodes at checkout or shelf auditing.
  - Instant color-coded verdict: Safe to Sell, Critical Expiry, or Sale Prohibited (Expired).

- **Clearance & Markdown Engine**:
  - Proactive discounting for short-dated items to minimize write-offs and recover margins.
  - Shelf clearance price tag generation simulator.

- **Waste & Disposal Compliance Register**:
  - Formal regulatory write-off logging with reason tracking (Expired, Spoiled, Packaging Damaged, Donated, Recalled).
  - Financial loss tracking and witness validation.

- **Export & Audit Reporting**:
  - Formatted print-ready compliance audit reports for store management and food safety inspectors.
  - One-click CSV export of full lot rosters.

---

## 2. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion.
- **Iconography**: Heroicons exclusively (no Lucide icons, no emojis).
- **Backend Architecture**: Node.js, Express.
- **Database Architecture**: PostgreSQL (prepared for Supabase hosting with full migrations and Row Level Security).
- **Design Philosophy**: High-contrast, clean green and white theme engineered for enterprise retail clarity.

---

## 3. Directory Structure

```text
/
|-- migrations/
|   |-- 001_initial_schema.sql      # Core PostgreSQL tables, enums, indexes, views
|   `-- 002_rls_policies.sql        # Supabase Row Level Security (RLS) policies
|-- server/
|   |-- db/
|   |   `-- supabaseClient.ts       # Supabase client connector template
|   |-- middleware/
|   |   `-- auth.ts                 # Tenant extraction and RBAC middleware
|   |-- routes/
|   |   |-- alerts.ts               # Expiry alert & disposal endpoints
|   |   |-- batches.ts              # Lot query, discount, and update endpoints
|   |   `-- products.ts             # Master product catalog endpoints
|   |-- app.ts                      # Express application composition
|   `-- types.ts                    # Backend data contracts
|-- src/
|   |-- components/
|   |   |-- AlertsView.tsx          # Expiry action center (30d, 14d, 7d, expired)
|   |   |-- AuditReportModal.tsx    # Print and CSV audit report generator
|   |   |-- BatchesView.tsx         # Full lot inventory list with search & filters
|   |   |-- CategoriesView.tsx      # Department management and standard shelf lives
|   |   |-- ClearanceView.tsx       # Markdowns and clearance pricing engine
|   |   |-- DashboardView.tsx       # Executive metrics, loss-at-risk, urgency queue
|   |   |-- DisposalModal.tsx       # Formal write-off modal with financial calculation
|   |   |-- DisposalView.tsx        # Disposal logs and food waste audit table
|   |   |-- FastScannerView.tsx     # Cashier POS barcode verification simulator
|   |   |-- Header.tsx              # Tenant switcher, role toggle, alert badge
|   |   |-- ProductEntryModal.tsx   # Lot & product creation modal
|   |   |-- Sidebar.tsx             # Main navigation
|   |   |-- StatusBadge.tsx         # Standardized status badge component
|   |   `-- TenantSettingsView.tsx  # Store configuration and threshold rules
|   |-- data/
|   |   `-- mockData.ts             # Realistic multi-tenant mock datasets
|   |-- types/
|   |   `-- index.ts                # TypeScript domain models
|   |-- App.tsx                     # Core application state and router
|   |-- index.css                   # Tailwind CSS styling
|   `-- main.tsx                    # React DOM root entry
|-- Agent.md                        # Handover guide for subsequent AI agents
|-- README.md                       # Project documentation
`-- metadata.json                   # Application metadata
```

---

## 4. Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   ```text
   http://localhost:3000
   ```

### Building for Production
```bash
npm run build
```

---

## 5. Current State: Mock State Mode

Because the target Supabase instance is not yet provisioned, the frontend runs autonomously using an interactive, in-memory state engine preloaded with 3 realistic supermarket tenants (`GreenMart Flagship Supermarket`, `FreshDirect Hypermarket`, and `Oasis Gourmet Market`). All actions (logging batches, applying discounts, scanning barcodes, authorizing write-offs, and exporting reports) function immediately in the browser.
