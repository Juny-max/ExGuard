-- ==============================================================================
-- Migration: 002_rls_policies.sql
-- Description: Supabase Row Level Security (RLS) policies for multi-tenant isolation
-- ==============================================================================

-- Enable Row Level Security on all tenant-isolated tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expiry_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's tenant_id from auth.jwt()
CREATE OR REPLACE FUNCTION current_user_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- -----------------------------------------------------------------------------
-- TENANT TABLE POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Tenants are visible to their own members" 
ON tenants FOR SELECT 
USING (id = current_user_tenant_id());

CREATE POLICY "Super admins can manage tenants" 
ON tenants FOR ALL 
USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- -----------------------------------------------------------------------------
-- USERS TABLE POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view peers in the same tenant" 
ON users FOR SELECT 
USING (tenant_id = current_user_tenant_id());

CREATE POLICY "Managers and Admins can update tenant users" 
ON users FOR ALL 
USING (
    tenant_id = current_user_tenant_id() 
    AND (auth.jwt() ->> 'role' IN ('TENANT_ADMIN', 'STORE_MANAGER'))
);

-- -----------------------------------------------------------------------------
-- CATEGORIES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Tenant members can view categories" 
ON categories FOR SELECT 
USING (tenant_id = current_user_tenant_id());

CREATE POLICY "Managers can manage categories" 
ON categories FOR ALL 
USING (
    tenant_id = current_user_tenant_id() 
    AND (auth.jwt() ->> 'role' IN ('TENANT_ADMIN', 'STORE_MANAGER'))
);

-- -----------------------------------------------------------------------------
-- PRODUCTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Tenant members can view products" 
ON products FOR SELECT 
USING (tenant_id = current_user_tenant_id());

CREATE POLICY "Authorized staff can insert and update products" 
ON products FOR ALL 
USING (
    tenant_id = current_user_tenant_id() 
    AND (auth.jwt() ->> 'role' IN ('TENANT_ADMIN', 'STORE_MANAGER', 'INVENTORY_CLERK'))
);

-- -----------------------------------------------------------------------------
-- BATCHES POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Tenant staff can view batches" 
ON batches FOR SELECT 
USING (tenant_id = current_user_tenant_id());

CREATE POLICY "Staff can insert batches" 
ON batches FOR INSERT 
WITH CHECK (tenant_id = current_user_tenant_id());

CREATE POLICY "Staff can update batches" 
ON batches FOR UPDATE 
USING (tenant_id = current_user_tenant_id());

-- -----------------------------------------------------------------------------
-- DISPOSAL LOGS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Tenant staff can view disposal logs" 
ON disposal_logs FOR SELECT 
USING (tenant_id = current_user_tenant_id());

CREATE POLICY "Managers can log disposal" 
ON disposal_logs FOR INSERT 
WITH CHECK (
    tenant_id = current_user_tenant_id()
    AND (auth.jwt() ->> 'role' IN ('TENANT_ADMIN', 'STORE_MANAGER'))
);

-- -----------------------------------------------------------------------------
-- ALERTS POLICIES
-- -----------------------------------------------------------------------------
CREATE POLICY "Tenant staff can view and acknowledge alerts" 
ON expiry_alerts FOR ALL 
USING (tenant_id = current_user_tenant_id());
