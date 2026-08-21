# ExpiryGuard: AI Agent Handover & Technical Blueprint

This document is the official technical handover guide for any AI agent or developer continuing development on the ExpiryGuard SaaS project.

---

## 1. Project Context & Objectives

Supermarkets and mall grocery anchors handle thousands of perishable inventory items across multiple departments (Dairy, Meat, Bakery, Deli, Produce, Seafood, Chilled Drinks). Manual tracking often fails, leading to:
- Accidental sale of expired items, triggering regulatory penalties and health hazards.
- Unnecessary food waste caused by failure to apply proactive clearance discounts before expiry.
- Revenue loss and lack of centralized audit documentation.

ExpiryGuard is an enterprise multi-tenant SaaS application that isolates each supermarket branch's inventory, automates expiry tracking with color-coded risk tiers (30 days, 14 days, 7 days, and expired), provides cashiers with point-of-sale barcode safety verification, and enables managers to execute markdowns and disposal write-offs.

---

## 2. UI/UX Design System & Color Palette

### Visual Guidelines & Strict Constraints
- **Primary Color Palette**: Professional Green & White.
  - Deep Forest & Emerald Green for primary brand, active navigation, and primary CTAs (`emerald-700`, `emerald-800`, `emerald-900`, `emerald-950`).
  - Crisp white background surfaces (`bg-white`) paired with light green container accents (`bg-emerald-50`, `border-emerald-100`, `border-emerald-200`).
  - High-contrast dark neutral text (`text-gray-900`, `text-gray-800`) to guarantee WCAG AA readability.
- **Status Color Hierarchy**:
  - **Safe Stock (>30 Days)**: Emerald Green (`bg-emerald-50 text-emerald-800 border-emerald-200`).
  - **30-Day Warning**: Lime/Yellow-Green (`bg-lime-50 text-lime-900 border-lime-300`).
  - **14-Day Warning**: Amber (`bg-amber-50 text-amber-900 border-amber-300`).
  - **7-Day Critical**: Rose/Red Alert (`bg-rose-50 text-rose-900 border-rose-300 animate-pulse`).
  - **Expired**: Crimson Flag (`bg-red-100 text-red-950 border-red-400 font-bold`).
  - **Disposed / Written Off**: Slate (`bg-slate-100 text-slate-700 border-slate-300`).
- **Iconography Rule**: Exclusively `@heroicons/react` (`/24/outline`, `/20/solid`). Lucide icons are strictly banned.
- **Emoji Rule**: Strictly zero emojis in user-facing labels, data strings, code identifiers, or documentation.

---

## 3. Database Schema Design (PostgreSQL / Supabase)

The migration scripts are located in `/migrations/`:
- `001_initial_schema.sql`: Core schema, constraints, enums, indexes, and views.
- `002_rls_policies.sql`: Row Level Security (RLS) policies enforcing multi-tenant isolation.

### Entity Relationship Model

1. **tenants**:
   - `id` (UUID PK)
   - `name` (VARCHAR)
   - `slug` (VARCHAR UNIQUE)
   - `code` (VARCHAR UNIQUE)
   - `branch_type` (VARCHAR)
   - `address` (TEXT), `city` (VARCHAR)
   - `contact_email`, `contact_phone`
   - `warning_threshold_days` (DEFAULT 30)
   - `critical_threshold_days` (DEFAULT 7)
   - `default_clearance_discount` (DEFAULT 35%)

2. **users**:
   - `id` (UUID PK)
   - `tenant_id` (UUID FK -> tenants.id ON DELETE CASCADE)
   - `email` (VARCHAR), `full_name` (VARCHAR)
   - `role` (ENUM: `SUPER_ADMIN`, `TENANT_ADMIN`, `STORE_MANAGER`, `CASHIER`, `INVENTORY_CLERK`)
   - `status` (ENUM: `ACTIVE`, `SUSPENDED`, `INVITED`)
   - `employee_code` (VARCHAR)

3. **categories**:
   - `id` (UUID PK)
   - `tenant_id` (UUID FK -> tenants.id ON DELETE CASCADE)
   - `name` (VARCHAR), `code` (VARCHAR)
   - `default_shelf_life_days` (INT)
   - `color_badge` (VARCHAR)

4. **products**:
   - `id` (UUID PK)
   - `tenant_id` (UUID FK -> tenants.id ON DELETE CASCADE)
   - `category_id` (UUID FK -> categories.id)
   - `name`, `brand`, `sku`, `barcode` (Unique per tenant)
   - `unit`, `standard_price`, `cost_price`
   - `is_perishable` (BOOLEAN)

5. **batches**:
   - `id` (UUID PK)
   - `tenant_id` (UUID FK -> tenants.id ON DELETE CASCADE)
   - `product_id` (UUID FK -> products.id ON DELETE CASCADE)
   - `batch_number` (VARCHAR)
   - `quantity_received`, `current_quantity`
   - `unit_cost`, `unit_price`
   - `date_received` (DATE), `expiry_date` (DATE)
   - `status` (ENUM: `SAFE`, `WARNING`, `CRITICAL`, `EXPIRED`, `DISPOSED`, `DISCOUNTED`)
   - `discount_percentage` (INT), `discounted_price` (NUMERIC)
   - `location_aisle`, `location_shelf`, `supplier_name`

6. **disposal_logs**:
   - `id` (UUID PK)
   - `tenant_id` (UUID FK -> tenants.id ON DELETE CASCADE)
   - `batch_id`, `product_id`
   - `quantity_disposed`, `unit_cost`, `total_loss`
   - `reason` (ENUM: `EXPIRED`, `SPOILED`, `DAMAGED_PACKAGING`, `RECALLED`, `DONATED`, `OTHER`)
   - `disposed_by` (UUID FK -> users.id)
   - `witness_name` (VARCHAR)
   - `disposed_at` (TIMESTAMPTZ)

7. **expiry_alerts**:
   - `id` (UUID PK)
   - `tenant_id` (UUID FK)
   - `batch_id`, `product_id`
   - `severity` (ENUM: `THIRTY_DAYS`, `FOURTEEN_DAYS`, `SEVEN_DAYS`, `EXPIRED`)
   - `is_acknowledged` (BOOLEAN)

---

## 4. Current Phase: Mock State Verification

In accordance with project specifications, because the Supabase production database is not yet linked, the application runs entirely in client-side Mock State.
- State is managed reactively in `/src/App.tsx`.
- Realistic initial data resides in `/src/data/mockData.ts`.
- Multi-tenancy is demonstrated across 3 pre-seeded supermarket accounts:
  1. `GreenMart Flagship Supermarket` (`GM-FLG-01`)
  2. `FreshDirect Hypermarket` (`FD-HYP-04`)
  3. `Oasis Gourmet Market` (`OGM-WST-09`)
- Roles can be toggled in real time:
  - `STORE_MANAGER`: Unlocks batch creation, clearance discounting, disposal logging, category creation, and store settings.
  - `CASHIER`: Tailored to rapid POS barcode verification, shelf inspections, and alert monitoring.

---

## 5. Exact Next Steps for Supabase Integration

When the user provisions the Supabase database instance, execute the following step-by-step procedure:

### Step 1: Execute SQL Migrations
1. Open the Supabase SQL Editor.
2. Run `/migrations/001_initial_schema.sql` to generate all tables, enums, indexes, and views.
3. Run `/migrations/002_rls_policies.sql` to activate Row Level Security.

### Step 2: Configure Environment Variables
In `.env` and `.env.example`, declare:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Step 3: Connect Backend & Client SDK
1. Install `@supabase/supabase-js`:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Update `/server/db/supabaseClient.ts` to instantiate `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)`.
3. In Express routes (`/server/routes/batches.ts`, `/server/routes/products.ts`, `/server/routes/alerts.ts`), replace mock responses with Supabase queries:
   ```typescript
   const { data, error } = await supabase
     .from('batches')
     .select('*, product:products(*), category:categories(*)')
     .eq('tenant_id', req.tenantContext.tenantId);
   ```

### Step 4: Link Frontend State to API Routes
1. Create an API service module `/src/services/api.ts` making standard `fetch('/api/...')` calls with header `x-tenant-id`.
2. Update `/src/App.tsx` to populate state from the API instead of `INITIAL_TENANTS` and `INITIAL_PRODUCTS`.
3. Verify live CRUD: creating a batch, applying a discount, or logging disposal will persist in PostgreSQL.
