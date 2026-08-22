import React, { useState } from 'react';
import { ActiveNavTab, UserRole, Tenant, User } from '../types/index.ts';
import { ExpiryGuardLogo } from './ExpiryGuardLogo.tsx';
import {
  Squares2X2Icon,
  ArchiveBoxIcon,
  BellAlertIcon,
  QrCodeIcon,
  ShoppingCartIcon,
  TagIcon,
  TrashIcon,
  FolderIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  currentRole: UserRole;
  currentUser?: User;
  expiredAlertsCount: number;
  criticalAlertsCount: number;
  onSignOut: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  currentTenant?: Tenant;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
  currentUser,
  expiredAlertsCount,
  criticalAlertsCount,
  onSignOut,
  isMobileOpen = false,
  onCloseMobile,
  currentTenant,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse: externalToggleCollapse,
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);
  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const toggleCollapse = externalToggleCollapse || (() => setInternalIsCollapsed((prev) => !prev));

  const allNavItems = [
    {
      id: 'DASHBOARD' as ActiveNavTab,
      label: 'Expiry Dashboard',
      icon: Squares2X2Icon,
      roles: ['STORE_MANAGER', 'TENANT_ADMIN'],
    },
    {
      id: 'CASHIER_SCAN' as ActiveNavTab,
      label: 'POS Checkout Register',
      icon: ShoppingCartIcon,
      roles: ['CASHIER', 'STORE_MANAGER', 'TENANT_ADMIN'],
    },
    {
      id: 'ALERTS' as ActiveNavTab,
      label: 'Alerts & Action Center',
      icon: BellAlertIcon,
      badgeCount: expiredAlertsCount + criticalAlertsCount,
      badgeType: expiredAlertsCount > 0 ? 'critical' : 'warning',
      roles: ['CASHIER', 'STORE_MANAGER', 'TENANT_ADMIN'],
    },
    {
      id: 'CLEARANCE' as ActiveNavTab,
      label: 'Clearance & Markdowns',
      icon: TagIcon,
      roles: ['CASHIER', 'STORE_MANAGER', 'TENANT_ADMIN'],
    },
    {
      id: 'INVENTORY' as ActiveNavTab,
      label: 'Batch Inventory',
      icon: ArchiveBoxIcon,
      roles: ['CASHIER', 'STORE_MANAGER', 'TENANT_ADMIN'],
    },
    {
      id: 'DISPOSAL' as ActiveNavTab,
      label: 'Disposal & Waste Log',
      icon: TrashIcon,
      roles: ['STORE_MANAGER', 'TENANT_ADMIN'],
    },
    {
      id: 'CATEGORIES' as ActiveNavTab,
      label: 'Categories & Shelf-Life',
      icon: FolderIcon,
      roles: ['STORE_MANAGER', 'TENANT_ADMIN'],
    },
    {
      id: 'SETTINGS' as ActiveNavTab,
      label: 'Store & Staff Settings',
      icon: Cog6ToothIcon,
      roles: ['STORE_MANAGER', 'TENANT_ADMIN'],
    },
  ];

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(currentRole)
  );

  const handleTabClick = (tabId: ActiveNavTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const renderNavContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Header at top of sidebar */}
        <div
          className={`border-b border-emerald-900 bg-emerald-950/80 flex items-center transition-all duration-300 ${
            collapsed ? 'p-3 justify-center' : 'p-4 sm:p-5 justify-between'
          }`}
        >
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div
              className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs ring-1 ring-emerald-500/30 shrink-0 cursor-pointer overflow-hidden"
              onClick={collapsed ? toggleCollapse : undefined}
              title={collapsed ? 'Click to expand sidebar' : undefined}
            >
              <ExpiryGuardLogo className="w-full h-full" />
            </div>

            {!collapsed && (
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-base tracking-tight">ExpiryGuard</span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-emerald-800 text-emerald-200 rounded border border-emerald-700">
                    SaaS
                  </span>
                </div>
                <p className="text-[11px] text-emerald-300/80 leading-tight">
                  Supermarket Expiry System
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button when expanded */}
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
          )}

          {/* Mobile Close Button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition-colors cursor-pointer"
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Collapse toggle bar when collapsed */}
        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-emerald-900/60 bg-emerald-900/20">
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-md transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className={`py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && (
            <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider px-3 mb-2">
              {currentRole === 'CASHIER' ? 'Cashier Station' : 'Operations & Auditing'}
            </div>
          )}

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                title={collapsed ? `${item.label}${item.badgeCount ? ` (${item.badgeCount} alerts)` : ''}` : undefined}
                className={`relative w-full flex items-center rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  collapsed
                    ? 'justify-center p-3'
                    : 'justify-between px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-xs font-semibold ring-1 ring-emerald-600/50'
                    : 'text-emerald-100/80 hover:bg-emerald-900 hover:text-white'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-emerald-300' : 'text-emerald-400/80'
                      }`}
                    />
                    {/* Collapsed dot/badge indicator */}
                    {collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                      <span
                        className={`absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-emerald-950 ${
                          item.badgeType === 'critical'
                            ? 'bg-red-500 animate-pulse'
                            : 'bg-amber-400'
                        }`}
                      />
                    )}
                  </div>

                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      item.badgeType === 'critical'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-amber-400 text-amber-950'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: Logged In User & Sign Out */}
      <div
        className={`border-t border-emerald-900/80 bg-emerald-900/30 shrink-0 space-y-3 transition-all duration-300 ${
          collapsed ? 'p-2.5' : 'p-4'
        }`}
      >
        {currentUser && (
          <div
            className={`rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center ${
              collapsed ? 'p-2 justify-center' : 'p-2.5 gap-2.5'
            }`}
            title={
              collapsed
                ? `${currentUser.fullName} (${currentUser.role === 'STORE_MANAGER' ? 'Manager' : 'Cashier'} • ${currentUser.employeeCode})`
                : undefined
            }
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-800 text-emerald-200 border border-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{currentUser.fullName}</div>
                <div className="text-[10px] text-emerald-300 flex items-center gap-1 truncate font-mono">
                  <span>{currentUser.employeeCode}</span>
                  <span>&bull;</span>
                  <span className="capitalize">
                    {currentUser.role === 'STORE_MANAGER'
                      ? 'Manager'
                      : currentUser.role === 'TENANT_ADMIN'
                      ? 'Admin'
                      : 'Cashier'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            onSignOut();
            if (onCloseMobile) onCloseMobile();
          }}
          title={collapsed ? 'Sign Out' : undefined}
          className={`w-full flex items-center justify-center gap-2 bg-emerald-900/60 hover:bg-red-950/60 text-emerald-100 hover:text-red-200 rounded-xl text-xs font-semibold border border-emerald-800/80 hover:border-red-800/60 shadow-xs transition-colors cursor-pointer group ${
            collapsed ? 'py-2.5 px-0' : 'px-3 py-2.5'
          }`}
        >
          <ArrowRightOnRectangleIcon className="w-4 h-4 text-emerald-300 group-hover:text-red-300 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {!collapsed && (
          <div className="text-[10px] text-emerald-400/70 text-center">
            ExpiryGuard Multi-Tenant Architecture
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky & Full Height Sidebar touching left edge */}
      <aside
        className={`hidden md:flex bg-emerald-950 text-emerald-100 flex-col shrink-0 border-r border-emerald-900 select-none sticky top-0 h-screen overflow-y-auto overflow-x-hidden z-20 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[72px]' : 'w-64 lg:w-72'
        }`}
      >
        {renderNavContent(isCollapsed)}
      </aside>

      {/* Mobile Slide-in Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-emerald-950 text-emerald-100 shadow-2xl flex flex-col z-50 overflow-y-auto animate-slide-in-right">
            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto">
              {renderNavContent(false)}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
