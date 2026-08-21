import React from 'react';
import { Tenant, UserRole, Batch, BatchStatus, User } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  TagIcon,
  TrashIcon,
  QrCodeIcon,
  CheckBadgeIcon,
  ArrowRightIcon,
  UserPlusIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  PlusIcon,
  IdentificationIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

interface DashboardViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  batches: Batch[];
  users?: User[];
  tenants?: Tenant[];
  onNavigateTab: (tabName: any) => void;
  onApplyDiscount: (batch: Batch, discountPct: number) => void;
  onOpenDisposalModal: (batch: Batch) => void;
  onOpenFastScanner: () => void;
  onOpenNewProductModal: () => void;
  onOpenAddCashierModal?: () => void;
  onOpenAddBranchModal?: () => void;
  onSelectTenant?: (tenant: Tenant) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentTenant,
  currentRole,
  batches,
  users = [],
  tenants = [currentTenant],
  onNavigateTab,
  onApplyDiscount,
  onOpenDisposalModal,
  onOpenFastScanner,
  onOpenNewProductModal,
  onOpenAddCashierModal,
  onOpenAddBranchModal,
  onSelectTenant,
}) => {
  const tenantBatches = batches.filter((b) => b.tenantId === currentTenant.id && b.status !== 'DISPOSED');

  // Metric breakdown
  const healthyBatches = tenantBatches.filter((b) => b.status === 'SAFE');
  const warning30Batches = tenantBatches.filter((b) => b.status === 'WARNING_30');
  const warning14Batches = tenantBatches.filter((b) => b.status === 'WARNING_14');
  const critical7Batches = tenantBatches.filter((b) => b.status === 'CRITICAL_7');
  const expiredBatches = tenantBatches.filter((b) => b.status === 'EXPIRED');
  const discountedBatches = tenantBatches.filter((b) => b.status === 'DISCOUNTED');

  const totalStockUnits = tenantBatches.reduce((acc, b) => acc + b.currentQuantity, 0);

  // Financial calculations
  const totalStockValue = tenantBatches.reduce((acc, b) => acc + b.currentQuantity * b.unitPrice, 0);
  const expiredLossValue = expiredBatches.reduce((acc, b) => acc + b.currentQuantity * b.unitCost, 0);
  const criticalAtRiskValue = critical7Batches.reduce((acc, b) => acc + b.currentQuantity * b.unitCost, 0);

  // Cashiers for this store
  const tenantCashiers = users.filter(
    (u) => u.tenantId === currentTenant.id && u.role === 'CASHIER'
  );

  // Immediate attention list: Expired first, then Critical 7d, then 14d
  const urgentBatches = [
    ...expiredBatches,
    ...critical7Batches,
    ...warning14Batches,
  ].slice(0, 7);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Freshness & Expiry Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Active tracking for <span className="font-semibold text-emerald-900">{currentTenant.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenFastScanner}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 shadow-2xs transition-colors cursor-pointer"
          >
            <CameraIcon className="w-4 h-4 text-emerald-700" />
            <span>POS Camera & Barcode Check</span>
          </button>

          {currentRole === 'STORE_MANAGER' && (
            <>
              {onOpenAddCashierModal && (
                <button
                  onClick={onOpenAddCashierModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-gray-800 border border-stone-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <UserPlusIcon className="w-4 h-4 text-emerald-700" />
                  <span>Add Cashier</span>
                </button>
              )}

              <button
                onClick={onOpenNewProductModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Add Received Batch</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Critical Banner If Expired Items Exist */}
      {expiredBatches.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-600 p-4 rounded-r-xl shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <XCircleIcon className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-red-950">
                  Critical Compliance Action Required: {expiredBatches.length} Expired Batches on Record
                </h3>
                <p className="text-xs text-red-800 mt-1">
                  Expired goods pose consumer safety hazards and must be pulled from supermarket display aisles immediately.
                  Estimated discard cost: ${expiredLossValue.toFixed(2)}.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('ALERTS')}
              className="px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              Review Expired Stock
            </button>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Healthy Stock */}
        <div className="bg-white rounded-xl p-5 border border-emerald-100 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Healthy Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-950">
              {healthyBatches.length}
            </span>
            <span className="text-xs font-medium text-gray-500">
              batches ({healthyBatches.reduce((a, b) => a + b.currentQuantity, 0)} units)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckBadgeIcon className="w-4 h-4 text-emerald-600" />
            <span>&gt; 30 Days Expiry Margin</span>
          </div>
        </div>

        {/* Card 2: Warning Alerts (30d & 14d) */}
        <div className="bg-white rounded-xl p-5 border border-amber-100 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Expiring Soon
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-950">
              {warning30Batches.length + warning14Batches.length}
            </span>
            <span className="text-xs font-medium text-gray-500">
              batches ({warning30Batches.length} at 30d, {warning14Batches.length} at 14d)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
            <ExclamationCircleIcon className="w-4 h-4 text-amber-600" />
            <span>Eligible for Clearance Markdowns</span>
          </div>
        </div>

        {/* Card 3: Critical Expiring (<= 7 Days) */}
        <div className="bg-white rounded-xl p-5 border border-rose-100 shadow-xs hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Critical (7 Days)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <ExclamationCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-950">
              {critical7Batches.length}
            </span>
            <span className="text-xs font-medium text-gray-500">
              batches (${criticalAtRiskValue.toFixed(2)} at risk)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-700">
            <ArrowTrendingUpIcon className="w-4 h-4 text-rose-600" />
            <span>Requires Fast POS Cashier Alert</span>
          </div>
        </div>

        {/* Card 4: Expired Stock */}
        <div className="bg-white rounded-xl p-5 border border-red-100 shadow-xs hover:border-red-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Expired Stock
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <XCircleIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-red-950">
              {expiredBatches.length}
            </span>
            <span className="text-xs font-medium text-gray-500">
              batches (${expiredLossValue.toFixed(2)} total loss)
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-red-700">
            <TrashIcon className="w-4 h-4 text-red-600" />
            <span>Must Be Disposed from Shelves</span>
          </div>
        </div>
      </div>

      {/* Quick Tier Threshold Breakdown Bar */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold text-gray-900">
            Shelf Freshness Distribution Profile
          </h2>
          <span className="text-xs text-gray-500">
            Total Monitored Stock: <strong className="text-gray-900">{totalStockUnits} units</strong> (${totalStockValue.toFixed(2)} retail value)
          </span>
        </div>

        {/* Segmented bar */}
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex shadow-inner">
          {healthyBatches.length > 0 && (
            <div
              style={{ width: `${(healthyBatches.length / tenantBatches.length) * 100}%` }}
              className="bg-emerald-600 h-full transition-all"
              title={`Healthy: ${healthyBatches.length} batches`}
            />
          )}
          {warning30Batches.length > 0 && (
            <div
              style={{ width: `${(warning30Batches.length / tenantBatches.length) * 100}%` }}
              className="bg-lime-500 h-full transition-all"
              title={`30d Warning: ${warning30Batches.length} batches`}
            />
          )}
          {warning14Batches.length > 0 && (
            <div
              style={{ width: `${(warning14Batches.length / tenantBatches.length) * 100}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`14d Alert: ${warning14Batches.length} batches`}
            />
          )}
          {critical7Batches.length > 0 && (
            <div
              style={{ width: `${(critical7Batches.length / tenantBatches.length) * 100}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`Critical (7d): ${critical7Batches.length} batches`}
            />
          )}
          {expiredBatches.length > 0 && (
            <div
              style={{ width: `${(expiredBatches.length / tenantBatches.length) * 100}%` }}
              className="bg-red-700 h-full transition-all"
              title={`Expired: ${expiredBatches.length} batches`}
            />
          )}
        </div>

        {/* Legend */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-600" />
            <span>Safe (&gt;30d): {healthyBatches.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-lime-500" />
            <span>30d Warning: {warning30Batches.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500" />
            <span>14d Alert: {warning14Batches.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-500" />
            <span>Critical (&lt;=7d): {critical7Batches.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-700" />
            <span>Expired: {expiredBatches.length}</span>
          </div>
        </div>
      </div>

      {/* Immediate Attention Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Immediate Priority Action Queue
            </h2>
            <p className="text-xs text-gray-500">
              Items flagged for immediate clearance markdown or physical disposal
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('ALERTS')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
          >
            <span>View Full Alerts Queue</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile View: Priority Action Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {urgentBatches.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-xs">
              All inventory items are currently in healthy stock status.
            </div>
          ) : (
            urgentBatches.map((batch) => {
              const isExpired = batch.status === 'EXPIRED';
              return (
                <div key={batch.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">{batch.productName}</h3>
                      <p className="text-xs text-gray-500">
                        SKU: {batch.sku} &bull; Batch: {batch.batchNumber}
                      </p>
                    </div>
                    <StatusBadge status={batch.status} daysRemaining={batch.daysRemaining} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-2.5 rounded-lg">
                    <div>
                      <span className="text-gray-500 block">Department & Aisle</span>
                      <span className="font-semibold text-gray-800">
                        {batch.categoryName} ({batch.locationAisle})
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Stock on Hand</span>
                      <span className="font-semibold text-gray-800">
                        {batch.currentQuantity} {batch.unit}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isExpired ? (
                      <button
                        onClick={() => onOpenDisposalModal(batch)}
                        className="w-full py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Dispose & Log Waste</span>
                      </button>
                    ) : (
                      <>
                        {currentRole === 'STORE_MANAGER' ? (
                          <button
                            onClick={() => onApplyDiscount(batch, 35)}
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <TagIcon className="w-4 h-4" />
                            <span>Apply 35% Clearance</span>
                          </button>
                        ) : (
                          <div className="text-xs text-gray-500 italic py-1">
                            Flagged for manager clearance markdown
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Priority Action Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold border-b border-gray-200">
              <tr>
                <th className="px-4 py-3">Product / SKU</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Expiry Date</th>
                <th className="px-4 py-3">Stock Units</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {urgentBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    All inventory items are currently in healthy stock status.
                  </td>
                </tr>
              ) : (
                urgentBatches.map((batch) => {
                  const isExpired = batch.status === 'EXPIRED';
                  const isCritical = batch.status === 'CRITICAL_7';

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isExpired ? 'bg-red-50/40' : isCritical ? 'bg-rose-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{batch.productName}</div>
                        <div className="text-gray-500 text-[11px]">
                          SKU: {batch.sku} | Batch: {batch.batchNumber}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{batch.categoryName}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{batch.locationAisle}</div>
                        <div className="text-[11px] text-gray-500">{batch.locationShelf}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{batch.expiryDate}</div>
                        <div
                          className={`text-[11px] font-bold ${
                            isExpired
                              ? 'text-red-700'
                              : batch.daysRemaining <= 7
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {isExpired
                            ? `${Math.abs(batch.daysRemaining)} days past due`
                            : `${batch.daysRemaining} days remaining`}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {batch.currentQuantity} {batch.unit}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={batch.status} daysRemaining={batch.daysRemaining} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isExpired ? (
                            <button
                              onClick={() => onOpenDisposalModal(batch)}
                              className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer"
                            >
                              Dispose & Log Waste
                            </button>
                          ) : (
                            <>
                              {currentRole === 'STORE_MANAGER' ? (
                                <button
                                  onClick={() => onApplyDiscount(batch, 35)}
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-md font-semibold text-xs transition-colors shadow-2xs cursor-pointer inline-flex items-center gap-1"
                                >
                                  <TagIcon className="w-3.5 h-3.5" />
                                  <span>Apply 35% Off</span>
                                </button>
                              ) : (
                                <span className="text-gray-500 text-xs italic">
                                  Flagged for Manager
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manager Operations: Cashier Accounts & Multi-Branch Management */}
      {currentRole === 'STORE_MANAGER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          {/* Card A: Cashier Staff Management */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <UserGroupIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Cashier POS Accounts</h3>
                  <p className="text-[11px] text-gray-500">
                    Staff authorized for POS scanning & register checkout
                  </p>
                </div>
              </div>

              {onOpenAddCashierModal && (
                <button
                  onClick={onOpenAddCashierModal}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <UserPlusIcon className="w-3.5 h-3.5" />
                  <span>Create Cashier</span>
                </button>
              )}
            </div>

            {tenantCashiers.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl">
                <IdentificationIcon className="w-8 h-8 text-gray-300 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-gray-700">No Cashier Accounts Yet</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto mt-0.5">
                  Create cashier accounts so your staff can log into the POS barcode scanner.
                </p>
                {onOpenAddCashierModal && (
                  <button
                    onClick={onOpenAddCashierModal}
                    className="mt-3 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg font-semibold border border-emerald-200 cursor-pointer"
                  >
                    + Create First Cashier
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {tenantCashiers.map((cashier) => (
                  <div key={cashier.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-900">{cashier.fullName}</div>
                      <div className="text-gray-500 text-[11px]">
                        {cashier.email} &bull; Badge:{' '}
                        <span className="font-mono text-emerald-800 font-semibold">
                          {cashier.employeeCode}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        POS Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card B: Store Branch Configuration */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
                  <BuildingStorefrontIcon className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Store & Branch Locations</h3>
                  <p className="text-[11px] text-gray-500">
                    {tenants.length === 1
                      ? 'Single Supermarket Operation'
                      : `${tenants.length} Active Branch Locations`}
                  </p>
                </div>
              </div>

              {onOpenAddBranchModal && (
                <button
                  onClick={onOpenAddBranchModal}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-gray-800 rounded-lg text-xs font-semibold border border-stone-300 transition-colors cursor-pointer"
                >
                  <PlusIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Add Branch</span>
                </button>
              )}
            </div>

            {tenants.length === 1 ? (
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">{tenants[0].name}</span>
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-100 text-emerald-800 rounded-md">
                    Single Store Mode
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your workspace is operating as a single standalone supermarket. If you open new
                  branches or satellite stores, you can register them at any time using the "Add Branch" button.
                </p>
                <div className="text-[11px] text-gray-400 pt-1">
                  Branch Code: <span className="font-mono text-gray-600">{tenants[0].code}</span> &bull;{' '}
                  {tenants[0].city}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {tenants.map((t) => {
                  const isActive = t.id === currentTenant.id;
                  return (
                    <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          <span>{t.name}</span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-emerald-100 text-emerald-800 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-gray-500 text-[11px]">
                          Code: <span className="font-mono">{t.code}</span> &bull; {t.city}
                        </div>
                      </div>
                      {!isActive && onSelectTenant && (
                        <button
                          onClick={() => onSelectTenant(t)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
