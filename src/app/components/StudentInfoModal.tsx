import { GraduationCap, X } from 'lucide-react';
import { motion } from 'motion/react';
import type { AssessmentStudent } from '../lib/studentAssessment';

interface StudentInfoModalProps {
  student: AssessmentStudent;
  onClose: () => void;
  onViewAssessment?: () => void;
}

export function StudentInfoModal({ student, onClose, onViewAssessment }: StudentInfoModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-information-title"
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-3">
          <h3 id="student-information-title" className="text-2xl font-bold text-slate-900">Student Information</h3>
          <button type="button" onClick={onClose} aria-label="Close student information" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <dl className="space-y-1">
          {[
            ['BIB', student.id],
            ['Name', student.name],
            ['School', student.school],
            ['Class', student.class],
            ['Age', student.age],
            ['Gender', student.gender === 'male' ? 'Male' : 'Female'],
          ].map(([label, value]) => <div key={String(label)} className="flex items-start justify-between gap-4 border-b border-slate-200 py-3">
            <dt className="font-semibold text-slate-700">{label}:</dt>
            <dd className="text-right text-slate-900">{String(value || '—')}</dd>
          </div>)}
        </dl>

        {onViewAssessment && <button type="button" onClick={onViewAssessment} className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 font-semibold text-white hover:bg-cyan-700">
          <GraduationCap className="h-5 w-5" />
          Click here to view detailed assessment result
        </button>}
        <button type="button" onClick={onClose} className="mt-3 min-h-12 w-full rounded-lg bg-slate-600 px-4 font-semibold text-white hover:bg-slate-700">Close</button>
      </motion.div>
    </motion.div>
  );
}
