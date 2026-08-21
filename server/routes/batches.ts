import { Router, Request, Response } from 'express';
import { requireTenant, requireManager } from '../middleware/auth.js';

export const batchesRouter = Router();

batchesRouter.use(requireTenant);

// Query batches with filtering (expiry tier, category, status)
batchesRouter.get('/', (req: Request, res: Response) => {
  const { status, category, urgency } = req.query;
  const tenantId = req.tenantContext?.tenantId;

  res.json({
    status: 'success',
    tenantId,
    filters: { status, category, urgency },
    message: 'Batches list endpoint',
    data: [],
  });
});

// Log received batch
batchesRouter.post('/', (req: Request, res: Response) => {
  const tenantId = req.tenantContext?.tenantId;
  const batchData = req.body;

  res.status(201).json({
    status: 'success',
    tenantId,
    message: 'Batch recorded successfully',
    data: { id: 'batch-new', ...batchData, tenantId },
  });
});

// Update batch status or apply clearance discount
batchesRouter.patch('/:id/discount', requireManager, (req: Request, res: Response) => {
  const { id } = req.params;
  const { discountPercentage } = req.body;

  res.json({
    status: 'success',
    message: `Discount of ${discountPercentage}% applied to batch ${id}`,
  });
});
