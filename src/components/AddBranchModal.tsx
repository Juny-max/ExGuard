import React, { useState } from 'react';
import { Tenant } from '../types/index.ts';
import {
  XMarkIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

interface AddBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (newTenant: Tenant) => void;
}

export const AddBranchModal: React.FC<AddBranchModalProps> = ({
  isOpen,
  onClose,
  onAddTenant,
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter the store branch name.');
      return;
    }

    const generatedCode =
      code.trim().toUpperCase() ||
      `BR-${name
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 4)
        .toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

    const newTenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: name.trim(),
      code: generatedCode,
      branchType: 'Branch Supermarket',
      address: address.trim() || 'Main Shopping Street',
      city: city.trim() || 'Central Zone',
      contactEmail: contactEmail.trim() || 'store@supermarket.com',
      contactPhone: contactPhone.trim() || '+1 (555) 019-2831',
      warningThresholdDays: 30,
      criticalThresholdDays: 7,
      defaultClearanceDiscount: 35,
    };

    onAddTenant(newTenant);
    onClose();

    setName('');
    setCode('');
    setAddress('');
    setCity('');
    setContactEmail('');
    setContactPhone('');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <BuildingStorefrontIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Add Store Branch</h2>
              <p className="text-xs text-gray-500">
                Register a new location under your supermarket network
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

          {/* Branch Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="branch-name">
              Store / Branch Name *
            </label>
            <input
              id="branch-name"
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!code) {
                  setCode(
                    `BR-${e.target.value
                      .replace(/[^a-zA-Z0-9]/g, '')
                      .slice(0, 4)
                      .toUpperCase()}`
                  );
                }
              }}
              placeholder="e.g. GreenMart - Northgate Mall"
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Branch Code */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="branch-code">
              Branch Identifier Code
            </label>
            <input
              id="branch-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. GM-NORTH"
              className="w-full px-3 py-2 text-sm font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden uppercase"
            />
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="branch-address">
                Street Address
              </label>
              <div className="relative">
                <MapPinIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="branch-address"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="400 North Blvd"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="branch-city">
                City / Zone
              </label>
              <input
                id="branch-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="North District"
                className="w-full px-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="branch-email">
                Branch Email
              </label>
              <div className="relative">
                <EnvelopeIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="branch-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="north@supermarket.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1" htmlFor="branch-phone">
                Phone
              </label>
              <div className="relative">
                <PhoneIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  id="branch-phone"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+1 (555) 012-3456"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>
            </div>
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
              Register Branch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
