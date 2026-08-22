import React, { useState } from 'react';
import { Tenant, UserRole, Batch } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  BellAlertIcon,
  TagIcon,
  TrashIcon,
  CheckBadgeIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface AlertsViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  batches: Batch[];
  onApplyDiscount: (batch: Batch, discountPct: number) => void;
  onOpenDisposalModal: (batch: Batch) => void;
  onAuditBatch: (batch: Batch) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  currentTenant,
  currentRole,
  batches,
  onApplyDiscount,
  onOpenDisposalModal,
  onAuditBatch,
}) => {
  const [activeTier, setActiveTier] = useState<'ALL' | 'EXPIRED' | 'CRITICAL_7' | 'WARNING_14' | 'WARNING_30'>('ALL');

  const tenantBatches = (batches || []).filter((b) => b && b.tenantId === currentTenant?.id && b.status !== 'DISPOSED');

  const alertBatches = tenantBatches.filter((b) => b.status !== 'SAFE');

  const filteredAlerts = alertBatches.filter((b) => {
    if (activeTier === 'ALL') return true;
    return b.status === activeTier;
  });

  const expiredCount = alertBatches.filter((b) => b.status === 'EXPIRED').length;
  const criticalCount = alertBatches.filter((b) => b.status === 'CRITICAL_7').length;
  const warning14Count = alertBatches.filter((b) => b.status === 'WARNING_14').length;
  const warning30Count = alertBatches.filter((b) => b.status === 'WARNING_30').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Expiry Alert Action Center
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automated alerts requiring shelf intervention, markdowns, or regulatory write-offs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            Total Active Alerts: <strong className="text-gray-900">{alertBatches.length}</strong>
          </span>
        </div>
      </div>

      {/* Tier Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        <button
          onClick={() => setActiveTier('ALL')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTier === 'ALL'
              ? 'bg-emerald-900 text-white border-emerald-900 shadow-xs'
              : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 uppercase tracking-wider">All Alerts</div>
          <div className="text-xl sm:text-2xl font-bold mt-0.5">{alertBatches.length}</div>
        </button>

        <button
          onClick={() => setActiveTier('EXPIRED')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTier === 'EXPIRED'
              ? 'bg-red-700 text-white border-red-700 shadow-xs'
              : 'bg-red-50/60 text-red-950 border-red-200 hover:border-red-400'
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-red-800">Expired</div>
          <div className="text-xl sm:text-2xl font-bold mt-0.5 text-red-950">{expiredCount}</div>
        </button>

        <button
          onClick={() => setActiveTier('CRITICAL_7')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTier === 'CRITICAL_7'
              ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
              : 'bg-rose-50/60 text-rose-950 border-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-rose-800">Critical (7d)</div>
          <div className="text-xl sm:text-2xl font-bold mt-0.5 text-rose-950">{criticalCount}</div>
        </button>

        <button
          onClick={() => setActiveTier('WARNING_14')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            activeTier === 'WARNING_14'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-amber-50/60 text-amber-950 border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-amber-800">14-Day Alert</div>
          <div className="text-xl sm:text-2xl font-bold mt-0.5 text-amber-950">{warning14Count}</div>
        </button>

        <button
          onClick={() => setActiveTier('WARNING_30')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            activeTier === 'WARNING_30'
              ? 'bg-lime-700 text-white border-lime-700 shadow-xs'
              : 'bg-lime-50/60 text-lime-950 border-lime-200 hover:border-lime-400'
          }`}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-lime-800">30-Day Alert</div>
          <div className="text-xl sm:text-2xl font-bold mt-0.5 text-lime-950">{warning30Count}</div>
        </button>
      </div>

      {/* Alert Items List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <CheckBadgeIcon className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">No Active Alerts in This Category</h3>
            <p className="text-xs text-gray-500 mt-1">All batches in this range are within regular shelf expectations.</p>
          </div>
        ) : (
          filteredAlerts.map((batch) => {
            const isExpired = batch.status === 'EXPIRED';
            const isCritical = batch.status === 'CRITICAL_7';

            return (
              <div
                key={batch.id}
                className={`bg-white rounded-xl p-4 sm:p-5 border shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all ${
                  isExpired
                    ? 'border-red-300 bg-red-50/20'
                    : isCritical
                    ? 'border-rose-300 bg-rose-50/15'
                    : 'border-gray-200'
                }`}
              >
                {/* Product & Batch Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={batch.status} daysRemaining={batch.daysRemaining} size="sm" />
                    <span className="text-xs font-semibold text-gray-500">{batch.categoryName}</span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900">{batch.productName}</h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                    <span>
                      Batch: <strong className="font-mono text-gray-900">{batch.batchNumber}</strong>
                    </span>
                    <span>
                      SKU: <strong className="font-mono text-gray-900">{batch.sku}</strong>
                    </span>
                    <span>
                      Location: <strong className="text-gray-900">{batch.locationAisle} ({batch.locationShelf})</strong>
                    </span>
                    <span>
                      Stock: <strong className="text-gray-900">{batch.currentQuantity} {batch.unit}</strong>
                    </span>
                  </div>
                </div>

                {/* Date & Financial Info & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 justify-between lg:justify-end">
                  <div className="text-left sm:text-right">
                    <div className="text-[11px] text-gray-500">Expiry Date</div>
                    <div className="text-sm font-bold text-gray-900">{batch.expiryDate}</div>
                    <div className="text-[11px] font-medium text-gray-500">
                      Value at Risk: ${(batch.currentQuantity * batch.unitCost).toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isExpired ? (
                      <button
                        onClick={() => onOpenDisposalModal(batch)}
                        className="w-full sm:w-auto px-3 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                        <span>Dispose & Log Waste</span>
                      </button>
                    ) : (
                      <>
                        {currentRole === 'STORE_MANAGER' && (
                          <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              onClick={() => onApplyDiscount(batch, 20)}
                              className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              -20%
                            </button>
                            <button
                              onClick={() => onApplyDiscount(batch, 35)}
                              className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              -35%
                            </button>
                            <button
                              onClick={() => onApplyDiscount(batch, 50)}
                              className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                            >
                              -50%
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => onAuditBatch(batch)}
                          className="w-full sm:w-auto px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
                        >
                          Mark Inspected
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
