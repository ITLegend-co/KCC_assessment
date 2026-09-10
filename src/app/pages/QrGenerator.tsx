import { useEffect, useState } from 'react';
import { BackButton } from '../components/BackButton';
import { QrCodeCard } from '../components/QrCodeCard';
import { onValue, ref } from 'firebase/database';
import { database } from '../lib/firebase';
import { useRounds } from '../hooks/useRounds';
import { getBoulderRange, useCompetitionSettings } from '../lib/competition';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';

interface StudentOption {
  id: string;
  name: string;
}

export default function QrGenerator() {
  const rounds = useRounds();
  const { settings } = useCompetitionSettings();
  const [selectedRound, setSelectedRound] = useState('');
  const [bibInput, setBibInput] = useState('');
  const [bibQr, setBibQr] = useState('');
  const [boulderInput, setBoulderInput] = useState('');
  const [boulderQr, setBoulderQr] = useState('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState('');

  useEffect(() => { if (!selectedRound && rounds.length) setSelectedRound(rounds[0]); }, [rounds, selectedRound]);

  useEffect(() => {
    return onValue(ref(database, 'students'), (snapshot) => {
      if (!snapshot.exists()) {
        setStudents([]);
        setBibInput('');
        setBibQr('');
        setIsLoading(false);
        return;
      }

      const studentList = Object.values(snapshot.val() as Record<string, StudentOption>)
        .map((student) => ({ id: student.id, name: student.name }))
        .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
      setStudents(studentList);
      setBibInput((current) => studentList.some((student) => student.id === current) ? current : '');
      setBibQr((current) => studentList.some((student) => student.id === current) ? current : '');
      setIsLoading(false);
      setDataError('');
    }, (error) => { setIsLoading(false); setDataError(`${error.message} (${error.code || 'STUDENT_READ_FAILED'})`); });
  }, []);

  const boulderRange = getBoulderRange(rounds, selectedRound, settings);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6"><BackButton /></div>
        <div className="rounded-xl bg-white p-4 shadow-lg sm:p-6 md:p-8">
          {isLoading && <div className="mb-4"><LoadingMessage text="Loading registered students…" /></div>}
          {dataError && <div className="mb-4"><ErrorMessage message={dataError} /></div>}
          <h2 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">Generate QR Codes</h2>
          <p className="mb-8 text-slate-600">Create QR codes for student BIBs and boulder numbers.</p>

          <div className="grid gap-8 md:grid-cols-2">
            <section className="space-y-4">
              <label className="block font-semibold text-slate-700">Student BIB Number</label>
              <select value={bibInput} onChange={(e) => setBibInput(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 focus:ring-2 focus:ring-emerald-500">
                <option value="">-- Select Registered Student --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.id} - {student.name}</option>
                ))}
              </select>
              {students.length === 0 && <p className="text-sm text-amber-700">No registered students are available.</p>}
              <button type="button" disabled={!bibInput} onClick={() => setBibQr(bibInput)} className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300">Generate BIB QR</button>
              {bibQr && <QrCodeCard value={`KCC:BIB:${bibQr}`} title="Student BIB" subtitle={bibQr} fileName={`KCC-BIB-${bibQr}`} prominentSubtitle />}
            </section>

            <section className="space-y-4">
              <label className="block font-semibold text-slate-700">Boulder Number</label>
              <select aria-label="Round for boulder QR" value={selectedRound} onChange={(e) => { setSelectedRound(e.target.value); setBoulderInput(''); setBoulderQr(''); }} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3">{rounds.map((name) => <option key={name}>{name}</option>)}</select>
              <p className="text-sm text-slate-600">Allowed for {selectedRound}: Boulder {boulderRange.start}–{boulderRange.end}</p>
              <input type="number" min={boulderRange.start} max={boulderRange.end} value={boulderInput} onChange={(e) => setBoulderInput(e.target.value)} placeholder={`Enter ${boulderRange.start}–${boulderRange.end}`} className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-blue-500" />
              <button type="button" disabled={Number(boulderInput) < boulderRange.start || Number(boulderInput) > boulderRange.end} onClick={() => setBoulderQr(String(Number(boulderInput)))} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">Generate Boulder QR</button>
              {boulderQr && <QrCodeCard value={`KCC:BOULDER:${boulderQr}`} title="Boulder" subtitle={`Number ${boulderQr}`} fileName={`KCC-Boulder-${boulderQr}`} />}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
