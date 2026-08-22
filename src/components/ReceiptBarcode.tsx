import React from 'react';

interface ReceiptBarcodeProps {
  value: string;
  className?: string;
  height?: number;
}

/**
 * Encodes text into a standard Code 128 (Subset B) 1D barcode pattern.
 * Renders as a clean, crisp, scalable SVG vector barcode that can be
 * scanned by standard handheld optical barcode scanners and camera apps.
 */

// Code 128 Pattern tables (Subset B)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (104=StartB, 106=Stop)
];

const START_B_INDEX = 104;
const STOP_INDEX = 106;

function encodeCode128B(text: string): string[] {
  const codes: number[] = [START_B_INDEX];
  let checksum = START_B_INDEX;

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Standard ASCII 32..126 map directly to Code 128 B values (0..94)
    let val = charCode - 32;
    if (val < 0 || val > 95) val = 0; // fallback for unencodable
    codes.push(val);
    checksum += val * (i + 1);
  }

  const checkVal = checksum % 103;
  codes.push(checkVal);
  codes.push(STOP_INDEX);

  return codes.map((c) => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]);
}

export const ReceiptBarcode: React.FC<ReceiptBarcodeProps> = ({
  value,
  className = '',
  height = 46,
}) => {
  const cleanValue = (value || 'INV-000000').toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const patternList = encodeCode128B(cleanValue);

  // Convert pattern strings into SVG bar widths
  // Each digit in the pattern represents the width of alternating bar / space
  const bars: { x: number; width: number; isBar: boolean }[] = [];
  let currentX = 10; // quiet zone

  patternList.forEach((pattern) => {
    let isBar = true;
    for (let i = 0; i < pattern.length; i++) {
      const width = parseInt(pattern[i], 10) * 1.5;
      if (isBar) {
        bars.push({ x: currentX, width, isBar: true });
      }
      currentX += width;
      isBar = !isBar;
    }
  });

  const totalWidth = currentX + 10; // quiet zone at end

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* SVG 1D Barcode */}
      <div className="bg-white p-2 rounded-lg border border-stone-200 shadow-2xs max-w-full overflow-x-auto flex justify-center">
        <svg
          viewBox={`0 0 ${totalWidth} ${height}`}
          className="h-11 sm:h-12 w-auto max-w-full"
          style={{ minHeight: '44px' }}
          preserveAspectRatio="xMidYMid meet"
          aria-label={`Barcode for ${cleanValue}`}
        >
          <rect width={totalWidth} height={height} fill="#ffffff" />
          {bars.map((bar, idx) => (
            <rect
              key={idx}
              x={bar.x}
              y={0}
              width={bar.width}
              height={height}
              fill="#000000"
            />
          ))}
        </svg>
      </div>

      {/* Human Readable Code 128 String */}
      <div className="flex items-center gap-2 mt-1.5">
        <span className="font-mono text-[11px] sm:text-xs font-black tracking-widest text-stone-800 bg-stone-100 px-2 py-0.5 rounded border border-stone-300">
          *{cleanValue}*
        </span>
      </div>
      <p className="text-[10px] text-stone-400 mt-0.5">
        Scan barcode at exit gate or customer returns desk
      </p>
    </div>
  );
};
