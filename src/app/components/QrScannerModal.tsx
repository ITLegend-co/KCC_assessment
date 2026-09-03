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

    const startPromise = scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
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
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Camera className="h-5 w-5 text-emerald-600" />
            {title}
          </h3>
          <button type="button" onClick={() => void handleClose()} className="rounded-lg p-2 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div id={readerId.current} className="overflow-hidden rounded-lg" />
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <p className="mt-4 text-center text-sm text-slate-500">Place the QR code inside the camera frame.</p>
      </div>
    </div>
  );
}
