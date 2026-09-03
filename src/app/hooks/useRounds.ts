import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from '../lib/firebase';
import { DEFAULT_ROUNDS, normalizeRounds } from '../lib/rounds';

export function useRounds() {
  const [rounds, setRounds] = useState<string[]>(DEFAULT_ROUNDS);

  useEffect(() => {
    const roundsRef = ref(database, 'settings/rounds');
    return onValue(roundsRef, (snapshot) => {
      setRounds(snapshot.exists() ? normalizeRounds(snapshot.val()) : DEFAULT_ROUNDS);
    });
  }, []);

  return rounds;
}

