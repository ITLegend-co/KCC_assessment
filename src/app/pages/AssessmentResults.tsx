import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, FileSpreadsheet, GraduationCap, Search, Trash2 } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { onValue, ref, set, update } from 'firebase/database';
import { database } from '../lib/firebase';
import { getCurrentUser } from '../lib/auth';
import { BackButton } from '../components/BackButton';
import { StudentInfoModal } from '../components/StudentInfoModal';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import { useRounds } from '../hooks/useRounds';
import { useAssessmentResultFields, useStudentAssessments } from '../hooks/useStudentAssessments';
import {
  ASSESSMENT_GRADE_BANDS,
  getAssessmentGradeClasses,
  summarizeStudentAssessment,
  type AssessmentStudent,
} from '../lib/studentAssessment';
import { exportSystemWorkbook } from '../lib/systemExcelExport';

interface ScoreRecord {
  id: string;
  round: string;
  boulder: number;
  at: number | null;
  az: number | null;
  attemptCount?: number;
  timestamp?: number;
  version?: number;
  key?: string;
}

export default function AssessmentResults() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const rounds = useRounds();
  const { assessments, loading: assessmentsLoading, error: assessmentsError } = useStudentAssessments();
  const { fields, loading: fieldsLoading, error: fieldsError } = useAssessmentResultFields();
  const [students, setStudents] = useState<AssessmentStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentError, setStudentError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<AssessmentStudent | null>(null);
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [adminBusy, setAdminBusy] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminError, setAdminError] = useState('');
  const isAdministrator = currentUser?.role === 'administrator';

  useEffect(() => onValue(ref(database, 'students'), (snapshot) => {
    const data = snapshot.val() || {};
    setStudents(Object.entries(data).map(([key, value]) => ({
      ...(value as Omit<AssessmentStudent, 'key'>),
      key,
    })).sort((a, b) => a.name.localeCompare(b.name)));
    setStudentsLoading(false);
    setStudentError('');
  }, (error) => {
    setStudentsLoading(false);
    setStudentError(`${error.message} (${error.code || 'STUDENT_READ_FAILED'})`);
  }), []);

  useEffect(() => onValue(ref(database, 'scores'), (snapshot) => {
    const data = snapshot.val() || {};
    setScores(Object.entries(data).map(([key, value]) => ({
      ...(value as Omit<ScoreRecord, 'key'>),
      key,
    })));
  }, (error) => setAdminError(`${error.message} (${error.code || 'SCORE_READ_FAILED'})`)), []);

  const results = useMemo(() => students.map((student) => ({
    student,
    summary: summarizeStudentAssessment(assessments, student.id, rounds),
  })), [assessments, rounds, students]);

  const assessedResults = results.filter(({ summary }) => summary.assessedBoulders > 0);

  const filteredResults = assessedResults.filter(({ student }) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [student.id, student.name, student.school, student.class]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      if (next.has(studentId)) next.delete(studentId);
      else next.add(studentId);
      return next;
    });
  };

  const toggleAllVisible = () => {
    const visibleIds = filteredResults.map(({ student }) => student.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.has(id));
    setSelectedStudentIds((current) => {
      const next = new Set(current);
      visibleIds.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const deleteSelectedAssessments = async () => {
    if (!isAdministrator || selectedStudentIds.size === 0) return;
    const names = assessedResults.filter(({ student }) => selectedStudentIds.has(student.id)).map(({ student }) => student.name);
    if (!window.confirm(`Delete all coach assessment records for ${names.length} selected student${names.length === 1 ? '' : 's'}? Rankings and judge scores will not be deleted.`)) return;
    setAdminBusy(true); setAdminError(''); setAdminMessage('');
    try {
      const updates: Record<string, null> = {};
      assessments.forEach((assessment) => {
        if (assessment.key && selectedStudentIds.has(assessment.id)) updates[`studentAssessments/${assessment.key}`] = null;
      });
      await update(ref(database), updates);
      setSelectedStudentIds(new Set());
      setAdminMessage(`Deleted assessment records for ${names.length} student${names.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Selected assessments could not be deleted.');
    } finally { setAdminBusy(false); }
  };

  const deleteAllAssessments = async () => {
    if (!isAdministrator || !assessedResults.length) return;
    if (!window.confirm(`Delete all coach assessment records for ${assessedResults.length} assessed students? Rankings and judge scores will not be deleted. This cannot be undone.`)) return;
    setAdminBusy(true); setAdminError(''); setAdminMessage('');
    try {
      await set(ref(database, 'studentAssessments'), null);
      setSelectedStudentIds(new Set());
      setAdminMessage('All student assessment records were deleted.');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Assessments could not be deleted.');
    } finally { setAdminBusy(false); }
  };

  const exportExcel = async () => {
    if (!isAdministrator) return;
    setAdminBusy(true); setAdminError(''); setAdminMessage('');
    try {
      await exportSystemWorkbook({ students, scores, assessments, rounds });
      setAdminMessage('Excel report exported successfully.');
    } catch (error) {
      setAdminError(error instanceof Error ? error.message : 'Excel report could not be created.');
    } finally { setAdminBusy(false); }
  };

  const openDetail = (student: AssessmentStudent) => {
    if (!student.key) return;
    navigate(`/assessment-results/${student.key}`);
  };

  const loading = studentsLoading || assessmentsLoading || fieldsLoading;
  const error = studentError || assessmentsError || fieldsError;
  const visibleColumnCount = 2 + Object.values(fields).filter(Boolean).length + (isAdministrator ? 1 : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">{currentUser ? <BackButton /> : <Link to="/ranking-only" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900"><ArrowLeft className="h-4 w-4" /> Back to Ranking</Link>}</div>
        <main className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="border-b border-slate-200 p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-cyan-700" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Student Assessment Results</h1>
                  <p className="text-sm text-slate-600">One overall technical evaluation compiled from every assessed boulder.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {isAdministrator && <button type="button" disabled={adminBusy} onClick={() => void exportExcel()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"><FileSpreadsheet className="h-5 w-5" />Export Complete Excel</button>}
                {(isAdministrator || currentUser?.role === 'coach') && <Link to="/student-assessment" className="flex min-h-11 items-center justify-center rounded-lg bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-700">Enter Student Assessment</Link>}
              </div>
            </div>

            <div className="mt-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search BIB, name, school, or class…" className="min-h-11 w-full rounded-lg border border-slate-300 pl-10 pr-4 focus:ring-2 focus:ring-cyan-500" />
              </div>
            </div>

            {isAdministrator && <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button type="button" disabled={adminBusy || !filteredResults.length} onClick={toggleAllVisible} className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{filteredResults.length > 0 && filteredResults.every(({ student }) => selectedStudentIds.has(student.id)) ? 'Clear Visible Selection' : 'Select All Visible'}</button>
              <button type="button" disabled={adminBusy || selectedStudentIds.size === 0} onClick={() => void deleteSelectedAssessments()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 font-semibold text-white hover:bg-red-700 disabled:opacity-50"><Trash2 className="h-5 w-5" />Delete Selected ({selectedStudentIds.size})</button>
              <button type="button" disabled={adminBusy || !assessedResults.length} onClick={() => void deleteAllAssessments()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"><Trash2 className="h-5 w-5" />Delete All Assessments</button>
            </div>}
            {adminMessage && <p role="status" className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">{adminMessage}</p>}
            {adminError && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{adminError}</p>}
          </div>

          {loading && <div className="p-4"><LoadingMessage text="Loading assessment results…" /></div>}
          {error && <div className="p-4"><ErrorMessage message={error} /></div>}

          {!loading && !error && <>
            <div className="space-y-3 p-3 md:hidden">
              {filteredResults.map(({ student, summary }) => <article key={student.key || student.id} className="rounded-xl border border-slate-200 p-4 shadow-sm">
                {isAdministrator && <label className="mb-3 flex min-h-11 items-center gap-3 rounded-lg bg-slate-50 px-3 text-sm font-semibold text-slate-700"><input type="checkbox" checked={selectedStudentIds.has(student.id)} onChange={() => toggleStudentSelection(student.id)} className="h-5 w-5" />Select this assessment</label>}
                <div className="flex items-start justify-between gap-3">
                  <button type="button" onClick={() => setSelectedStudent(student)} className="text-left font-bold text-slate-900 hover:text-cyan-700 hover:underline">{student.name}</button>
                  <span className={`inline-flex min-w-12 items-center justify-center rounded-lg border px-3 py-1 text-lg font-bold ${getAssessmentGradeClasses(summary.overallGrade)}`}>{summary.overallGrade || '—'}</span>
                </div>
                {fields.bib && <p className="mt-1 text-sm text-slate-600">BIB: {student.id}</p>}
                {fields.school && <p className="mt-1 text-sm text-slate-600">School: {student.school || '—'}</p>}
                {fields.class && <p className="mt-1 text-sm text-slate-600">Class: {student.class || '—'}</p>}
                {fields.age && <p className="mt-1 text-sm text-slate-600">Age: {student.age || '—'}</p>}
                {fields.gender && <p className="mt-1 text-sm text-slate-600">Gender: {student.gender === 'male' ? 'Male' : 'Female'}</p>}
                {fields.overallAverage && <p className="mt-1 text-sm text-slate-600">Overall average: {summary.overallAverage?.toFixed(2) || '—'} / 5.00</p>}
                <p className="mt-2 text-xs text-slate-500">{summary.assessedBoulders ? `${summary.assessedBoulders} boulder${summary.assessedBoulders === 1 ? '' : 's'} assessed` : 'Not assessed yet'}</p>
              </article>)}
              {!filteredResults.length && <p className="py-10 text-center text-slate-500">{assessedResults.length ? 'No assessed students match this search.' : 'No students have been assessed yet.'}</p>}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full">
                <thead className="bg-slate-100 text-left text-sm text-slate-700"><tr>
                  {isAdministrator && <th className="w-16 px-4 py-3 text-center font-semibold"><input type="checkbox" aria-label="Select all visible assessments" checked={filteredResults.length > 0 && filteredResults.every(({ student }) => selectedStudentIds.has(student.id))} onChange={toggleAllVisible} className="h-5 w-5" /></th>}
                  <th className="px-4 py-3 font-semibold">Name</th>
                  {fields.bib && <th className="px-4 py-3 font-semibold">BIB</th>}
                  {fields.school && <th className="px-4 py-3 font-semibold">School</th>}
                  {fields.class && <th className="px-4 py-3 font-semibold">Class</th>}
                  {fields.age && <th className="px-4 py-3 font-semibold">Age</th>}
                  {fields.gender && <th className="px-4 py-3 font-semibold">Gender</th>}
                  {fields.overallAverage && <th className="px-4 py-3 text-center font-semibold">Average</th>}
                  <th className="px-4 py-3 text-center font-semibold">Overall Result</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredResults.map(({ student, summary }) => <tr key={student.key || student.id} className="hover:bg-slate-50">
                    {isAdministrator && <td className="px-4 py-3 text-center"><input type="checkbox" aria-label={`Select ${student.name}`} checked={selectedStudentIds.has(student.id)} onChange={() => toggleStudentSelection(student.id)} className="h-5 w-5" /></td>}
                    <td className="px-4 py-3"><button type="button" onClick={() => setSelectedStudent(student)} className="font-semibold text-slate-900 hover:text-cyan-700 hover:underline">{student.name}</button></td>
                    {fields.bib && <td className="px-4 py-3 font-mono text-sm">{student.id}</td>}
                    {fields.school && <td className="px-4 py-3 text-sm">{student.school || '—'}</td>}
                    {fields.class && <td className="px-4 py-3 text-sm">{student.class || '—'}</td>}
                    {fields.age && <td className="px-4 py-3 text-sm">{student.age || '—'}</td>}
                    {fields.gender && <td className="px-4 py-3 text-sm">{student.gender === 'male' ? 'Male' : 'Female'}</td>}
                    {fields.overallAverage && <td className="px-4 py-3 text-center font-semibold">{summary.overallAverage?.toFixed(2) || '—'}</td>}
                    <td className="px-4 py-3 text-center"><span className={`inline-flex min-w-12 items-center justify-center rounded-lg border px-3 py-1 font-bold ${getAssessmentGradeClasses(summary.overallGrade)}`}>{summary.overallGrade || 'Not assessed'}</span></td>
                  </tr>)}
                  {!filteredResults.length && <tr><td colSpan={visibleColumnCount} className="px-4 py-10 text-center text-slate-500">{assessedResults.length ? 'No assessed students match this search.' : 'No students have been assessed yet.'}</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <strong className="text-slate-800">Equal grade bands:</strong>{' '}
              {ASSESSMENT_GRADE_BANDS.map((band) => `${band.grade} ${band.minimum.toFixed(2)}–${band.maximum.toFixed(2)}`).join(' · ')}
              <span className="mt-1 block text-xs">Not Observed entries are excluded from the averages.</span>
            </div>
          </>}
        </main>
      </div>

      <AnimatePresence>
        {selectedStudent && <StudentInfoModal student={selectedStudent} onClose={() => setSelectedStudent(null)} onViewAssessment={() => openDetail(selectedStudent)} />}
      </AnimatePresence>
    </div>
  );
}
