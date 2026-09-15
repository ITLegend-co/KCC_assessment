export const ASSESSMENT_ELEMENTS = [
  {
    id: 'safetyConfidence',
    label: 'Safety & Confidence',
    observe: 'Safe behaviour, awareness, commitment and composure.',
  },
  {
    id: 'footworkPositioning',
    label: 'Footwork & Positioning',
    observe: 'Foot placement, body position and use of hips.',
  },
  {
    id: 'balanceEfficiency',
    label: 'Balance & Efficiency',
    observe: 'Stability, control and conservation of energy.',
  },
  {
    id: 'routeReading',
    label: 'Route Reading',
    observe: 'Planning, recognising holds and adjusting the sequence.',
  },
  {
    id: 'powerSequencing',
    label: 'Coordination Movement',
    observe: 'Coordinating hands, feet and body timing through complex movement.',
  },
  {
    id: 'technicalTransition',
    label: 'Technical Transition',
    observe: 'Moving smoothly between positions, techniques and wall angles.',
  },
  {
    id: 'powerEfficiency',
    label: 'Power & Efficiency',
    observe: 'Generating required force with minimal wasted movement.',
  },
  {
    id: 'executionPressure',
    label: 'Execution Under Pressure',
    observe: 'Composure, time management and decision-making during attempts.',
  },
  {
    id: 'precisionPower',
    label: 'Precision & Power',
    observe: 'Accurate contact and body control while applying force.',
  },
] as const;

export type AssessmentElementId = (typeof ASSESSMENT_ELEMENTS)[number]['id'];
export type AssessmentRating = 1 | 2 | 3 | 4 | 5 | 'not-observed' | null;
export type AssessmentGrade = 'A' | 'B' | 'C' | 'D' | 'E' | null;

export interface AssessmentStudent {
  id: string;
  name: string;
  school: string;
  class: string;
  age: number | string;
  gender: 'male' | 'female';
  key?: string;
}

export interface StudentAssessmentRecord {
  id: string;
  studentKey?: string;
  round: string;
  boulder: number;
  ratings: Partial<Record<AssessmentElementId, AssessmentRating>>;
  remarks?: string;
  evaluator: string;
  timestamp: number;
  version?: number;
  key?: string;
}

export interface ElementAssessmentSummary {
  elementId: AssessmentElementId;
  label: string;
  scores: Record<string, AssessmentRating>;
  average: number | null;
  grade: AssessmentGrade;
}

export interface AssessmentBoulderSummary {
  key: string;
  round: string;
  boulder: number;
}

export interface StudentAssessmentSummary {
  elements: ElementAssessmentSummary[];
  boulders: AssessmentBoulderSummary[];
  overallAverage: number | null;
  overallGrade: AssessmentGrade;
  assessedBoulders: number;
}

export const ASSESSMENT_RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Not Demonstrated',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Advanced',
};

export const ASSESSMENT_GRADE_BANDS = [
  { grade: 'E' as const, minimum: 1, maximum: 1.79 },
  { grade: 'D' as const, minimum: 1.8, maximum: 2.59 },
  { grade: 'C' as const, minimum: 2.6, maximum: 3.39 },
  { grade: 'B' as const, minimum: 3.4, maximum: 4.19 },
  { grade: 'A' as const, minimum: 4.2, maximum: 5 },
];

export interface AssessmentResultFields {
  bib: boolean;
  school: boolean;
  class: boolean;
  age: boolean;
  gender: boolean;
  overallAverage: boolean;
}

export const DEFAULT_ASSESSMENT_RESULT_FIELDS: AssessmentResultFields = {
  bib: false,
  school: false,
  class: false,
  age: false,
  gender: false,
  overallAverage: false,
};

export function normalizeAssessmentResultFields(value: unknown): AssessmentResultFields {
  if (!value || typeof value !== 'object') return DEFAULT_ASSESSMENT_RESULT_FIELDS;
  const fields = value as Partial<AssessmentResultFields>;
  return {
    bib: fields.bib === true,
    school: fields.school === true,
    class: fields.class === true,
    age: fields.age === true,
    gender: fields.gender === true,
    overallAverage: fields.overallAverage === true,
  };
}

export function gradeAssessmentAverage(average: number | null): AssessmentGrade {
  if (average === null || !Number.isFinite(average)) return null;
  if (average >= 4.2) return 'A';
  if (average >= 3.4) return 'B';
  if (average >= 2.6) return 'C';
  if (average >= 1.8) return 'D';
  return 'E';
}

export function getLatestStudentAssessments(records: StudentAssessmentRecord[]) {
  const latest = new Map<string, StudentAssessmentRecord>();

  records.forEach((record) => {
    const combination = `${record.id}\u0000${record.round}\u0000${record.boulder}`;
    const current = latest.get(combination);
    if (
      !current ||
      Number(record.version || 0) > Number(current.version || 0) ||
      (Number(record.version || 0) === Number(current.version || 0) && record.timestamp > current.timestamp)
    ) {
      latest.set(combination, record);
    }
  });

  return Array.from(latest.values());
}

export function getAssessmentBoulderKey(round: string, boulder: number) {
  return `${round}\u0000${boulder}`;
}

export function summarizeStudentAssessment(
  records: StudentAssessmentRecord[],
  studentId: string,
  roundOrder: string[] = [],
): StudentAssessmentSummary {
  const roundPosition = new Map(roundOrder.map((roundName, index) => [roundName, index]));
  const latest = getLatestStudentAssessments(records)
    .filter((record) => record.id === studentId)
    .sort((a, b) => {
      const aRound = roundPosition.get(a.round) ?? Number.MAX_SAFE_INTEGER;
      const bRound = roundPosition.get(b.round) ?? Number.MAX_SAFE_INTEGER;
      return aRound - bRound || a.boulder - b.boulder || a.round.localeCompare(b.round);
    });

  const boulders = latest.map((record) => ({
    key: getAssessmentBoulderKey(record.round, record.boulder),
    round: record.round,
    boulder: record.boulder,
  }));

  const elements = ASSESSMENT_ELEMENTS.map((element) => {
    const scores: Record<string, AssessmentRating> = {};
    const observed: number[] = [];

    latest.forEach((record) => {
      const rating = record.ratings?.[element.id];
      scores[getAssessmentBoulderKey(record.round, record.boulder)] = typeof rating === 'number' ? rating : null;
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) observed.push(rating);
    });

    const average = observed.length
      ? Number((observed.reduce((total, rating) => total + rating, 0) / observed.length).toFixed(2))
      : null;

    return {
      elementId: element.id,
      label: element.label,
      scores,
      average,
      grade: gradeAssessmentAverage(average),
    };
  });

  const observedElementAverages = elements
    .map((element) => element.average)
    .filter((average): average is number => average !== null);
  const overallAverage = observedElementAverages.length
    ? Number(
        (
          observedElementAverages.reduce((total, average) => total + average, 0) /
          observedElementAverages.length
        ).toFixed(2),
      )
    : null;

  return {
    elements,
    boulders,
    overallAverage,
    overallGrade: gradeAssessmentAverage(overallAverage),
    assessedBoulders: latest.length,
  };
}

export function getAssessmentGradeClasses(grade: AssessmentGrade) {
  switch (grade) {
    case 'A':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'B':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'C':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'D':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'E':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}
