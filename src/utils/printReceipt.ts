/**
 * Utility to print receipts and reports reliably across standard desktop browsers,
 * popups, and sandboxed iframes while preserving 100% of styles, SVGs, barcodes, and zigzag edges.
 */

export function printElementById(elementId: string, documentTitle = 'Print Receipt'): boolean {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element #${elementId} not found for printing.`);
    return false;
  }

  // Clone node to capture computed SVGs and inner DOM cleanly
  const clone = element.cloneNode(true) as HTMLElement;

  // Extract all existing style sheets and link tags from main document
  const headStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
    .map((node) => node.outerHTML)
    .join('\n');

  try {
    let printFrame = document.getElementById('receipt-print-iframe') as HTMLIFrameElement | null;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'receipt-print-iframe';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      printFrame.style.visibility = 'hidden';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>${documentTitle}</title>
            ${headStyles}
            <style>
              @page {
                size: 80mm auto;
                margin: 0;
              }
              *, *::before, *::after {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
                box-sizing: border-box;
              }
              html, body {
                margin: 0;
                padding: 0;
                background-color: #ffffff !important;
                color: #1c1917 !important;
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important;
                -webkit-font-smoothing: antialiased;
              }
              .print-container {
                width: 100%;
                max-width: 80mm;
                margin: 0 auto;
                padding: 12px 10px;
                background: #ffffff !important;
              }
              svg {
                display: block;
                max-width: 100%;
              }
              @media print {
                html, body {
                  width: 100%;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: #ffffff !important;
                }
                .print-container {
                  width: 100% !important;
                  max-width: 80mm !important;
                  margin: 0 auto !important;
                  padding: 8px 6px !important;
                  box-shadow: none !important;
                  border: none !important;
                }
              }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${clone.outerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        } catch {
          window.print();
        }
      }, 350);

      return true;
    }
  } catch (err) {
    console.error('Error invoking iframe print, falling back to window.print():', err);
    window.print();
    return true;
  }

  return false;
}
