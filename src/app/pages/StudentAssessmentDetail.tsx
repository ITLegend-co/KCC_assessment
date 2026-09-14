import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { ClipboardList, GraduationCap } from 'lucide-react';
import { onValue, ref } from 'firebase/database';
import { database } from '../lib/firebase';
import { getCurrentUser } from '../lib/auth';
import { BackButton } from '../components/BackButton';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { useRounds } from '../hooks/useRounds';
import { getBoulderRange, useCompetitionSettings } from '../lib/competition';
import { useStudentAssessments } from '../hooks/useStudentAssessments';
import {
  ASSESSMENT_GRADE_BANDS,
  getAssessmentGradeClasses,
  getLatestStudentAssessments,
  summarizeStudentAssessment,
  type AssessmentStudent,
} from '../lib/studentAssessment';

export default function StudentAssessmentDetail() {
  const navigate = useNavigate();
  const { studentKey = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentUser] = useState(() => getCurrentUser());
  const rounds = useRounds();
  const { settings: competitionSettings, loading: settingsLoading, error: settingsError } = useCompetitionSettings();
  const { assessments, loading: assessmentsLoading, error: assessmentsError } = useStudentAssessments();
  const [student, setStudent] = useState<AssessmentStudent | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState('');
  const [selectedRound, setSelectedRound] = useState(searchParams.get('round') || '');

  useEffect(() => {
    if (!currentUser) navigate('/login');
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!studentKey) return;
    return onValue(ref(database, `students/${studentKey}`), (snapshot) => {
      setStudent(snapshot.exists() ? { ...snapshot.val(), key: studentKey } : null);
      setStudentLoading(false);
      setStudentError(snapshot.exists() ? '' : 'This student could not be found.');
    }, (error) => {
      setStudentLoading(false);
      setStudentError(`${error.message} (${error.code || 'STUDENT_READ_FAILED'})`);
    });
  }, [studentKey]);

  useEffect(() => {
    if (!rounds.length) return;
    if (!rounds.includes(selectedRound)) {
      setSelectedRound(rounds[0]);
      setSearchParams({ round: rounds[0] }, { replace: true });
    }
  }, [rounds, selectedRound, setSearchParams]);

  const boulderRange = getBoulderRange(rounds, selectedRound, competitionSettings);
  const summary = useMemo(
    () => summarizeStudentAssessment(assessments, student?.id || '', selectedRound, boulderRange),
    [assessments, boulderRange.end, boulderRange.start, selectedRound, student?.id],
  );
  const boulders = Array.from({ length: boulderRange.count }, (_, index) => boulderRange.start + index);
  const latestRecords = useMemo(() => getLatestStudentAssessments(assessments).filter(
    (assessment) => assessment.id === student?.id &&
      assessment.round === selectedRound &&
      assessment.boulder >= boulderRange.start &&
      assessment.boulder <= boulderRange.end,
  ).sort((a, b) => a.boulder - b.boulder), [assessments, boulderRange.end, boulderRange.start, selectedRound, student?.id]);

  if (!currentUser) return null;

  const loading = studentLoading || assessmentsLoading || settingsLoading;
  const error = studentError || assessmentsError || settingsError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6"><BackButton /></div>
        {loading && <div className="mb-4"><LoadingMessage text="Loading detailed assessment…" /></div>}
        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {!loading && student && <>
          <header className="mb-6 rounded-xl bg-white p-5 shadow-lg sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <GraduationCap className="mt-1 h-8 w-8 text-cyan-700" />
                <div>
                  <p className="font-mono text-sm text-slate-500">{student.id}</p>
                  <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{student.name}</h1>
                  <p className="mt-1 text-sm text-slate-600">{student.school} · {student.class} · Age {student.age}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">Round
                <select value={selectedRound} onChange={(event) => { setSelectedRound(event.target.value); setSearchParams({ round: event.target.value }, { replace: true }); }} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3">
                  {rounds.map((roundName) => <option key={roundName} value={roundName}>{roundName}</option>)}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Overall Result</p><span className={`mt-2 inline-flex min-w-14 items-center justify-center rounded-lg border px-4 py-2 text-2xl font-bold ${getAssessmentGradeClasses(summary.overallGrade)}`}>{summary.overallGrade || '—'}</span></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Overall Average</p><p className="mt-2 text-2xl font-bold text-slate-900">{summary.overallAverage?.toFixed(2) || '—'} <span className="text-base text-slate-500">/ 5.00</span></p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Boulders Assessed</p><p className="mt-2 text-2xl font-bold text-slate-900">{summary.assessedBoulders} <span className="text-base text-slate-500">/ {boulderRange.count}</span></p></div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Overall average gives equal weight to each of the 12 climbing-element averages. Not Observed entries are excluded.</p>
          </header>

          <section className="overflow-hidden rounded-xl bg-white shadow-lg">
            <div className="border-b border-slate-200 p-4 sm:p-6"><h2 className="text-xl font-bold text-slate-900">Detailed Element Results</h2><p className="mt-1 text-sm text-slate-600">Scores for Boulder {boulderRange.start}–{boulderRange.end} in {selectedRound}.</p></div>

            <div className="space-y-3 p-3 lg:hidden">
              {summary.elements.map((element) => <article key={element.elementId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3"><h3 className="font-bold text-slate-900">{element.label}</h3><span className={`inline-flex min-w-11 items-center justify-center rounded-lg border px-2 py-1 font-bold ${getAssessmentGradeClasses(element.grade)}`}>{element.grade || '—'}</span></div>
                <div className="mt-3 flex flex-wrap gap-2">{boulders.map((boulderNumber) => {
                  const entered = Object.prototype.hasOwnProperty.call(element.scores, boulderNumber);
                  const rating = element.scores[boulderNumber];
                  return <span key={boulderNumber} className="rounded-lg bg-slate-100 px-2 py-1 text-sm"><strong>B{boulderNumber}:</strong> {entered ? typeof rating === 'number' ? rating : '–' : '—'}</span>;
                })}</div>
                <p className="mt-3 text-sm text-slate-600">Average: <strong>{element.average?.toFixed(2) || '—'} / 5.00</strong></p>
              </article>)}
            </div>

            <div className="hidden overflow-x-auto lg:block">
              <table className="min-w-full">
                <thead className="bg-slate-100 text-sm text-slate-700"><tr><th className="sticky left-0 z-10 min-w-56 bg-slate-100 px-4 py-3 text-left font-semibold">Climbing Element</th>{boulders.map((boulderNumber) => <th key={boulderNumber} className="min-w-14 px-2 py-3 text-center font-semibold">B{boulderNumber}</th>)}<th className="px-4 py-3 text-center font-semibold">Average</th><th className="px-4 py-3 text-center font-semibold">Grade</th></tr></thead>
                <tbody className="divide-y divide-slate-200">{summary.elements.map((element) => <tr key={element.elementId} className="hover:bg-slate-50"><td className="sticky left-0 bg-white px-4 py-3 font-semibold text-slate-900">{element.label}</td>{boulders.map((boulderNumber) => {
                  const entered = Object.prototype.hasOwnProperty.call(element.scores, boulderNumber);
                  const rating = element.scores[boulderNumber];
                  return <td key={boulderNumber} className="px-2 py-3 text-center font-semibold">{entered ? typeof rating === 'number' ? rating : '–' : '—'}</td>;
                })}<td className="px-4 py-3 text-center font-semibold">{element.average?.toFixed(2) || '—'}</td><td className="px-4 py-3 text-center"><span className={`inline-flex min-w-10 items-center justify-center rounded-lg border px-2 py-1 font-bold ${getAssessmentGradeClasses(element.grade)}`}>{element.grade || '—'}</span></td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="mt-6 rounded-xl bg-white p-5 shadow-lg sm:p-6">
            <div className="mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-slate-600" /><h2 className="text-xl font-bold text-slate-900">Coach Comments / Remarks</h2></div>
            {latestRecords.some((record) => record.remarks?.trim()) ? <div className="space-y-3">{latestRecords.filter((record) => record.remarks?.trim()).map((record) => <article key={record.key} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-2 text-sm"><strong>Boulder {record.boulder}</strong><span className="text-slate-500">{record.evaluator} · {new Date(record.timestamp).toLocaleString()}</span></div><p className="mt-2 whitespace-pre-wrap text-slate-700">{record.remarks}</p></article>)}</div> : <p className="text-slate-500">No comments have been recorded for this round.</p>}
          </section>

          <section className="mt-6 rounded-xl bg-slate-800 p-5 text-white shadow-lg sm:p-6">
            <h2 className="text-lg font-bold">Equal Grade Bands</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">{ASSESSMENT_GRADE_BANDS.map((band) => <div key={band.grade} className="rounded-lg bg-white/10 p-3 text-center"><strong className="block text-lg">{band.grade}</strong><span>{band.minimum.toFixed(2)}–{band.maximum.toFixed(2)}</span></div>)}</div>
            <p className="mt-3 text-xs text-slate-300">“–” means Not Observed and is excluded from averages. “—” means no assessment was entered for that boulder.</p>
          </section>
        </>}
      </div>
    </div>
  );
}
