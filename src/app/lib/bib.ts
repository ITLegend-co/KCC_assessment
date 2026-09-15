import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from './firebase';
import { DEFAULT_BIB_SETTINGS, normalizeBibSettings } from './bibRules';

export * from './bibRules';

export function useBibSettings() {
  const [settings, setSettings] = useState(DEFAULT_BIB_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onValue(ref(database, 'settings/bib'), (snapshot) => {
    setSettings(normalizeBibSettings(snapshot.val()));
    setLoading(false);
    setError('');
  }, (reason) => {
    setLoading(false);
    setError(reason.message || 'Unable to load BIB settings');
  }), []);

  return { settings, loading, error };
}
