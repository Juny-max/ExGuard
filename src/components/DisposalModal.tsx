import React, { useState } from 'react';
import { Tenant, UserRole, Batch, DisposalLog, DisposalReason } from '../types/index.ts';
import { formatCedi } from '../utils/currency.ts';
import {
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

interface DisposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: Batch | null;
  currentTenant: Tenant;
  currentRole: UserRole;
  onConfirmDisposal: (log: DisposalLog) => void;
}

export const DisposalModal: React.FC<DisposalModalProps> = ({
  isOpen,
  onClose,
  batch,
  currentTenant,
  currentRole,
  onConfirmDisposal,
}) => {
  if (!isOpen || !batch) return null;

  const [quantity, setQuantity] = useState<number>(batch.currentQuantity);
  const [reason, setReason] = useState<DisposalReason>(batch.status === 'EXPIRED' ? 'EXPIRED' : 'SPOILED');
  const [witnessName, setWitnessName] = useState('David Vance (Floor Lead)');
  const [notes, setNotes] = useState(
    batch.status === 'EXPIRED'
      ? 'Product passed official expiration date. Removed from supermarket shelf for organic waste composting.'
      : 'Visual inspection revealed package damage / spoilage. Removed from stock.'
  );

  const totalLoss = Number(quantity) * batch.unitCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;

    const log: DisposalLog = {
      id: `disp-${Date.now()}`,
      tenantId: currentTenant.id,
      batchId: batch.id,
      productName: batch.productName,
      batchNumber: batch.batchNumber,
      quantityDisposed: Number(quantity),
      unit: batch.unit,
      unitCost: batch.unitCost,
      totalLoss,
      reason,
      disposedBy: currentRole === 'STORE_MANAGER' ? 'Sarah Jenkins (Store Manager)' : 'Staff Floor Member',
      witnessName,
      disposedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes,
    };

    onConfirmDisposal(log);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-red-200 flex flex-col overflow-hidden transform transition-all my-auto">
        {/* Header */}
        <div className="bg-red-800 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <TrashIcon className="w-5 h-5 text-red-200" />
            <div>
              <h2 className="text-sm sm:text-base font-bold">Write-Off & Disposal Authorization</h2>
              <p className="text-xs text-red-200">Regulatory compliance log for discarded goods</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-red-200 hover:text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Target Product Summary Card */}
          <div className="bg-red-50/60 p-3.5 rounded-xl border border-red-200 text-xs text-red-950 space-y-1">
            <div className="font-bold text-sm text-red-900">{batch.productName}</div>
            <div className="flex flex-wrap gap-2 text-[11px] text-red-800">
              <span>SKU: {batch.sku}</span>
              <span>Batch: {batch.batchNumber}</span>
              <span>Expiry: {batch.expiryDate}</span>
              <span>Current Stock: {batch.currentQuantity} {batch.unit}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Quantity to Discard *
              </label>
              <input
                type="number"
                min="1"
                max={batch.currentQuantity}
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Disposal Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as DisposalReason)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-hidden bg-white"
              >
                <option value="EXPIRED">Expired Past Expiry Date</option>
                <option value="SPOILED">Spoilage / Visual Mold</option>
                <option value="DAMAGED_PACKAGING">Damaged Packaging / Broken Seal</option>
                <option value="RECALLED">Manufacturer Recall</option>
                <option value="DONATED">Donated to Food Bank</option>
                <option value="OTHER">Other Compliance Reason</option>
              </select>
            </div>
          </div>

          {/* Financial Loss Calculation */}
          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
            <span className="text-gray-600 font-medium">Estimated Financial Cost Loss:</span>
            <span className="text-sm font-bold text-red-700">
              {formatCedi(totalLoss)} ({quantity} x {formatCedi(batch.unitCost)} cost)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Witness / Verifying Staff Member
            </label>
            <input
              type="text"
              value={witnessName}
              onChange={(e) => setWitnessName(e.target.value)}
              placeholder="e.g. David Vance (Floor Lead)"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Compliance Notes & Disposal Bin Ref
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Confirm Disposal & Deduct Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
