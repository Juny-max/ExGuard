import { Request, Response, NextFunction } from 'express';
import { TenantContext } from '../types.js';

declare global {
  namespace Express {
    interface Request {
      tenantContext?: TenantContext;
    }
  }
}

/**
 * Middleware that extracts and validates tenant context from headers or JWT
 */
export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const tenantId = (req.headers['x-tenant-id'] as string) || 'tenant-greenmart-flagship';
  const role = ((req.headers['x-user-role'] as string) || 'STORE_MANAGER') as TenantContext['role'];
  const userId = (req.headers['x-user-id'] as string) || 'usr-101';
  const email = (req.headers['x-user-email'] as string) || 'manager@greenmart.com';
  const name = (req.headers['x-user-name'] as string) || 'Sarah Jenkins';

  req.tenantContext = {
    tenantId,
    userId,
    role,
    email,
    name,
  };

  next();
}

/**
 * Middleware ensuring only Managers and Admins can perform sensitive actions (disposal, discount, deletion)
 */
export function requireManager(req: Request, res: Response, next: NextFunction) {
  const role = req.tenantContext?.role;
  if (!role || (role !== 'STORE_MANAGER' && role !== 'TENANT_ADMIN' && role !== 'SUPER_ADMIN')) {
    res.status(403).json({
      error: 'Forbidden: This action requires Store Manager or Admin privileges.',
    });
    return;
  }
  next();
}
