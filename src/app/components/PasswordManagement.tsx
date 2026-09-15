import { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, KeyRound, Save, ShieldCheck, UserCog, X } from 'lucide-react';
import { get, onValue, ref, set, update } from 'firebase/database';
import { database } from '../lib/firebase';
import {
  setCurrentUser as saveCurrentUser,
  type CurrentUser,
  type User,
  type UserRole,
} from '../lib/auth';
import { describeError } from '../lib/appError';
import { passwordResetRequestKey, type PasswordResetRequest } from '../lib/passwords';

interface AccountRecord {
  key: string;
  user: User;
}

interface ResettableUser {
  key: string;
  username: string;
  role: UserRole;
}

interface StoredPasswordResetRequest extends PasswordResetRequest {
  key: string;
}

async function loadAccountRecord(currentUser: CurrentUser): Promise<AccountRecord> {
  if (currentUser.key) {
    const accountSnapshot = await get(ref(database, `users/${currentUser.key}`));
    if (accountSnapshot.exists()) {
      const account = accountSnapshot.val() as User;
      if (account.username?.toLowerCase() === currentUser.username.toLowerCase()) {
        return { key: currentUser.key, user: account };
      }
    }
  }

  const usersSnapshot = await get(ref(database, 'users'));
  if (usersSnapshot.exists()) {
    const entry = Object.entries(usersSnapshot.val() as Record<string, User>).find(
      ([, account]) => account.username?.toLowerCase() === currentUser.username.toLowerCase(),
    );
    if (entry) return { key: entry[0], user: entry[1] };
  }

  throw new Error('Your account record could not be found. Ask an administrator for help.');
}

export function AccountPasswordSection({ currentUser }: { currentUser: CurrentUser }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(Boolean(currentUser.mustChangePassword));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== repeatPassword) {
      setError('The new passwords do not match');
      return;
    }
    if (oldPassword === newPassword) {
      setError('Choose a new password that is different from your old password');
      return;
    }

    setSaving(true);
    try {
      const account = await loadAccountRecord(currentUser);
      if (String(account.user.password || '') !== oldPassword) {
        setError('Old password is incorrect');
        return;
      }

      const changedAt = new Date().toISOString();
      await update(ref(database), {
        [`users/${account.key}/password`]: newPassword,
        [`users/${account.key}/mustChangePassword`]: false,
        [`users/${account.key}/passwordChangedAt`]: changedAt,
        [`passwordResetRequests/${passwordResetRequestKey(account.user.username)}`]: null,
      });

      const nextCurrentUser: CurrentUser = {
        ...currentUser,
        key: account.key,
        mustChangePassword: false,
      };
      saveCurrentUser(nextCurrentUser);
      setMustChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setRepeatPassword('');
      setSuccess('Password changed successfully');
    } catch (caughtError) {
      const details = describeError(caughtError, 'Password could not be changed');
      setError(`${details.message} — ${details.code}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-b border-slate-200 pb-6 mb-6">
      <div className="mb-2 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-emerald-700" />
        <h3 className="text-xl font-bold text-slate-900">Change My Password</h3>
      </div>
      <p className="mb-4 text-sm text-slate-600">Enter your current password, then choose and repeat your new password.</p>

      {mustChangePassword && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div><strong className="block">Please change your temporary password</strong><span>For account security, we recommend changing it now before continuing.</span></div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="old-password" className="mb-2 block text-sm font-semibold text-slate-700">Old Password</label>
          <input id="old-password" type={showPasswords ? 'text' : 'password'} autoComplete="current-password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500" placeholder="Enter old password" />
        </div>
        <div>
          <label htmlFor="new-password" className="mb-2 block text-sm font-semibold text-slate-700">New Password</label>
          <input id="new-password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={6} className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500" placeholder="At least 6 characters" />
        </div>
        <div>
          <label htmlFor="repeat-new-password" className="mb-2 block text-sm font-semibold text-slate-700">Repeat New Password</label>
          <input id="repeat-new-password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} required minLength={6} className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:ring-2 focus:ring-emerald-500" placeholder="Repeat new password" />
        </div>

        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} className="h-5 w-5" />
          {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} Show passwords
        </label>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}

        <button type="submit" disabled={saving} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          <Save className="h-5 w-5" /> {saving ? 'Saving…' : 'Save New Password'}
        </button>
      </form>
    </section>
  );
}

export function AdminPasswordResetSection({ users, currentUsername }: { users: ResettableUser[]; currentUsername: string }) {
  const [requests, setRequests] = useState<StoredPasswordResetRequest[]>([]);
  const [targetKey, setTargetKey] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => onValue(ref(database, 'passwordResetRequests'), (snapshot) => {
    if (!snapshot.exists()) {
      setRequests([]);
      setLoading(false);
      return;
    }
    const nextRequests = Object.entries(snapshot.val() as Record<string, PasswordResetRequest>)
      .filter(([, request]) => request?.status === 'pending' && request.username)
      .map(([key, request]) => ({ ...request, key }))
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
    setRequests(nextRequests);
    setLoading(false);
  }, (caughtError) => {
    const details = describeError(caughtError, 'Password reset requests could not be loaded');
    setError(`${details.message} — ${details.code}`);
    setLoading(false);
  }), []);

  const resettableUsers = useMemo(
    () => users.filter((user) => user.username.toLowerCase() !== currentUsername.toLowerCase()),
    [currentUsername, users],
  );
  const selectedUser = resettableUsers.find((user) => user.key === targetKey);

  const selectUser = (user: ResettableUser) => {
    setTargetKey(user.key);
    setTemporaryPassword('');
    setRepeatPassword('');
    setError('');
    setSuccess('');
  };

  const dismissRequest = async (requestKey: string) => {
    try {
      await set(ref(database, `passwordResetRequests/${requestKey}`), null);
    } catch (caughtError) {
      const details = describeError(caughtError, 'Request could not be dismissed');
      setError(`${details.message} — ${details.code}`);
    }
  };

  const handleReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUser) {
      setError('Select a user account');
      return;
    }
    if (temporaryPassword.length < 6) {
      setError('Temporary password must be at least 6 characters');
      return;
    }
    if (temporaryPassword !== repeatPassword) {
      setError('The temporary passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const resetAt = new Date().toISOString();
      const updates: Record<string, unknown> = {
        [`users/${selectedUser.key}/password`]: temporaryPassword,
        [`users/${selectedUser.key}/mustChangePassword`]: true,
        [`users/${selectedUser.key}/passwordResetAt`]: resetAt,
      };
      requests
        .filter((request) => request.username.toLowerCase() === selectedUser.username.toLowerCase())
        .forEach((request) => { updates[`passwordResetRequests/${request.key}`] = null; });
      updates[`passwordResetRequests/${passwordResetRequestKey(selectedUser.username)}`] = null;
      await update(ref(database), updates);

      setTemporaryPassword('');
      setRepeatPassword('');
      setTargetKey('');
      setSuccess(`Temporary password saved for ${selectedUser.username}. Give it to the user privately; they will be asked to change it after login.`);
    } catch (caughtError) {
      const details = describeError(caughtError, 'Password could not be reset');
      setError(`${details.message} — ${details.code}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="border-b border-slate-200 pb-6 mb-6">
      <div className="mb-2 flex items-center gap-2">
        <UserCog className="h-5 w-5 text-violet-700" />
        <h3 className="text-xl font-bold text-slate-900">Forgotten Password Requests</h3>
      </div>
      <p className="mb-4 text-sm text-slate-600">Set a temporary password for a user, then give it to them privately. The system recommends they replace it on their next login.</p>

      <div className="mb-5 space-y-2">
        {loading && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Loading requests…</p>}
        {!loading && requests.length === 0 && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No pending password reset requests.</p>}
        {requests.map((request) => {
          const matchingUser = resettableUsers.find((user) => user.username.toLowerCase() === request.username.toLowerCase());
          return (
            <article key={request.key} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0"><p className="font-bold text-slate-900">{request.username}</p><p className="text-xs text-slate-600">Requested {new Date(request.requestedAt).toLocaleString()}</p>{!matchingUser && <p className="mt-1 text-xs font-semibold text-red-700">No matching user account</p>}</div>
              <div className="flex flex-wrap gap-2">
                {matchingUser && <button type="button" onClick={() => selectUser(matchingUser)} className="min-h-11 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700">Reset Password</button>}
                <button type="button" onClick={() => void dismissRequest(request.key)} className="flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"><X className="h-4 w-4" /> Dismiss</button>
              </div>
            </article>
          );
        })}
      </div>

      <form onSubmit={handleReset} className="rounded-xl border border-slate-200 p-4 space-y-4">
        <div>
          <label htmlFor="reset-user" className="mb-2 block text-sm font-semibold text-slate-700">User Account</label>
          <select id="reset-user" value={targetKey} onChange={(event) => { setTargetKey(event.target.value); setError(''); setSuccess(''); }} required className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4">
            <option value="">Select a user</option>
            {resettableUsers.map((user) => <option key={user.key} value={user.key}>{user.username} — {user.role.replace('-', ' ')}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="temporary-password" className="mb-2 block text-sm font-semibold text-slate-700">Temporary Password</label><input id="temporary-password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={temporaryPassword} onChange={(event) => setTemporaryPassword(event.target.value)} required minLength={6} className="w-full rounded-lg border border-slate-300 px-4 py-2" placeholder="At least 6 characters" /></div>
          <div><label htmlFor="repeat-temporary-password" className="mb-2 block text-sm font-semibold text-slate-700">Repeat Temporary Password</label><input id="repeat-temporary-password" type={showPasswords ? 'text' : 'password'} autoComplete="new-password" value={repeatPassword} onChange={(event) => setRepeatPassword(event.target.value)} required minLength={6} className="w-full rounded-lg border border-slate-300 px-4 py-2" placeholder="Repeat temporary password" /></div>
        </div>
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={showPasswords} onChange={(event) => setShowPasswords(event.target.checked)} className="h-5 w-5" />{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} Show passwords</label>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {success && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{success}</div>}
        <button type="submit" disabled={saving || !selectedUser} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"><KeyRound className="h-5 w-5" /> {saving ? 'Saving…' : 'Set Temporary Password'}</button>
      </form>
    </section>
  );
}
