import { Router, Request, Response } from 'express';
import { requireTenant, requireManager } from '../middleware/auth.js';

export const alertsRouter = Router();
alertsRouter.use(requireTenant);

alertsRouter.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    tenantId: req.tenantContext?.tenantId,
    alerts: [],
  });
});

alertsRouter.post('/:id/acknowledge', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actionTaken } = req.body;
  res.json({
    status: 'success',
    message: `Alert ${id} acknowledged with action: ${actionTaken || 'INSPECTED'}`,
  });
});

export const disposalRouter = Router();
disposalRouter.use(requireTenant);

disposalRouter.post('/', requireManager, (req: Request, res: Response) => {
  const payload = req.body;
  res.status(201).json({
    status: 'success',
    message: 'Disposal logged and stock adjusted.',
    data: { id: 'disp-log-new', ...payload, tenantId: req.tenantContext?.tenantId },
  });
});

export const tenantsRouter = Router();

tenantsRouter.get('/current', requireTenant, (req: Request, res: Response) => {
  res.json({
    status: 'success',
    tenant: {
      id: req.tenantContext?.tenantId,
      name: 'GreenMart Flagship Supermarket',
      warningThresholdDays: 30,
      criticalThresholdDays: 7,
    },
  });
});
