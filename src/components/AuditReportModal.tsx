import React from 'react';
import { Tenant, Batch } from '../types/index.ts';
import { formatCedi } from '../utils/currency.ts';
import { printElementById } from '../utils/printReceipt.ts';
import { ExpiryGuardLogo } from './ExpiryGuardLogo.tsx';
import {
  XMarkIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: Tenant;
  batches: Batch[];
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  currentTenant,
  batches,
}) => {
  if (!isOpen) return null;

  const tenantBatches = batches.filter((b) => b.tenantId === currentTenant.id && b.status !== 'DISPOSED');
  const expiredBatches = tenantBatches.filter((b) => b.status === 'EXPIRED');
  const criticalBatches = tenantBatches.filter((b) => b.status === 'CRITICAL_7');
  const warningBatches = tenantBatches.filter((b) => b.status === 'WARNING_14' || b.status === 'WARNING_30');
  const healthyBatches = tenantBatches.filter((b) => b.status === 'SAFE');

  const totalLoss = expiredBatches.reduce((acc, b) => acc + b.currentQuantity * b.unitCost, 0);

  const handleDownloadCSV = () => {
    const headers = [
      'Product Name',
      'SKU',
      'Barcode',
      'Category',
      'Batch Number',
      'Date Received',
      'Expiry Date',
      'Days Remaining',
      'Current Quantity',
      'Unit',
      'Unit Cost',
      'Unit Price',
      'Status',
      'Aisle Location',
    ];

    const rows = tenantBatches.map((b) => [
      `"${b.productName}"`,
      `"${b.sku}"`,
      `"${b.barcode}"`,
      `"${b.categoryName}"`,
      `"${b.batchNumber}"`,
      b.dateReceived,
      b.expiryDate,
      b.daysRemaining,
      b.currentQuantity,
      `"${b.unit}"`,
      b.unitCost.toFixed(2),
      b.unitPrice.toFixed(2),
      `"${b.status}"`,
      `"${b.locationAisle}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `expiry_guard_audit_${currentTenant.code}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const success = printElementById('printable-audit-report', `Audit-Report-${currentTenant.code}`);
    if (!success) {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-emerald-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="bg-emerald-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white p-1 flex items-center justify-center border border-emerald-700/60 shadow-xs">
              <ExpiryGuardLogo className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Official Stock Freshness & Expiry Audit Report</h2>
              <p className="text-xs text-emerald-200">
                {currentTenant.name} ({currentTenant.code}) | Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content */}
        <div id="printable-audit-report" className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Executive KPI Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-500 font-semibold block uppercase">Total Monitored Lots</span>
              <span className="text-lg font-bold text-gray-900">{tenantBatches.length} Batches</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block uppercase">Expired / Pull From Shelf</span>
              <span className="text-lg font-bold text-red-700">{expiredBatches.length} Batches</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block uppercase">Critical (&lt;= 7 Days)</span>
              <span className="text-lg font-bold text-rose-700">{criticalBatches.length} Batches</span>
            </div>
            <div>
              <span className="text-gray-500 font-semibold block uppercase">Expired Cost Loss</span>
              <span className="text-lg font-bold text-red-700">{formatCedi(totalLoss)}</span>
            </div>
          </div>

          {/* Detailed Lot Table */}
          <div className="border border-gray-200 rounded-xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-100 font-bold text-gray-700 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Product</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Batch</th>
                  <th className="px-3 py-2.5">Expiry Date</th>
                  <th className="px-3 py-2.5">Stock</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tenantBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-gray-900">{b.productName}</td>
                    <td className="px-3 py-2 text-gray-600">{b.categoryName}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">{b.batchNumber}</td>
                    <td className="px-3 py-2 font-bold text-gray-900">{b.expiryDate}</td>
                    <td className="px-3 py-2 font-semibold">{b.currentQuantity} {b.unit}</td>
                    <td className="px-3 py-2 font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                          b.status === 'EXPIRED'
                            ? 'bg-red-100 text-red-900'
                            : b.status === 'CRITICAL_7'
                            ? 'bg-rose-100 text-rose-900'
                            : b.status === 'WARNING_14' || b.status === 'WARNING_30'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{b.locationAisle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-5 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <PrinterIcon className="w-4 h-4 text-gray-600" />
            <span>Print Report</span>
          </button>

          <div className="flex items-center gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer text-center"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex-1 sm:flex-initial px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <DocumentArrowDownIcon className="w-4 h-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
