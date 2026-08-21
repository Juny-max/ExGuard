/**
 * ExpiryGuard - Multi-Tenant Supermarket Expiry Tracking SaaS
 * Strict Theme: Professional Green & White Palette
 * Icons: Heroicons ONLY
 * Emojis: Strictly Zero
 */

import React, { useState } from 'react';
import {
  Tenant,
  User,
  UserRole,
  ActiveNavTab,
  Batch,
  Product,
  Category,
  DisposalLog,
} from './types/index.ts';
import {
  INITIAL_TENANTS,
  INITIAL_USERS,
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  createMockBatches,
  INITIAL_DISPOSAL_LOGS,
  determineStatus,
} from './data/mockData.ts';

import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { BatchesView } from './components/BatchesView.tsx';
import { AlertsView } from './components/AlertsView.tsx';
import { FastScannerView } from './components/FastScannerView.tsx';
import { ClearanceView } from './components/ClearanceView.tsx';
import { DisposalView } from './components/DisposalView.tsx';
import { CategoriesView } from './components/CategoriesView.tsx';
import { TenantSettingsView } from './components/TenantSettingsView.tsx';
import { ProductEntryModal } from './components/ProductEntryModal.tsx';
import { DisposalModal } from './components/DisposalModal.tsx';
import { AuditReportModal } from './components/AuditReportModal.tsx';
import { AddCashierModal } from './components/AddCashierModal.tsx';
import { AddBranchModal } from './components/AddBranchModal.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { ForgotPasswordPage } from './components/ForgotPasswordPage.tsx';
import { SignUpPage } from './components/SignUpPage.tsx';
import { LandingHomePage } from './components/LandingHomePage.tsx';

export default function App() {
  // Global & Authentication State
  const [tenants, setTenants] = useState<Tenant[]>(INITIAL_TENANTS);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'HOME' | 'LOGIN' | 'FORGOT_PASSWORD' | 'SIGNUP'>('HOME');
  const [currentTenant, setCurrentTenant] = useState<Tenant>(INITIAL_TENANTS[0]);
  const [currentRole, setCurrentRole] = useState<UserRole>('STORE_MANAGER');
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('DASHBOARD');

  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [batches, setBatches] = useState<Batch[]>(createMockBatches());
  const [disposalLogs, setDisposalLogs] = useState<DisposalLog[]>(INITIAL_DISPOSAL_LOGS);

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDisposalModalOpen, setIsDisposalModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isAddCashierModalOpen, setIsAddCashierModalOpen] = useState(false);
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedBatchForDisposal, setSelectedBatchForDisposal] = useState<Batch | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auth Handlers
  const handleLogin = (user: User, tenant: Tenant) => {
    setCurrentUser(user);
    setCurrentTenant(tenant);
    setCurrentRole(user.role);
    setIsLoggedIn(true);
    
    // Route to role-specific dashboard
    if (user.role === 'CASHIER') {
      setActiveTab('CASHIER_SCAN');
      showToast(`Authenticated as Cashier: ${user.fullName}. Opened POS Terminal Dashboard.`);
    } else {
      setActiveTab('DASHBOARD');
      showToast(`Authenticated as Store Owner / Manager: ${user.fullName}. Opened Store Management Dashboard.`);
    }
  };

  const handleSignUp = (user: User, tenant: Tenant) => {
    // If it's a new manager creating a new store workspace
    setTenants((prev) => [tenant, ...prev]);
    setUsers((prev) => [user, ...prev]);
    setCurrentUser(user);
    setCurrentTenant(tenant);
    setCurrentRole(user.role);
    setIsLoggedIn(true);
    setActiveTab('DASHBOARD');
    showToast(`Store Manager account created for ${tenant.name}! Welcome, ${user.fullName}.`);
  };

  const handleSignOut = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setAuthView('HOME');
    setIsMobileMenuOpen(false);
    showToast('Signed out of terminal session.');
  };

  // Handlers
  const handleSelectTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    showToast(`Switched active tenant workspace to: ${tenant.name}`);
  };

  const handleAddCashier = (newCashier: User) => {
    setUsers((prev) => [newCashier, ...prev]);
    showToast(`Created Cashier account: ${newCashier.fullName} (${newCashier.employeeCode})`);
  };

  const handleAddBranch = (newBranch: Tenant) => {
    setTenants((prev) => [...prev, newBranch]);
    setCurrentTenant(newBranch);
    showToast(`Registered new branch location: ${newBranch.name} (${newBranch.code})`);
  };

  const handleSaveNewBatch = (newBatch: Batch, newProduct?: Product) => {
    if (newProduct) {
      setProducts((prev) => [newProduct, ...prev]);
    }
    setBatches((prev) => [newBatch, ...prev]);
    showToast(`Registered batch lot ${newBatch.batchNumber} for ${newBatch.productName}`);
  };

  const handleApplyDiscount = (batch: Batch, discountPct: number) => {
    const discountedPrice = batch.unitPrice * (1 - discountPct / 100);
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batch.id) {
          return {
            ...b,
            discountPercentage: discountPct,
            discountedPrice,
            status: 'DISCOUNTED',
          };
        }
        return b;
      })
    );
    showToast(`Applied ${discountPct}% clearance discount on ${batch.productName} (New Price: $${discountedPrice.toFixed(2)})`);
  };

  const handleOpenDisposalModal = (batch: Batch) => {
    setSelectedBatchForDisposal(batch);
    setIsDisposalModalOpen(true);
  };

  const handleConfirmDisposal = (log: DisposalLog) => {
    setDisposalLogs((prev) => [log, ...prev]);

    // Deduct stock or mark disposed
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === log.batchId) {
          const remaining = Math.max(0, b.currentQuantity - log.quantityDisposed);
          return {
            ...b,
            currentQuantity: remaining,
            status: remaining === 0 ? 'DISPOSED' : b.status,
          };
        }
        return b;
      })
    );

    showToast(`Disposal registered: ${log.quantityDisposed} units of ${log.productName} written off ($${log.totalLoss.toFixed(2)} loss logged).`);
  };

  const handleAuditBatch = (batch: Batch) => {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBatches((prev) =>
      prev.map((b) => {
        if (b.id === batch.id) {
          return {
            ...b,
            lastAuditedAt: `Today, ${nowStr}`,
            lastAuditedBy: currentUser?.fullName || (currentRole === 'STORE_MANAGER' ? 'Store Manager' : 'Cashier'),
          };
        }
        return b;
      })
    );
    showToast(`Shelf verification audited for ${batch.productName} (${batch.batchNumber}).`);
  };

  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    showToast(`Added department: ${newCat.name} with ${newCat.defaultShelfLifeDays}d standard shelf-life.`);
  };

  const handleUpdateTenant = (updated: Tenant) => {
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    setCurrentTenant(updated);
    showToast(`Tenant configuration updated for ${updated.name}.`);
  };

  // If not logged in, render LandingHomePage, LoginPage, ForgotPasswordPage, or SignUpPage
  if (!isLoggedIn || !currentUser) {
    if (authView === 'HOME') {
      return (
        <LandingHomePage
          onNavigateLogin={() => setAuthView('LOGIN')}
          onNavigateSignUp={() => setAuthView('SIGNUP')}
          onOpenDemoStore={() => {
            // Auto-sign in with demo Store Owner to immediately preview the system
            const demoUser = users.find((u) => u.role === 'STORE_MANAGER') || users[0];
            handleLogin(demoUser, currentTenant);
          }}
        />
      );
    }

    if (authView === 'FORGOT_PASSWORD') {
      return (
        <ForgotPasswordPage
          onBackToLogin={() => setAuthView('LOGIN')}
          defaultEmail="s.jenkins@greenmart.example.com"
        />
      );
    }

    if (authView === 'SIGNUP') {
      return (
        <SignUpPage
          currentTenant={currentTenant}
          onSignUp={handleSignUp}
          onNavigateLogin={() => setAuthView('LOGIN')}
          onNavigateHome={() => setAuthView('HOME')}
        />
      );
    }

    return (
      <LoginPage
        tenants={tenants}
        users={users}
        currentTenant={currentTenant}
        onLogin={handleLogin}
        onNavigateForgotPassword={() => setAuthView('FORGOT_PASSWORD')}
        onNavigateSignUp={() => setAuthView('SIGNUP')}
        onNavigateHome={() => setAuthView('HOME')}
      />
    );
  }

  // Urgent counts
  const tenantBatches = batches.filter((b) => b.tenantId === currentTenant.id && b.status !== 'DISPOSED');
  const expiredCount = tenantBatches.filter((b) => b.status === 'EXPIRED').length;
  const criticalCount = tenantBatches.filter((b) => b.status === 'CRITICAL_7').length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-950 text-emerald-50 px-4 py-3 rounded-xl shadow-xl border border-emerald-800 text-xs font-semibold flex items-center gap-2 max-w-md animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Left Sidebar (Full height, touching screen's left edge) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        currentRole={currentRole}
        currentUser={currentUser}
        expiredAlertsCount={expiredCount}
        criticalAlertsCount={criticalCount}
        onSignOut={handleSignOut}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        currentTenant={currentTenant}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Right Column: Top Header + Main Content View */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header
          currentTenant={currentTenant}
          allTenants={tenants}
          onSelectTenant={handleSelectTenant}
          currentUser={currentUser}
          currentRole={currentRole}
          batches={batches}
          onOpenNewProductModal={() => setIsProductModalOpen(true)}
          onOpenFastScanner={() => setActiveTab('CASHIER_SCAN')}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenAddBranchModal={() => setIsAddBranchModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            {activeTab === 'DASHBOARD' && (
              <DashboardView
                currentTenant={currentTenant}
                currentRole={currentRole}
                batches={batches}
                users={users}
                tenants={tenants}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onApplyDiscount={handleApplyDiscount}
                onOpenDisposalModal={handleOpenDisposalModal}
                onOpenFastScanner={() => setActiveTab('CASHIER_SCAN')}
                onOpenNewProductModal={() => setIsProductModalOpen(true)}
                onOpenAddCashierModal={() => setIsAddCashierModalOpen(true)}
                onOpenAddBranchModal={() => setIsAddBranchModalOpen(true)}
                onSelectTenant={handleSelectTenant}
              />
            )}

            {activeTab === 'INVENTORY' && (
              <BatchesView
                currentTenant={currentTenant}
                currentRole={currentRole}
                batches={batches}
                categories={categories}
                onOpenNewProductModal={() => setIsProductModalOpen(true)}
                onApplyDiscount={handleApplyDiscount}
                onOpenDisposalModal={handleOpenDisposalModal}
                onAuditBatch={handleAuditBatch}
              />
            )}

            {activeTab === 'ALERTS' && (
              <AlertsView
                currentTenant={currentTenant}
                currentRole={currentRole}
                batches={batches}
                onApplyDiscount={handleApplyDiscount}
                onOpenDisposalModal={handleOpenDisposalModal}
                onAuditBatch={handleAuditBatch}
              />
            )}

            {activeTab === 'CASHIER_SCAN' && (
              <FastScannerView
                currentTenant={currentTenant}
                currentRole={currentRole}
                batches={batches}
                onOpenDisposalModal={handleOpenDisposalModal}
              />
            )}

            {activeTab === 'CLEARANCE' && (
              <ClearanceView
                currentTenant={currentTenant}
                currentRole={currentRole}
                batches={batches}
                onApplyDiscount={handleApplyDiscount}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'DISPOSAL' && (
              <DisposalView
                currentTenant={currentTenant}
                currentRole={currentRole}
                batches={batches}
                onOpenDisposalModal={handleOpenDisposalModal}
                disposalLogs={disposalLogs}
              />
            )}

            {activeTab === 'CATEGORIES' && (
              <CategoriesView
                currentTenant={currentTenant}
                currentRole={currentRole}
                categories={categories}
                onAddCategory={handleAddCategory}
              />
            )}

            {activeTab === 'SETTINGS' && (
              <TenantSettingsView
                currentTenant={currentTenant}
                allTenants={tenants}
                currentRole={currentRole}
                users={users}
                onUpdateTenant={handleUpdateTenant}
                onOpenReportModal={() => setIsReportModalOpen(true)}
                onOpenAddCashierModal={() => setIsAddCashierModalOpen(true)}
                onOpenAddBranchModal={() => setIsAddBranchModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <ProductEntryModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        currentTenant={currentTenant}
        categories={categories.filter((c) => c.tenantId === currentTenant.id)}
        existingProducts={products.filter((p) => p.tenantId === currentTenant.id)}
        onSaveBatch={handleSaveNewBatch}
      />

      <DisposalModal
        isOpen={isDisposalModalOpen}
        onClose={() => {
          setIsDisposalModalOpen(false);
          setSelectedBatchForDisposal(null);
        }}
        batch={selectedBatchForDisposal}
        currentTenant={currentTenant}
        currentRole={currentRole}
        onConfirmDisposal={handleConfirmDisposal}
      />

      <AuditReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentTenant={currentTenant}
        batches={batches}
      />

      <AddCashierModal
        isOpen={isAddCashierModalOpen}
        onClose={() => setIsAddCashierModalOpen(false)}
        currentTenant={currentTenant}
        onAddCashier={handleAddCashier}
      />

      <AddBranchModal
        isOpen={isAddBranchModalOpen}
        onClose={() => setIsAddBranchModalOpen(false)}
        onAddTenant={handleAddBranch}
      />
    </div>
  );
}
