export type BibGender = 'male' | 'female';
export type BibAllocationMode = 'first-available' | 'next-highest';
export type BibSequenceMode = 'separate' | 'combined';

export interface BibSettings {
  malePrefix: string;
  femalePrefix: string;
  maleStart: number;
  femaleStart: number;
  combinedStart: number;
  numberLength: number;
  allocationMode: BibAllocationMode;
  sequenceMode: BibSequenceMode;
  eventPrefix: string;
}

export interface BibStudent {
  id: string;
  gender: BibGender;
  name?: string;
  key?: string;
  createdAt?: number | string;
}

export interface BibMigrationEntry {
  key: string;
  name: string;
  gender: BibGender;
  oldId: string;
  newId: string;
}

export const DEFAULT_BIB_SETTINGS: BibSettings = {
  malePrefix: 'M',
  femalePrefix: 'F',
  maleStart: 1,
  femaleStart: 1,
  combinedStart: 1,
  numberLength: 2,
  allocationMode: 'first-available',
  sequenceMode: 'separate',
  eventPrefix: '',
};

const cleanGenderPrefix = (value: unknown, fallback: string) => {
  if (value === undefined || value === null) return fallback;
  const cleaned = String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return cleaned;
};

const cleanEventPrefix = (value: unknown) => (
  String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 10)
);

const cleanStart = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : fallback;
};

const cleanNumberLength = (value: unknown) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 6
    ? number
    : DEFAULT_BIB_SETTINGS.numberLength;
};

export function normalizeBibSettings(value: unknown): BibSettings {
  const source = value && typeof value === 'object' ? value as Partial<BibSettings> : {};
  return {
    malePrefix: cleanGenderPrefix(source.malePrefix, DEFAULT_BIB_SETTINGS.malePrefix),
    femalePrefix: cleanGenderPrefix(source.femalePrefix, DEFAULT_BIB_SETTINGS.femalePrefix),
    maleStart: cleanStart(source.maleStart, DEFAULT_BIB_SETTINGS.maleStart),
    femaleStart: cleanStart(source.femaleStart, DEFAULT_BIB_SETTINGS.femaleStart),
    combinedStart: cleanStart(source.combinedStart, DEFAULT_BIB_SETTINGS.combinedStart),
    numberLength: cleanNumberLength(source.numberLength),
    allocationMode: source.allocationMode === 'next-highest' ? 'next-highest' : 'first-available',
    sequenceMode: source.sequenceMode === 'combined' ? 'combined' : 'separate',
    eventPrefix: cleanEventPrefix(source.eventPrefix),
  };
}

export function validateBibSettings(settings: BibSettings) {
  const errors: string[] = [];
  if (!/^[A-Z0-9]{0,4}$/.test(settings.malePrefix)) {
    errors.push('Male prefix may contain up to 4 letters or numbers.');
  }
  if (!/^[A-Z0-9]{0,4}$/.test(settings.femalePrefix)) {
    errors.push('Female prefix may contain up to 4 letters or numbers.');
  }
  if (!/^[A-Z0-9-]{0,10}$/.test(settings.eventPrefix)) {
    errors.push('Event prefix may contain up to 10 letters, numbers, or hyphens.');
  }
  if (!Number.isInteger(settings.maleStart) || settings.maleStart < 1) {
    errors.push('Male starting number must be 1 or higher.');
  }
  if (!Number.isInteger(settings.femaleStart) || settings.femaleStart < 1) {
    errors.push('Female starting number must be 1 or higher.');
  }
  if (!Number.isInteger(settings.combinedStart) || settings.combinedStart < 1) {
    errors.push('Combined starting number must be 1 or higher.');
  }
  if (!Number.isInteger(settings.numberLength) || settings.numberLength < 1 || settings.numberLength > 6) {
    errors.push('Number length must be between 1 and 6 digits.');
  }
  return errors;
}

export function getBibPrefix(gender: BibGender, settings: BibSettings) {
  return `${settings.eventPrefix}${gender === 'male' ? settings.malePrefix : settings.femalePrefix}`;
}

export function getBibStart(gender: BibGender, settings: BibSettings) {
  if (settings.sequenceMode === 'combined') return settings.combinedStart;
  return gender === 'male' ? settings.maleStart : settings.femaleStart;
}

export function formatBib(gender: BibGender, number: number, settings: BibSettings) {
  return `${getBibPrefix(gender, settings)}${String(number).padStart(settings.numberLength, '0')}`;
}

export function extractBibNumber(id: string, gender: BibGender, settings: BibSettings) {
  const prefix = getBibPrefix(gender, settings);
  if (!id.toUpperCase().startsWith(prefix.toUpperCase())) return null;
  const suffix = id.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return null;
  const number = Number(suffix);
  return Number.isSafeInteger(number) ? number : null;
}

export function generateAvailableBib(
  students: BibStudent[],
  gender: BibGender,
  settings: BibSettings,
  excludedKey?: string,
) {
  const eligibleStudents = students.filter((student) => student.key !== excludedKey);
  const occupiedIds = new Set(eligibleStudents.map((student) => student.id.toUpperCase()));
  const usesCombinedSequence = settings.sequenceMode === 'combined';
  const usedNumbers = new Set(
    eligibleStudents
      .filter((student) => usesCombinedSequence || student.gender === gender)
      .map((student) => (
        extractBibNumber(student.id, student.gender, settings) ??
        (usesCombinedSequence ? trailingNumber(student.id) : null)
      ))
      .filter((number): number is number => number !== null),
  );
  const start = getBibStart(gender, settings);

  if (usesCombinedSequence && excludedKey) {
    const existing = students.find((student) => student.key === excludedKey);
    const currentNumber = existing
      ? extractBibNumber(existing.id, existing.gender, settings) ?? trailingNumber(existing.id)
      : null;
    if (
      currentNumber !== null &&
      currentNumber >= start &&
      !usedNumbers.has(currentNumber) &&
      !occupiedIds.has(formatBib(gender, currentNumber, settings).toUpperCase())
    ) {
      return formatBib(gender, currentNumber, settings);
    }
  }

  let number = settings.allocationMode === 'next-highest' && usedNumbers.size
    ? Math.max(start - 1, ...usedNumbers) + 1
    : start;

  while (usedNumbers.has(number) || occupiedIds.has(formatBib(gender, number, settings).toUpperCase())) {
    number += 1;
  }
  return formatBib(gender, number, settings);
}

function trailingNumber(id: string) {
  const match = id.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
}

function compareRegistrationOrder(a: BibStudent, b: BibStudent) {
  const parseCreatedAt = (value: BibStudent['createdAt']) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || !value.trim()) return null;
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  };
  const aCreated = parseCreatedAt(a.createdAt);
  const bCreated = parseCreatedAt(b.createdAt);
  if (aCreated !== null && bCreated !== null && aCreated !== bCreated) {
    return aCreated - bCreated;
  }
  if (aCreated === null && bCreated !== null) return -1;
  if (aCreated !== null && bCreated === null) return 1;
  return (
    String(a.key).localeCompare(String(b.key)) ||
    String(a.name || '').localeCompare(String(b.name || '')) ||
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
}

export function buildBibMigration(students: BibStudent[], settings: BibSettings): BibMigrationEntry[] {
  const result: BibMigrationEntry[] = [];

  if (settings.sequenceMode === 'combined') {
    const ordered = students
      .filter((student) => student.key)
      .sort(compareRegistrationOrder);
    let number = settings.combinedStart;
    ordered.forEach((student) => {
      result.push({
        key: student.key as string,
        name: student.name || student.id,
        gender: student.gender,
        oldId: student.id,
        newId: formatBib(student.gender, number, settings),
      });
      number += 1;
    });
    return result;
  }

  const assignedIds = new Set<string>();
  (['female', 'male'] as BibGender[]).forEach((gender) => {
    const ordered = students
      .filter((student) => student.gender === gender && student.key)
      .sort((a, b) => (
        (trailingNumber(a.id) ?? Number.MAX_SAFE_INTEGER) - (trailingNumber(b.id) ?? Number.MAX_SAFE_INTEGER) ||
        a.id.localeCompare(b.id, undefined, { numeric: true }) ||
        String(a.name || '').localeCompare(String(b.name || '')) ||
        String(a.key).localeCompare(String(b.key))
      ));
    let number = getBibStart(gender, settings);
    ordered.forEach((student) => {
      while (assignedIds.has(formatBib(gender, number, settings).toUpperCase())) number += 1;
      const newId = formatBib(gender, number, settings);
      assignedIds.add(newId.toUpperCase());
      result.push({
        key: student.key as string,
        name: student.name || student.id,
        gender,
        oldId: student.id,
        newId,
      });
      number += 1;
    });
  });

  return result;
}
