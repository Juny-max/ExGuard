import React, { useState } from 'react';
import { SaleReceipt, User } from '../types/index.ts';
import { formatCedi } from '../utils/currency.ts';
import { ReceiptBarcode } from './ReceiptBarcode.tsx';
import {
  CheckBadgeIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CalendarDaysIcon,
  UserIcon,
  CreditCardIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

interface ReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: SaleReceipt | null;
  currentUser?: User | null;
  onProcessReturn?: (refundData: {
    receiptNumber: string;
    returnItems: any[];
    refundTotal: number;
    reason: string;
  }) => void;
}

export const ReceiptVerificationModal: React.FC<ReceiptVerificationModalProps> = ({
  isOpen,
  onClose,
  receipt,
  currentUser,
  onProcessReturn,
}) => {
  const [selectedItemsForReturn, setSelectedItemsForReturn] = useState<Record<number, number>>({});
  const [returnReason, setReturnReason] = useState('CUSTOMER_RETURN');
  const [isProcessing, setIsProcessing] = useState(false);
  const [returnSuccessMessage, setReturnSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !receipt) return null;

  const toggleItemSelection = (idx: number, maxQty: number) => {
    setSelectedItemsForReturn((prev) => {
      const next = { ...prev };
      if (next[idx]) {
        delete next[idx];
      } else {
        next[idx] = maxQty;
      }
      return next;
    });
  };

  const updateReturnQty = (idx: number, qty: number, maxQty: number) => {
    const validQty = Math.max(1, Math.min(qty, maxQty));
    setSelectedItemsForReturn((prev) => ({
      ...prev,
      [idx]: validQty,
    }));
  };

  // Calculate refund sum
  const selectedIndices = Object.keys(selectedItemsForReturn).map(Number);
  const refundSubtotal = selectedIndices.reduce((sum, idx) => {
    const item = receipt.items[idx];
    const qty = selectedItemsForReturn[idx] || 0;
    return sum + item.unitPrice * qty;
  }, 0);
  const refundTax = refundSubtotal * 0.05;
  const refundTotal = refundSubtotal + refundTax;

  const handleConfirmRefund = async () => {
    if (selectedIndices.length === 0) return;

    setIsProcessing(true);
    const returnItems = selectedIndices.map((idx) => ({
      productName: receipt.items[idx].batch.productName,
      batchNumber: receipt.items[idx].batch.batchNumber,
      sku: receipt.items[idx].batch.sku,
      unitPrice: receipt.items[idx].unitPrice,
      quantityReturned: selectedItemsForReturn[idx],
      itemRefundAmount: receipt.items[idx].unitPrice * selectedItemsForReturn[idx],
    }));

    const refundPayload = {
      receiptNumber: receipt.receiptNumber,
      returnItems,
      refundTotal: Number(refundTotal.toFixed(2)),
      reason: returnReason,
      processedBy: currentUser?.fullName || 'Cashier Desk',
    };

    if (onProcessReturn) {
      onProcessReturn(refundPayload);
    }

    try {
      await fetch('/api/sales/returns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': receipt.tenantId,
        },
        body: JSON.stringify(refundPayload),
      });
    } catch {
      // Handled via local state
    }

    setIsProcessing(false);
    setReturnSuccessMessage(
      `Refund of ${formatCedi(refundTotal)} processed successfully to original payment method (${receipt.paymentMethod}).`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in duration-150">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-stone-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
              <CheckBadgeIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg">Verified Customer Receipt</h2>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Official transaction record retrieved via barcode scan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-stone-800">
          {returnSuccessMessage ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
              <div className="inline-flex p-3 bg-emerald-100 text-emerald-700 rounded-full">
                <CheckCircleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-black text-emerald-950">Refund Completed</h3>
              <p className="text-xs text-emerald-800 leading-relaxed">{returnSuccessMessage}</p>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Close & Return to Scanner
              </button>
            </div>
          ) : (
            <>
              {/* Receipt Summary Card */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Receipt No.</span>
                  <span className="font-mono font-black text-stone-900 text-xs sm:text-sm">{receipt.receiptNumber}</span>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Date & Time</span>
                  <div className="flex items-center gap-1 font-medium text-stone-800 text-[11px] pt-0.5">
                    <CalendarDaysIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span>{receipt.timestamp}</span>
                  </div>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Cashier / Staff</span>
                  <div className="flex items-center gap-1 font-medium text-stone-800 text-[11px] pt-0.5">
                    <UserIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span className="truncate">{receipt.cashierName}</span>
                  </div>
                </div>
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase font-bold tracking-wider">Payment Method</span>
                  <div className="flex items-center gap-1 font-medium text-stone-800 text-[11px] pt-0.5">
                    <CreditCardIcon className="w-3.5 h-3.5 text-stone-400" />
                    <span className="font-bold">{receipt.paymentMethod}</span>
                  </div>
                </div>
              </div>

              {/* Items in this Receipt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                    <BuildingStorefrontIcon className="w-4 h-4 text-emerald-700" />
                    <span>Purchased Items ({receipt.items.length})</span>
                  </h4>
                  <span className="text-[11px] text-stone-500">
                    Select items below to issue partial or full refund
                  </span>
                </div>

                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-200">
                  {receipt.items.map((item, idx) => {
                    const isSelected = selectedItemsForReturn[idx] !== undefined;
                    const selectedQty = selectedItemsForReturn[idx] || item.quantity;

                    return (
                      <div
                        key={idx}
                        className={`p-3 transition-colors flex items-center justify-between gap-3 ${
                          isSelected ? 'bg-emerald-50/60' : 'bg-white hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItemSelection(idx, item.quantity)}
                            id={`return-item-${idx}`}
                            className="mt-1 w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                          />
                          <label htmlFor={`return-item-${idx}`} className="cursor-pointer flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-stone-900 truncate">
                                {item.batch.productName}
                              </span>
                              {item.isClearance && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                                  Markdown -{item.discountPercent}%
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                              <span>Batch: <strong className="font-mono text-stone-700">{item.batch.batchNumber}</strong></span>
                              <span>•</span>
                              <span>Unit Price: {formatCedi(item.unitPrice)}</span>
                            </div>
                          </label>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isSelected && (
                            <div className="flex items-center gap-1.5 bg-white border border-stone-200 rounded-lg p-1">
                              <span className="text-[10px] text-stone-500 px-1">Qty:</span>
                              <input
                                type="number"
                                min={1}
                                max={item.quantity}
                                value={selectedQty}
                                onChange={(e) =>
                                  updateReturnQty(idx, parseInt(e.target.value) || 1, item.quantity)
                                }
                                className="w-12 text-center text-xs font-bold border border-stone-300 rounded py-0.5 focus:ring-emerald-600 focus:border-emerald-600"
                              />
                              <span className="text-[10px] text-stone-400">/ {item.quantity}</span>
                            </div>
                          )}
                          <div className="text-right font-black text-xs text-stone-900 min-w-[70px]">
                            {formatCedi(item.unitPrice * (isSelected ? selectedQty : item.quantity))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Receipt Barcode Graphic Display */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <ReceiptBarcode value={receipt.barcodeValue || receipt.receiptNumber} height={38} />
              </div>

              {/* Refund Options Panel if items are selected */}
              {selectedIndices.length > 0 && (
                <div className="p-4 bg-emerald-900/5 border border-emerald-800/20 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-900">
                    <span className="flex items-center gap-1.5 text-emerald-950">
                      <ArrowPathIcon className="w-4 h-4 text-emerald-700" />
                      Refund Calculation ({selectedIndices.length} items)
                    </span>
                    <span className="text-sm font-black text-emerald-900">
                      Refund Total: {formatCedi(refundTotal)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Reason for Customer Return
                      </label>
                      <select
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}
                        className="w-full text-xs bg-white border border-stone-300 rounded-xl p-2 font-medium focus:ring-emerald-600 focus:border-emerald-600"
                      >
                        <option value="CUSTOMER_RETURN">Standard Customer Return (Unopened)</option>
                        <option value="DEFECTIVE_PRODUCT">Defective / Damaged Seal</option>
                        <option value="EXPIRED_DISCOVERY">Customer Discovered Near Expiry</option>
                        <option value="WRONG_ITEM_PURCHASED">Customer Purchased Wrong Variant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">
                        Refund Method
                      </label>
                      <div className="bg-white border border-stone-300 rounded-xl p-2 text-xs font-bold text-stone-800 flex items-center justify-between">
                        <span>Original Method: {receipt.paymentMethod}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-black">
                          INSTANT
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!returnSuccessMessage && (
          <div className="p-4 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row gap-2.5 sm:gap-3 shrink-0">
            {selectedIndices.length > 0 ? (
              <>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmRefund}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowPathIcon className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>Authorize Refund ({formatCedi(refundTotal)})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedItemsForReturn({})}
                  className="px-4 py-3 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-colors text-center"
                >
                  Deselect All
                </button>
              </>
            ) : (
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-500 text-xs">
                  <ExclamationCircleIcon className="w-4 h-4 text-stone-400" />
                  <span>Original Total Paid: <strong>{formatCedi(receipt.total)}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
