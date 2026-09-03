import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer } from 'lucide-react';

interface QrCodeCardProps {
  value: string;
  title: string;
  subtitle?: string;
  fileName: string;
}

export function QrCodeCard({ value, title, subtitle, fileName }: QrCodeCardProps) {
  const [dataUrl, setDataUrl] = useState('');

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
    const printWindow = window.open('', '_blank', 'width=700,height=700');
    if (!printWindow) return;
    const escapeHtml = (text: string) => text.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
    printWindow.document.write(`<!doctype html><html><head><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;text-align:center;padding:32px}img{width:420px;max-width:90%}h1{margin-bottom:6px}p{font-size:20px;margin-top:0}</style></head><body><h1>${escapeHtml(title)}</h1>${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}<img src="${dataUrl}" onload="window.print();window.close()" /></body></html>`);
    printWindow.document.close();
  };

  if (!dataUrl) return null;

  return (
    <div className="rounded-xl border-2 border-slate-200 bg-white p-5 text-center shadow-sm">
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      <img src={dataUrl} alt={`${title} QR code`} className="mx-auto my-4 w-full max-w-72" />
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={handleDownload} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
          <Download className="h-5 w-5" /> Download
        </button>
        <button type="button" onClick={handlePrint} className="flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-3 font-semibold text-white hover:bg-slate-800">
          <Printer className="h-5 w-5" /> Print
        </button>
      </div>
    </div>
  );
}
