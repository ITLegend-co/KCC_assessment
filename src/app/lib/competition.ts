import { database } from './firebase';
import { onValue, ref } from 'firebase/database';
import { useEffect, useState } from 'react';

export type BoulderNumberingMode = 'per-round' | 'continuous';

export interface CompetitionSettings {
  numberingMode: BoulderNumberingMode;
  boulderCounts: Record<string, number>;
}

export const DEFAULT_COMPETITION_SETTINGS: CompetitionSettings = {
  numberingMode: 'continuous',
  boulderCounts: {},
};

export function getBoulderRange(rounds: string[], selectedRound: string, settings: CompetitionSettings) {
  const count = Math.max(1, Number(settings.boulderCounts[selectedRound]) || 5);
  if (settings.numberingMode === 'per-round') return { start: 1, end: count, count };
  const roundIndex = Math.max(0, rounds.indexOf(selectedRound));
  const start = rounds.slice(0, roundIndex).reduce((total, round) => total + (Number(settings.boulderCounts[round]) || 5), 1);
  return { start, end: start + count - 1, count };
}

export function useCompetitionSettings() {
  const [settings, setSettings] = useState(DEFAULT_COMPETITION_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onValue(ref(database, 'settings/competition'), (snapshot) => {
    setSettings({ ...DEFAULT_COMPETITION_SETTINGS, ...(snapshot.val() || {}) });
    setLoading(false);
    setError('');
  }, (reason) => {
    setLoading(false);
    setError(reason.message || 'Unable to load competition settings');
  }), []);

  return { settings, loading, error };
}
