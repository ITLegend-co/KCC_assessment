import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { UserPlus, ClipboardCheck, Trophy, LogOut, Settings, QrCode, GraduationCap } from 'lucide-react';
import { getCurrentUser, logout } from '../lib/auth';
import { canManageBoulderAssignments, useBoulderAssignmentSettings } from '../lib/boulderAssignments';

export default function Home() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const { settings: boulderAssignmentSettings } = useBoulderAssignmentSettings();

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

  const canManageAssignments = canManageBoulderAssignments(currentUser, boulderAssignmentSettings);
  const canAccessAssessment =
    currentUser.role === 'administrator' ||
    currentUser.role === 'coach';
  const canAccessQrGenerator = currentUser.role !== 'coach';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-start justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="bg-white rounded-2xl shadow-2xl p-5 sm:p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Bouldering System
          </h1>
          <p className="text-slate-600">Competition Management</p>
          <div className="mt-4 inline-flex max-w-full flex-wrap items-center justify-center px-3 py-2 bg-slate-100 rounded-lg">
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
                  : currentUser.role === 'coach'
                  ? 'bg-cyan-100 text-cyan-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {currentUser.role === 'chief-judge'
                ? 'Chief Judge'
                : currentUser.role === 'administrator'
                ? 'Admin'
                : currentUser.role === 'judge'
                ? 'Judge'
                : currentUser.role === 'coach'
                ? 'Coach'
                : 'Registry'}
            </span>
          </div>
          {currentUser.mustChangePassword && (
            <Link to="/settings" className="mt-4 block rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 hover:bg-amber-100">
              <strong className="block">Change your temporary password</strong>
              We recommend updating it now in Account Settings.
            </Link>
          )}
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

          {canAccessAssessment && (
            <Link
              to="/student-assessment"
              className="flex items-center justify-center gap-3 w-full p-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <GraduationCap className="w-5 h-5" />
              Student Assessment
            </Link>
          )}

          <Link
            to="/ranking"
            className="flex items-center justify-center gap-3 w-full p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trophy className="w-5 h-5" />
            Ranking Board
          </Link>

          {canAccessQrGenerator && (
            <Link
              to="/qr-generator"
              className="flex items-center justify-center gap-3 w-full p-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            >
              <QrCode className="w-5 h-5" />
              Generate QR Codes
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200 space-y-3">
            <Link
              to="/settings"
              className="flex items-center justify-center gap-3 w-full p-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <Settings className="w-5 h-5" />
              {currentUser.role === 'administrator'
                ? 'Settings'
                : canManageAssignments
                ? 'Account & Boulder Settings'
                : 'Account Settings'}
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
