import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  BinaryBitmap,
  HybridBinarizer,
  HTMLCanvasElementLuminanceSource,
} from '@zxing/library';
import { Batch, Tenant } from '../types/index.ts';
import { StatusBadge } from './StatusBadge.tsx';
import {
  XMarkIcon,
  CameraIcon,
  QrCodeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ArrowPathIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  BoltIcon,
  SparklesIcon,
  TrashIcon,
  PhotoIcon,
  PlusCircleIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/outline';

interface CameraBarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTenant: Tenant;
  batches: Batch[];
  onSelectBatch?: (batch: Batch) => void;
  onOpenDisposalModal?: (batch: Batch) => void;
  onBarcodeDetected?: (barcode: string) => void;
  onAddNewProductWithBarcode?: (barcode: string) => void;
  title?: string;
  subtitle?: string;
}

// Suppress internal ZXing MultiFormatReader non-ReaderException console noise
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    const firstStr = typeof args[0] === 'string' ? args[0] : '';
    if (
      firstStr.includes('MultiFormatReader:') ||
      firstStr.includes('No Micro QR finder pattern') ||
      firstStr.includes('Video play interrupted')
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Audio Feedback (POS checkout beep sound)
const playPosBeep = (type: 'success' | 'warning' | 'expired' = 'success') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'expired') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'warning') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.setValueAtTime(1800, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.12);
    }
  } catch {
    // Audio feedback silent catch
  }
};

// Validate whether a detected string is a legitimate retail/inventory barcode
const isValidBarcode = (raw: string): boolean => {
  if (!raw) return false;
  const clean = raw.trim().replace(/[\r\n\t]/g, '');

  // Reject too short (< 5 chars) or too long (> 48 chars)
  if (clean.length < 5 || clean.length > 48) {
    return false;
  }

  // Reject strings with illegal non-barcode characters
  if (!/^[A-Za-z0-9\-_./:@+]+$/.test(clean)) {
    return false;
  }

  // Pure numeric validation (UPC, EAN, ITF, Lot numbers)
  if (/^\d+$/.test(clean)) {
    if (clean.length === 13) {
      // EAN-13 checksum validation
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        sum += parseInt(clean[i], 10) * (i % 2 === 0 ? 1 : 3);
      }
      const check = (10 - (sum % 10)) % 10;
      if (check === parseInt(clean[12], 10)) return true;
    } else if (clean.length === 12) {
      // UPC-A checksum validation
      let sum = 0;
      for (let i = 0; i < 11; i++) {
        sum += parseInt(clean[i], 10) * (i % 2 === 0 ? 3 : 1);
      }
      const check = (10 - (sum % 10)) % 10;
      if (check === parseInt(clean[11], 10)) return true;
    } else if (clean.length === 8) {
      // EAN-8 checksum validation
      let sum = 0;
      for (let i = 0; i < 7; i++) {
        sum += parseInt(clean[i], 10) * (i % 2 === 0 ? 3 : 1);
      }
      const check = (10 - (sum % 10)) % 10;
      if (check === parseInt(clean[7], 10)) return true;
    }

    // Accept valid 6-18 digit numeric codes
    return clean.length >= 6;
  }

  // Alphanumeric barcodes (Code 128, Code 39, QR code, DataMatrix)
  return /^[A-Za-z0-9\-_./]+$/.test(clean);
};

// Declaring Native BarcodeDetector interface for Chromium / Android fallback
interface NativeBarcodeResult {
  rawValue: string;
  format: string;
}

interface NativeBarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<NativeBarcodeResult[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): NativeBarcodeDetectorInstance;
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

export const CameraBarcodeScannerModal: React.FC<CameraBarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  currentTenant,
  batches,
  onSelectBatch,
  onOpenDisposalModal,
  onBarcodeDetected,
  onAddNewProductWithBarcode,
  title = 'Barcode Expiry Scanner',
  subtitle = 'Instant supermarket shelf & POS verification',
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'permission' | 'device' | 'iframe' | 'generic' | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTargetLocked, setIsTargetLocked] = useState(false);

  // Result states
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [matchedBatch, setMatchedBatch] = useState<Batch | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [auditScans, setAuditScans] = useState<Array<{ id: string; batch?: Batch; code: string; time: string }>>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDecodingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(false);
  const lockTimerRef = useRef<number | null>(null);
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Keep latest callbacks and props in refs to prevent unnecessary re-initialization
  const batchesRef = useRef(batches);
  const currentTenantRef = useRef(currentTenant);
  const soundEnabledRef = useRef(soundEnabled);
  const onBarcodeDetectedRef = useRef(onBarcodeDetected);

  useEffect(() => {
    batchesRef.current = batches;
  }, [batches]);

  useEffect(() => {
    currentTenantRef.current = currentTenant;
  }, [currentTenant]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    onBarcodeDetectedRef.current = onBarcodeDetected;
  }, [onBarcodeDetected]);

  // Pre-configured MultiFormatReader
  const readerRef = useRef<MultiFormatReader | null>(null);

  const activeTenantBatches = useMemo(() => {
    return batches.filter(
      (b) => b.tenantId === currentTenant.id && b.status !== 'DISPOSED'
    );
  }, [batches, currentTenant.id]);

  const handleProcessBarcode = useCallback((rawCode: string) => {
    const cleanCode = rawCode.trim().replace(/[\r\n\t]/g, '');
    if (!cleanCode || !isValidBarcode(cleanCode)) return;

    // Debounce duplicate scans within 1.5s
    const now = Date.now();
    if (lastScannedCodeRef.current === cleanCode && now - lastScannedTimeRef.current < 1500) {
      return;
    }
    lastScannedCodeRef.current = cleanCode;
    lastScannedTimeRef.current = now;

    setScannedCode(cleanCode);
    setIsTargetLocked(true);
    if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    lockTimerRef.current = window.setTimeout(() => {
      setIsTargetLocked(false);
    }, 1400);

    const tenantBatches = batchesRef.current.filter(
      (b) => b.tenantId === currentTenantRef.current.id && b.status !== 'DISPOSED'
    );

    // Match against active tenant batches (both exact and leading-zero normalized)
    const found = tenantBatches.find((b) => {
      const bCode = b.barcode.trim();
      const bSku = b.sku.trim();
      const bNum = b.batchNumber.trim();
      return (
        bCode === cleanCode ||
        bCode.replace(/^0+/, '') === cleanCode.replace(/^0+/, '') ||
        bSku.toLowerCase() === cleanCode.toLowerCase() ||
        bNum.toLowerCase() === cleanCode.toLowerCase()
      );
    });

    setMatchedBatch(found || null);

    // Audio confirmation
    if (soundEnabledRef.current) {
      if (found) {
        if (found.status === 'EXPIRED') playPosBeep('expired');
        else if (found.status === 'CRITICAL_7' || found.status === 'WARNING_14') playPosBeep('warning');
        else playPosBeep('success');
      } else {
        playPosBeep('success');
      }
    }

    // Auto-scroll modal to result section immediately so results are instantly obvious on mobile
    window.setTimeout(() => {
      if (resultCardRef.current) {
        resultCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 60);

    if (onBarcodeDetectedRef.current) {
      onBarcodeDetectedRef.current(cleanCode);
    }

    setAuditScans((prev) => [
      {
        id: `${Date.now()}-${Math.random()}`,
        batch: found,
        code: cleanCode,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      },
      ...prev.slice(0, 15),
    ]);
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch {
        // Silent catch on track stop
      }
      streamRef.current = null;
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {
        // Silent catch
      }
    }

    setCameraActive(false);
    setTorchEnabled(false);
    setTorchSupported(false);
    setIsTargetLocked(false);
    isDecodingRef.current = false;
  }, []);

  // Frame decoding loop strictly bound to Green Target Viewfinder (ROI)
  const startScanningLoop = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Initialize ZXing reader with standard retail format hints
    if (!readerRef.current) {
      const hints = new Map<DecodeHintType, any>();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
      ]);

      const reader = new MultiFormatReader();
      reader.setHints(hints);
      readerRef.current = reader;
    }

    let nativeDetector: NativeBarcodeDetectorInstance | null = null;
    if (typeof window !== 'undefined' && window.BarcodeDetector) {
      try {
        nativeDetector = new window.BarcodeDetector({
          formats: [
            'ean_13',
            'ean_8',
            'upc_a',
            'upc_e',
            'code_128',
            'code_39',
            'qr_code',
          ],
        });
      } catch {
        nativeDetector = null;
      }
    }

    // Run decode check every 120ms strictly within target box
    scanIntervalRef.current = window.setInterval(async () => {
      if (isDecodingRef.current || !isMountedRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < 2 || video.videoWidth === 0) {
        return;
      }

      isDecodingRef.current = true;

      try {
        const fullWidth = video.videoWidth;
        const fullHeight = video.videoHeight;

        // Mathematical ROI constraint: Only crop the exact central reticle box
        // (60% horizontal width, 38% vertical height)
        const roiWidth = Math.max(240, Math.round(fullWidth * 0.60));
        const roiHeight = Math.max(140, Math.round(fullHeight * 0.38));
        const roiX = Math.round((fullWidth - roiWidth) / 2);
        const roiY = Math.round((fullHeight - roiHeight) / 2);

        if (canvas.width !== roiWidth) canvas.width = roiWidth;
        if (canvas.height !== roiHeight) canvas.height = roiHeight;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          // Draw ONLY the sub-region inside the green box onto the decoding canvas
          ctx.drawImage(video, roiX, roiY, roiWidth, roiHeight, 0, 0, roiWidth, roiHeight);

          // Fast path 1: Chromium Native BarcodeDetector on cropped canvas
          if (nativeDetector) {
            try {
              const barcodes = await nativeDetector.detect(canvas);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                const candidate = barcodes[0].rawValue.trim();
                if (isValidBarcode(candidate)) {
                  handleProcessBarcode(candidate);
                  isDecodingRef.current = false;
                  return;
                }
              }
            } catch {
              // Fallthrough to ZXing on canvas
            }
          }

          // Fast path 2: ZXing multi-format reader on cropped canvas
          if (readerRef.current) {
            try {
              const luminanceSource = new HTMLCanvasElementLuminanceSource(canvas);
              const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
              const result = readerRef.current.decode(binaryBitmap);
              if (result && result.getText()) {
                const candidate = result.getText().trim();
                if (isValidBarcode(candidate)) {
                  handleProcessBarcode(candidate);
                }
              }
            } catch {
              // Expected when barcode is not aligned inside target reticle
            }
          }
        }
      } catch {
        // Ignored frame error
      } finally {
        isDecodingRef.current = false;
      }
    }, 120);
  }, [handleProcessBarcode]);

  // Start Camera Stream cleanly
  const startCamera = useCallback(async (deviceIdOverride?: string) => {
    stopCamera();
    setCameraError(null);
    setErrorType(null);
    setIsProcessing(true);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorType('iframe');
        setCameraError('Camera API is not accessible in this iframe. Open the app in a new tab or use photo capture.');
        setIsProcessing(false);
        return;
      }

      // Enumerate cameras
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
      } catch {
        // Ignore device enumeration errors
      }

      // Constraints
      let constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const devId = deviceIdOverride || selectedDeviceId;
      if (devId) {
        constraints = {
          video: { deviceId: { exact: devId } },
          audio: false,
        };
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback to basic constraint if high-res fails
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (!isMountedRef.current) {
        // Modal was closed while waiting for stream
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (!videoRef.current) {
        throw new Error('Video element ref unavailable');
      }

      const videoEl = videoRef.current;
      videoEl.srcObject = stream;

      // Clean play handling without console warnings
      await videoEl.play().catch(() => {
        // Silent catch for browser auto-play interruptions
      });

      // Check flashlight support
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const caps = videoTrack.getCapabilities?.() as unknown as { torch?: boolean };
        if (caps?.torch) {
          setTorchSupported(true);
        }
      }

      setCameraActive(true);
      startScanningLoop();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);

      if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied') || errMsg.includes('Permission dismissed')) {
        setErrorType('permission');
        setCameraError('Camera access was blocked by your browser. Please click the camera icon in your browser address bar to allow access.');
      } else if (errMsg.includes('NotFoundError') || errMsg.includes('DevicesNotFoundError')) {
        setErrorType('device');
        setCameraError('No camera was detected on this device.');
      } else if (errMsg.includes('NotReadableError') || errMsg.includes('TrackStartError')) {
        setErrorType('generic');
        setCameraError('Camera is currently in use by another app (Zoom, Teams, etc.). Please close other apps and click Retry.');
      } else {
        setErrorType('generic');
        setCameraError(`Camera connection issue (${errMsg}). You can test with sample barcodes or upload a photo.`);
      }
      setCameraActive(false);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedDeviceId, startScanningLoop, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current || !torchSupported) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack) return;

    try {
      const nextTorch = !torchEnabled;
      await videoTrack.applyConstraints({
        advanced: [{ torch: nextTorch } as MediaTrackConstraintSet],
      });
      setTorchEnabled(nextTorch);
    } catch {
      // Silent catch
    }
  };

  // Image / File Snapshot decoder
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // 1. Try native BarcodeDetector on image bitmap
      if (window.BarcodeDetector && 'createImageBitmap' in window) {
        try {
          const bitmap = await createImageBitmap(file);
          const detector = new window.BarcodeDetector();
          const detected = await detector.detect(bitmap);
          if (detected && detected.length > 0 && detected[0].rawValue) {
            handleProcessBarcode(detected[0].rawValue);
            return;
          }
        } catch {
          // Continue to canvas fallback
        }
      }

      // 2. ZXing fallback via temporary image element
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((res, rej) => {
        img.onload = () => res(true);
        img.onerror = rej;
      });

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.naturalWidth || img.width;
      tempCanvas.height = img.naturalHeight || img.height;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const luminanceSource = new HTMLCanvasElementLuminanceSource(tempCanvas);
        const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

        const hints = new Map<DecodeHintType, any>();
        hints.set(DecodeHintType.TRY_HARDER, true);
        const reader = new MultiFormatReader();
        reader.setHints(hints);

        const result = reader.decode(binaryBitmap);
        if (result && result.getText()) {
          handleProcessBarcode(result.getText());
          URL.revokeObjectURL(img.src);
          return;
        }
      }
      URL.revokeObjectURL(img.src);

      alert('Could not detect a clear barcode from that image. Please make sure the barcode lines are sharp and well-lit.');
    } catch {
      alert('Could not decode barcode from image. Please try a clearer snapshot or enter digits manually.');
    }
  };

  const openAppInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  useEffect(() => {
    isMountedRef.current = true;
    if (isOpen) {
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => {
        isMountedRef.current = false;
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
      setScannedCode(null);
      setMatchedBatch(null);
    }
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      {/* Hidden processing canvas for frame analysis */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden file input for Photo / Native Camera capture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Main Light Modal Container */}
      <div className="bg-white text-gray-900 rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 flex flex-col overflow-hidden transform transition-all my-auto max-h-[94vh]">
        {/* Header - Supermarket Clean Light Theme */}
        <div className="bg-emerald-800 px-5 sm:px-6 py-4 border-b border-emerald-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs ring-2 ring-emerald-600/50">
              <CameraIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">{title}</h2>
              <p className="text-xs text-emerald-100/90">{subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`p-2 rounded-xl transition-colors cursor-pointer border ${
                soundEnabled
                  ? 'bg-emerald-900 text-emerald-200 border-emerald-700 hover:bg-emerald-950'
                  : 'bg-emerald-900/40 text-emerald-300/60 border-emerald-800'
              }`}
              title={soundEnabled ? 'Mute Scanner Beep' : 'Enable Scanner Beep'}
            >
              {soundEnabled ? <SpeakerWaveIcon className="w-5 h-5" /> : <SpeakerXMarkIcon className="w-5 h-5" />}
            </button>

            {/* Close Modal */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-emerald-900/60 transition-colors cursor-pointer"
              title="Close Scanner"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={scrollContainerRef} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-stone-50/50">
          {/* Top Camera Controls & Device Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
            <div className="flex items-center gap-2">
              {/* Camera device picker if multiple cameras found */}
              {videoDevices.length > 1 ? (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => {
                    setSelectedDeviceId(e.target.value);
                    startCamera(e.target.value);
                  }}
                  className="text-xs bg-stone-50 border border-stone-300 rounded-lg px-2 py-1.5 text-gray-800 font-medium focus:ring-1 focus:ring-emerald-600 focus:outline-hidden"
                >
                  {videoDevices.map((dev, idx) => (
                    <option key={dev.deviceId || idx} value={dev.deviceId}>
                      {dev.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-semibold text-stone-600">Camera Viewfinder</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Torch Toggle */}
              {torchSupported && cameraActive && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                    torchEnabled
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border-stone-200'
                  }`}
                  title="Toggle Flashlight / Torch"
                >
                  <BoltIcon className="w-4 h-4" />
                  <span>{torchEnabled ? 'Flash ON' : 'Flash'}</span>
                </button>
              )}

              {/* Restart / Reconnect Camera */}
              <button
                type="button"
                onClick={() => startCamera()}
                disabled={isProcessing}
                className="px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                title="Restart Camera Stream"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>Restart Cam</span>
              </button>

              {/* Take Snapshot / Photo Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer shadow-2xs"
                title="Snap photo with phone camera or upload image"
              >
                <PhotoIcon className="w-4 h-4 text-emerald-700" />
                <span>Snap / Upload Photo</span>
              </button>
            </div>
          </div>

          {/* Camera Viewport Section */}
          <div className="relative rounded-2xl overflow-hidden bg-stone-900 border-2 border-emerald-700 shadow-md flex flex-col items-center justify-center min-h-[320px] sm:min-h-[400px] w-full">
            {/* Direct HTML5 Video Stream Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full min-h-[320px] sm:min-h-[400px] max-h-[500px] object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Custom High-Contrast Laser Viewfinder Over Video */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-4">
                {/* Wide Target Box for 1D Barcodes & 2D QR Codes */}
                <div
                  className={`relative w-full max-w-[480px] h-[190px] sm:h-[220px] rounded-2xl transition-all duration-300 ${
                    isTargetLocked
                      ? 'border-4 border-emerald-300 ring-4 ring-emerald-400/60 bg-emerald-500/20 shadow-[0_0_35px_rgba(52,211,153,0.8)] scale-[1.02]'
                      : 'border-2 border-emerald-400/90 shadow-[0_0_20px_rgba(16,185,129,0.4)] bg-black/10 backdrop-contrast-125'
                  }`}
                >
                  {/* Corner Reticles */}
                  <div
                    className={`absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                      isTargetLocked ? 'border-emerald-200' : 'border-emerald-400'
                    }`}
                  />
                  <div
                    className={`absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                      isTargetLocked ? 'border-emerald-200' : 'border-emerald-400'
                    }`}
                  />
                  <div
                    className={`absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                      isTargetLocked ? 'border-emerald-200' : 'border-emerald-400'
                    }`}
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                      isTargetLocked ? 'border-emerald-200' : 'border-emerald-400'
                    }`}
                  />

                  {/* Horizontal Guideline */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/30 -translate-y-1/2" />

                  {/* Laser Scan Animation */}
                  {!isTargetLocked && (
                    <div
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_14px_#ef4444]"
                      style={{
                        animation: 'scanAnimation 2.2s ease-in-out infinite alternate',
                      }}
                    />
                  )}

                  {/* Target Locked Center Badge */}
                  {isTargetLocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-emerald-900/90 text-white border border-emerald-300 px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                        <span>LOCKED: {scannedCode}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-4 text-center bg-black/85 backdrop-blur-xs px-4 py-2 rounded-full text-xs font-bold text-emerald-300 shadow-md border border-emerald-500/30 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isTargetLocked ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
                  <span>
                    {isTargetLocked
                      ? '✓ Barcode Locked Inside Target Box!'
                      : 'Fit barcode inside the green box to scan'}
                  </span>
                </div>
              </div>
            )}

            {/* Error or Inactive State Overlay */}
            {!cameraActive && (
              <div className="absolute inset-0 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-stone-900/95 text-white">
                <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-600 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  {errorType === 'permission' ? (
                    <ExclamationTriangleIcon className="w-8 h-8 text-amber-400" />
                  ) : (
                    <VideoCameraIcon className="w-8 h-8 text-emerald-400" />
                  )}
                </div>

                {cameraError ? (
                  <div className="space-y-3 max-w-md">
                    <h4 className="text-base font-bold text-white">Camera Permission Notice</h4>
                    <p className="text-xs text-amber-300/90 leading-relaxed">{cameraError}</p>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                        <span>Retry Camera Access</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <PhotoIcon className="w-4 h-4" />
                        <span>Take Photo / Upload</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-w-md">
                    <h4 className="text-base font-bold">Start Live Camera Feed</h4>
                    <p className="text-xs text-stone-300">
                      Click below to activate your camera for real-time POS barcode verification.
                    </p>
                    <button
                      type="button"
                      onClick={() => startCamera()}
                      disabled={isProcessing}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold inline-flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg ring-2 ring-emerald-500/40"
                    >
                      <CameraIcon className="w-5 h-5" />
                      <span>{isProcessing ? 'Connecting...' : 'Activate Camera'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scanned Result Card - Crisp High Contrast Supermarket Theme with Auto-Focus */}
          {scannedCode && (
            <div ref={resultCardRef} className="animate-fade-in transition-all scroll-mt-3">
              {matchedBatch ? (
                <div
                  className={`p-5 rounded-2xl border-2 shadow-sm space-y-4 ${
                    matchedBatch.status === 'EXPIRED'
                      ? 'bg-red-50/95 border-red-400 text-red-950'
                      : matchedBatch.status === 'CRITICAL_7'
                      ? 'bg-rose-50/95 border-rose-400 text-rose-950'
                      : matchedBatch.status === 'WARNING_14' || matchedBatch.status === 'WARNING_30'
                      ? 'bg-amber-50/95 border-amber-400 text-amber-950'
                      : 'bg-emerald-50/95 border-emerald-400 text-emerald-950'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 font-bold shadow-xs ${
                          matchedBatch.status === 'EXPIRED'
                            ? 'bg-red-600'
                            : matchedBatch.status === 'CRITICAL_7'
                            ? 'bg-rose-600'
                            : 'bg-emerald-700'
                        }`}
                      >
                        {matchedBatch.status === 'EXPIRED' ? (
                          <XCircleIcon className="w-7 h-7" />
                        ) : matchedBatch.status === 'CRITICAL_7' ? (
                          <ExclamationTriangleIcon className="w-7 h-7" />
                        ) : (
                          <CheckCircleIcon className="w-7 h-7" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                              matchedBatch.status === 'EXPIRED'
                                ? 'bg-red-700 text-white'
                                : matchedBatch.status === 'CRITICAL_7'
                                ? 'bg-rose-700 text-white'
                                : 'bg-emerald-800 text-white'
                            }`}
                          >
                            {matchedBatch.status === 'EXPIRED'
                              ? '🛑 EXPIRED - REMOVE FROM SHELF'
                              : matchedBatch.status === 'CRITICAL_7'
                              ? '⚠️ CRITICAL EXPIRY (<= 7 DAYS)'
                              : '✅ SAFE TO SELL'}
                          </span>

                          <span className="text-xs font-mono font-bold bg-white/90 px-2 py-0.5 rounded border border-current">
                            UPC: {matchedBatch.barcode}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mt-1">{matchedBatch.productName}</h3>
                        <p className="text-xs text-gray-600">
                          Brand: <strong className="text-gray-900">{matchedBatch.brand}</strong> &bull; Dept:{' '}
                          <strong className="text-gray-900">{matchedBatch.categoryName}</strong> &bull; SKU:{' '}
                          <strong className="font-mono text-gray-900">{matchedBatch.sku}</strong>
                        </p>
                      </div>
                    </div>

                    <StatusBadge
                      status={matchedBatch.status}
                      daysRemaining={matchedBatch.daysRemaining}
                      size="md"
                    />
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Expiry Date</span>
                      <span className="font-extrabold text-sm text-gray-900">{matchedBatch.expiryDate}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Remaining</span>
                      <span
                        className={`font-extrabold text-sm ${
                          matchedBatch.daysRemaining < 0
                            ? 'text-red-700'
                            : matchedBatch.daysRemaining <= 7
                            ? 'text-rose-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {matchedBatch.daysRemaining < 0
                          ? `Expired ${Math.abs(matchedBatch.daysRemaining)}d ago`
                          : `${matchedBatch.daysRemaining} days left`}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Selling Price</span>
                      <span className="font-extrabold text-sm text-gray-900">${matchedBatch.unitPrice.toFixed(2)}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Aisle Location</span>
                      <span className="font-extrabold text-sm text-gray-900 truncate block">
                        {matchedBatch.locationAisle}
                      </span>
                    </div>
                  </div>

                  {/* Context Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-stone-200">
                    <div className="text-xs font-medium">
                      {matchedBatch.status === 'EXPIRED' ? (
                        <span className="text-red-800 font-bold">
                          🛑 Hazard item: Do not scan at checkout. Log inventory disposal below.
                        </span>
                      ) : matchedBatch.status === 'CRITICAL_7' ? (
                        <span className="text-rose-800 font-bold">
                          ⚠️ Apply automatic clearance markdown or prioritize customer sale.
                        </span>
                      ) : (
                        <span className="text-emerald-800 font-semibold">
                          Product passed POS audit and is safe for consumer purchase.
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {matchedBatch.status === 'EXPIRED' && onOpenDisposalModal && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenDisposalModal(matchedBatch);
                            onClose();
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <TrashIcon className="w-4 h-4" />
                          <span>Dispose Batch</span>
                        </button>
                      )}
                      {onSelectBatch && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectBatch(matchedBatch);
                            onClose();
                          }}
                          className="flex-1 sm:flex-none px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        >
                          View Full Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Unregistered Barcode */
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                      <QrCodeIcon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-900">
                        Scanned Code: <span className="font-mono text-emerald-800 font-extrabold">{scannedCode}</span>
                      </h4>
                      <p className="text-xs text-gray-600 mt-0.5">
                        This barcode is not yet registered in {currentTenant.name}'s active batch inventory.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                    {onAddNewProductWithBarcode && (
                      <button
                        type="button"
                        onClick={() => {
                          onAddNewProductWithBarcode(scannedCode);
                          onClose();
                        }}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <PlusCircleIcon className="w-4 h-4" />
                        <span>Register as New Batch ({scannedCode})</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Simulation Testing Barcodes (Instant 1-Click Verification) */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <SparklesIcon className="w-4 h-4 text-emerald-700" />
                <span>Simulate Product Barcode Scan</span>
              </span>
              <span className="text-[11px] text-stone-500">Click any product to test instantly</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeTenantBatches.slice(0, 6).map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleProcessBarcode(b.barcode)}
                  className="px-3 py-1.5 bg-stone-50 hover:bg-emerald-50 border border-stone-200 hover:border-emerald-300 text-gray-800 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
                >
                  <span className="font-bold text-emerald-800">{b.barcode}</span>
                  <span className="text-gray-600 truncate max-w-[130px] font-sans font-medium">{b.productName}</span>
                  <StatusBadge status={b.status} size="sm" showIcon={false} />
                </button>
              ))}
            </div>
          </div>

          {/* Manual Barcode Gun or Typing Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <QrCodeIcon className="w-4 h-4 text-stone-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Scan with handheld barcode gun or enter digits (e.g. 745114590534)..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualCode.trim()) {
                    handleProcessBarcode(manualCode);
                    setManualCode('');
                  }
                }}
                className="w-full pl-10 pr-3 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-mono text-gray-900 placeholder-stone-400 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden shadow-2xs"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (manualCode.trim()) {
                  handleProcessBarcode(manualCode);
                  setManualCode('');
                }
              }}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Verify Code
            </button>
          </div>

          {/* Recent Audit Scan Stream Log */}
          {auditScans.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-stone-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                <span>Recent Camera & Gun Scan Stream ({auditScans.length})</span>
                <button
                  type="button"
                  onClick={() => setAuditScans([])}
                  className="text-stone-400 hover:text-stone-600 cursor-pointer text-[11px]"
                >
                  Clear Log
                </button>
              </div>

              <div className="max-h-32 overflow-y-auto divide-y divide-stone-100 text-xs">
                {auditScans.map((scan) => (
                  <div key={scan.id} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-emerald-800 font-bold">{scan.code}</span>
                      <span className="text-gray-700 truncate max-w-[220px]">
                        {scan.batch ? scan.batch.productName : 'Unregistered code'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-stone-400">{scan.time}</span>
                      {scan.batch && <StatusBadge status={scan.batch.status} size="sm" showIcon={false} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white px-5 sm:px-6 py-3.5 border-t border-stone-200 flex items-center justify-between shrink-0 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${cameraActive ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-medium">
              {cameraActive ? 'Live Camera Feed Active & Scanning' : 'Ready for Camera Feed, Photo Snapshots or Gun Input'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold transition-colors cursor-pointer border border-stone-200"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
