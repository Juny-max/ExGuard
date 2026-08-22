import React, { useState, useRef } from 'react';
import { Tenant, UserRole, Batch, User, CartItem, SaleReceipt } from '../types/index.ts';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal.tsx';
import { ReceiptBarcode } from './ReceiptBarcode.tsx';
import { ReceiptVerificationModal } from './ReceiptVerificationModal.tsx';
import { INITIAL_RECEIPTS } from '../data/mockReceipts.ts';
import { formatCedi, CURRENCY_SYMBOL } from '../utils/currency.ts';
import { printElementById } from '../utils/printReceipt.ts';
import {
  QrCodeIcon,
  CameraIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  PrinterIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  XMarkIcon,
  ReceiptPercentIcon,
  ArrowPathRoundedSquareIcon,
} from '@heroicons/react/24/outline';

interface FastScannerViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  currentUser?: User | null;
  batches: Batch[];
  onOpenDisposalModal: (batch: Batch) => void;
  onRecordSale?: (items: CartItem[]) => void;
}

export const FastScannerView: React.FC<FastScannerViewProps> = ({
  currentTenant,
  currentUser,
  batches = [],
  onRecordSale,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [scanStatusType, setScanStatusType] = useState<'SUCCESS' | 'WARNING' | 'ERROR' | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<SaleReceipt | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_PAY'>('CARD');

  // Receipt Verification & Return State
  const [savedReceipts, setSavedReceipts] = useState<SaleReceipt[]>(INITIAL_RECEIPTS);
  const [verifiedReceiptForReturn, setVerifiedReceiptForReturn] = useState<SaleReceipt | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement | null>(null);
  
  // Get batches belonging to this tenant, or fallback to all batches if tenant specific ones are empty
  const tenantBatches = (batches || []).filter((b) => b && b.tenantId === currentTenant?.id && b.status !== 'DISPOSED');
  const availableCatalog = tenantBatches.length > 0 ? tenantBatches : (batches || []).filter((b) => b && b.status !== 'DISPOSED');

  // Sound feedback helper
  const playSound = (type: 'SUCCESS' | 'WARNING' | 'ERROR') => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'SUCCESS') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High chime A5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === 'WARNING') {
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.08); // A5
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.22);
      } else {
        // Error Buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Helper to compute batch pricing and expiry markdown
  const getBatchDetails = (batch: Batch) => {
    const isExpired = batch.status === 'EXPIRED' || batch.daysRemaining <= 0;
    const isCritical = batch.status === 'CRITICAL_7' || (batch.daysRemaining > 0 && batch.daysRemaining <= 7);
    const isWarning = batch.status === 'WARNING_14' || batch.status === 'WARNING_30' || (batch.daysRemaining > 7 && batch.daysRemaining <= 30);

    let discountPercent = batch.discountPercentage || 0;
    if (discountPercent === 0) {
      if (isCritical) discountPercent = 50;
      else if (isWarning) discountPercent = 25;
    }

    const originalPrice = batch.unitPrice || 4.99;
    const unitPrice = discountPercent > 0
      ? Number((originalPrice * (1 - discountPercent / 100)).toFixed(2))
      : originalPrice;

    return {
      isExpired,
      isCritical,
      isWarning,
      isClearance: discountPercent > 0 && !isExpired,
      discountPercent,
      originalPrice,
      unitPrice,
    };
  };

  // Main Barcode Scan Handler (supports Product SKUs & Receipt Return Barcodes)
  const handleScan = async (codeToScan: string) => {
    const code = codeToScan.trim();
    if (!code) return;

    // 1. CHECK IF SCANNED CODE IS A RECEIPT BARCODE (e.g. INV-123456 or rcpt-...)
    const normalizedCode = code.toUpperCase().replace(/[*]/g, '');
    const isReceiptCode = normalizedCode.startsWith('INV') || normalizedCode.startsWith('RCPT');

    if (isReceiptCode) {
      // Look up in local saved receipts first
      let matchedReceipt = savedReceipts.find(
        (r) =>
          r.receiptNumber.toUpperCase() === normalizedCode ||
          (r.barcodeValue && r.barcodeValue.toUpperCase().replace(/[^A-Z0-9-]/g, '') === normalizedCode) ||
          r.id.toUpperCase() === normalizedCode
      );

      // If not in local cache, query backend API
      if (!matchedReceipt) {
        try {
          const res = await fetch(`/api/sales/lookup/${encodeURIComponent(normalizedCode)}`, {
            headers: { 'x-tenant-id': currentTenant?.id || 'tenant-main' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data.data) {
              matchedReceipt = data.data;
            }
          }
        } catch {
          // fallback
        }
      }

      if (matchedReceipt) {
        playSound('SUCCESS');
        setScanStatusType('SUCCESS');
        setScanStatusMessage(
          `🔍 RECEIPT AUTHENTICATED: ${matchedReceipt.receiptNumber} (${matchedReceipt.items.length} items, Total: ${formatCedi(matchedReceipt.total)}). Opening Returns & Verification window.`
        );
        setVerifiedReceiptForReturn(matchedReceipt);
        setIsVerificationModalOpen(true);
        setBarcodeInput('');
        return;
      }
    }

    // 2. CHECK PRODUCT CATALOG BARCODES
    const matched = availableCatalog.find(
      (b) =>
        b &&
        (b.barcode.toLowerCase() === code.toLowerCase() ||
        b.sku.toLowerCase() === code.toLowerCase() ||
        b.batchNumber.toLowerCase() === code.toLowerCase())
    );

    if (!matched) {
      playSound('ERROR');
      setScanStatusType('ERROR');
      setScanStatusMessage(`Barcode or Receipt "${code}" not found in supermarket database.`);
      setBarcodeInput('');
      return;
    }

    const { isExpired, isClearance, discountPercent, unitPrice, originalPrice } = getBatchDetails(matched);

    // BLOCK EXPIRED PRODUCT FROM SALE
    if (isExpired) {
      playSound('ERROR');
      setScanStatusType('ERROR');
      setScanStatusMessage(
        `⛔ SALE BLOCKED! "${matched.productName}" is EXPIRED (${Math.abs(matched.daysRemaining)} days ago). Remove from shelf immediately.`
      );
      setBarcodeInput('');
      return;
    }

    // ADD SAFE OR CLEARANCE ITEM TO CART
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.batch?.id === matched.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      } else {
        return [
          ...prev,
          {
            batch: matched,
            quantity: 1,
            unitPrice,
            originalPrice,
            discountPercent,
            isClearance,
          },
        ];
      }
    });

    if (isClearance) {
      playSound('WARNING');
      setScanStatusType('WARNING');
      setScanStatusMessage(
        `🏷️ CLEARANCE MARKDOWN APPLIED: ${discountPercent}% OFF on ${matched.productName}! Price: ${formatCedi(unitPrice)}`
      );
    } else {
      playSound('SUCCESS');
      setScanStatusType('SUCCESS');
      setScanStatusMessage(`✅ ADDED: ${matched.productName} — ${formatCedi(unitPrice)}`);
    }

    setBarcodeInput('');
    inputRef.current?.focus();
  };

  const updateQuantity = (batchId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.batch?.id === batchId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (batchId: string) => {
    setCart((prev) => prev.filter((item) => item.batch?.id !== batchId));
  };

  const clearCart = () => {
    setCart([]);
    setScanStatusMessage(null);
    setScanStatusType(null);
    setActiveReceipt(null);
  };

  // Calculations
  const grossSubtotal = cart.reduce((acc, item) => acc + (item.originalPrice || item.unitPrice) * item.quantity, 0);
  const netSubtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalSavings = grossSubtotal - netSubtotal;
  const tax = Number((netSubtotal * 0.05).toFixed(2)); // 5% grocery sales tax
  const grandTotal = netSubtotal + tax;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const receiptNum = `INV-${randomSuffix}`;

    const receipt: SaleReceipt = {
      id: `rcpt-${Date.now()}-${randomSuffix}`,
      receiptNumber: receiptNum,
      barcodeValue: receiptNum,
      tenantId: currentTenant?.id || 'tenant-main',
      cashierName: currentUser?.fullName || 'Cashier Terminal #1',
      items: [...cart],
      subtotal: grossSubtotal,
      savings: totalSavings,
      tax,
      total: grandTotal,
      timestamp: new Date().toLocaleString(),
      paymentMethod,
    };

    setSavedReceipts((prev) => [receipt, ...prev]);
    setActiveReceipt(receipt);
    playSound('SUCCESS');

    // Notify parent state & log sale
    if (onRecordSale) {
      onRecordSale(cart);
    }

    // Call backend API if available to persist transaction log
    try {
      await fetch('/api/sales/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': currentTenant?.id || 'tenant-main',
        },
        body: JSON.stringify(receipt),
      });
    } catch {
      // Offline / fallback mode handled seamlessly
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShoppingCartIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight">
                POS Checkout & Returns Register
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-600">
              Scan product SKUs to ring sales, or scan receipt barcodes (<strong className="font-mono text-emerald-800">INV-XXXXXX</strong>) to process returns & refunds.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {savedReceipts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setVerifiedReceiptForReturn(savedReceipts[0]);
                setIsVerificationModalOpen(true);
              }}
              className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs sm:text-sm font-bold rounded-xl border border-stone-300 inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              title="View recent receipts & returns"
            >
              <ArrowPathRoundedSquareIcon className="w-4 h-4 text-stone-600" />
              <span>Lookup Returns</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCameraScannerOpen(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-600/20 shrink-0"
          >
            <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Open Camera Scanner</span>
          </button>
        </div>
      </div>

      {/* Main Register 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Scanner & Catalog Simulator */}
        <div className="lg:col-span-7 space-y-5">
          {/* Scanner Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-emerald-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                Barcode / SKU / Receipt Scanner Gun Input
              </label>
              <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Supports INV- Barcodes
              </span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScan(barcodeInput);
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <QrCodeIcon className="w-5 h-5 text-stone-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Scan product barcode (890123400101) or Receipt barcode (INV-482910)..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 bg-stone-50 border border-stone-300 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-mono font-medium outline-hidden transition-all shadow-inner"
                  autoFocus
                />
                {barcodeInput && (
                  <button
                    type="button"
                    onClick={() => setBarcodeInput('')}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
              >
                Scan Code
              </button>
            </form>

            {/* Live Scan Outcome Alert */}
            {scanStatusMessage && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs sm:text-sm ${
                  scanStatusType === 'ERROR'
                    ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
                    : scanStatusType === 'WARNING'
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                }`}
              >
                {scanStatusType === 'ERROR' && <XCircleIcon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
                {scanStatusType === 'WARNING' && (
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                {scanStatusType === 'SUCCESS' && (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p>{scanStatusMessage}</p>
                </div>
              </div>
            )}
          </div>

          {/* Quick-Tap Store Inventory Catalog */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Store Catalog (Tap any product to simulate scanning)
              </span>
              <span className="text-xs text-stone-500">{availableCatalog.length} items</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {availableCatalog.map((batch) => {
                const { isExpired, isClearance, discountPercent, unitPrice, originalPrice } =
                  getBatchDetails(batch);
                return (
                  <button
                    key={batch.id}
                    type="button"
                    onClick={() => handleScan(batch.barcode)}
                    className="p-3 rounded-xl border border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-left transition-all cursor-pointer flex items-center justify-between gap-2 shadow-2xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {batch.productName}
                        </span>
                        {isExpired && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-black border border-rose-200">
                            EXPIRED
                          </span>
                        )}
                        {isClearance && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                            -{discountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                        {batch.barcode} • Exp: {batch.expiryDate}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-emerald-900 block">
                        {formatCedi(unitPrice)}
                      </span>
                      {isClearance && (
                        <span className="text-[10px] text-stone-400 line-through block">
                          {formatCedi(originalPrice)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Active Shopping Cart, Totals & Checkout */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h2 className="text-base font-bold text-stone-900">Current Customer Bill</h2>
                <span className="text-xs text-stone-500">
                  {cart.reduce((a, c) => a + c.quantity, 0)} items in cart
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 cursor-pointer flex items-center gap-1"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  <span>Void All</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto max-h-72 space-y-2.5 pr-1 divide-y divide-stone-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-stone-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center">
                    <ReceiptPercentIcon className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-stone-700">No items scanned yet</p>
                  <p className="text-xs text-stone-500">
                    Scan barcodes with the camera/scanner gun or tap items from the catalog.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.batch?.id} className="pt-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {item.batch?.productName}
                        </span>
                        {item.isClearance && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                            -{item.discountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2">
                        <span>{formatCedi(item.unitPrice)} each</span>
                        {item.isClearance && (
                          <span className="line-through text-stone-400">
                            {formatCedi(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.batch?.id, -1)}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
                      >
                        <MinusIcon className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-black text-stone-900 w-5 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.batch?.id, 1)}
                        className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center cursor-pointer"
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Item Subtotal */}
                    <div className="text-right shrink-0 min-w-[55px]">
                      <span className="text-xs font-black text-stone-900">
                        {formatCedi(item.unitPrice * item.quantity)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.batch?.id)}
                      className="text-stone-400 hover:text-rose-600 cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            {cart.length > 0 && (
              <div className="pt-2 border-t border-stone-200 space-y-2">
                <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                  Payment Method
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <CreditCardIcon className="w-4 h-4" />
                    <span>Card POS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <BanknotesIcon className="w-4 h-4" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MOBILE_PAY')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      paymentMethod === 'MOBILE_PAY'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    <DevicePhoneMobileIcon className="w-4 h-4" />
                    <span>Mobile Pay</span>
                  </button>
                </div>
              </div>
            )}

            {/* Calculations & Total Bill */}
            <div className="pt-3 border-t border-stone-200 space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Gross Subtotal:</span>
                <span className="font-semibold text-stone-800">{formatCedi(grossSubtotal)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Clearance Savings:</span>
                  <span>-{formatCedi(totalSavings)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Estimated Tax (5%):</span>
                <span className="font-semibold text-stone-800">{formatCedi(tax)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-base font-black text-stone-900">
                <span>Total Amount:</span>
                <span className="text-xl text-emerald-800">{formatCedi(grandTotal)}</span>
              </div>
            </div>

            {/* Complete Sale & Generate Invoice Button */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={cart.length === 0}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-200 disabled:text-stone-400 text-white text-sm font-black rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <PrinterIcon className="w-5 h-5" />
              <span>Complete Sale & Generate Invoice</span>
            </button>
          </div>
        </div>
      </div>

      {/* Camera Barcode Scanner Modal */}
      {isCameraScannerOpen && (
        <CameraBarcodeScannerModal
          isOpen={isCameraScannerOpen}
          onClose={() => setIsCameraScannerOpen(false)}
          currentTenant={currentTenant}
          batches={batches}
          onBarcodeDetected={(scannedCode) => {
            setIsCameraScannerOpen(false);
            handleScan(scannedCode);
          }}
          onScanSuccess={(scannedCode) => {
            setIsCameraScannerOpen(false);
            handleScan(scannedCode);
          }}
        />
      )}

      {/* Generated Customer Invoice / Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
            {/* Header - Fixed */}
            <div className="p-4 bg-emerald-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-bold text-sm">Sale Completed Successfully</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="text-white hover:text-emerald-200 cursor-pointer p-1 rounded-lg hover:bg-emerald-800/50 transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Printable Receipt Paper Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-100/90 overscroll-contain">
              <div
                id="printable-receipt"
                className="bg-white rounded-none sm:rounded-sm shadow-md border border-stone-200/80 mx-auto max-w-sm overflow-hidden"
              >
                {/* Top ZigZag Sawtooth Edge */}
                <div className="w-full overflow-hidden leading-none select-none bg-stone-200/60">
                  <svg
                    className="w-full h-3 text-white fill-current block"
                    viewBox="0 0 240 10"
                    preserveAspectRatio="none"
                  >
                    <polygon points="0,10 5,0 10,10 15,0 20,10 25,0 30,10 35,0 40,10 45,0 50,10 55,0 60,10 65,0 70,10 75,0 80,10 85,0 90,10 95,0 100,10 105,0 110,10 115,0 120,10 125,0 130,10 135,0 140,10 145,0 150,10 155,0 160,10 165,0 170,10 175,0 180,10 185,0 190,10 195,0 200,10 205,0 210,10 215,0 220,10 225,0 230,10 235,0 240,10 240,10 0,10" />
                  </svg>
                </div>

                {/* Thermal Receipt Content Body */}
                <div className="p-4 sm:p-5 font-mono text-xs text-stone-900 space-y-3.5 bg-white">
                  {/* Store Header */}
                  <div className="text-center space-y-1">
                    <h3 className="font-black text-sm sm:text-base text-stone-950 uppercase tracking-wide">
                      {currentTenant?.name || 'SUPERMARKET STORE'}
                    </h3>
                    <p className="text-[10px] text-stone-600 font-sans">
                      {currentTenant?.code || 'FLAGSHIP'} - POS REGISTER #01
                    </p>
                    <div className="border-b border-dashed border-stone-400 my-2 pt-1" />
                    
                    <div className="flex justify-between text-[10px] text-stone-600">
                      <span>RCVD: {activeReceipt.timestamp}</span>
                      <span>TERM: #POS-01</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-600">
                      <span>CASHIER: {activeReceipt.cashierName.toUpperCase()}</span>
                      <span>RCPT: <strong className="text-stone-900">{activeReceipt.receiptNumber}</strong></span>
                    </div>
                    <div className="border-b border-dashed border-stone-400 my-2" />
                  </div>

                  {/* Items List */}
                  <div>
                    <div className="flex justify-between font-bold text-stone-900 pb-1 border-b border-stone-900 text-[10px] uppercase tracking-wider">
                      <span className="flex-1">ITEM DESCRIPTION</span>
                      <span className="w-10 text-center">QTY</span>
                      <span className="w-16 text-right">TOTAL</span>
                    </div>

                    <div className="divide-y divide-stone-200/60 pt-1">
                      {activeReceipt.items.map((item, idx) => (
                        <div key={idx} className="py-1.5 text-[11px] space-y-0.5">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-stone-950 flex-1 pr-2 leading-tight">
                              {item.batch?.productName}
                            </span>
                            <span className="w-10 text-center font-bold text-stone-800">
                              x{item.quantity}
                            </span>
                            <span className="w-16 text-right font-bold text-stone-950">
                              {formatCedi(item.unitPrice * item.quantity)}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                            <span>SKU: {item.batch?.sku || item.batch?.barcode}</span>
                            {item.isClearance && (
                              <span className="font-bold text-emerald-800 bg-emerald-50 px-1 rounded border border-emerald-300 text-[9px]">
                                MARKDOWN -{item.discountPercent}% ({formatCedi(item.unitPrice)}/ea)
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Calculation */}
                  <div className="border-t border-dashed border-stone-400 pt-2 space-y-1 text-[11px]">
                    <div className="flex justify-between text-stone-700">
                      <span>GROSS SUBTOTAL:</span>
                      <span className="font-semibold text-stone-900">{formatCedi(activeReceipt.subtotal)}</span>
                    </div>
                    {activeReceipt.savings > 0 && (
                      <div className="flex justify-between text-emerald-800 font-bold">
                        <span>CLEARANCE MARKDOWN:</span>
                        <span>-{formatCedi(activeReceipt.savings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-stone-700">
                      <span>VALUE ADDED TAX (5%):</span>
                      <span className="font-semibold text-stone-900">{formatCedi(activeReceipt.tax)}</span>
                    </div>

                    {/* Prominent Double Line Total */}
                    <div className="border-t-2 border-b-2 border-stone-900 py-1.5 my-1.5 flex justify-between items-center">
                      <span className="font-black text-sm text-stone-950 tracking-tight">TOTAL PAID:</span>
                      <span className="font-black text-base text-stone-950">{formatCedi(activeReceipt.total)}</span>
                    </div>

                    <div className="flex justify-between text-[10px] text-stone-600 pt-0.5">
                      <span>TENDER METHOD:</span>
                      <span className="font-bold text-stone-900 uppercase">{activeReceipt.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-600">
                      <span>PAYMENT STATUS:</span>
                      <span className="font-bold text-emerald-800 uppercase">APPROVED / SETTLED</span>
                    </div>
                  </div>

                  {/* Footer & Barcode Section */}
                  <div className="text-center pt-2 space-y-2 border-t border-dashed border-stone-400">
                    <p className="text-[10px] font-bold text-stone-800 tracking-wider uppercase">
                      *** THANK YOU FOR SHOPPING! ***
                    </p>
                    
                    {/* Authentic Code-128 SVG Barcode */}
                    <div className="py-1">
                      <ReceiptBarcode
                        value={activeReceipt.barcodeValue || activeReceipt.receiptNumber}
                      />
                    </div>

                    <p className="text-[9px] text-stone-500 font-sans leading-tight">
                      Items with intact packaging eligible for return within 7 days with this barcode receipt.
                    </p>
                    <p className="text-[8px] text-stone-400 font-mono">
                      EXPIRYGUARD POS ENTERPRISE v2.4
                    </p>
                  </div>
                </div>

                {/* Bottom ZigZag Sawtooth Edge */}
                <div className="w-full overflow-hidden leading-none select-none bg-stone-200/60">
                  <svg
                    className="w-full h-3 text-white fill-current block"
                    viewBox="0 0 240 10"
                    preserveAspectRatio="none"
                  >
                    <polygon points="0,0 5,10 10,0 15,10 20,0 25,10 30,0 35,10 40,0 45,10 50,0 55,10 60,0 65,10 70,0 75,10 80,0 85,10 90,0 95,10 100,0 105,10 110,0 115,10 120,0 125,10 130,0 135,10 140,0 145,10 150,0 155,10 160,0 165,10 170,0 175,10 180,0 185,10 190,0 195,10 200,0 205,10 210,0 215,10 220,0 225,10 230,0 235,10 240,0 240,0 0,0" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Modal Actions - Fixed at bottom */}
            <div className="p-4 bg-white border-t border-stone-200 flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const success = printElementById('printable-receipt', `Receipt-${activeReceipt.receiptNumber}`);
                  if (!success) {
                    window.print();
                  }
                }}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
                title="Print receipt slip"
              >
                <PrinterIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Print Invoice Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveReceipt(null);
                  clearCart();
                }}
                className="px-6 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors text-center"
              >
                New Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Verification & Return Refund Modal */}
      {isVerificationModalOpen && (
        <ReceiptVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            setVerifiedReceiptForReturn(null);
          }}
          receipt={verifiedReceiptForReturn}
          currentUser={currentUser}
          onProcessReturn={(refundData) => {
            setScanStatusType('SUCCESS');
            setScanStatusMessage(
              `REFUND PROCESSED: ${formatCedi(refundData.refundTotal)} for Receipt ${refundData.receiptNumber}.`
            );
          }}
        />
      )}
    </div>
  );
};
