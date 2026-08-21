import React, { useState } from 'react';
import { Tenant, User } from '../types/index.ts';
import {
  XMarkIcon,
  UserPlusIcon,
  IdentificationIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingStorefrontIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';

interface AddCashierModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: Tenant;
  onAddCashier: (newCashier: User) => void;
}

export const AddCashierModal: React.FC<AddCashierModalProps> = ({
  isOpen,
  onClose,
  currentTenant,
  onAddCashier,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState(
    `CSH-${Math.floor(100 + Math.random() * 900)}`
  );
  const [terminalStation, setTerminalStation] = useState('Checkout Lane 01');
  const [password, setPassword] = useState('cashier123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage('Please enter the cashier full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid work email or username.');
      return;
    }

    const newCashier: User = {
      id: `usr-csh-${Date.now()}`,
      tenantId: currentTenant.id,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      role: 'CASHIER',
      employeeCode: employeeCode.trim() || `CSH-${Math.floor(100 + Math.random() * 900)}`,
      lastLogin: 'Never (New Account)',
    };

    onAddCashier(newCashier);
    onClose();

    // Reset fields
    setFullName('');
    setEmail('');
    setEmployeeCode(`CSH-${Math.floor(100 + Math.random() * 900)}`);
    setPassword('cashier123');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <UserPlusIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create Cashier Account</h2>
              <p className="text-xs text-gray-500">
                Grant POS register & scan terminal access for {currentTenant.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMessage}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cashier-name">
              Cashier Full Name *
            </label>
            <div className="relative">
              <IdentificationIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="cashier-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. David Miller"
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Work Email */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cashier-email">
              Work Email / Login Username *
            </label>
            <div className="relative">
              <EnvelopeIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="cashier-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. d.miller@supermarket.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Employee Code & Station */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cashier-code">
                Staff Badge / Code
              </label>
              <input
                id="cashier-code"
                type="text"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                placeholder="CSH-101"
                className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cashier-terminal">
                Assigned Terminal
              </label>
              <div className="relative">
                <ComputerDesktopIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="cashier-terminal"
                  type="text"
                  value={terminalStation}
                  onChange={(e) => setTerminalStation(e.target.value)}
                  placeholder="Lane 01"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Initial Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="cashier-password">
              Initial Temporary Password / PIN
            </label>
            <div className="relative">
              <LockClosedIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              <input
                id="cashier-password"
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Cashiers use this password to sign into the POS scanner and checkout terminals.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Create Cashier Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
