import React from 'react';
import { Tenant, UserRole, Batch, User } from '../types/index.ts';
import { ExpiryGuardLogo } from './ExpiryGuardLogo.tsx';
import {
  BuildingStorefrontIcon,
  UserCircleIcon,
  BellAlertIcon,
  PlusIcon,
  QrCodeIcon,
  Bars3Icon,
  XMarkIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

interface HeaderProps {
  currentTenant: Tenant;
  allTenants: Tenant[];
  onSelectTenant: (tenant: Tenant) => void;
  currentUser: User;
  currentRole: UserRole;
  batches: Batch[];
  onOpenNewProductModal: () => void;
  onOpenFastScanner: () => void;
  onNavigateTab: (tabName: any) => void;
  onOpenAddBranchModal?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTenant,
  allTenants,
  onSelectTenant,
  currentUser,
  currentRole,
  batches,
  onOpenNewProductModal,
  onOpenFastScanner,
  onNavigateTab,
  onOpenAddBranchModal,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
}) => {
  const expiredCount = (batches || []).filter(
    (b) => b && b.tenantId === currentTenant?.id && b.status === 'EXPIRED' && b.currentQuantity > 0
  ).length;

  const criticalCount = (batches || []).filter(
    (b) => b && b.tenantId === currentTenant?.id && b.status === 'CRITICAL_7' && b.currentQuantity > 0
  ).length;

  const totalUrgent = expiredCount + criticalCount;
  const isSingleStore = (allTenants || []).length <= 1;

  return (
    <header className="bg-white border-b border-emerald-100 sticky top-0 z-30 shadow-xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          {/* Left: Mobile Menu Toggle + Store Identity */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile Hamburger Button */}
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-emerald-50 hover:text-emerald-900 border border-gray-200 transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-5 h-5 text-emerald-900" />
              ) : (
                <Bars3Icon className="w-5 h-5 text-gray-800" />
              )}
            </button>

            {/* Mobile Brand Logo */}
            <div className="md:hidden flex items-center gap-1.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white p-0.5 border border-emerald-200 shadow-xs flex items-center justify-center">
                <ExpiryGuardLogo className="w-full h-full" />
              </div>
            </div>

            {/* Store Name Badge (Responsive) */}
            <div className="flex items-center bg-stone-50 border border-stone-200 rounded-xl px-2.5 sm:px-3 py-1.5 max-w-[140px] sm:max-w-[220px] md:max-w-none">
              <BuildingStorefrontIcon className="w-4 h-4 text-emerald-700 mr-1.5 shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {currentTenant.name}
              </span>
            </div>
          </div>

          {/* Right: Urgent Alerts + Actions + User Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Urgent Alert Banner / Quick Jump */}
            {totalUrgent > 0 && (
              <button
                onClick={() => onNavigateTab('ALERTS')}
                className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-900 rounded-lg border border-red-200 text-xs font-semibold transition-all cursor-pointer"
                title="View urgent alerts"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                </span>
                <span className="hidden sm:inline">
                  {expiredCount > 0 ? `${expiredCount} Expired` : ''}
                  {expiredCount > 0 && criticalCount > 0 ? ', ' : ''}
                  {criticalCount > 0 ? `${criticalCount} Critical` : ''}
                </span>
                <span className="sm:hidden text-[11px] font-bold text-red-700">
                  {totalUrgent}
                </span>
              </button>
            )}

            {/* Quick Action: Fast POS Scanner */}
            <button
              onClick={onOpenFastScanner}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              title="Fast POS Camera & Barcode Scanner"
            >
              <CameraIcon className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="hidden md:inline">POS Scan</span>
            </button>

            {/* Manager Only: New Product Entry */}
            {currentRole === 'STORE_MANAGER' && (
              <button
                onClick={onOpenNewProductModal}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Add Batch</span>
              </button>
            )}

            {/* User Profile Pill */}
            <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-gray-700 font-bold text-xs shrink-0">
                {currentUser?.fullName
                  ? currentUser.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </div>
              <div className="hidden xl:block text-left text-xs leading-tight">
                <div className="font-bold text-gray-900 truncate max-w-[110px]">
                  {currentUser?.fullName || 'Active User'}
                </div>
                <div className="text-[10px] text-gray-500 font-medium capitalize">
                  {currentRole === 'STORE_MANAGER'
                    ? 'Store Manager'
                    : currentRole === 'TENANT_ADMIN'
                    ? 'Tenant Admin'
                    : 'POS Cashier'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
