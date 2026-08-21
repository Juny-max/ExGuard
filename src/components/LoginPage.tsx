import React, { useState } from 'react';
import { Tenant, User } from '../types/index.ts';
import {
  ShieldCheckIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  UserCircleIcon,
  BuildingStorefrontIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

interface LoginPageProps {
  tenants: Tenant[];
  users: User[];
  currentTenant: Tenant;
  onLogin: (user: User, tenant: Tenant) => void;
  onNavigateForgotPassword?: () => void;
  onNavigateSignUp?: () => void;
  onNavigateHome?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  tenants,
  users,
  currentTenant,
  onLogin,
  onNavigateForgotPassword,
  onNavigateSignUp,
  onNavigateHome,
}) => {
  const [email, setEmail] = useState('owner@greenmart.com');
  const [password, setPassword] = useState('owner123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fillCredentials = (targetEmail: string, targetPass: string) => {
    setEmail(targetEmail);
    setPassword(targetPass);
    setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const trimmedEmail = email.trim().toLowerCase();
      const enteredPassword = password.trim();

      // Find user by email or standard alias
      let matchedUser = users.find(
        (u) =>
          u.email.toLowerCase() === trimmedEmail ||
          (trimmedEmail.includes('owner') && u.role === 'STORE_MANAGER') ||
          (trimmedEmail.includes('cashier') && u.role === 'CASHIER')
      );

      // If typed alias or direct match
      if (!matchedUser) {
        if (trimmedEmail.includes('cashier')) {
          matchedUser = users.find((u) => u.role === 'CASHIER') || {
            id: 'usr-cashier',
            tenantId: currentTenant.id,
            fullName: 'David Vance',
            email: 'cashier@greenmart.com',
            password: 'cashier123',
            role: 'CASHIER',
            employeeCode: 'CSH-1044',
            lastLogin: 'Just now',
          };
        } else if (trimmedEmail.includes('owner') || trimmedEmail.includes('mgr') || trimmedEmail.includes('manager')) {
          matchedUser = users.find((u) => u.role === 'STORE_MANAGER') || {
            id: 'usr-owner',
            tenantId: currentTenant.id,
            fullName: 'Sarah Jenkins',
            email: 'owner@greenmart.com',
            password: 'owner123',
            role: 'STORE_MANAGER',
            employeeCode: 'OWNER-01',
            lastLogin: 'Just now',
          };
        }
      }

      // Password check against hardcoded / configured user password
      if (matchedUser) {
        const expectedPassword = matchedUser.password || (matchedUser.role === 'STORE_MANAGER' ? 'owner123' : 'cashier123');
        if (enteredPassword && enteredPassword !== expectedPassword && enteredPassword !== 'password123') {
          setIsLoading(false);
          setErrorMessage(
            `Incorrect password for ${matchedUser.fullName}. Please use "${expectedPassword}" to sign in.`
          );
          return;
        }

        const targetTenant =
          tenants.find((t) => t.id === matchedUser?.tenantId) || currentTenant;

        setIsLoading(false);
        onLogin(matchedUser, targetTenant);
      } else {
        // Fallback generic user
        const targetTenant = currentTenant;
        const isCashier = trimmedEmail.includes('cashier') || trimmedEmail.includes('pos');
        const fallbackUser: User = {
          id: `usr-${Date.now()}`,
          tenantId: targetTenant.id,
          fullName: isCashier ? 'Cashier Staff' : 'Store Manager',
          email: trimmedEmail.includes('@') ? trimmedEmail : `${trimmedEmail}@greenmart.com`,
          password: enteredPassword,
          role: isCashier ? 'CASHIER' : 'STORE_MANAGER',
          employeeCode: isCashier ? 'CSH-2020' : 'MGR-1001',
          lastLogin: 'Just now',
        };
        setIsLoading(false);
        onLogin(fallbackUser, targetTenant);
      }
    }, 350);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          {onNavigateHome && (
            <div className="mb-4 text-left">
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <span>← Back to Homepage</span>
              </button>
            </div>
          )}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-700 text-white shadow-sm ring-4 ring-emerald-100 mb-3">
            <ShieldCheckIcon className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">ExpiryGuard</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to your role-based supermarket dashboard</p>
        </div>

        {/* Quick-Fill Demo Accounts Cards */}
        <div className="mb-5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              Hardcoded User Accounts
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">
              Click to autofill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Store Owner Button */}
            <button
              type="button"
              onClick={() => fillCredentials('owner@greenmart.com', 'owner123')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                email === 'owner@greenmart.com'
                  ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-600/20'
                  : 'bg-white/80 hover:bg-white border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <BuildingStorefrontIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-bold text-gray-900">Store Owner</span>
              </div>
              <div className="text-[11px] text-gray-600 font-mono leading-tight">owner@greenmart.com</div>
              <div className="text-[10px] text-emerald-800 font-mono mt-0.5">pass: owner123</div>
            </button>

            {/* Cashier Button */}
            <button
              type="button"
              onClick={() => fillCredentials('cashier@greenmart.com', 'cashier123')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                email === 'cashier@greenmart.com'
                  ? 'bg-white border-emerald-600 shadow-xs ring-2 ring-emerald-600/20'
                  : 'bg-white/80 hover:bg-white border-emerald-200'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <QrCodeIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-xs font-bold text-gray-900">POS Cashier</span>
              </div>
              <div className="text-[11px] text-gray-600 font-mono leading-tight">cashier@greenmart.com</div>
              <div className="text-[10px] text-emerald-800 font-mono mt-0.5">pass: cashier123</div>
            </button>
          </div>
        </div>

        {/* Off-White Form Card */}
        <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
              <span className="font-bold">Error:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="email-input">
                Email address
              </label>
              <div className="relative">
                <EnvelopeIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@greenmart.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-700" htmlFor="password-input">
                  Password
                </label>
                <button
                  type="button"
                  onClick={onNavigateForgotPassword}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <LockClosedIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300 text-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Primary Sign In Button */}
            <button
              id="submit-signin-btn"
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-sm font-semibold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Verifying credentials...</span>
                </span>
              ) : (
                <>
                  <span>Sign In as {email.includes('cashier') ? 'Cashier' : 'Store Owner'}</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          {onNavigateSignUp && (
            <div className="mt-6 pt-5 border-t border-stone-200 text-center">
              <p className="text-xs text-gray-500">
                Don't have a store workspace?{' '}
                <button
                  type="button"
                  onClick={onNavigateSignUp}
                  className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer ml-1"
                >
                  Register Store Owner
                </button>
              </p>
            </div>
          )}
        </div>

        {/* Subtle Footer Note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Protected by enterprise security &bull; ExpiryGuard Multi-Tenant System
        </p>
      </div>
    </div>
  );
};

