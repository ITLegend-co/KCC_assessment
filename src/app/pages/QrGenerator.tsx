import { useState } from 'react';
import { BackButton } from '../components/BackButton';
import { QrCodeCard } from '../components/QrCodeCard';

export default function QrGenerator() {
  const [bibInput, setBibInput] = useState('');
  const [bibQr, setBibQr] = useState('');
  const [boulderInput, setBoulderInput] = useState('');
  const [boulderQr, setBoulderQr] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6"><BackButton /></div>
        <div className="rounded-xl bg-white p-6 shadow-lg md:p-8">
          <h2 className="mb-2 text-3xl font-bold text-slate-900">Generate QR Codes</h2>
          <p className="mb-8 text-slate-600">Create QR codes for student BIBs and boulder numbers.</p>

          <div className="grid gap-8 md:grid-cols-2">
            <section className="space-y-4">
              <label className="block font-semibold text-slate-700">Student BIB Number</label>
              <input value={bibInput} onChange={(e) => setBibInput(e.target.value)} placeholder="Enter BIB number" className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-emerald-500" />
              <button type="button" onClick={() => bibInput.trim() && setBibQr(bibInput.trim())} className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">Generate BIB QR</button>
              {bibQr && <QrCodeCard value={`KCC:BIB:${bibQr}`} title="Student BIB" subtitle={bibQr} fileName={`KCC-BIB-${bibQr}`} />}
            </section>

            <section className="space-y-4">
              <label className="block font-semibold text-slate-700">Boulder Number</label>
              <input type="number" min="1" value={boulderInput} onChange={(e) => setBoulderInput(e.target.value)} placeholder="Enter boulder number" className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500" />
              <button type="button" onClick={() => Number(boulderInput) > 0 && setBoulderQr(String(Number(boulderInput)))} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">Generate Boulder QR</button>
              {boulderQr && <QrCodeCard value={`KCC:BOULDER:${boulderQr}`} title="Boulder" subtitle={`Number ${boulderQr}`} fileName={`KCC-Boulder-${boulderQr}`} />}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

