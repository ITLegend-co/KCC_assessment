import { calculateBoulderPoints } from './scoring';
import {
  ASSESSMENT_ELEMENTS,
  getLatestStudentAssessments,
  summarizeStudentAssessment,
  type AssessmentStudent,
  type StudentAssessmentRecord,
} from './studentAssessment';

interface ScoreRecord {
  id: string;
  round: string;
  boulder: number;
  at: number | null;
  az: number | null;
  attemptCount?: number;
  timestamp?: number;
  version?: number;
}

interface ExportSystemWorkbookOptions {
  students: AssessmentStudent[];
  scores: ScoreRecord[];
  assessments: StudentAssessmentRecord[];
  rounds: string[];
}

function getLatestScores(scores: ScoreRecord[]) {
  const latest = new Map<string, ScoreRecord>();
  scores.forEach((score) => {
    const key = `${score.id}\u0000${score.round}\u0000${score.boulder}`;
    const current = latest.get(key);
    if (
      !current ||
      Number(score.version || 0) > Number(current.version || 0) ||
      (Number(score.version || 0) === Number(current.version || 0) && Number(score.timestamp || 0) > Number(current.timestamp || 0))
    ) latest.set(key, score);
  });
  return Array.from(latest.values());
}

function buildRoundRankings(students: AssessmentStudent[], scores: ScoreRecord[], rounds: string[]) {
  const studentIds = new Set(students.map((student) => student.id));
  const result = new Map<string, { rank: number; score: number }>();

  rounds.forEach((round) => {
    const totals = new Map<string, number>();
    scores.filter((score) => score.round === round && studentIds.has(score.id)).forEach((score) => {
      totals.set(score.id, Number(((totals.get(score.id) || 0) + calculateBoulderPoints(score.at, score.az, score.attemptCount)).toFixed(1)));
    });
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    sorted.forEach(([id, score], index) => {
      const previous = sorted[index - 1];
      const rank = previous && previous[1] === score
        ? result.get(`${round}\u0000${previous[0]}`)?.rank || index + 1
        : index + 1;
      result.set(`${round}\u0000${id}`, { rank, score });
    });
  });

  return result;
}

function formatWorksheet(worksheet: import('exceljs').Worksheet) {
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: Math.max(1, worksheet.columnCount) },
  };
  worksheet.getRow(1).height = 28;
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    row.alignment = { vertical: 'top', wrapText: true };
    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDFA' } };
      });
    }
  });
}

export async function exportSystemWorkbook({ students, scores, assessments, rounds }: ExportSystemWorkbookOptions) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'KCC Bouldering Assessment System';
  workbook.created = new Date();

  const latestScores = getLatestScores(scores);
  const latestAssessments = getLatestStudentAssessments(assessments);
  const rankings = buildRoundRankings(students, latestScores, rounds);
  const studentById = new Map(students.map((student) => [student.id, student]));

  const summarySheet = workbook.addWorksheet('Overall Results');
  summarySheet.columns = [
    { header: 'BIB', key: 'bib', width: 14 },
    { header: 'Student Name', key: 'name', width: 28 },
    { header: 'School', key: 'school', width: 28 },
    { header: 'Class', key: 'class', width: 16 },
    { header: 'Age', key: 'age', width: 10 },
    { header: 'Gender', key: 'gender', width: 12 },
    ...rounds.flatMap((round) => [
      { header: `${round} Rank`, key: `${round}-rank`, width: 14 },
      { header: `${round} Score`, key: `${round}-score`, width: 15 },
    ]),
    { header: 'Assessment Average', key: 'assessmentAverage', width: 20 },
    { header: 'Assessment Grade', key: 'assessmentGrade', width: 18 },
    { header: 'Boulders Assessed', key: 'bouldersAssessed', width: 18 },
    ...ASSESSMENT_ELEMENTS.map((element) => ({ header: `${element.label} Average`, key: element.id, width: 22 })),
  ];

  students.slice().sort((a, b) => a.name.localeCompare(b.name)).forEach((student) => {
    const summary = summarizeStudentAssessment(latestAssessments, student.id, rounds);
    const row: Record<string, string | number | null> = {
      bib: student.id,
      name: student.name,
      school: student.school || '',
      class: student.class || '',
      age: student.age === '' ? null : Number(student.age),
      gender: student.gender === 'male' ? 'Male' : 'Female',
      assessmentAverage: summary.overallAverage,
      assessmentGrade: summary.overallGrade || '',
      bouldersAssessed: summary.assessedBoulders,
    };
    rounds.forEach((round) => {
      const ranking = rankings.get(`${round}\u0000${student.id}`);
      row[`${round}-rank`] = ranking?.rank ?? null;
      row[`${round}-score`] = ranking?.score ?? null;
    });
    summary.elements.forEach((element) => { row[element.elementId] = element.average; });
    summarySheet.addRow(row);
  });
  summarySheet.getColumn('assessmentAverage').numFmt = '0.00';
  ASSESSMENT_ELEMENTS.forEach((element) => { summarySheet.getColumn(element.id).numFmt = '0.00'; });
  rounds.forEach((round) => { summarySheet.getColumn(`${round}-score`).numFmt = '0.0'; });
  formatWorksheet(summarySheet);

  const assessmentSheet = workbook.addWorksheet('Assessment Details');
  assessmentSheet.columns = [
    { header: 'BIB', key: 'bib', width: 14 },
    { header: 'Student Name', key: 'name', width: 28 },
    { header: 'Round', key: 'round', width: 18 },
    { header: 'Boulder', key: 'boulder', width: 12 },
    ...ASSESSMENT_ELEMENTS.map((element) => ({ header: element.label, key: element.id, width: 20 })),
    { header: 'Remarks', key: 'remarks', width: 36 },
    { header: 'Evaluator', key: 'evaluator', width: 20 },
    { header: 'Recorded At', key: 'timestamp', width: 22 },
  ];
  latestAssessments
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id) || rounds.indexOf(a.round) - rounds.indexOf(b.round) || a.boulder - b.boulder)
    .forEach((assessment) => {
      const student = studentById.get(assessment.id);
      const row: Record<string, string | number | Date> = {
        bib: assessment.id,
        name: student?.name || assessment.id,
        round: assessment.round,
        boulder: assessment.boulder,
        remarks: assessment.remarks || '',
        evaluator: assessment.evaluator || '',
        timestamp: new Date(assessment.timestamp),
      };
      ASSESSMENT_ELEMENTS.forEach((element) => {
        const rating = assessment.ratings?.[element.id];
        row[element.id] = rating === 'not-observed' || rating == null ? 'Not Observed' : rating;
      });
      assessmentSheet.addRow(row);
    });
  assessmentSheet.getColumn('timestamp').numFmt = 'dd mmm yyyy hh:mm';
  formatWorksheet(assessmentSheet);

  const scoringSheet = workbook.addWorksheet('Scoring Details');
  scoringSheet.columns = [
    { header: 'BIB', key: 'bib', width: 14 },
    { header: 'Student Name', key: 'name', width: 28 },
    { header: 'Round', key: 'round', width: 18 },
    { header: 'Boulder', key: 'boulder', width: 12 },
    { header: 'Attempts', key: 'attempts', width: 12 },
    { header: 'AZ', key: 'az', width: 10 },
    { header: 'AT', key: 'at', width: 10 },
    { header: 'Points', key: 'points', width: 12 },
    { header: 'Recorded At', key: 'timestamp', width: 22 },
  ];
  latestScores
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id) || rounds.indexOf(a.round) - rounds.indexOf(b.round) || a.boulder - b.boulder)
    .forEach((score) => scoringSheet.addRow({
      bib: score.id,
      name: studentById.get(score.id)?.name || score.id,
      round: score.round,
      boulder: score.boulder,
      attempts: score.attemptCount ?? Math.max(score.at ?? 0, score.az ?? 0),
      az: score.az,
      at: score.at,
      points: calculateBoulderPoints(score.at, score.az, score.attemptCount),
      timestamp: score.timestamp ? new Date(score.timestamp) : '',
    }));
  scoringSheet.getColumn('points').numFmt = '0.0';
  scoringSheet.getColumn('timestamp').numFmt = 'dd mmm yyyy hh:mm';
  formatWorksheet(scoringSheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `KCC_Assessment_Results_${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
}
