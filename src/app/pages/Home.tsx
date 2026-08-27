import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { UserPlus, ClipboardCheck, Trophy, LogOut, Settings } from 'lucide-react';
import { getCurrentUser, logout } from '../lib/auth';

export default function Home() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) {
    return null;
  }

  const canAccessRegistration =
    currentUser.role === 'administrator' ||
    currentUser.role === 'registry';

  const canAccessJudging =
    currentUser.role === 'administrator' ||
    currentUser.role === 'chief-judge' ||
    currentUser.role === 'judge';

  const canAccessSettings = currentUser.role === 'administrator';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Bouldering System
          </h1>
          <p className="text-slate-600">Competition Management</p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-slate-100 rounded-lg">
            <span className="text-sm text-slate-600">Logged in as:</span>
            <span className="ml-2 font-semibold text-slate-900">{currentUser.username}</span>
            <span
              className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                currentUser.role === 'administrator'
                  ? 'bg-purple-100 text-purple-700'
                  : currentUser.role === 'chief-judge'
                  ? 'bg-emerald-100 text-emerald-700'
                  : currentUser.role === 'judge'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {currentUser.role === 'chief-judge'
                ? 'Chief Judge'
                : currentUser.role === 'administrator'
                ? 'Admin'
                : currentUser.role === 'judge'
                ? 'Judge'
                : 'Registry'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {canAccessRegistration && (
            <Link
              to="/registration"
              className="flex items-center justify-center gap-3 w-full p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <UserPlus className="w-5 h-5" />
              Register Student
            </Link>
          )}

          {canAccessJudging && (
            <Link
              to="/judge"
              className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <ClipboardCheck className="w-5 h-5" />
              Judging Panel
            </Link>
          )}

          <Link
            to="/ranking"
            className="flex items-center justify-center gap-3 w-full p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trophy className="w-5 h-5" />
            Ranking Board
          </Link>

          <div className="pt-4 border-t border-slate-200 space-y-3">
            {canAccessSettings && (
              <Link
                to="/settings"
                className="flex items-center justify-center gap-3 w-full p-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
          <p></p>
        </div>
      </div>
    </div>
  );
}
