import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../lib/firebase';
import {
  DEFAULT_ASSESSMENT_RESULT_FIELDS,
  normalizeAssessmentResultFields,
  type AssessmentResultFields,
  type StudentAssessmentRecord,
} from '../lib/studentAssessment';

export function useStudentAssessments() {
  const [assessments, setAssessments] = useState<StudentAssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onValue(ref(database, 'studentAssessments'), (snapshot) => {
    const data = snapshot.val() || {};
    setAssessments(
      Object.entries(data).map(([key, value]) => ({
        ...(value as Omit<StudentAssessmentRecord, 'key'>),
        key,
      })),
    );
    setLoading(false);
    setError('');
  }, (reason) => {
    setLoading(false);
    setError(`${reason.message} (${reason.code || 'ASSESSMENT_READ_FAILED'})`);
  }), []);

  return { assessments, loading, error };
}

export function useAssessmentResultFields() {
  const [fields, setFields] = useState<AssessmentResultFields>(DEFAULT_ASSESSMENT_RESULT_FIELDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onValue(ref(database, 'settings/assessment/resultFields'), (snapshot) => {
    setFields(snapshot.exists() ? normalizeAssessmentResultFields(snapshot.val()) : DEFAULT_ASSESSMENT_RESULT_FIELDS);
    setLoading(false);
    setError('');
  }, (reason) => {
    setLoading(false);
    setError(`${reason.message} (${reason.code || 'ASSESSMENT_SETTINGS_READ_FAILED'})`);
  }), []);

  return { fields, loading, error };
}
