import React, { useState } from 'react';
import { Tenant, Category, Batch, Product } from '../types/index.ts';
import { calculateDaysRemaining, determineStatus } from '../data/mockData.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal.tsx';
import {
  XMarkIcon,
  PlusIcon,
  CalendarDaysIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';

interface ProductEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: Tenant;
  categories: Category[];
  existingProducts: Product[];
  onSaveBatch: (newBatch: Batch, newProduct?: Product) => void;
}

export const ProductEntryModal: React.FC<ProductEntryModalProps> = ({
  isOpen,
  onClose,
  currentTenant,
  categories,
  existingProducts,
  onSaveBatch,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Form states
  const [selectedProductId, setSelectedProductId] = useState<string>('NEW');
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [brand, setBrand] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [unit, setUnit] = useState('Pack');
  const [unitCost, setUnitCost] = useState<number>(2.50);
  const [unitPrice, setUnitPrice] = useState<number>(4.99);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);

  // Batch specific states
  const [batchNumber, setBatchNumber] = useState(`LOT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [dateReceived, setDateReceived] = useState(todayStr);
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 18);
    return d.toISOString().split('T')[0];
  });
  const [quantity, setQuantity] = useState<number>(24);
  const [locationAisle, setLocationAisle] = useState('Aisle 2 - Chilled Goods');
  const [locationShelf, setLocationShelf] = useState('Shelf Tier 2');
  const [supplierName, setSupplierName] = useState('Fresh Valley Direct');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  // Real-time calculation of status based on selected expiry date
  const calculatedDays = calculateDaysRemaining(expiryDate);
  const previewStatus = determineStatus(calculatedDays, false, 0);

  const handleProductSelect = (prodId: string) => {
    setSelectedProductId(prodId);
    if (prodId === 'NEW') {
      setProductName('');
      setBrand('');
      setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
      setBarcode(`890123${Math.floor(100000 + Math.random() * 900000)}`);
    } else {
      const prod = existingProducts.find((p) => p.id === prodId);
      if (prod) {
        setProductName(prod.name);
        setCategoryId(prod.categoryId);
        setBrand(prod.brand);
        setSku(prod.sku);
        setBarcode(prod.barcode);
        setUnit(prod.unit);
        setUnitPrice(prod.standardPrice);
        setUnitCost(prod.costPrice);
      }
    }
  };

  const handleAutoGenerateSKU = () => {
    const prefix = productName.slice(0, 3).toUpperCase() || 'ITM';
    setSku(`${prefix}-${Math.floor(100 + Math.random() * 900)}`);
    setBarcode(`890123${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim() || !expiryDate) return;

    const category = categories.find((c) => c?.id === categoryId) || categories[0] || {
      id: 'cat-general',
      tenantId: currentTenant?.id || 'tenant-default',
      name: 'General Groceries',
      code: 'CAT-GEN',
      description: 'General grocery category',
      defaultShelfLifeDays: 30,
      colorBadge: 'emerald',
    };

    let createdProduct: Product | undefined = undefined;
    const finalProductId = selectedProductId === 'NEW' ? `prod-${Date.now()}` : selectedProductId;

    if (selectedProductId === 'NEW') {
      createdProduct = {
        id: finalProductId,
        tenantId: currentTenant?.id || category.tenantId || 'tenant-default',
        categoryId: category.id,
        name: productName,
        brand: brand || 'House Brand',
        sku: sku || `SKU-${Date.now()}`,
        barcode: barcode || `890123${Date.now().toString().slice(-6)}`,
        unit,
        standardPrice: Number(unitPrice),
        costPrice: Number(unitCost),
        isPerishable: true,
      };
    }

    const newBatch: Batch = {
      id: `bat-${Date.now()}`,
      tenantId: currentTenant?.id || category.tenantId || 'tenant-default',
      productId: finalProductId,
      productName: productName,
      categoryName: category.name || 'General Groceries',
      brand: brand || 'House Brand',
      sku: sku || `SKU-${Date.now()}`,
      barcode: barcode || `890123${Date.now().toString().slice(-6)}`,
      batchNumber,
      quantityReceived: Number(quantity),
      currentQuantity: Number(quantity),
      unit,
      unitCost: Number(unitCost),
      unitPrice: Number(unitPrice),
      dateReceived,
      expiryDate,
      daysRemaining: calculatedDays,
      status: previewStatus,
      discountPercentage: 0,
      locationAisle,
      locationShelf,
      supplierName,
      notes,
    };

    onSaveBatch(newBatch, createdProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-stone-200 flex flex-col overflow-hidden transform transition-all my-auto">
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="min-w-0 pr-2">
            <h2 className="text-base sm:text-lg font-bold truncate">Log Fresh Product & Expiry Batch</h2>
            <p className="text-xs text-emerald-200 truncate">
              Tenant: {currentTenant.name} ({currentTenant.code})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors cursor-pointer shrink-0"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
          {/* Top selection: Existing product vs New */}
          <div className="bg-emerald-50/80 p-3 sm:p-4 rounded-xl border border-emerald-200">
            <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider mb-2">
              Catalog Product Link
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <select
                value={selectedProductId}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full min-w-0 flex-1 py-2.5 px-3 border border-emerald-300 rounded-xl text-xs sm:text-sm bg-white font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-hidden shadow-2xs"
              >
                <option value="NEW">+ Create New Product Definition</option>
                {existingProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>

              {selectedProductId === 'NEW' && (
                <button
                  type="button"
                  onClick={handleAutoGenerateSKU}
                  className="w-full sm:w-auto text-xs font-semibold text-emerald-800 hover:text-emerald-950 inline-flex items-center justify-center gap-1.5 bg-white px-3.5 py-2.5 rounded-xl border border-emerald-200 shadow-2xs cursor-pointer shrink-0"
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Auto-Generate SKU & Barcode</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Product Master Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1">
              1. Product Master Details
            </h3>
            
            {/* Product Name full row */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Organic Whole Milk 1L"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
              />
            </div>

            {/* Category & Brand */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Department / Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Brand / Producer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meadow Brook Farms"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>
            </div>

            {/* SKU & Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  SKU Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MBF-MLK-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Barcode (EAN/UPC) *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCameraScannerOpen(true)}
                    className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 inline-flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                  >
                    <CameraIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Scan Barcode</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="890123400101"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Batch Expiry & Quantities */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1">
              2. Lot Identification, Shelf-Life & Stock Received
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batch / Lot Number *
                </label>
                <input
                  type="text"
                  required
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Date Received
                </label>
                <input
                  type="date"
                  value={dateReceived}
                  onChange={(e) => setDateReceived(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>
            </div>

            {/* Expiration Date with Status Badge */}
            <div className="bg-emerald-50/70 p-3 sm:p-3.5 rounded-xl border border-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-emerald-950">
                  Product Expiration Date *
                </label>
                <StatusBadge status={previewStatus} daysRemaining={calculatedDays} size="sm" />
              </div>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm font-bold border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
              />
            </div>

            {/* Quantities & Pricing */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Qty Received *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full min-w-0 px-3 py-2.5 text-xs sm:text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Unit Type
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full min-w-0 px-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                >
                  <option value="Bottle">Bottle</option>
                  <option value="Pack">Pack</option>
                  <option value="Tub">Tub</option>
                  <option value="Carton">Carton</option>
                  <option value="Punnet">Punnet</option>
                  <option value="Loaf">Loaf</option>
                  <option value="Kg">Kg</option>
                  <option value="Container">Container</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Unit Cost (GH₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  className="w-full min-w-0 px-3 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Retail Price (GH₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Number(e.target.value))}
                  className="w-full min-w-0 px-3 py-2.5 text-xs sm:text-sm font-bold border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Physical Location & Supplier */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 pb-1">
              3. Supermarket Floor Location & Supplier
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Store Aisle / Zone
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aisle 4 - Dairy Cold Walk-in"
                  value={locationAisle}
                  onChange={(e) => setLocationAisle(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Shelf / Rack Tier
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shelf Tier 3 / Island B"
                  value={locationShelf}
                  onChange={(e) => setLocationShelf(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Meadow Brook Farms LLC"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batch Notes & Handling
                </label>
                <input
                  type="text"
                  placeholder="e.g. Keep strictly refrigerated at 4°C"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-w-0 px-3.5 py-2.5 text-xs sm:text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-center"
            >
              Save & Register Batch
            </button>
          </div>
        </form>

        {/* Live Camera Scanner for Barcode Intake */}
        <CameraBarcodeScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          currentTenant={currentTenant}
          batches={[]}
          title="Scan Product Box Barcode"
          subtitle="Point camera at product UPC/EAN code on delivery carton"
          onBarcodeDetected={(code) => {
            setBarcode(code);
            const matchedExisting = existingProducts.find(
              (p) => p.barcode.toLowerCase() === code.toLowerCase()
            );
            if (matchedExisting) {
              handleProductSelect(matchedExisting.id);
            }
            setIsCameraScannerOpen(false);
          }}
        />
      </div>
    </div>
  );
};
