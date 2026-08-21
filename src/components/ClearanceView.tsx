import React, { useState } from 'react';
import { Tenant, UserRole, Batch } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  TagIcon,
  SparklesIcon,
  ArrowTrendingDownIcon,
  PrinterIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ClearanceViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  batches: Batch[];
  onApplyDiscount: (batch: Batch, discountPct: number) => void;
}

export const ClearanceView: React.FC<ClearanceViewProps> = ({
  currentTenant,
  currentRole,
  batches,
  onApplyDiscount,
}) => {
  const [discountInput, setDiscountInput] = useState<{ [batchId: string]: number }>({});
  const [printSuccessMessage, setPrintSuccessMessage] = useState<string | null>(null);

  const tenantBatches = batches.filter(
    (b) => b.tenantId === currentTenant.id && b.status !== 'DISPOSED' && b.status !== 'EXPIRED'
  );

  // Candidates for clearance: items with <= 14 days or already discounted
  const clearanceCandidates = tenantBatches.filter(
    (b) => b.daysRemaining <= 14 || b.discountPercentage > 0
  );

  const handleCustomDiscount = (batch: Batch) => {
    const pct = discountInput[batch.id] || 30;
    onApplyDiscount(batch, pct);
  };

  const handleSimulatePrintTags = (batch: Batch) => {
    setPrintSuccessMessage(`Clearance price tags generated for ${batch.productName} (${batch.currentQuantity} tags sent to shelf label printer).`);
    setTimeout(() => setPrintSuccessMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Clearance & Markdown Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Proactively discount short-dated inventory to minimize food waste and recover margins
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            Tenant Default Markdown: {currentTenant.defaultClearanceDiscount}%
          </span>
        </div>
      </div>

      {/* Notice Banner */}
      {printSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-xs">
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{printSuccessMessage}</span>
        </div>
      )}

      {/* Candidate Cards Grid */}
      <div className="space-y-4">
        {clearanceCandidates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <TagIcon className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-gray-900">No Short-Dated Clearance Items</h3>
            <p className="text-xs text-gray-500 mt-1">
              All active inventory has ample shelf life. Short-dated batches (14 days or less) will automatically populate here.
            </p>
          </div>
        ) : (
          clearanceCandidates.map((batch) => {
            const hasDiscount = batch.discountPercentage > 0;
            const currentDiscount = hasDiscount ? batch.discountPercentage : currentTenant.defaultClearanceDiscount;

            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl p-5 border border-emerald-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left product details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={batch.status} daysRemaining={batch.daysRemaining} size="sm" />
                    <span className="text-xs text-gray-500 font-semibold">{batch.categoryName}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{batch.productName}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                    <span>SKU: <strong className="font-mono text-gray-900">{batch.sku}</strong></span>
                    <span>Batch: <strong className="font-mono text-gray-900">{batch.batchNumber}</strong></span>
                    <span>Stock: <strong className="text-gray-900">{batch.currentQuantity} {batch.unit}</strong></span>
                    <span>Shelf: <strong className="text-gray-900">{batch.locationAisle}</strong></span>
                  </div>
                </div>

                {/* Center price comparison */}
                <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-center min-w-[180px]">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Retail Price Plan
                  </span>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`text-sm ${hasDiscount ? 'line-through text-gray-400' : 'font-bold text-gray-900'}`}>
                      ${batch.unitPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-lg font-extrabold text-emerald-800">
                        ${batch.discountedPrice?.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {hasDiscount && (
                    <span className="text-[11px] font-bold text-emerald-700 block mt-0.5">
                      {batch.discountPercentage}% Clearance Applied
                    </span>
                  )}
                </div>

                {/* Right action controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto justify-between md:justify-end pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                  {currentRole === 'STORE_MANAGER' ? (
                    <>
                      <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                        <button
                          onClick={() => onApplyDiscount(batch, 20)}
                          className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer text-center"
                        >
                          20%
                        </button>
                        <button
                          onClick={() => onApplyDiscount(batch, 35)}
                          className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer text-center"
                        >
                          35%
                        </button>
                        <button
                          onClick={() => onApplyDiscount(batch, 50)}
                          className="flex-1 sm:flex-initial px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs text-center"
                        >
                          50%
                        </button>
                      </div>

                      <button
                        onClick={() => handleSimulatePrintTags(batch)}
                        className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <PrinterIcon className="w-3.5 h-3.5 text-gray-600" />
                        <span>Print Tags</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleSimulatePrintTags(batch)}
                      className="w-full sm:w-auto px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <PrinterIcon className="w-3.5 h-3.5 text-gray-600" />
                      <span>Print Shelf Tags</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
