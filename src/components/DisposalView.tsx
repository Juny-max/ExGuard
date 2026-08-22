import React, { useState } from 'react';
import { Tenant, UserRole, DisposalLog } from '../types/index.ts';
import { formatCedi } from '../utils/currency.ts';
import {
  TrashIcon,
  CurrencyDollarIcon,
  ArchiveBoxXMarkIcon,
  DocumentArrowDownIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';

interface DisposalViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  disposalLogs: DisposalLog[];
}

export const DisposalView: React.FC<DisposalViewProps> = ({
  currentTenant,
  currentRole,
  disposalLogs,
}) => {
  const [reasonFilter, setReasonFilter] = useState<string>('ALL');

  const tenantLogs = (disposalLogs || []).filter((log) => log && log.tenantId === currentTenant?.id);

  const filteredLogs = tenantLogs.filter((log) => {
    if (reasonFilter === 'ALL') return true;
    return log.reason === reasonFilter;
  });

  const totalLossAmount = tenantLogs.reduce((acc, l) => acc + l.totalLoss, 0);
  const totalUnitsDisposed = tenantLogs.reduce((acc, l) => acc + l.quantityDisposed, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Waste & Disposal Audit Register
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Documented write-offs, health compliance records, and food waste accounting for {currentTenant.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-red-50 text-red-950 px-3.5 py-1.5 rounded-lg border border-red-200 text-xs font-bold">
            Total Period Write-Off: {formatCedi(totalLossAmount)}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Disposed Units
          </span>
          <div className="mt-2 text-3xl font-extrabold text-gray-900">
            {totalUnitsDisposed}
          </div>
          <span className="text-xs text-gray-500 mt-1 block">
            Across {tenantLogs.length} documented incidents
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-red-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Total Financial Cost
          </span>
          <div className="mt-2 text-3xl font-extrabold text-red-700">
            {formatCedi(totalLossAmount)}
          </div>
          <span className="text-xs text-red-700 mt-1 block">
            Net inventory loss write-off
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Compliance Safety Rate
          </span>
          <div className="mt-2 text-3xl font-extrabold text-emerald-900">
            100%
          </div>
          <span className="text-xs text-emerald-700 mt-1 block">
            Zero expired items sold to consumers
          </span>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-700">Filter By Reason:</span>
            <select
              value={reasonFilter}
              onChange={(e) => setReasonFilter(e.target.value)}
              className="py-1 px-2.5 border border-gray-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="ALL">All Disposal Reasons</option>
              <option value="EXPIRED">Expired Past Expiry Date</option>
              <option value="SPOILED">Spoilage / Visual Mold</option>
              <option value="DAMAGED_PACKAGING">Damaged Packaging</option>
              <option value="DONATED">Donated to Food Bank</option>
              <option value="RECALLED">Manufacturer Recall</option>
            </select>
          </div>

          <span className="text-xs text-gray-500">
            Showing {filteredLogs.length} entries
          </span>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              No disposal logs recorded under this filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2 bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{log.productName}</div>
                    <div className="text-gray-500 font-mono text-[11px]">Batch: {log.batchNumber}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-900 border border-red-200">
                    {log.reason.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Qty Disposed</span>
                    <span className="font-bold text-gray-900">{log.quantityDisposed} {log.unit}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Financial Loss</span>
                    <span className="font-bold text-red-700">{formatCedi(log.totalLoss)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Staff & Witness</span>
                    <div className="text-gray-800 text-[11px] truncate">{log.disposedBy}</div>
                    <div className="text-gray-500 text-[10px] truncate">Witness: {log.witnessName}</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase font-bold">Logged At</span>
                    <span className="font-mono text-gray-600 text-[11px]">{log.disposedAt}</span>
                  </div>
                </div>

                {log.notes && (
                  <div className="text-[11px] text-gray-600 bg-red-50/40 p-2 rounded-md border border-red-100">
                    {log.notes}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Product / Batch</th>
                <th className="px-4 py-3">Disposed Qty</th>
                <th className="px-4 py-3">Cost Loss</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Authorized By & Witness</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                    No disposal logs recorded under this filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <div>{log.productName}</div>
                      <div className="text-gray-500 font-mono text-[11px]">Batch: {log.batchNumber}</div>
                    </td>
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {log.quantityDisposed} {log.unit}
                    </td>
                    <td className="px-4 py-3 font-bold text-red-700">
                      {formatCedi(log.totalLoss)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-900 border border-red-200">
                        {log.reason.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <div className="font-semibold">{log.disposedBy}</div>
                      <div className="text-[11px] text-gray-500">Witness: {log.witnessName}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-[11px]">
                      {log.disposedAt}
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={log.notes}>
                      {log.notes}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
