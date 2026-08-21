import { Router, Request, Response } from 'express';
import { requireTenant, requireManager } from '../middleware/auth.js';

export const productsRouter = Router();

productsRouter.use(requireTenant);

// List products for tenant
productsRouter.get('/', (req: Request, res: Response) => {
  const tenantId = req.tenantContext?.tenantId;
  res.json({
    status: 'success',
    tenantId,
    message: 'Products list endpoint (ready for Supabase integration)',
    data: [],
  });
});

// Create new master product
productsRouter.post('/', requireManager, (req: Request, res: Response) => {
  const tenantId = req.tenantContext?.tenantId;
  const productData = req.body;
  res.status(201).json({
    status: 'success',
    tenantId,
    message: 'Product created successfully',
    data: { id: 'prod-new', ...productData, tenantId },
  });
});
