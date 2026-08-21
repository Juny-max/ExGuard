import React, { useState } from 'react';
import { Tenant, UserRole, Category } from '../types/index.ts';
import {
  FolderIcon,
  PlusIcon,
  ClockIcon,
  TagIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

interface CategoriesViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  categories: Category[];
  onAddCategory: (cat: Category) => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  currentTenant,
  currentRole,
  categories,
  onAddCategory,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [shelfLifeDays, setShelfLifeDays] = useState(14);
  const [description, setDescription] = useState('');

  const tenantCategories = categories.filter((c) => c.tenantId === currentTenant.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCat: Category = {
      id: `cat-${Date.now()}`,
      tenantId: currentTenant.id,
      name,
      code: code || `CAT-${name.slice(0, 3).toUpperCase()}`,
      description,
      defaultShelfLifeDays: Number(shelfLifeDays),
      colorBadge: 'emerald',
    };

    onAddCategory(newCat);
    setName('');
    setCode('');
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Departments & Shelf-Life Rules
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Default freshness lifespans and regulatory categories for {currentTenant.name}
          </p>
        </div>

        {currentRole === 'STORE_MANAGER' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{showAddForm ? 'Close Form' : 'Add Department'}</span>
          </button>
        )}
      </div>

      {/* Add Department Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Add New Supermarket Department</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Organic Dairy & Cheeses"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Category Code</label>
              <input
                type="text"
                placeholder="CAT-ORG"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Standard Shelf Life (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Department Scope & Description</label>
            <input
              type="text"
              placeholder="e.g. Chilled goat milk, artisan cheeses, cultured yogurts"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Save Department
            </button>
          </div>
        </form>
      )}

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tenantCategories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <FolderIcon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-gray-500">{cat.code}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <span>{cat.defaultShelfLifeDays}d Shelf-Life</span>
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mt-3">{cat.name}</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{cat.description}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckBadgeIcon className="w-4 h-4" />
                <span>Active Category</span>
              </span>
              <span>Tenant: {currentTenant.code}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
