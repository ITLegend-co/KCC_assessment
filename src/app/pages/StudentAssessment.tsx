import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Save,
} from 'lucide-react';
import { onValue, push, ref } from 'firebase/database';
import { database } from '../lib/firebase';
import { getCurrentUser } from '../lib/auth';
import { BackButton } from '../components/BackButton';
import { SearchableSelect } from '../components/SearchableSelect';
import { QrScannerModal } from '../components/QrScannerModal';
import { ErrorMessage, LoadingMessage, OfflineMessage } from '../components/StatusMessage';
import { useRounds } from '../hooks/useRounds';
import { getBoulderRange, useCompetitionSettings } from '../lib/competition';
import { useStudentAssessments } from '../hooks/useStudentAssessments';
import { describeError } from '../lib/appError';
import {
  getAssignedBoulder,
  isBoulderAssignmentEnabled,
  useBoulderAssignmentSettings,
} from '../lib/boulderAssignments';
import {
  ASSESSMENT_ELEMENTS,
  ASSESSMENT_RATING_LABELS,
  getLatestStudentAssessments,
  type AssessmentElementId,
  type AssessmentRating,
  type AssessmentStudent,
} from '../lib/studentAssessment';

type DraftRating = AssessmentRating | undefined;
type DraftRatings = Partial<Record<AssessmentElementId, DraftRating>>;

const ratingChoices: Array<{ value: AssessmentRating; short: string; label: string }> = [
  { value: 1, short: '1', label: ASSESSMENT_RATING_LABELS[1] },
  { value: 2, short: '2', label: ASSESSMENT_RATING_LABELS[2] },
  { value: 3, short: '3', label: ASSESSMENT_RATING_LABELS[3] },
  { value: 4, short: '4', label: ASSESSMENT_RATING_LABELS[4] },
  { value: 5, short: '5', label: ASSESSMENT_RATING_LABELS[5] },
  { value: 'not-observed', short: '–', label: 'Not Observed' },
];

export default function StudentAssessment() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const rounds = useRounds();
  const { settings: competitionSettings, loading: settingsLoading, error: settingsError } = useCompetitionSettings();
  const {
    settings: boulderAssignmentSettings,
    loading: assignmentsLoading,
    error: assignmentsError,
  } = useBoulderAssignmentSettings();
  const { assessments, loading: assessmentsLoading, error: assessmentsError } = useStudentAssessments();

  const [students, setStudents] = useState<AssessmentStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [busy, setBusy] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [round, setRound] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [boulder, setBoulder] = useState('');
  const [ratings, setRatings] = useState<DraftRatings>({});
  const [remarks, setRemarks] = useState('');
  const [editingExisting, setEditingExisting] = useState(false);
  const [scannerMode, setScannerMode] = useState<'student' | 'boulder' | null>(null);
  const assignmentRequired = isBoulderAssignmentEnabled(currentUser?.role, boulderAssignmentSettings);
  const assignedBoulder = getAssignedBoulder(currentUser, round, boulderAssignmentSettings);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'administrator' && currentUser.role !== 'coach') navigate('/');
  }, [currentUser, navigate]);

  useEffect(() => onValue(ref(database, 'students'), (snapshot) => {
    const data = snapshot.val() || {};
    setStudents(Object.entries(data).map(([key, value]) => ({
      ...(value as Omit<AssessmentStudent, 'key'>),
      key,
    })).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true })));
    setStudentsLoading(false);
    setDataError('');
  }, (error) => {
    setStudentsLoading(false);
    setDataError(`${error.message} (${error.code || 'STUDENT_READ_FAILED'})`);
  }), []);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  useEffect(() => {
    if (!assignmentRequired || currentStep > 3) return;
    setBoulder(assignedBoulder === null ? '' : String(assignedBoulder));
  }, [assignedBoulder, assignmentRequired, currentStep, round]);

  const selectedStudentRecord = useMemo(
    () => students.find((student) => student.id === selectedStudent),
    [selectedStudent, students],
  );
  const boulderRange = getBoulderRange(rounds, round, competitionSettings);
  const latestAssessments = useMemo(() => getLatestStudentAssessments(assessments), [assessments]);

  const validateBoulder = () => {
    const value = Number(boulder);
    const insideRound = Number.isInteger(value) && value >= boulderRange.start && value <= boulderRange.end;
    if (assignmentRequired) return insideRound && assignedBoulder !== null && value === assignedBoulder;
    return insideRound;
  };

  const prepareEvaluation = () => {
    const existing = latestAssessments.find(
      (assessment) => assessment.id === selectedStudent &&
        assessment.round === round &&
        assessment.boulder === Number(boulder),
    );
    const draft: DraftRatings = {};
    ASSESSMENT_ELEMENTS.forEach((element) => {
      const stored = existing?.ratings?.[element.id];
      draft[element.id] = typeof stored === 'number'
        ? stored as AssessmentRating
        : stored === 'not-observed' || stored === null
          ? 'not-observed'
          : undefined;
    });
    setRatings(draft);
    setRemarks(existing?.remarks || '');
    setEditingExisting(Boolean(existing));
  };

  const handleNext = () => {
    setActionError('');
    if (assignmentsLoading || assignmentsError) {
      setActionError(assignmentsError || 'Boulder assignments are still loading. Please wait.');
      return;
    }
    if (currentStep === 1) {
      if (!round) { setActionError('Select a round to continue.'); return; }
      if (assignmentRequired && assignedBoulder === null) {
        setActionError(`No boulder is assigned to you for ${round}. Ask an assignment manager to assign one in Settings.`);
        return;
      }
      if (assignmentRequired) setBoulder(String(assignedBoulder));
      setCurrentStep(2);
      return;
    }
    if (currentStep === 2) {
      if (!selectedStudentRecord) { setActionError('Select a registered student to continue.'); return; }
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      if (!validateBoulder()) {
        setActionError(assignmentRequired
          ? `Your assigned boulder for ${round} is unavailable. Ask an assignment manager to check Settings.`
          : `Select Boulder ${boulderRange.start}–${boulderRange.end} for ${round}.`);
        return;
      }
      prepareEvaluation();
      setCurrentStep(4);
    }
  };

  const handlePrevious = () => {
    setActionError('');
    if (currentStep > 1 && currentStep <= 4) setCurrentStep((step) => step - 1);
    if (currentStep === 5) setCurrentStep(4);
  };

  const setRating = (elementId: AssessmentElementId, value: AssessmentRating) => {
    setRatings((current) => ({ ...current, [elementId]: value }));
    setActionError('');
  };

  const handleSave = async () => {
    setActionError('');
    setSuccessMessage('');
    if (assignmentsLoading || assignmentsError) {
      setActionError(assignmentsError || 'Boulder assignments are still loading. Please wait before saving.');
      return;
    }
    const missing = ASSESSMENT_ELEMENTS.filter((element) => ratings[element.id] === undefined);
    if (missing.length) {
      setActionError(`Complete all ${ASSESSMENT_ELEMENTS.length} elements. Select 1–5 or Not Observed for: ${missing.map((item) => item.label).join(', ')}.`);
      return;
    }
    if (!selectedStudentRecord || !validateBoulder() || !round || !currentUser) {
      setActionError(assignmentRequired
        ? 'Your assigned boulder is no longer valid. Ask an assignment manager to check Settings.'
        : 'The round, student, or boulder selection is no longer valid. Please select them again.');
      return;
    }

    setBusy(true);
    try {
      const matchingVersions = assessments.filter(
        (assessment) => assessment.id === selectedStudent &&
          assessment.round === round &&
          assessment.boulder === Number(boulder),
      );
      const version = matchingVersions.reduce((highest, item) => Math.max(highest, Number(item.version || 0)), 0) + 1;
      const storedRatings = Object.fromEntries(
        ASSESSMENT_ELEMENTS.map((element) => [element.id, ratings[element.id] ?? 'not-observed']),
      );
      await push(ref(database, 'studentAssessments'), {
        id: selectedStudentRecord.id,
        studentKey: selectedStudentRecord.key || '',
        round,
        boulder: Number(boulder),
        ratings: storedRatings,
        remarks: remarks.trim(),
        evaluator: currentUser.username,
        timestamp: Date.now(),
        version,
      });
      setSuccessMessage(`${selectedStudentRecord.name}'s Boulder ${boulder} assessment was saved.`);
      setCurrentStep(5);
    } catch (error) {
      const details = describeError(error, 'Student assessment could not be saved');
      setActionError(`${details.message} — ${details.code} — ${details.time}`);
    } finally {
      setBusy(false);
    }
  };

  const resetRatings = () => {
    setRatings({});
    setRemarks('');
    setEditingExisting(false);
    setSuccessMessage('');
    setActionError('');
  };

  const nextStudent = () => {
    setSelectedStudent('');
    resetRatings();
    setCurrentStep(2);
  };

  const nextBoulder = () => {
    setBoulder('');
    resetRatings();
    setCurrentStep(3);
  };

  const startNew = () => {
    setRound('');
    setSelectedStudent('');
    setBoulder('');
    resetRatings();
    setCurrentStep(1);
  };

  const handleQrScan = (rawValue: string) => {
    if (scannerMode === 'student') {
      const scannedBib = rawValue.startsWith('KCC:BIB:')
        ? rawValue.slice('KCC:BIB:'.length).trim()
        : rawValue.trim();
      const student = students.find((item) => item.id.toLowerCase() === scannedBib.toLowerCase());
      if (!student) setActionError(`No registered student was found for BIB ${scannedBib}.`);
      else setSelectedStudent(student.id);
    }

    if (scannerMode === 'boulder' && !assignmentRequired) {
      const scannedBoulder = rawValue.startsWith('KCC:BOULDER:')
        ? rawValue.slice('KCC:BOULDER:'.length).trim()
        : rawValue.trim();
      const value = Number(scannedBoulder);
      if (!Number.isInteger(value) || value < boulderRange.start || value > boulderRange.end) {
        setActionError(`This QR is not valid for ${round}. Use Boulder ${boulderRange.start}–${boulderRange.end}.`);
      } else setBoulder(String(value));
    }
    setScannerMode(null);
  };

  if (!currentUser || (currentUser.role !== 'administrator' && currentUser.role !== 'coach')) return null;

  const steps = ['Round', 'Student', 'Boulder', 'Evaluation', 'Saved'];

  return (
    <div className="kcc-page kcc-assessment-page min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6"><BackButton title="Student" accent="Assessment" /></div>
        {!isOnline && <div className="mb-4"><OfflineMessage /></div>}
        {(studentsLoading || assessmentsLoading || settingsLoading || assignmentsLoading) && <div className="mb-4"><LoadingMessage text="Loading student assessment…" /></div>}
        {(dataError || assessmentsError || settingsError || assignmentsError) && <div className="mb-4"><ErrorMessage message={dataError || assessmentsError || settingsError || assignmentsError} /></div>}

        <main className="kcc-panel rounded-xl bg-white p-4 shadow-lg sm:p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-cyan-700" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Student Assessment</h1>
              <p className="text-sm text-slate-600">Coach technical evaluation based on the {ASSESSMENT_ELEMENTS.length} KCC climbing elements.</p>
            </div>
          </div>

          <div className="kcc-stepper mb-6 flex w-full items-start pb-2">
            {steps.map((label, index) => {
              const step = index + 1;
              return <div key={label} className="relative flex min-w-0 flex-1 flex-col items-center">
                {index > 0 && <div className={`absolute right-1/2 top-4 h-1 w-full ${currentStep >= step ? 'bg-cyan-600' : 'bg-slate-200'}`} />}
                <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${currentStep >= step ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{step}</div>
                <span className={`mt-2 w-full truncate px-0.5 text-center text-[10px] sm:text-xs ${currentStep === step ? 'font-semibold text-cyan-700' : 'text-slate-500'}`}>{label}</span>
              </div>;
            })}
          </div>

          {actionError && <div className="mb-5"><ErrorMessage message={actionError} /></div>}

          {currentStep === 1 && <section className="space-y-6">
            <div>
              <label htmlFor="assessment-round" className="mb-2 block text-sm font-semibold text-slate-700">Round</label>
              <select id="assessment-round" value={round} onChange={(event) => { setRound(event.target.value); setBoulder(''); }} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 focus:ring-2 focus:ring-cyan-500">
                <option value="">-- Select Round --</option>
                {rounds.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              {assignmentRequired && <p className="mt-2 text-sm text-indigo-700">Your assigned boulder will be loaded automatically for the selected round.</p>}
            </div>
            <button type="button" onClick={handleNext} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 font-semibold text-white hover:bg-cyan-700">Next <ChevronRight className="h-5 w-5" /></button>
          </section>}

          {currentStep === 2 && <section className="space-y-6">
            <div className="rounded-lg bg-slate-50 p-4 text-sm"><strong>Round:</strong> {round}</div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Select Student</label>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1"><SearchableSelect value={selectedStudent} onChange={setSelectedStudent} options={students.map((student) => ({ value: student.id, label: `${student.id} - ${student.name}` }))} placeholder="Search BIB or student name" required /></div>
                <button type="button" onClick={() => setScannerMode('student')} aria-label="Scan student BIB QR" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700"><Camera className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={handlePrevious} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-500 px-4 font-semibold text-white hover:bg-slate-600"><ChevronLeft className="h-5 w-5" /> Previous</button>
              <button type="button" onClick={handleNext} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-700">Next <ChevronRight className="h-5 w-5" /></button>
            </div>
          </section>}

          {currentStep === 3 && <section className="space-y-6">
            <div className="rounded-lg bg-slate-50 p-4 text-sm"><strong>{selectedStudentRecord?.name}</strong><span className="mx-2 text-slate-300">|</span>{round}</div>
            {assignmentRequired ? (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 text-center">
                <p className="text-sm font-semibold text-indigo-700">Your assigned boulder</p>
                <p className="mt-1 text-3xl font-bold text-indigo-950">Boulder {assignedBoulder ?? '—'}</p>
                <p className="mt-2 text-xs text-indigo-700">This assignment is controlled in Settings and cannot be changed here.</p>
              </div>
            ) : (
              <div>
                <label htmlFor="assessment-boulder" className="mb-2 block text-sm font-semibold text-slate-700">Boulder Number</label>
                <p className="mb-2 text-sm text-slate-500">Available for {round}: Boulder {boulderRange.start}–{boulderRange.end}</p>
                <div className="flex gap-2">
                  <input id="assessment-boulder" type="number" min={boulderRange.start} max={boulderRange.end} value={boulder} onChange={(event) => setBoulder(event.target.value)} placeholder={`Enter ${boulderRange.start}–${boulderRange.end}`} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-cyan-500" />
                  <button type="button" onClick={() => setScannerMode('boulder')} aria-label="Scan boulder QR" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white hover:bg-violet-700"><Camera className="h-5 w-5" /></button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={handlePrevious} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-500 px-4 font-semibold text-white hover:bg-slate-600"><ChevronLeft className="h-5 w-5" /> Previous</button>
              <button type="button" onClick={handleNext} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-700">Next <ChevronRight className="h-5 w-5" /></button>
            </div>
          </section>}

          {currentStep === 4 && <section className="space-y-5">
            <div className="rounded-lg bg-slate-50 p-4 text-sm">
              <strong>{selectedStudentRecord?.name}</strong><span className="mx-2 text-slate-300">|</span>{round}<span className="mx-2 text-slate-300">|</span>Boulder {boulder}
            </div>
            {editingExisting && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">An assessment already exists for this student and boulder. Saving will create an updated version while preserving its history.</div>}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"><strong>Scoring:</strong> 1 Not Demonstrated · 2 Developing · 3 Competent · 4 Proficient · 5 Advanced · – Not Observed</div>

            <div className="space-y-4">
              {ASSESSMENT_ELEMENTS.map((element, index) => <fieldset key={element.id} className="rounded-xl border border-slate-200 p-4">
                <legend className="px-2 font-bold text-slate-900">{index + 1}. {element.label}</legend>
                <p className="mb-3 text-sm text-slate-600">{element.observe}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {ratingChoices.map((choice) => {
                    const selected = ratings[element.id] === choice.value;
                    return <button key={choice.short} type="button" onClick={() => setRating(element.id, choice.value)} aria-pressed={selected} title={choice.label} className={`min-h-12 rounded-lg border px-2 py-2 font-bold transition-colors ${selected ? 'border-cyan-700 bg-cyan-600 text-white ring-2 ring-cyan-200' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>
                      <span className="block text-lg">{choice.short}</span><span className="block text-[10px] font-medium sm:hidden">{choice.label}</span>
                    </button>;
                  })}
                </div>
                {ratings[element.id] !== undefined && <p className="mt-2 text-sm font-medium text-cyan-700">Selected: {ratings[element.id] === 'not-observed' || ratings[element.id] === null ? 'Not Observed' : ASSESSMENT_RATING_LABELS[ratings[element.id] as 1 | 2 | 3 | 4 | 5]}</p>}
              </fieldset>)}
            </div>

            <div>
              <label htmlFor="assessment-remarks" className="mb-2 block text-sm font-semibold text-slate-700">Comments / Remarks</label>
              <textarea id="assessment-remarks" rows={4} value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder="Optional observations, strengths, weaknesses, or coaching notes…" className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button type="button" onClick={handlePrevious} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-slate-500 px-4 font-semibold text-white hover:bg-slate-600"><ChevronLeft className="h-5 w-5" /> Previous</button>
              <button type="button" disabled={busy} onClick={() => void handleSave()} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-700 disabled:opacity-50"><Save className="h-5 w-5" /> {busy ? 'Saving…' : editingExisting ? 'Save Updated Assessment' : 'Save Assessment'}</button>
            </div>
          </section>}

          {currentStep === 5 && <section className="space-y-6">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center text-emerald-800"><CheckCircle2 className="mx-auto mb-2 h-10 w-10" /><p className="font-bold">Assessment saved successfully</p><p className="mt-1 text-sm">{successMessage}</p></div>
            <div className={`grid gap-3 ${assignmentRequired ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              <button type="button" onClick={nextStudent} className="min-h-12 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">Keep Round + Boulder<br />Next Student</button>
              {!assignmentRequired && <button type="button" onClick={nextBoulder} className="min-h-12 rounded-lg bg-violet-600 px-4 py-3 font-semibold text-white hover:bg-violet-700">Keep Round + Student<br />Next Boulder</button>}
              <button type="button" onClick={startNew} className="min-h-12 rounded-lg bg-cyan-600 px-4 py-3 font-semibold text-white hover:bg-cyan-700">Start New Selection</button>
            </div>
          </section>}
        </main>
      </div>

      {scannerMode && <QrScannerModal title={scannerMode === 'student' ? 'Scan Student BIB' : 'Scan Boulder QR'} onScan={handleQrScan} onClose={() => setScannerMode(null)} />}
    </div>
  );
}
