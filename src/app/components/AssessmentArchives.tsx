import { useEffect, useState } from 'react';
import { Archive, Download, Eye, PlayCircle, RotateCcw, Save, X } from 'lucide-react';
import { database } from '../lib/firebase';
import { get, onValue, push, ref, set, update } from 'firebase/database';
import { describeError } from '../lib/appError';

interface ArchiveRecord {
  key: string;
  name: string;
  createdAt: number;
  createdBy: string;
  students?: Record<string, unknown>;
  scores?: Record<string, unknown>;
  settings?: Record<string, unknown>;
}

export function AssessmentArchives({ username }: { username: string }) {
  const [name, setName] = useState('');
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [selected, setSelected] = useState<ArchiveRecord | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => onValue(ref(database, 'assessmentArchives'), (snapshot) => {
    const data = snapshot.val() || {};
    setArchives(Object.entries(data).map(([key, value]) => ({ ...(value as Omit<ArchiveRecord, 'key'>), key })).sort((a, b) => b.createdAt - a.createdAt));
  }, (reason) => setError(`${reason.message} (${reason.code || 'ARCHIVE_READ_FAILED'})`)), []);

  const snapshotCurrent = async () => {
    const [students, scores, settings] = await Promise.all([
      get(ref(database, 'students')), get(ref(database, 'scores')), get(ref(database, 'settings')),
    ]);
    return { students: students.val() || {}, scores: scores.val() || {}, settings: settings.val() || {} };
  };

  const saveArchive = async () => {
    const cleanName = name.trim();
    if (!cleanName) { setError('Enter an assessment name before saving.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const snapshot = await snapshotCurrent();
      await set(push(ref(database, 'assessmentArchives')), { name: cleanName, createdAt: Date.now(), createdBy: username, ...snapshot });
      setName(''); setMessage('Assessment saved successfully.');
    } catch (reason) {
      const details = describeError(reason, 'Assessment could not be saved');
      setError(`${details.message} — ${details.code} — ${details.time}`);
    } finally { setBusy(false); }
  };

  const startNew = async () => {
    if (!window.confirm('Start a new assessment? Active students and scores will be cleared. Save an archive first if you need these records.')) return;
    setBusy(true); setError('');
    try {
      await update(ref(database), { students: null, scores: null });
      setMessage('New assessment started. Existing archives were not changed.');
    } catch (reason) { const d = describeError(reason, 'New assessment could not be started'); setError(`${d.message} — ${d.code}`); }
    finally { setBusy(false); }
  };

  const restoreArchive = async (archive: ArchiveRecord) => {
    if (!window.confirm(`Restore “${archive.name}”? This replaces the active students, scores, and competition settings.`)) return;
    setBusy(true); setError('');
    try {
      await update(ref(database), { students: archive.students || null, scores: archive.scores || null, settings: archive.settings || null });
      setMessage(`“${archive.name}” restored successfully.`);
    } catch (reason) { const d = describeError(reason, 'Archive could not be restored'); setError(`${d.message} — ${d.code}`); }
    finally { setBusy(false); }
  };

  const downloadArchive = (archive: ArchiveRecord) => {
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${archive.name.replace(/[^a-z0-9_-]/gi, '-')}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return <section className="border-b border-slate-200 pb-6 mb-6">
    <div className="mb-2 flex items-center gap-2"><Archive className="h-5 w-5" /><h3 className="text-xl font-bold">Assessment Save Files</h3></div>
    <p className="mb-4 text-sm text-slate-600">Save the current students, scores, rounds, and boulder settings before starting another event.</p>
    <div className="flex flex-col gap-2 sm:flex-row"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Example: KCC Assessment September 2026" className="min-h-11 min-w-0 flex-1 rounded-lg border px-4" /><button disabled={busy} onClick={saveArchive} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-semibold text-white disabled:opacity-50"><Save className="h-5 w-5" />Save Current Assessment</button></div>
    {message && <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="mt-5 space-y-3">{archives.map((archive) => <article key={archive.key} className="rounded-lg border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-bold">{archive.name}</p><p className="text-sm text-slate-500">{new Date(archive.createdAt).toLocaleString()} · {Object.keys(archive.students || {}).length} students · {Object.keys(archive.scores || {}).length} score records</p></div><div className="grid grid-cols-3 gap-2"><button aria-label={`View ${archive.name}`} onClick={() => setSelected(archive)} className="flex min-h-11 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><Eye className="h-5 w-5" /></button><button aria-label={`Download ${archive.name}`} onClick={() => downloadArchive(archive)} className="flex min-h-11 items-center justify-center rounded-lg bg-violet-100 text-violet-700"><Download className="h-5 w-5" /></button><button aria-label={`Restore ${archive.name}`} onClick={() => restoreArchive(archive)} className="flex min-h-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700"><RotateCcw className="h-5 w-5" /></button></div></div></article>)}</div>
    <button disabled={busy} onClick={startNew} className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-700 px-4 font-semibold text-white disabled:opacity-50"><PlayCircle className="h-5 w-5" />Start New Assessment</button>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="archive-title" onClick={() => setSelected(null)}><div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5" onClick={(e) => e.stopPropagation()}><div className="flex justify-between gap-3"><h3 id="archive-title" className="text-xl font-bold">{selected.name}</h3><button aria-label="Close archive details" onClick={() => setSelected(null)} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-slate-100"><X /></button></div><dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm"><div><dt className="font-semibold">Saved</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div><div><dt className="font-semibold">Saved by</dt><dd>{selected.createdBy}</dd></div><div><dt className="font-semibold">Students</dt><dd>{Object.keys(selected.students || {}).length}</dd></div><div><dt className="font-semibold">Score records</dt><dd>{Object.keys(selected.scores || {}).length}</dd></div></dl><p className="mt-4 text-sm text-slate-600">Restore this save file to review its complete ranking and score history in the normal system pages. You can save the current assessment first so it can be restored afterward.</p></div></div>}
  </section>;
}
