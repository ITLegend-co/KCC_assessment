import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { getCurrentUser, type UserRole } from '../lib/auth';
import { database } from '../lib/firebase';
import { ref, get, set, update } from 'firebase/database';
import { Settings as SettingsIcon, UserPlus, Trash2, Save, ListChecks, Plus, ArrowUp, ArrowDown, GraduationCap, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { DEFAULT_ROUNDS, normalizeRounds } from '../lib/rounds';
import { AssessmentArchives } from '../components/AssessmentArchives';
import { BoulderNumberingMode, DEFAULT_COMPETITION_SETTINGS, getBoulderRange } from '../lib/competition';
import { describeError } from '../lib/appError';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';
import {
  DEFAULT_ASSESSMENT_RESULT_FIELDS,
  normalizeAssessmentResultFields,
  type AssessmentResultFields,
} from '../lib/studentAssessment';
import {
  canManageBoulderAssignments,
  DEFAULT_BOULDER_ASSIGNMENT_SETTINGS,
  normalizeBoulderAssignmentSettings,
  useBoulderAssignmentSettings,
  type BoulderAssignmentSettings,
} from '../lib/boulderAssignments';
import { AccountPasswordSection, AdminPasswordResetSection } from '../components/PasswordManagement';

interface ManagedUser {
  username: string;
  role: UserRole;
  createdAt: string;
  key: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const {
    settings: savedBoulderAssignments,
    loading: assignmentAccessLoading,
    error: assignmentAccessError,
  } = useBoulderAssignmentSettings();
  const isAdministrator = currentUser?.role === 'administrator';
  const hasAssignmentAccess = canManageBoulderAssignments(currentUser, savedBoulderAssignments);

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'chief-judge' | 'judge' | 'registry' | 'coach'>('judge');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [rounds, setRounds] = useState<string[]>(DEFAULT_ROUNDS);
  const [roundOrigins, setRoundOrigins] = useState<Array<string | null>>(DEFAULT_ROUNDS);
  const [newRound, setNewRound] = useState('');
  const [roundError, setRoundError] = useState('');
  const [roundSuccess, setRoundSuccess] = useState('');
  const [numberingMode, setNumberingMode] = useState<BoulderNumberingMode>('continuous');
  const [boulderCounts, setBoulderCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [assessmentResultFields, setAssessmentResultFields] = useState<AssessmentResultFields>(DEFAULT_ASSESSMENT_RESULT_FIELDS);
  const [assessmentDisplayError, setAssessmentDisplayError] = useState('');
  const [assessmentDisplaySuccess, setAssessmentDisplaySuccess] = useState('');
  const [boulderAssignmentSettings, setBoulderAssignmentSettings] = useState<BoulderAssignmentSettings>(DEFAULT_BOULDER_ASSIGNMENT_SETTINGS);
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState('');
  const [assignmentSaving, setAssignmentSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (assignmentAccessLoading) return;
    if (!isAdministrator && !hasAssignmentAccess) {
      setIsLoading(false);
      return;
    }
    loadUsers();
    loadRounds();
  }, [assignmentAccessError, assignmentAccessLoading, currentUser?.role, hasAssignmentAccess, isAdministrator, navigate]);

  useEffect(() => {
    setBoulderAssignmentSettings(savedBoulderAssignments);
  }, [savedBoulderAssignments]);

  const loadUsers = async () => {
    try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const usersList: ManagedUser[] = Object.keys(data).map((key) => ({
        username: String(data[key].username || ''),
        role: data[key].role as UserRole,
        createdAt: String(data[key].createdAt || ''),
        key,
      }));
      setUsers(usersList);
    } else setUsers([]);
    } catch (error) { const d = describeError(error, 'Unable to load users'); setDataError(`${d.message} — ${d.code}`); }
  };

  const loadRounds = async () => {
    try {
    const [roundSnapshot, competitionSnapshot, assessmentSnapshot] = await Promise.all([
      get(ref(database, 'settings/rounds')),
      get(ref(database, 'settings/competition')),
      get(ref(database, 'settings/assessment/resultFields')),
    ]);
    const loadedRounds = roundSnapshot.exists() ? normalizeRounds(roundSnapshot.val()) : DEFAULT_ROUNDS;
    const competition = { ...DEFAULT_COMPETITION_SETTINGS, ...(competitionSnapshot.val() || {}) };
    setRounds(loadedRounds);
    setRoundOrigins(loadedRounds);
    setNumberingMode(competition.numberingMode === 'per-round' ? 'per-round' : 'continuous');
    setBoulderCounts(competition.boulderCounts || {});
    setAssessmentResultFields(
      assessmentSnapshot.exists()
        ? normalizeAssessmentResultFields(assessmentSnapshot.val())
        : DEFAULT_ASSESSMENT_RESULT_FIELDS,
    );
    } catch (error) { const d = describeError(error, 'Unable to load settings'); setDataError(`${d.message} — ${d.code}`); }
    finally { setIsLoading(false); }
  };

  const handleRoundNameChange = (index: number, value: string) => {
    setRounds((current) => current.map((roundName, itemIndex) => itemIndex === index ? value : roundName));
    setRoundError('');
    setRoundSuccess('');
  };

  const handleAddRound = () => {
    const roundName = newRound.trim();
    if (!roundName) {
      setRoundError('Enter a round name');
      return;
    }
    if (rounds.some((item) => item.trim().toLowerCase() === roundName.toLowerCase())) {
      setRoundError('Round name already exists');
      return;
    }
    setRounds((current) => [...current, roundName]);
    setRoundOrigins((current) => [...current, null]);
    setNewRound('');
    setRoundError('');
    setRoundSuccess('');
  };

  const handleDeleteRound = (index: number) => {
    if (rounds.length === 1) {
      setRoundError('At least one round is required');
      return;
    }
    setRounds((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setRoundOrigins((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setRoundError('');
    setRoundSuccess('');
  };

  const moveRound = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rounds.length) return;
    setRounds((current) => {
      const updated = [...current];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
    setRoundOrigins((current) => {
      const updated = [...current];
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return updated;
    });
    setRoundSuccess('');
  };

  const handleSaveRounds = async () => {
    setRoundError('');
    setRoundSuccess('');
    const cleanedItems = rounds
      .map((item, index) => ({ name: item.trim(), originalName: roundOrigins[index] || null }))
      .filter((item) => item.name);
    const cleanedRounds = cleanedItems.map((item) => item.name);
    if (cleanedRounds.length === 0) {
      setRoundError('At least one round is required');
      return;
    }
    if (new Set(cleanedRounds.map((item) => item.toLowerCase())).size !== cleanedRounds.length) {
      setRoundError('Round names must be unique');
      return;
    }

    try {
      const [scoresSnapshot, assessmentsSnapshot, settingsSnapshot, assignmentsSnapshot] = await Promise.all([
        get(ref(database, 'scores')),
        get(ref(database, 'studentAssessments')),
        get(ref(database, 'settings/competition/boulderCounts')),
        get(ref(database, 'settings/boulderAssignments')),
      ]);
      const existingCounts = settingsSnapshot.val() || {};
      const renamed = cleanedItems
        .filter(({ originalName, name }) => originalName && originalName !== name && !cleanedRounds.includes(originalName))
        .map(({ originalName, name }) => ({ oldName: originalName as string, newName: name }));
      const updates: Record<string, unknown> = {
        'settings/rounds': cleanedRounds,
        'settings/competition/numberingMode': numberingMode,
      };
      const nextCounts: Record<string, number> = {};
      cleanedItems.forEach(({ name, originalName }) => {
        nextCounts[name] = Math.max(1, Number(boulderCounts[name] ?? existingCounts[name] ?? (originalName ? existingCounts[originalName] : 5)) || 5);
      });
      updates['settings/competition/boulderCounts'] = nextCounts;

      const existingAssignments = normalizeBoulderAssignmentSettings(assignmentsSnapshot.val());
      const nextAssignmentRecords: BoulderAssignmentSettings['assignments'] = Object.fromEntries(
        Object.entries(existingAssignments.assignments).map(([userKey, assignment]) => {
          const nextRounds: Record<string, number> = {};
          cleanedItems.forEach(({ name, originalName }) => {
            const previousValue = Number(
              assignment.rounds?.[originalName || name] ?? assignment.rounds?.[name],
            );
            const range = getBoulderRange(cleanedRounds, name, {
              numberingMode,
              boulderCounts: nextCounts,
            });
            if (Number.isInteger(previousValue) && previousValue >= range.start && previousValue <= range.end) {
              nextRounds[name] = previousValue;
            }
          });
          return [userKey, { ...assignment, rounds: nextRounds }];
        }),
      );
      updates['settings/boulderAssignments/assignments'] = nextAssignmentRecords;
      if (scoresSnapshot.exists()) Object.entries(scoresSnapshot.val() as Record<string, { round?: string }>).forEach(([key, score]) => {
        const match = renamed.find((item) => item.oldName === score.round);
        if (match) updates[`scores/${key}/round`] = match.newName;
      });
      if (assessmentsSnapshot.exists()) Object.entries(assessmentsSnapshot.val() as Record<string, { round?: string }>).forEach(([key, assessment]) => {
        const match = renamed.find((item) => item.oldName === assessment.round);
        if (match) updates[`studentAssessments/${key}/round`] = match.newName;
      });
      await update(ref(database), updates);
      setRounds(cleanedRounds);
      setRoundOrigins(cleanedRounds);
      setBoulderCounts(nextCounts);
      setBoulderAssignmentSettings((current) => ({ ...current, assignments: nextAssignmentRecords }));
      setRoundSuccess('Rounds saved successfully. Boulder assignments were kept where valid; review assignments after any range change.');
    } catch (error) {
      const details = describeError(error, 'Failed to save rounds');
      setRoundError(`${details.message} — ${details.code} — ${details.time}`);
    }
  };

  const handleSaveAssessmentDisplay = async () => {
    setAssessmentDisplayError('');
    setAssessmentDisplaySuccess('');
    try {
      await set(ref(database, 'settings/assessment/resultFields'), assessmentResultFields);
      setAssessmentDisplaySuccess('Student assessment result display saved successfully');
    } catch (error) {
      const details = describeError(error, 'Assessment result display could not be saved');
      setAssessmentDisplayError(`${details.message} — ${details.code} — ${details.time}`);
    }
  };

  const handleAssignedBoulderChange = (user: ManagedUser, roundName: string, rawValue: string) => {
    if (!user.key) return;
    setBoulderAssignmentSettings((current) => {
      const existing = current.assignments[user.key as string] || {
        username: user.username,
        role: user.role,
        rounds: {},
      };
      const nextRounds = { ...existing.rounds };
      if (rawValue) nextRounds[roundName] = Number(rawValue);
      else delete nextRounds[roundName];
      return {
        ...current,
        assignments: {
          ...current.assignments,
          [user.key as string]: {
            username: user.username,
            role: user.role,
            rounds: nextRounds,
          },
        },
      };
    });
    setAssignmentError('');
    setAssignmentSuccess('');
  };

  const handleAssignmentManagerChange = (user: ManagedUser, enabled: boolean) => {
    if (!user.key || !isAdministrator) return;
    setBoulderAssignmentSettings((current) => {
      const managers = { ...current.managers };
      if (enabled) managers[user.key as string] = { username: user.username, enabled: true };
      else delete managers[user.key as string];
      return { ...current, managers };
    });
    setAssignmentError('');
    setAssignmentSuccess('');
  };

  const handleSaveBoulderAssignments = async () => {
    setAssignmentError('');
    setAssignmentSuccess('');
    setAssignmentSaving(true);

    try {
      const assignableUsers = users.filter((user) => user.role === 'judge' || user.role === 'chief-judge' || user.role === 'coach');
      const nextAssignments = { ...boulderAssignmentSettings.assignments };

      assignableUsers.forEach((user) => {
        if (!user.key) return;
        const existing = nextAssignments[user.key] || {
          username: user.username,
          role: user.role,
          rounds: {},
        };
        const validRounds: Record<string, number> = {};
        rounds.forEach((roundName) => {
          const range = getBoulderRange(rounds, roundName, { numberingMode, boulderCounts });
          const value = Number(existing.rounds?.[roundName]);
          if (Number.isInteger(value) && value >= range.start && value <= range.end) {
            validRounds[roundName] = value;
          }
        });
        nextAssignments[user.key] = {
          username: user.username,
          role: user.role,
          rounds: validRounds,
        };
      });

      const nextSettings: BoulderAssignmentSettings = {
        ...boulderAssignmentSettings,
        assignments: nextAssignments,
      };

      if (isAdministrator) {
        const activeUserKeys = new Set(users.map((user) => user.key).filter(Boolean));
        nextSettings.managers = Object.fromEntries(
          Object.entries(nextSettings.managers).filter(([key, manager]) => activeUserKeys.has(key) && manager.enabled),
        );
        await set(ref(database, 'settings/boulderAssignments'), nextSettings);
      } else {
        await set(ref(database, 'settings/boulderAssignments/assignments'), nextAssignments);
      }

      setBoulderAssignmentSettings(nextSettings);
      setAssignmentSuccess('Boulder assignments saved successfully');
    } catch (error) {
      const details = describeError(error, 'Boulder assignments could not be saved');
      setAssignmentError(`${details.message} — ${details.code} — ${details.time}`);
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (newUsername.length < 3) {
      setUserError('Username must be at least 3 characters');
      return;
    }

    if (newUserPassword.length < 6) {
      setUserError('Password must be at least 6 characters');
      return;
    }

    // Check if username already exists
    if (users.some((u) => u.username === newUsername)) {
      setUserError('Username already exists');
      return;
    }

    try {
      const userKey = newUsername.toLowerCase().replace(/\s+/g, '_');
      const userRef = ref(database, `users/${userKey}`);
      await set(userRef, {
        username: newUsername,
        password: newUserPassword,
        role: newUserRole,
        createdAt: new Date().toISOString(),
        mustChangePassword: true,
      });

      setUserSuccess(`User "${newUsername}" created successfully. Ask them to change the temporary password after their first login.`);
      setNewUsername('');
      setNewUserPassword('');
      setNewUserRole('judge');
      loadUsers();
    } catch (err) {
      setUserError('Failed to create user');
    }
  };

  const handleDeleteUser = async (userKey: string, username: string) => {
    if (username === 'admin') {
      alert('Cannot delete the admin user');
      return;
    }

    if (!window.confirm(`Delete user "${username}"?`)) {
      return;
    }

    try {
      await update(ref(database), {
        [`users/${userKey}`]: null,
        [`settings/boulderAssignments/assignments/${userKey}`]: null,
        [`settings/boulderAssignments/managers/${userKey}`]: null,
      });
      loadUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  if (!currentUser) {
    return null;
  }

  if (assignmentAccessLoading) {
    return <div className="min-h-screen bg-slate-100 p-4 md:p-6"><div className="mx-auto max-w-4xl"><LoadingMessage text="Checking settings access…" /></div></div>;
  }

  const assignmentTargets = users.filter((user) => user.role === 'judge' || user.role === 'chief-judge' || user.role === 'coach');
  const permissionCandidates = users.filter((user) => user.role !== 'administrator');
  const getUserAssignment = (user: ManagedUser) => {
    if (user.key && boulderAssignmentSettings.assignments[user.key]) {
      return boulderAssignmentSettings.assignments[user.key];
    }
    return Object.values(boulderAssignmentSettings.assignments).find(
      (assignment) => assignment.username.toLowerCase() === user.username.toLowerCase(),
    );
  };

  const assignmentSection = (
    <section className="order-2 border-b border-slate-200 pb-6 mb-6">
      <div className="mb-2 flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-indigo-700" />
        <h3 className="text-xl font-bold text-slate-900">Judge & Coach Boulder Assignments</h3>
      </div>
      <p className="mb-4 text-sm text-slate-600">
        Assign one boulder to each judge or coach for every round. When assignment mode is enabled, they cannot enter or scan a different boulder.
      </p>

      {isAdministrator ? (
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={boulderAssignmentSettings.judgesEnabled}
              onChange={(event) => setBoulderAssignmentSettings((current) => ({ ...current, judgesEnabled: event.target.checked }))}
              className="h-5 w-5"
            />
            <span><strong className="block text-slate-900">Enable for Judges</strong><span className="text-xs text-slate-600">Judge and Chief Judge panels use the assigned boulder.</span></span>
          </label>
          <label className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-4 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={boulderAssignmentSettings.coachesEnabled}
              onChange={(event) => setBoulderAssignmentSettings((current) => ({ ...current, coachesEnabled: event.target.checked }))}
              className="h-5 w-5"
            />
            <span><strong className="block text-slate-900">Enable for Coaches</strong><span className="text-xs text-slate-600">Student Assessment uses the assigned boulder.</span></span>
          </label>
        </div>
      ) : (
        <div className="mb-5 grid gap-2 text-sm sm:grid-cols-2">
          <div className={`rounded-lg border p-3 ${boulderAssignmentSettings.judgesEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>Judge assignments: <strong>{boulderAssignmentSettings.judgesEnabled ? 'Enabled' : 'Disabled'}</strong></div>
          <div className={`rounded-lg border p-3 ${boulderAssignmentSettings.coachesEnabled ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>Coach assignments: <strong>{boulderAssignmentSettings.coachesEnabled ? 'Enabled' : 'Disabled'}</strong></div>
        </div>
      )}

      {isAdministrator && (
        <fieldset className="mb-5 rounded-xl border border-slate-200 p-4">
          <legend className="px-2 font-bold text-slate-800">Who can manage assignments</legend>
          <p className="mb-3 text-sm text-slate-600">Administrators always have access. Selected users see only this assignment section in Settings.</p>
          {permissionCandidates.length ? <div className="grid gap-2 sm:grid-cols-2">
            {permissionCandidates.map((user) => (
              <label key={user.key || user.username} className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={Boolean(user.key && boulderAssignmentSettings.managers[user.key]?.enabled)}
                  onChange={(event) => handleAssignmentManagerChange(user, event.target.checked)}
                  className="h-5 w-5"
                />
                <span className="min-w-0"><strong className="block truncate text-slate-800">{user.username}</strong><span className="text-xs capitalize text-slate-500">{user.role.replace('-', ' ')}</span></span>
              </label>
            ))}
          </div> : <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Create a user before granting assignment access.</p>}
        </fieldset>
      )}

      <div className="space-y-4">
        {assignmentTargets.map((user) => {
          const assignment = getUserAssignment(user);
          const enabledForRole = user.role === 'coach'
            ? boulderAssignmentSettings.coachesEnabled
            : boulderAssignmentSettings.judgesEnabled;
          return (
            <article key={user.key || user.username} className="rounded-xl border border-slate-200 p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><p className="font-bold text-slate-900">{user.username}</p><p className="text-sm capitalize text-slate-500">{user.role.replace('-', ' ')}</p></div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${enabledForRole ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{enabledForRole ? 'Assignment enforced' : 'Prepared only'}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rounds.map((roundName) => {
                  const range = getBoulderRange(rounds, roundName, { numberingMode, boulderCounts });
                  const options = Array.from({ length: range.count }, (_, index) => range.start + index);
                  const selectedValue = assignment?.rounds?.[roundName] ?? '';
                  return (
                    <label key={roundName} className="text-sm font-semibold text-slate-700">
                      {roundName}
                      <select
                        value={selectedValue}
                        onChange={(event) => handleAssignedBoulderChange(user, roundName, event.target.value)}
                        className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal text-slate-900"
                      >
                        <option value="">Not assigned</option>
                        {options.map((number) => <option key={number} value={number}>Boulder {number}</option>)}
                      </select>
                    </label>
                  );
                })}
              </div>
            </article>
          );
        })}
        {!assignmentTargets.length && !isLoading && <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">Create Judge or Coach users before assigning boulders.</p>}
      </div>

      <p className="mt-4 text-xs text-slate-500">If you change round names, order, boulder counts, or numbering mode, save Round & Boulder Settings before reviewing these assignments.</p>
      {assignmentError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{assignmentError}</div>}
      {assignmentSuccess && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{assignmentSuccess}</div>}
      <button type="button" disabled={assignmentSaving} onClick={() => void handleSaveBoulderAssignments()} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
        <Save className="h-5 w-5" /> {assignmentSaving ? 'Saving…' : 'Save Boulder Assignments'}
      </button>
    </section>
  );

  if (!isAdministrator) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6"><BackButton /></div>
          <main className="rounded-xl bg-white p-4 shadow-lg sm:p-6 md:p-8">
            {isLoading && <div className="mb-4"><LoadingMessage text="Loading settings…" /></div>}
            {(dataError || (hasAssignmentAccess ? assignmentAccessError : '')) && <div className="mb-4"><ErrorMessage message={dataError || assignmentAccessError} /></div>}
            <div className="mb-6 flex items-center gap-3"><SettingsIcon className="h-8 w-8 text-slate-700" /><h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{hasAssignmentAccess ? 'Account & Boulder Settings' : 'Account Settings'}</h2></div>
            <AccountPasswordSection currentUser={currentUser} />
            {hasAssignmentAccess && assignmentSection}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="flex flex-col bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-6">
          {isLoading && <div className="mb-4"><LoadingMessage text="Loading settings…" /></div>}
          {(dataError || assignmentAccessError) && <div className="mb-4"><ErrorMessage message={dataError || assignmentAccessError} /></div>}
          <div className="order-0 flex items-center gap-3 mb-6">
            <SettingsIcon className="w-8 h-8 text-slate-700" />
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Administrator Settings
            </h2>
          </div>

          <section className="order-3 border-b border-slate-200 pb-6 mb-6">
            <div className="mb-2 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-cyan-700" />
              <h3 className="text-xl font-bold text-slate-900">Student Assessment Result Display</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">Choose which student information appears in the assessment result list. Name and Overall Result are always shown.</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3"><input type="checkbox" checked disabled className="h-5 w-5" /><span className="font-semibold text-slate-700">Name (required)</span></label>
              <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3"><input type="checkbox" checked disabled className="h-5 w-5" /><span className="font-semibold text-slate-700">Overall Result (required)</span></label>
              {([
                ['bib', 'BIB'],
                ['school', 'School'],
                ['class', 'Class'],
                ['age', 'Age'],
                ['gender', 'Gender'],
                ['overallAverage', 'Overall Average'],
              ] as Array<[keyof AssessmentResultFields, string]>).map(([field, label]) => <label key={field} className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-3 hover:bg-slate-50"><input type="checkbox" checked={assessmentResultFields[field]} onChange={(event) => setAssessmentResultFields((current) => ({ ...current, [field]: event.target.checked }))} className="h-5 w-5" /><span className="font-medium text-slate-700">{label}</span></label>)}
            </div>
            {assessmentDisplayError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{assessmentDisplayError}</div>}
            {assessmentDisplaySuccess && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{assessmentDisplaySuccess}</div>}
            <button type="button" onClick={() => void handleSaveAssessmentDisplay()} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 px-6 font-semibold text-white hover:bg-cyan-700 sm:w-auto"><Save className="h-5 w-5" /> Save Assessment Display</button>
          </section>

          <div className="order-4"><AssessmentArchives username={currentUser.username} /></div>

          <div className="order-5"><AccountPasswordSection currentUser={currentUser} /></div>

          <div className="order-6"><AdminPasswordResetSection users={users} currentUsername={currentUser.username} /></div>

          {/* Round Management Section */}
          <div id="manage-rounds" className="order-1 border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <ListChecks className="w-5 h-5 text-slate-600" />
              <h3 className="text-xl font-bold text-slate-900">Manage Rounds</h3>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              These rounds will appear in the Judging Panel and Student Ranking. Removing a round does not delete its previous scores.
            </p>

            <fieldset className="mb-5 rounded-xl border border-slate-200 p-4">
              <legend className="px-2 font-bold text-slate-800">Boulder numbering</legend>
              <label className="flex min-h-11 items-start gap-3 py-2"><input type="radio" name="numbering" value="continuous" checked={numberingMode === 'continuous'} onChange={() => setNumberingMode('continuous')} className="mt-1 h-5 w-5" /><span><strong>Continuous (Mode B)</strong><span className="block text-sm text-slate-600">Example: Qualifier 1–5, Semi Final 6–9, Final 10–13.</span></span></label>
              <label className="flex min-h-11 items-start gap-3 py-2"><input type="radio" name="numbering" value="per-round" checked={numberingMode === 'per-round'} onChange={() => setNumberingMode('per-round')} className="mt-1 h-5 w-5" /><span><strong>Restart each round (Mode A)</strong><span className="block text-sm text-slate-600">Example: every round begins with Boulder 1.</span></span></label>
            </fieldset>

            <div className="space-y-3">
              {rounds.map((roundName, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-100 p-2 sm:flex-nowrap sm:border-0 sm:p-0">
                  <span className="w-7 text-center text-sm font-semibold text-slate-500">{index + 1}</span>
                  <input
                    value={roundName}
                    onChange={(event) => handleRoundNameChange(index, event.target.value)}
                    aria-label={`Round ${index + 1} name`}
                    className="min-w-0 basis-[calc(100%-2.25rem)] flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500 sm:basis-auto"
                  />
                  <label className="w-24 text-xs font-semibold text-slate-600">Boulders<input aria-label={`${roundName} boulder count`} type="number" min="1" max="99" value={boulderCounts[roundName] ?? (roundOrigins[index] ? boulderCounts[roundOrigins[index] as string] : undefined) ?? 5} onChange={(event) => setBoulderCounts((current) => ({ ...current, [roundName]: Math.max(1, Number(event.target.value)) }))} className="mt-1 w-full rounded-lg border px-2 py-2 text-base" /></label>
                  <button type="button" onClick={() => moveRound(index, -1)} disabled={index === 0} aria-label={`Move ${roundName} up`} title="Move round up" className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                    <ArrowUp className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => moveRound(index, 1)} disabled={index === rounds.length - 1} aria-label={`Move ${roundName} down`} title="Move round down" className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40">
                    <ArrowDown className="h-5 w-5" />
                  </button>
                  <button type="button" onClick={() => handleDeleteRound(index)} aria-label={`Delete ${roundName}`} title="Delete round" className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700 hover:bg-red-200">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                value={newRound}
                onChange={(event) => setNewRound(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddRound();
                  }
                }}
                placeholder="New round name"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500"
              />
              <button type="button" onClick={handleAddRound} className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
                <Plus className="h-5 w-5" /> Add Round
              </button>
            </div>

            {roundError && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{roundError}</div>}
            {roundSuccess && <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{roundSuccess}</div>}

            <button type="button" onClick={handleSaveRounds} className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-emerald-700 sm:w-auto">
              <Save className="h-5 w-5" /> Save Round & Boulder Settings
            </button>
          </div>

          {assignmentSection}

          {/* Create User Section */}
          <div className="order-7 border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-slate-600" />
              <h3 className="text-xl font-bold text-slate-900">Create New User</h3>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Role
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) =>
                    setNewUserRole(e.target.value as 'chief-judge' | 'judge' | 'registry' | 'coach')
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="chief-judge">Chief Judge</option>
                  <option value="judge">Judge</option>
                  <option value="coach">Coach</option>
                  <option value="registry">Registry</option>
                </select>
              </div>

              {userError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {userError}
                </div>
              )}

              {userSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                  {userSuccess}
                </div>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <UserPlus className="w-5 h-5" />
                Create User
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="order-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Existing Users</h3>

            <div className="space-y-3 sm:hidden">{users.map((user) => <article key={user.key} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{user.username}</p><p className="text-sm capitalize text-slate-600">{user.role.replace('-', ' ')}</p><p className="text-xs text-slate-500">Created {new Date(user.createdAt).toLocaleDateString()}</p></div>{user.username !== 'admin' && <button aria-label={`Delete user ${user.username}`} onClick={() => handleDeleteUser(user.key || '', user.username)} className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-100 text-red-700"><Trash2 className="h-5 w-5" /></button>}</div></article>)}</div>
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Username
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
                      Created
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.key} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'administrator'
                              ? 'bg-purple-100 text-purple-700'
                              : user.role === 'chief-judge'
                              ? 'bg-emerald-100 text-emerald-700'
                              : user.role === 'judge'
                              ? 'bg-blue-100 text-blue-700'
                              : user.role === 'coach'
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {user.role === 'chief-judge'
                            ? 'Chief Judge'
                            : user.role === 'administrator'
                            ? 'Administrator'
                            : user.role === 'judge'
                            ? 'Judge'
                            : user.role === 'coach'
                            ? 'Coach'
                            : 'Registry'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.username !== 'admin' && (
                          <button
                            onClick={() => handleDeleteUser(user.key || '', user.username)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
