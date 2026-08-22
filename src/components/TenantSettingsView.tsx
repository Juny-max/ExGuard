import React, { useState } from 'react';
import { Tenant, UserRole, User } from '../types/index.ts';
import {
  BuildingStorefrontIcon,
  BellAlertIcon,
  UserGroupIcon,
  CheckCircleIcon,
  DocumentChartBarIcon,
  ArrowDownTrayIcon,
  UserPlusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface TenantSettingsViewProps {
  currentTenant: Tenant;
  allTenants?: Tenant[];
  currentRole: UserRole;
  users: User[];
  onUpdateTenant: (updated: Tenant) => void;
  onOpenReportModal: () => void;
  onOpenAddCashierModal?: () => void;
  onOpenAddBranchModal?: () => void;
}

export const TenantSettingsView: React.FC<TenantSettingsViewProps> = ({
  currentTenant,
  allTenants = [currentTenant],
  currentRole,
  users,
  onUpdateTenant,
  onOpenReportModal,
  onOpenAddCashierModal,
  onOpenAddBranchModal,
}) => {
  const [storeName, setStoreName] = useState(currentTenant.name);
  const [address, setAddress] = useState(currentTenant.address);
  const [city, setCity] = useState(currentTenant.city);
  const [email, setEmail] = useState(currentTenant.contactEmail);
  const [phone, setPhone] = useState(currentTenant.contactPhone);
  const [warningDays, setWarningDays] = useState(currentTenant.warningThresholdDays);
  const [criticalDays, setCriticalDays] = useState(currentTenant.criticalThresholdDays);
  const [defaultDiscount, setDefaultDiscount] = useState(currentTenant.defaultClearanceDiscount);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const tenantUsers = (users || []).filter((u) => u && u.tenantId === currentTenant?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateTenant({
      ...currentTenant,
      name: storeName,
      address,
      city,
      contactEmail: email,
      contactPhone: phone,
      warningThresholdDays: Number(warningDays),
      criticalThresholdDays: Number(criticalDays),
      defaultClearanceDiscount: Number(defaultDiscount),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Store & Staff Management
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Manage store profile, branches, cashier accounts, and alert rules
        </p>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold shadow-xs">
          <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Store configuration updated successfully.</span>
        </div>
      )}

      {/* Official Compliance & Expiry Audit Reports Card */}
      <div className="bg-white p-6 rounded-2xl border border-emerald-200 shadow-xs space-y-4 bg-gradient-to-r from-emerald-50/40 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
              <DocumentChartBarIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Official Stock Freshness & Expiry Audit Report</h2>
              <p className="text-xs text-gray-500 mt-0.5 max-w-xl leading-relaxed">
                Generate formal compliance certificates, print food safety documentation, or export batch datasets as CSV files for municipal health inspections and internal governance audits.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenReportModal}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <DocumentChartBarIcon className="w-4 h-4" />
            <span>Export Expiry Audit Report</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Branch Profile */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <BuildingStorefrontIcon className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-gray-900">Store Profile & Location</h2>
            </div>
            {currentRole === 'STORE_MANAGER' && onOpenAddBranchModal && (
              <button
                type="button"
                onClick={onOpenAddBranchModal}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-gray-800 rounded-lg border border-stone-300 transition-colors cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>Add Another Branch</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store / Branch Name *</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Branch Code</label>
              <input
                type="text"
                disabled
                value={currentTenant.code}
                className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 rounded-lg font-mono text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Store Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">City / Mall Zone</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Operations Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Alert Thresholds */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
            <BellAlertIcon className="w-5 h-5 text-emerald-700" />
            <h2 className="text-sm font-bold text-gray-900">Automated Expiry Alert Rules</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Early Warning Window</label>
              <div className="relative">
                <input
                  type="number"
                  min="15"
                  max="60"
                  value={warningDays}
                  onChange={(e) => setWarningDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">Days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Critical Expiry Window</label>
              <div className="relative">
                <input
                  type="number"
                  min="2"
                  max="14"
                  value={criticalDays}
                  onChange={(e) => setCriticalDays(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">Days</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Default Clearance Discount</label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={defaultDiscount}
                  onChange={(e) => setDefaultDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
                <span className="absolute right-3 top-2 text-xs text-gray-500">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Staff & Cashier Accounts */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-5 h-5 text-emerald-700" />
              <h2 className="text-sm font-bold text-gray-900">Authorized Branch Staff & Cashiers</h2>
            </div>

            {currentRole === 'STORE_MANAGER' && onOpenAddCashierModal && (
              <button
                type="button"
                onClick={onOpenAddCashierModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <UserPlusIcon className="w-3.5 h-3.5" />
                <span>Create Cashier Account</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {tenantUsers.map((user) => (
              <div key={user.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-gray-900 text-sm">{user.fullName}</span>
                  <div className="text-gray-500">
                    {user.email} | Code: <span className="font-mono">{user.employeeCode}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md font-bold uppercase text-[10px] border ${
                      user.role === 'STORE_MANAGER'
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                        : user.role === 'TENANT_ADMIN'
                        ? 'bg-blue-100 text-blue-900 border-blue-200'
                        : 'bg-stone-100 text-stone-800 border-stone-300'
                    }`}
                  >
                    {user.role === 'CASHIER' ? 'POS Cashier' : user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        {currentRole === 'STORE_MANAGER' && (
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Store Settings
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
