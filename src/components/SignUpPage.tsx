import React, { useState } from 'react';
import { Tenant, User } from '../types/index.ts';
import { ExpiryGuardLogo } from './ExpiryGuardLogo.tsx';
import {
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BuildingStorefrontIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface SignUpPageProps {
  currentTenant: Tenant;
  onSignUp: (user: User, tenant: Tenant) => void;
  onNavigateLogin: () => void;
  onNavigateHome?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  currentTenant,
  onSignUp,
  onNavigateLogin,
  onNavigateHome,
}) => {
  const [fullName, setFullName] = useState('');
  const [storeName, setStoreName] = useState('GreenMart Supermarket');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const cleanStoreName = storeName.trim() || 'My Supermarket';
      const storeCode = `GM-${cleanStoreName
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase()}`;

      // Create new Tenant for this manager
      const newTenant: Tenant = {
        id: `tenant-${Date.now()}`,
        name: cleanStoreName,
        code: storeCode,
        branchType: 'Flagship Supermarket',
        address: '100 Market Center Way',
        city: 'Metropolitan District',
        contactEmail: email.trim().toLowerCase(),
        contactPhone: '+1 (555) 019-8800',
        warningThresholdDays: 30,
        criticalThresholdDays: 7,
        defaultClearanceDiscount: 35,
      };

      const newManager: User = {
        id: `usr-mgr-${Date.now()}`,
        tenantId: newTenant.id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        role: 'STORE_MANAGER',
        employeeCode: `MGR-${Math.floor(1000 + Math.random() * 9000)}`,
        lastLogin: 'Just now',
      };

      setIsLoading(false);
      onSignUp(newManager, newTenant);
    }, 450);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-10 font-sans">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white p-2 shadow-md border border-emerald-100 ring-4 ring-emerald-50 mb-3">
            <ExpiryGuardLogo className="w-full h-full" variant="original" />
          </div>
          <h1 className="text-2xl font-bold text-gray-950 tracking-tight">Manager Registration</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set up your supermarket workspace & expiry management portal
          </p>
        </div>

        {/* Off-White Form Card */}
        <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs">
          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Manager Full Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="name-input">
                Manager Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="name-input"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Supermarket / Store Name */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="store-input">
                Supermarket / Store Name
              </label>
              <div className="relative">
                <BuildingStorefrontIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="store-input"
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. GreenMart Flagship"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 placeholder-gray-400 transition-colors"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                You can manage single stores or add extra branches later inside the manager dashboard.
              </p>
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="signup-email-input">
                Manager Work Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="signup-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@supermarket.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 placeholder-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="signup-password-input">
                Create Password
              </label>
              <div className="relative">
                <LockClosedIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="signup-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5" htmlFor="confirm-password-input">
                Confirm Password
              </label>
              <div className="relative">
                <LockClosedIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  id="confirm-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 text-gray-900 rounded-xl text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors"
                />
              </div>
            </div>

            {/* Primary Sign Up Button */}
            <button
              id="submit-signup-btn"
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
                  <span>Registering Store Workspace...</span>
                </span>
              ) : (
                <>
                  <span>Create Manager Workspace</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 pt-5 border-t border-stone-200 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onNavigateLogin}
                className="text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer ml-1"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Subtle Footer Note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Protected by enterprise security &bull; ExpiryGuard Systems
        </p>
      </div>
    </div>
  );
};
