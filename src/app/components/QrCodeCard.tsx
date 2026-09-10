import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer } from 'lucide-react';

interface QrCodeCardProps {
  value: string;
  title: string;
  subtitle?: string;
  fileName: string;
  prominentSubtitle?: boolean;
}

export function QrCodeCard({ value, title, subtitle, fileName, prominentSubtitle = false }: QrCodeCardProps) {
  const [dataUrl, setDataUrl] = useState('');
  const [printError, setPrintError] = useState('');

  useEffect(() => {
    if (!value) {
      setDataUrl('');
      return;
    }

    QRCode.toDataURL(value, { width: 512, margin: 2, errorCorrectionLevel: 'H' }).then(setDataUrl);
  }, [value]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName.replace(/[^a-z0-9_-]/gi, '-')}.png`;
    link.click();
  };

  const handlePrint = () => {
    if (!dataUrl) return;
    setPrintError('');
    const printWindow = window.open('', '_blank', 'width=700,height=700');
    if (!printWindow) { setPrintError('Printing was blocked by the browser. Download the QR image instead.'); return; }
    const escapeHtml = (text: string) => text.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
    const subtitleSize = prominentSubtitle ? '52px' : '20px';
    const qrWidth = prominentSubtitle ? '340px' : '420px';
    printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:32px}img{width:${qrWidth};max-width:85%}h1{margin-bottom:4px}p{font-size:${subtitleSize};font-weight:${prominentSubtitle ? '800' : '400'};margin:6px 0 12px}</style></head><body><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}<img src="${dataUrl}" onload="window.print();window.close()" /></body></html>`);
    printWindow.document.close();
  };

  if (!dataUrl) return null;

  return (
    <div className="max-h-[90dvh] overflow-y-auto rounded-xl border-2 border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      {subtitle && <p className={prominentSubtitle ? 'mt-2 break-all text-4xl font-extrabold tracking-wide text-slate-900 sm:text-5xl' : 'mt-1 break-words text-slate-600'}>{subtitle}</p>}
      <img src={dataUrl} alt={`${title} QR code`} className={`mx-auto my-3 w-full ${prominentSubtitle ? 'max-w-48 sm:max-w-56' : 'max-w-64 sm:max-w-72'}`} />
      {printError && <p role="alert" className="mb-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{printError}</p>}
      <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        <button type="button" onClick={handleDownload} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-3 font-semibold text-white hover:bg-blue-700">
          <Download className="h-5 w-5" /> Download
        </button>
        <button type="button" onClick={handlePrint} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-700 px-3 py-3 font-semibold text-white hover:bg-slate-800">
          <Printer className="h-5 w-5" /> Print
        </button>
      </div>
    </div>
  );
}
