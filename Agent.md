# ExpiryGuard: Technical Handover Guide

This document is the technical handover guide for developers and AI agents working on the ExpiryGuard project.

---

## 1. Executive Summary

ExpiryGuard is an enterprise multi-tenant SaaS application built for supermarkets, hypermarkets, and shopping mall food retail anchors. It provides:
1. **Automated Expiry Freshness Monitoring**: Lot tracking across 5 risk tiers (`SAFE_30`, `WARNING_30`, `ALERT_14`, `CRITICAL_7`, `EXPIRED`).
2. **Point of Sale (POS) & Dual Barcode Scanner**: Product scanning with markdown price recognition, expired item blocking, and dynamic cart calculation.
3. **Receipt Barcode Returns & Verification Engine**: Instant receipt lookup (`INV-XXXXXX`), itemized return quantity selection, reason code logging, and refund calculation.
4. **Ghana Cedi (`GH₵`) Currency Localization**: Standardized across the entire platform via `/src/utils/currency.ts`.
5. **Clearance Discounts & Waste Write-Offs**: Proactive markdowns (-20%, -35%, -50%) and compliance disposal logs.

---

## 2. Technical Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion.
- **Icon Library**: Exclusively `@heroicons/react` (`/24/outline`, `/20/solid`).
- **Backend API**: Node.js, Express, bundled via esbuild (`/dist/server.cjs`).
- **Database Architecture**: PostgreSQL with ready-to-use migrations in `/migrations/` and Row Level Security (RLS) policies.

---

## 3. Key Workflows & Component Reference

- **Checkout & Barcode Scanning**:
  - Main Component: `src/components/FastScannerView.tsx`
  - Dual Scan Logic:
    - If scanned code matches an `INV-` prefix or a known receipt number, it opens `src/components/ReceiptVerificationModal.tsx`.
    - If scanned code matches an inventory SKU/barcode, it checks expiry status and adds the item to the active POS cart.
- **Returns & Refund API**:
  - Endpoint: `POST /api/sales/returns`
  - Handler: `server/routes/sales.ts`
- **Currency Standard**:
  - Always use `formatCedi(value)` from `src/utils/currency.ts`.

---

## 4. Testing & Verification

- Dev Server: `npm run dev` (starts Express + Vite on port 3000).
- Production Build: `npm run build`.
