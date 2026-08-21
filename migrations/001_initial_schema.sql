-- ==============================================================================
-- Migration: 001_initial_schema.sql
-- Description: Core schema for ExpiryGuard Multi-Tenant Supermarket Expiry Tracking SaaS
-- Database Target: PostgreSQL 14+ / Supabase
-- ==============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Definitions
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TENANT_ADMIN', 'STORE_MANAGER', 'CASHIER', 'INVENTORY_CLERK');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'SUSPENDED', 'INVITED');
CREATE TYPE batch_status AS ENUM ('SAFE', 'WARNING', 'CRITICAL', 'EXPIRED', 'DISPOSED', 'DISCOUNTED');
CREATE TYPE alert_severity AS ENUM ('THIRTY_DAYS', 'FOURTEEN_DAYS', 'SEVEN_DAYS', 'EXPIRED');
CREATE TYPE disposal_reason AS ENUM ('EXPIRED', 'SPOILED', 'DAMAGED_PACKAGING', 'RECALLED', 'DONATED', 'OTHER');

-- -----------------------------------------------------------------------------
-- 1. TENANTS TABLE (Malls / Supermarket Chains / Independent Stores)
-- -----------------------------------------------------------------------------
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    branch_type VARCHAR(50) DEFAULT 'SUPERMARKET', -- 'SUPERMARKET', 'HYPERMARKET', 'MALL_MART', 'CONVENIENCE'
    address TEXT,
    city VARCHAR(100),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255) NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'PROFESSIONAL', -- 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'
    warning_threshold_days INT DEFAULT 30,
    critical_threshold_days INT DEFAULT 7,
    auto_discount_enabled BOOLEAN DEFAULT FALSE,
    default_clearance_discount INT DEFAULT 30, -- percentage
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. USERS TABLE (Store Managers, Cashiers, Clerks tied to a tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'CASHIER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    employee_code VARCHAR(50),
    avatar_url TEXT,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_user_email UNIQUE (tenant_id, email)
);

-- -----------------------------------------------------------------------------
-- 3. CATEGORIES TABLE (Department & Product Classifications per Tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    default_shelf_life_days INT DEFAULT 30,
    color_badge VARCHAR(30) DEFAULT 'emerald',
    icon_name VARCHAR(50) DEFAULT 'TagIcon',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_category_code UNIQUE (tenant_id, code)
);

-- -----------------------------------------------------------------------------
-- 4. PRODUCTS TABLE (Master catalog of items per Tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(150),
    sku VARCHAR(100) NOT NULL,
    barcode VARCHAR(100) NOT NULL,
    unit VARCHAR(50) DEFAULT 'PCS', -- 'PCS', 'KG', 'LITER', 'PACK', 'BOTTLE'
    min_stock_alert INT DEFAULT 5,
    standard_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    is_perishable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_product_sku UNIQUE (tenant_id, sku),
    CONSTRAINT uq_tenant_product_barcode UNIQUE (tenant_id, barcode)
);

-- -----------------------------------------------------------------------------
-- 5. PRODUCT BATCHES TABLE (Individual received lots with exact expiry dates)
-- -----------------------------------------------------------------------------
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    quantity_received INT NOT NULL CHECK (quantity_received >= 0),
    current_quantity INT NOT NULL CHECK (current_quantity >= 0),
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    status batch_status NOT NULL DEFAULT 'SAFE',
    discount_percentage INT DEFAULT 0 CHECK (discount_percentage BETWEEN 0 AND 100),
    discounted_price NUMERIC(10, 2),
    location_aisle VARCHAR(50),
    location_shelf VARCHAR(50),
    supplier_name VARCHAR(150),
    supplier_invoice_ref VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    last_audited_at TIMESTAMPTZ,
    last_audited_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_batch_number UNIQUE (tenant_id, product_id, batch_number)
);

-- -----------------------------------------------------------------------------
-- 6. DISPOSAL & WASTE LOGS (Records of discarded/expired products)
-- -----------------------------------------------------------------------------
CREATE TABLE disposal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_disposed INT NOT NULL CHECK (quantity_disposed > 0),
    unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_loss NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reason disposal_reason NOT NULL DEFAULT 'EXPIRED',
    disposed_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    manager_approval_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    witness_name VARCHAR(150),
    disposal_method VARCHAR(100) DEFAULT 'STANDARD_DISPOSAL',
    notes TEXT,
    disposed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. EXPIRY ALERTS TABLE (System generated notifications)
-- -----------------------------------------------------------------------------
CREATE TABLE expiry_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    severity alert_severity NOT NULL,
    days_until_expiry INT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    action_taken VARCHAR(100), -- 'DISCOUNTED', 'DISPOSED', 'REMOVED_FROM_SHELF', 'INSPECTED'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. AUDIT LOGS (Compliance and action tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- 'BATCH_CREATED', 'EXPIRY_CHECKED', 'BATCH_DISCOUNTED', 'BATCH_DISPOSED'
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- -----------------------------------------------------------------------------
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_categories_tenant ON categories(tenant_id);
CREATE INDEX idx_products_tenant_category ON products(tenant_id, category_id);
CREATE INDEX idx_products_tenant_barcode ON products(tenant_id, barcode);
CREATE INDEX idx_products_tenant_sku ON products(tenant_id, sku);

CREATE INDEX idx_batches_tenant_expiry ON batches(tenant_id, expiry_date);
CREATE INDEX idx_batches_tenant_status ON batches(tenant_id, status);
CREATE INDEX idx_batches_product_id ON batches(product_id);
CREATE INDEX idx_batches_expiry_status ON batches(expiry_date, status);

CREATE INDEX idx_disposal_tenant ON disposal_logs(tenant_id);
CREATE INDEX idx_disposal_date ON disposal_logs(disposed_at);
CREATE INDEX idx_alerts_tenant_unack ON expiry_alerts(tenant_id, is_acknowledged, severity);

-- -----------------------------------------------------------------------------
-- VIEWS FOR REAL-TIME DASHBOARDS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_expiry_status_summary AS
SELECT 
    b.tenant_id,
    COUNT(b.id) AS total_batches,
    SUM(b.current_quantity) AS total_stock_items,
    SUM(CASE WHEN b.expiry_date < CURRENT_DATE AND b.status != 'DISPOSED' THEN 1 ELSE 0 END) AS expired_batches_count,
    SUM(CASE WHEN b.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' AND b.status != 'DISPOSED' THEN 1 ELSE 0 END) AS critical_7_days_count,
    SUM(CASE WHEN b.expiry_date BETWEEN CURRENT_DATE + INTERVAL '8 days' AND CURRENT_DATE + INTERVAL '14 days' AND b.status != 'DISPOSED' THEN 1 ELSE 0 END) AS warning_14_days_count,
    SUM(CASE WHEN b.expiry_date BETWEEN CURRENT_DATE + INTERVAL '15 days' AND CURRENT_DATE + INTERVAL '30 days' AND b.status != 'DISPOSED' THEN 1 ELSE 0 END) AS warning_30_days_count,
    SUM(CASE WHEN b.expiry_date > CURRENT_DATE + INTERVAL '30 days' AND b.status != 'DISPOSED' THEN 1 ELSE 0 END) AS safe_batches_count,
    SUM(CASE WHEN b.expiry_date <= CURRENT_DATE + INTERVAL '7 days' AND b.status != 'DISPOSED' THEN (b.current_quantity * b.unit_cost) ELSE 0 END) AS estimated_cost_at_risk
FROM batches b
WHERE b.current_quantity > 0 AND b.status != 'DISPOSED'
GROUP BY b.tenant_id;
