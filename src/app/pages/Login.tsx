import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { LogIn, User, Lock, Eye, EyeOff, CircleHelp, Send } from 'lucide-react';
import { login, setCurrentUser } from '../lib/auth';
import { requestPasswordReset } from '../lib/passwords';
import { describeError } from '../lib/appError';
import { KccFooter, KccLogo } from '../components/KccBrand';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [recoveryUsername, setRecoveryUsername] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password);

      if (user) {
        setCurrentUser(user);
        navigate(user.mustChangePassword ? '/settings' : '/');
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openForgotPassword = () => {
    setRecoveryUsername(username);
    setRecoveryError('');
    setRecoverySuccess('');
    setShowForgotPassword(true);
  };

  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');
    if (!recoveryUsername.trim()) {
      setRecoveryError('Enter your username');
      return;
    }

    setRecoveryLoading(true);
    try {
      await requestPasswordReset(recoveryUsername);
      setRecoverySuccess('Request sent. If this username exists, an administrator will see it and can give you a temporary password.');
    } catch (caughtError) {
      const details = describeError(caughtError, 'Password reset request could not be sent');
      setRecoveryError(`${details.message} — ${details.code}`);
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <div className="kcc-page min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col p-4">
      <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <KccLogo className="mx-auto mb-4 h-32 w-auto" />
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
            <span className="text-white">Bouldering</span> <span className="text-amber-400">System</span>
          </h1>
          <p className="text-slate-600">Competition Management · Sign in to continue</p>
        </div>

        <div className="kcc-panel bg-white rounded-xl shadow-lg p-5 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="login-username" className="block text-sm font-semibold text-slate-700 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  id="login-username"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Enter password"
                />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)} className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
              <div className="mt-2 text-right">
                <button type="button" onClick={openForgotPassword} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-violet-700 hover:bg-violet-50 hover:text-violet-800">
                  <CircleHelp className="h-4 w-4" /> Forgot Password?
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {showForgotPassword && (
            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div><h2 className="font-bold text-slate-900">Request a Password Reset</h2><p className="mt-1 text-sm text-slate-600">Enter your username. An administrator will set a temporary password for you.</p></div>
                <button type="button" aria-label="Close forgot password form" onClick={() => setShowForgotPassword(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100">×</button>
              </div>
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div><label htmlFor="recovery-username" className="mb-2 block text-sm font-semibold text-slate-700">Username</label><input id="recovery-username" type="text" autoComplete="username" value={recoveryUsername} onChange={(event) => setRecoveryUsername(event.target.value)} required className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:ring-2 focus:ring-violet-500" placeholder="Enter username" /></div>
                {recoveryError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{recoveryError}</div>}
                {recoverySuccess && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{recoverySuccess}</div>}
                <button type="submit" disabled={recoveryLoading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-6 font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"><Send className="h-5 w-5" /> {recoveryLoading ? 'Sending…' : 'Send Request to Administrator'}</button>
              </form>
            </div>
          )}
        </div>
      </div>
      </div>
      <KccFooter />
    </div>
  );
}
