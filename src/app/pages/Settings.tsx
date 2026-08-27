import { useState, useEffect } from 'react';
import { BackButton } from '../components/BackButton';
import { getCurrentUser, User } from '../lib/auth';
import { database } from '../lib/firebase';
import { ref, get, set, update, remove } from 'firebase/database';
import { Settings as SettingsIcon, Key, UserPlus, Trash2, Save } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [users, setUsers] = useState<User[]>([]);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'chief-judge' | 'judge' | 'registry'>('judge');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'administrator') {
      navigate('/');
      return;
    }
    loadUsers();
  }, [currentUser, navigate]);

  const loadUsers = async () => {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const usersList: User[] = Object.keys(data).map((key) => ({
        ...data[key],
        key,
      }));
      setUsers(usersList);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      // Find current user's key in Firebase
      const userKey = users.find((u) => u.username === currentUser?.username)?.key;

      if (userKey) {
        const userRef = ref(database, `users/${userKey}`);
        await update(userRef, { password: newPassword });
        setPasswordSuccess('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setPasswordError('Failed to change password');
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
      });

      setUserSuccess(`User "${newUsername}" created successfully`);
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
      const userRef = ref(database, `users/${userKey}`);
      await remove(userRef);
      loadUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  if (!currentUser || currentUser.role !== 'administrator') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <SettingsIcon className="w-8 h-8 text-slate-700" />
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Administrator Settings
            </h2>
          </div>

          {/* Change Password Section */}
          <div className="border-b border-slate-200 pb-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-slate-600" />
              <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Confirm new password"
                />
              </div>

              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <Save className="w-5 h-5" />
                Change Password
              </button>
            </form>
          </div>

          {/* Create User Section */}
          <div className="border-b border-slate-200 pb-6 mb-6">
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
                    setNewUserRole(e.target.value as 'chief-judge' | 'judge' | 'registry')
                  }
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="chief-judge">Chief Judge</option>
                  <option value="judge">Judge</option>
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
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Existing Users</h3>

            <div className="overflow-x-auto">
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
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {user.role === 'chief-judge'
                            ? 'Chief Judge'
                            : user.role === 'administrator'
                            ? 'Administrator'
                            : user.role === 'judge'
                            ? 'Judge'
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
