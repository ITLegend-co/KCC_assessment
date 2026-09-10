import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, X } from 'lucide-react';

interface QrScannerModalProps {
  title: string;
  onScan: (value: string) => void;
  onClose: () => void;
}

export function QrScannerModal({ title, onScan, onClose }: QrScannerModalProps) {
  const readerId = useRef(`qr-reader-${Math.random().toString(36).slice(2)}`);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startPromiseRef = useRef<Promise<unknown> | null>(null);
  const handledRef = useRef(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const stopAndClearScanner = async () => {
    const startPromise = startPromiseRef.current;
    if (startPromise) {
      await startPromise.catch(() => undefined);
      startPromiseRef.current = null;
    }

    const scanner = scannerRef.current;
    if (!scanner) return;
    scannerRef.current = null;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // The camera may already have stopped during modal cleanup.
    }

    try {
      await scanner.clear();
    } catch {
      // Clearing is best-effort after the camera has fully stopped.
    }
  };

  const handleClose = async () => {
    handledRef.current = true;
    await stopAndClearScanner();
    onClose();
  };

  useEffect(() => {
    const scanner = new Html5Qrcode(readerId.current);
    scannerRef.current = scanner;

    const frameSize = Math.max(160, Math.min(240, window.innerWidth - 96, window.innerHeight - 320));
    const startPromise = scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: frameSize, height: frameSize } },
        (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          void stopAndClearScanner().then(() => onScan(decodedText));
        },
        () => undefined,
      );
    startPromiseRef.current = startPromise;
    startPromise.catch(() => {
      startPromiseRef.current = null;
      if (!handledRef.current) {
        setError('Unable to open the camera. Please allow camera access and try again.');
      }
    });

    return () => {
      handledRef.current = true;
      void stopAndClearScanner();
    };
  }, [onScan, retryKey]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div role="dialog" aria-modal="true" aria-labelledby={`${readerId.current}-title`} className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-2xl sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 id={`${readerId.current}-title`} className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
            <Camera className="h-5 w-5 text-emerald-600" />
            {title}
          </h3>
          <button type="button" aria-label="Close QR scanner" onClick={() => void handleClose()} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div id={readerId.current} className="overflow-hidden rounded-lg" />
        {error && <div role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"><p>{error}</p><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => { setError(''); setRetryKey((key) => key + 1); }} className="min-h-11 rounded-lg bg-emerald-600 px-3 font-semibold text-white">Retry Camera</button><button onClick={() => void handleClose()} className="min-h-11 rounded-lg bg-slate-200 px-3 font-semibold text-slate-800">Enter Manually</button></div></div>}
        <p className="mt-4 text-center text-sm text-slate-500">Place the QR code inside the camera frame.</p>
      </div>
    </div>
  );
}
