import React, { useState, useRef } from 'react';
import { Tenant, UserRole, Batch } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import { CameraBarcodeScannerModal } from './CameraBarcodeScannerModal.tsx';
import {
  QrCodeIcon,
  CameraIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface FastScannerViewProps {
  currentTenant: Tenant;
  currentRole: UserRole;
  batches: Batch[];
  onOpenDisposalModal: (batch: Batch) => void;
}

export const FastScannerView: React.FC<FastScannerViewProps> = ({
  currentTenant,
  currentRole,
  batches,
  onOpenDisposalModal,
}) => {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedBatch, setScannedBatch] = useState<Batch | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [scanHistory, setScanHistory] = useState<Batch[]>([]);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement | null>(null);

  const tenantBatches = batches.filter((b) => b.tenantId === currentTenant.id && b.status !== 'DISPOSED');

  const handleScan = (codeToScan: string) => {
    const code = codeToScan.trim();
    if (!code) return;

    setBarcodeInput(code);
    setHasSearched(true);

    const found = tenantBatches.find(
      (b) => b.barcode.toLowerCase() === code.toLowerCase() || b.sku.toLowerCase() === code.toLowerCase()
    );

    if (found) {
      setScannedBatch(found);
      setScanHistory((prev) => [found, ...prev.filter((p) => p.id !== found.id)].slice(0, 8));
    } else {
      setScannedBatch(null);
    }

    // Auto-scroll down to results so cashier or mobile user sees the outcome instantly
    window.setTimeout(() => {
      if (resultRef.current) {
        resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <QrCodeIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              POS Expiry Scanner
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Instant shelf & checkout verification
            </p>
          </div>
        </div>

        {/* Single Primary Action: Open Camera Scanner */}
        <button
          type="button"
          onClick={() => setIsCameraScannerOpen(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer ring-2 ring-emerald-600/30 hover:shadow-md shrink-0"
        >
          <CameraIcon className="w-5 h-5" />
          <span>Open Camera Scanner</span>
        </button>
      </div>

      {/* Main Scanner Card */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-emerald-100 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Barcode or SKU Input (Supports Hardware Barcode Guns & Manual Entry)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <QrCodeIcon className="w-5 h-5 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Scan with barcode gun or type code (e.g. 890123400101)..."
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleScan(barcodeInput);
                }}
                className="w-full pl-11 pr-4 py-2.5 border-2 border-emerald-300 rounded-xl text-sm sm:text-base font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <button
              onClick={() => handleScan(barcodeInput)}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Verify Code
            </button>
          </div>
        </div>

        {/* Quick Demo Test Buttons */}
        <div>
          <span className="text-xs font-semibold text-gray-500 block mb-2">
            Quick Simulation Barcodes (Click to test):
          </span>
          <div className="flex flex-wrap gap-2">
            {tenantBatches.slice(0, 5).map((b) => (
              <button
                key={b.id}
                onClick={() => handleScan(b.barcode)}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <span className="font-mono font-bold text-emerald-800">{b.barcode}</span>
                <span className="text-gray-600">({b.productName.slice(0, 18)}...)</span>
                <StatusBadge status={b.status} size="sm" showIcon={false} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Verification Result Display */}
      {hasSearched && (
        <div ref={resultRef} className="transition-all scroll-mt-4">
          {scannedBatch ? (
            <div
              className={`rounded-2xl p-6 border-2 shadow-sm ${
                scannedBatch.status === 'EXPIRED'
                  ? 'bg-red-50 border-red-500'
                  : scannedBatch.status === 'CRITICAL_7'
                  ? 'bg-rose-50 border-rose-400'
                  : scannedBatch.status === 'WARNING_14' || scannedBatch.status === 'WARNING_30'
                  ? 'bg-amber-50 border-amber-400'
                  : 'bg-emerald-50 border-emerald-400'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                {/* Status Indicator Icon & Verdict */}
                <div className="flex items-start gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                      scannedBatch.status === 'EXPIRED'
                        ? 'bg-red-600'
                        : scannedBatch.status === 'CRITICAL_7'
                        ? 'bg-rose-600'
                        : scannedBatch.status === 'WARNING_14' || scannedBatch.status === 'WARNING_30'
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                  >
                    {scannedBatch.status === 'EXPIRED' ? (
                      <XCircleIcon className="w-8 h-8" />
                    ) : scannedBatch.status === 'CRITICAL_7' ? (
                      <ExclamationTriangleIcon className="w-8 h-8" />
                    ) : (
                      <CheckCircleIcon className="w-8 h-8" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                          scannedBatch.status === 'EXPIRED'
                            ? 'bg-red-200 text-red-900'
                            : scannedBatch.status === 'CRITICAL_7'
                            ? 'bg-rose-200 text-rose-900'
                            : 'bg-emerald-200 text-emerald-900'
                        }`}
                      >
                        {scannedBatch.status === 'EXPIRED'
                          ? 'SALE PROHIBITED: EXPIRED'
                          : scannedBatch.status === 'CRITICAL_7'
                          ? 'VERIFIED: CRITICAL EXPIRY (<= 7 DAYS)'
                          : 'VERIFIED: SAFE TO SELL'}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-gray-900 mt-1">
                      {scannedBatch.productName}
                    </h2>
                    <p className="text-xs text-gray-600">
                      Brand: {scannedBatch.brand} | Department: {scannedBatch.categoryName} | SKU:{' '}
                      <span className="font-mono">{scannedBatch.sku}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <StatusBadge
                    status={scannedBatch.status}
                    daysRemaining={scannedBatch.daysRemaining}
                    size="lg"
                  />
                </div>
              </div>

              {/* Detail Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-gray-200/80 bg-white/70 p-4 rounded-xl">
                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Product Expiry Date
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    {scannedBatch.expiryDate}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Days Remaining
                  </span>
                  <span
                    className={`text-base font-bold ${
                      scannedBatch.daysRemaining < 0
                        ? 'text-red-700'
                        : scannedBatch.daysRemaining <= 7
                        ? 'text-rose-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {scannedBatch.daysRemaining < 0
                      ? `${Math.abs(scannedBatch.daysRemaining)} Days Past Expiry`
                      : `${scannedBatch.daysRemaining} Days`}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Retail Price
                  </span>
                  <span className="text-base font-bold text-gray-900">
                    ${scannedBatch.unitPrice.toFixed(2)}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase block">
                    Shelf Location
                  </span>
                  <span className="text-xs font-semibold text-gray-800">
                    {scannedBatch.locationAisle}
                  </span>
                </div>
              </div>

              {/* Action notice for cashier */}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-700">
                  {scannedBatch.status === 'EXPIRED' ? (
                    <strong className="text-red-800 font-bold">
                      Staff Warning: Do NOT scan through checkout. Remove physical item to the disposal return bin.
                    </strong>
                  ) : (
                    <span className="text-emerald-800">
                      Standard register checkout allowed. Stock safety check passed.
                    </span>
                  )}
                </div>

                {scannedBatch.status === 'EXPIRED' && (
                  <button
                    onClick={() => onOpenDisposalModal(scannedBatch)}
                    className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Log Disposal Now</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center">
              <ExclamationTriangleIcon className="w-10 h-10 text-amber-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-amber-950">Barcode Not Found in Tenant Inventory</h3>
              <p className="text-xs text-amber-800 mt-1 max-w-md mx-auto">
                No active batch was found matching code <code className="font-mono font-bold">{barcodeInput}</code> for {currentTenant.name}.
                Verify the code or register a new batch entry.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recent Scanned History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Recent Verification History</h3>
          <div className="divide-y divide-gray-100">
            {scanHistory.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-gray-900">{item.productName}</span>
                  <span className="font-mono text-gray-500 ml-2">[{item.barcode}]</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500 font-medium">Exp: {item.expiryDate}</span>
                  <StatusBadge status={item.status} daysRemaining={item.daysRemaining} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Camera Barcode Scanner Modal */}
      <CameraBarcodeScannerModal
        isOpen={isCameraScannerOpen}
        onClose={() => setIsCameraScannerOpen(false)}
        currentTenant={currentTenant}
        batches={batches}
        onBarcodeDetected={(code) => handleScan(code)}
        onOpenDisposalModal={onOpenDisposalModal}
      />
    </div>
  );
};
