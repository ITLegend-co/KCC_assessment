import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { database } from './firebase';
import type { CurrentUser, UserRole } from './auth';

export interface BoulderAssignmentUser {
  username: string;
  role: UserRole;
  rounds: Record<string, number>;
}

export interface BoulderAssignmentManager {
  username: string;
  enabled: boolean;
}

export interface BoulderAssignmentSettings {
  judgesEnabled: boolean;
  coachesEnabled: boolean;
  assignments: Record<string, BoulderAssignmentUser>;
  managers: Record<string, BoulderAssignmentManager>;
}

export const DEFAULT_BOULDER_ASSIGNMENT_SETTINGS: BoulderAssignmentSettings = {
  judgesEnabled: false,
  coachesEnabled: false,
  assignments: {},
  managers: {},
};

export function normalizeBoulderAssignmentSettings(value: unknown): BoulderAssignmentSettings {
  const loaded = value && typeof value === 'object'
    ? value as Partial<BoulderAssignmentSettings>
    : {};
  const rawAssignments = loaded.assignments && typeof loaded.assignments === 'object'
    ? loaded.assignments as Record<string, Partial<BoulderAssignmentUser>>
    : {};
  const rawManagers = loaded.managers && typeof loaded.managers === 'object'
    ? loaded.managers as Record<string, Partial<BoulderAssignmentManager>>
    : {};
  const validRoles: UserRole[] = ['administrator', 'chief-judge', 'judge', 'registry', 'coach'];

  const assignments: Record<string, BoulderAssignmentUser> = {};
  Object.entries(rawAssignments).forEach(([key, assignment]) => {
    if (typeof assignment?.username !== 'string' || !validRoles.includes(assignment.role as UserRole)) return;
    const rawRounds = assignment.rounds && typeof assignment.rounds === 'object' ? assignment.rounds : {};
    const rounds: Record<string, number> = {};
    Object.entries(rawRounds).forEach(([round, value]) => {
      const boulder = Number(value);
      if (Number.isInteger(boulder) && boulder > 0) rounds[round] = boulder;
    });
    assignments[key] = { username: assignment.username, role: assignment.role as UserRole, rounds };
  });

  const managers: Record<string, BoulderAssignmentManager> = {};
  Object.entries(rawManagers).forEach(([key, manager]) => {
    if (typeof manager?.username === 'string' && manager.enabled === true) {
      managers[key] = { username: manager.username, enabled: true };
    }
  });

  return {
    judgesEnabled: loaded.judgesEnabled === true,
    coachesEnabled: loaded.coachesEnabled === true,
    assignments,
    managers,
  };
}

export function isBoulderAssignmentEnabled(
  role: UserRole | undefined,
  settings: BoulderAssignmentSettings,
) {
  if (role === 'judge') return settings.judgesEnabled;
  if (role === 'coach') return settings.coachesEnabled;
  return false;
}

function findUserEntry<T extends { username?: string }>(
  entries: Record<string, T>,
  user: CurrentUser | null,
) {
  if (!user) return undefined;
  if (user.key && entries[user.key]) return entries[user.key];
  return Object.values(entries).find(
    (entry) => entry.username?.toLowerCase() === user.username.toLowerCase(),
  );
}

export function getAssignedBoulder(
  user: CurrentUser | null,
  round: string,
  settings: BoulderAssignmentSettings,
) {
  const assignment = findUserEntry(settings.assignments, user);
  const value = Number(assignment?.rounds?.[round]);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export function canManageBoulderAssignments(
  user: CurrentUser | null,
  settings: BoulderAssignmentSettings,
) {
  if (user?.role === 'administrator') return true;
  return findUserEntry(settings.managers, user)?.enabled === true;
}

export function useBoulderAssignmentSettings() {
  const [settings, setSettings] = useState(DEFAULT_BOULDER_ASSIGNMENT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => onValue(ref(database, 'settings/boulderAssignments'), (snapshot) => {
    setSettings(normalizeBoulderAssignmentSettings(snapshot.val()));
    setLoading(false);
    setError('');
  }, (reason) => {
    setLoading(false);
    setError(reason.message || 'Unable to load boulder assignments');
  }), []);

  return { settings, loading, error };
}
