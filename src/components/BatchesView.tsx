import React, { useState, useMemo } from 'react';
import { Tenant, UserRole, Batch, Category, BatchStatus } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { formatCedi } from '../utils/currency.ts';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TagIcon,
  TrashIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ArrowsUpDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface BatchesViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  batches: Batch[];
  categories: Category[];
  onOpenNewProductModal: () => void;
  onApplyDiscount: (batch: Batch, discountPct: number) => void;
  onOpenDisposalModal: (batch: Batch) => void;
  onAuditBatch: (batch: Batch) => void;
}

export const BatchesView: React.FC<BatchesViewProps> = ({
  currentTenant,
  currentRole,
  batches,
  categories,
  onOpenNewProductModal,
  onApplyDiscount,
  onOpenDisposalModal,
  onAuditBatch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'expiry_asc' | 'expiry_desc' | 'qty_desc' | 'name_asc'>('expiry_asc');

  const tenantBatches = (batches || []).filter(
    (b) => b && b.tenantId === currentTenant?.id && b.status !== 'DISPOSED'
  );

  const filteredBatches = useMemo(() => {
    return tenantBatches
      .filter((batch) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = batch.productName.toLowerCase().includes(q);
          const matchSku = batch.sku.toLowerCase().includes(q);
          const matchBarcode = batch.barcode.toLowerCase().includes(q);
          const matchBatch = batch.batchNumber.toLowerCase().includes(q);
          const matchBrand = batch.brand.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchBarcode && !matchBatch && !matchBrand) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && batch.categoryName !== selectedCategory) {
          return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL' && batch.status !== selectedStatus) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'expiry_asc') {
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        }
        if (sortBy === 'expiry_desc') {
          return new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime();
        }
        if (sortBy === 'qty_desc') {
          return b.currentQuantity - a.currentQuantity;
        }
        if (sortBy === 'name_asc') {
          return a.productName.localeCompare(b.productName);
        }
        return 0;
      });
  }, [tenantBatches, searchQuery, selectedCategory, selectedStatus, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Batch Inventory & Expiry Roster
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete active lot listings for {currentTenant.name} ({filteredBatches.length} of {tenantBatches.length} items shown)
          </p>
        </div>

        {currentRole === 'STORE_MANAGER' && (
          <button
            onClick={onOpenNewProductModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add New Batch Entry</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search product name, SKU, barcode (e.g. 890123...), or batch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
            />
          </div>

          {/* Department / Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="ALL">All Categories / Departments</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent bg-white cursor-pointer"
            >
              <option value="ALL">All Expiry Statuses</option>
              <option value="EXPIRED">Expired (Immediate Pull)</option>
              <option value="CRITICAL_7">Critical (&lt;= 7 Days)</option>
              <option value="WARNING_14">Warning (8 - 14 Days)</option>
              <option value="WARNING_30">Warning (15 - 30 Days)</option>
              <option value="SAFE">Safe Stock (&gt; 30 Days)</option>
              <option value="DISCOUNTED">Clearance Discounted</option>
            </select>
          </div>
        </div>

        {/* Sort selector & Quick reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="flex items-center gap-1 text-gray-700 font-semibold mr-1">
              <ArrowsUpDownIcon className="w-3.5 h-3.5 text-gray-400" />
              <span>Sort:</span>
            </div>
            <button
              onClick={() => setSortBy('expiry_asc')}
              className={`px-2.5 py-1 rounded-md cursor-pointer text-xs ${
                sortBy === 'expiry_asc'
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'hover:bg-gray-100 text-gray-600 bg-gray-50'
              }`}
            >
              Earliest Expiry
            </button>
            <button
              onClick={() => setSortBy('expiry_desc')}
              className={`px-2.5 py-1 rounded-md cursor-pointer text-xs ${
                sortBy === 'expiry_desc'
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'hover:bg-gray-100 text-gray-600 bg-gray-50'
              }`}
            >
              Latest Expiry
            </button>
            <button
              onClick={() => setSortBy('qty_desc')}
              className={`px-2.5 py-1 rounded-md cursor-pointer text-xs ${
                sortBy === 'qty_desc'
                  ? 'bg-emerald-100 text-emerald-900 font-bold'
                  : 'hover:bg-gray-100 text-gray-600 bg-gray-50'
              }`}
            >
              Highest Stock
            </button>
          </div>

          {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
              }}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer self-end sm:self-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Batches Table & Mobile Cards */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Mobile View: Batch Cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {filteredBatches.length === 0 ? (
            <div className="px-4 py-12 text-center text-gray-500 text-xs">
              No batches match the selected filters or search query.
            </div>
          ) : (
            filteredBatches.map((batch) => {
              const isExpired = batch.status === 'EXPIRED';
              const isCritical = batch.status === 'CRITICAL_7';

              return (
                <div
                  key={batch.id}
                  className={`p-4 space-y-3 transition-colors ${
                    isExpired ? 'bg-red-50/30' : isCritical ? 'bg-rose-50/20' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{batch.productName}</div>
                      <div className="text-gray-500 text-xs">
                        {batch.brand} · <span className="text-emerald-800 font-medium">{batch.categoryName}</span>
                      </div>
                    </div>
                    <StatusBadge status={batch.status} daysRemaining={batch.daysRemaining} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50/80 p-2.5 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Batch & SKU</span>
                      <div className="font-mono font-medium text-gray-900 truncate">{batch.batchNumber}</div>
                      <div className="text-gray-500 text-[10px] font-mono">{batch.sku}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Expiry Date</span>
                      <div className="font-bold text-gray-900">{batch.expiryDate}</div>
                      <div
                        className={`text-[10px] font-bold ${
                          isExpired ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {isExpired ? `${Math.abs(batch.daysRemaining)}d EXPIRED` : `${batch.daysRemaining}d left`}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Location</span>
                      <div className="text-gray-700 font-medium truncate">{batch.locationAisle}</div>
                      <div className="text-gray-500 text-[10px]">{batch.locationShelf}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 block uppercase font-bold">Quantity & Price</span>
                      <div className="font-bold text-gray-900">{batch.currentQuantity} {batch.unit}</div>
                      <div className="text-emerald-800 font-semibold text-[11px]">
                        {batch.discountPercentage > 0 ? formatCedi(batch.discountedPrice || 0) : formatCedi(batch.unitPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex items-center justify-between pt-1 gap-2 border-t border-gray-100">
                    <button
                      onClick={() => onAuditBatch(batch)}
                      className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                      <span>Audit Shelf</span>
                    </button>

                    {currentRole === 'STORE_MANAGER' && (
                      <>
                        {!isExpired && (
                          <button
                            onClick={() => onApplyDiscount(batch, 35)}
                            className="flex-1 py-1.5 px-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <TagIcon className="w-4 h-4" />
                            <span>-35% Off</span>
                          </button>
                        )}
                        <button
                          onClick={() => onOpenDisposalModal(batch)}
                          className="py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span>Dispose</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Product Name & SKU</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Batch & Barcode</th>
                <th className="px-4 py-3">Received / Expiry Date</th>
                <th className="px-4 py-3">Aisle / Shelf</th>
                <th className="px-4 py-3">Stock Units</th>
                <th className="px-4 py-3">Unit Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                    No batches match the selected filters or search query.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const isExpired = batch.status === 'EXPIRED';
                  const isCritical = batch.status === 'CRITICAL_7';

                  return (
                    <tr
                      key={batch.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isExpired ? 'bg-red-50/30' : isCritical ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{batch.productName}</div>
                        <div className="text-gray-500 text-[11px]">
                          {batch.brand} | SKU: <span className="font-mono">{batch.sku}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {batch.categoryName}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-gray-900 font-medium">{batch.batchNumber}</div>
                        <div className="font-mono text-[11px] text-gray-500">{batch.barcode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-gray-500 text-[11px]">Rec: {batch.dateReceived}</div>
                        <div className="font-bold text-gray-900">Exp: {batch.expiryDate}</div>
                        <div
                          className={`text-[11px] font-bold ${
                            isExpired
                              ? 'text-red-700'
                              : batch.daysRemaining <= 7
                              ? 'text-rose-700'
                              : batch.daysRemaining <= 14
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          {isExpired
                            ? `${Math.abs(batch.daysRemaining)}d EXPIRED`
                            : `${batch.daysRemaining} days remaining`}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{batch.locationAisle}</div>
                        <div className="text-[11px] text-gray-500">{batch.locationShelf}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-gray-900">
                          {batch.currentQuantity}
                        </span>{' '}
                        <span className="text-gray-500 text-[11px]">{batch.unit}</span>
                      </td>
                      <td className="px-4 py-3">
                        {batch.discountPercentage > 0 ? (
                          <div>
                            <span className="line-through text-gray-400 text-[11px]">
                              {formatCedi(batch.unitPrice)}
                            </span>
                            <div className="font-bold text-emerald-800">
                              {formatCedi(batch.discountedPrice || 0)}
                              <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded-sm">
                                -{batch.discountPercentage}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">
                            {formatCedi(batch.unitPrice)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={batch.status} daysRemaining={batch.daysRemaining} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Shelf Audit Button */}
                          <button
                            onClick={() => onAuditBatch(batch)}
                            className="p-1 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                            title="Log physical shelf verification"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>

                          {/* Manager Actions: Discount / Dispose */}
                          {currentRole === 'STORE_MANAGER' && (
                            <>
                              {!isExpired && (
                                <button
                                  onClick={() => onApplyDiscount(batch, 35)}
                                  className="p-1 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                                  title="Apply 35% clearance markdown"
                                >
                                  <TagIcon className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => onOpenDisposalModal(batch)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Write-off / Dispose batch"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
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
    </div>
  );
};
