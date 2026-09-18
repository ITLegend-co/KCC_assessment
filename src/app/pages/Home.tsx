import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { UserPlus, ClipboardCheck, Trophy, LogOut, Settings, QrCode, GraduationCap, Download, X, Globe2, Smartphone, Share2 } from 'lucide-react';
import { getCurrentUser, logout } from '../lib/auth';
import { canManageBoulderAssignments, useBoulderAssignmentSettings } from '../lib/boulderAssignments';
import { KccLogo } from '../components/KccBrand';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function Home() {
  const navigate = useNavigate();
  const [currentUser] = useState(() => getCurrentUser());
  const isAndroidApk = navigator.userAgent.includes('KCCAssessmentAndroid/');
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallOptions, setShowInstallOptions] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  const { settings: boulderAssignmentSettings } = useBoulderAssignmentSettings();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowInstallHelp(false);
      setShowInstallOptions(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBrowserInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallPrompt(null);
        setShowInstallOptions(false);
      }
      return;
    }

    setShowInstallHelp(true);
  };

  const apkDownloadUrl = `${import.meta.env.BASE_URL}downloads/KCC_Assessment_Test_v1.apk`;

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
    <div className="kcc-page kcc-home-page min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 flex items-start justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
      <div className="kcc-panel kcc-home-card bg-white rounded-2xl shadow-2xl p-5 sm:p-8 md:p-12 w-full max-w-md">
        <div className="text-center mb-8">
          <KccLogo className="mb-4 h-28 w-auto" />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            <span className="text-amber-400">KCC</span> Youth Level Assessment
          </h1>
          <p className="text-slate-600">Bouldering Competition Management</p>
          <div className="kcc-user-chip mt-4 inline-flex max-w-full flex-wrap items-center justify-center px-3 py-2 bg-slate-100 rounded-lg">
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

        <div className="kcc-home-actions space-y-4">
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

          {!isAndroidApk && <button
            type="button"
            onClick={() => {
              setShowInstallOptions(true);
              setShowInstallHelp(false);
            }}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-indigo-600 p-4 font-semibold text-white shadow-lg transition-all hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98]"
          >
            <Download className="h-5 w-5" />
            Install on Mobile
          </button>}

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

      {!isAndroidApk && showInstallOptions && (
        <div role="dialog" aria-modal="true" aria-labelledby="mobile-install-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" onClick={() => setShowInstallOptions(false)}>
          <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => setShowInstallOptions(false)} aria-label="Close mobile installation options" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900">
              <X className="h-5 w-5" />
            </button>

            <div className="pr-12">
              <h2 id="mobile-install-title" className="text-2xl font-bold text-slate-900">Install on Mobile</h2>
              <p className="mt-1 text-sm text-slate-600">Choose the installation method for your device.</p>
            </div>

            <div className="mt-5 space-y-3">
              <button type="button" onClick={() => void handleBrowserInstall()} className="flex min-h-20 w-full items-center gap-4 rounded-xl border-2 border-indigo-200 bg-indigo-50 p-4 text-left hover:border-indigo-400 hover:bg-indigo-100">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Globe2 className="h-6 w-6" /></span>
                <span>
                  <strong className="block text-indigo-950">Install Using Browser</strong>
                  <span className="mt-1 block text-sm text-indigo-800">Android, iPhone and iPad. Opens like an app from the home screen.</span>
                  {isInstalled && <span className="mt-1 block text-xs font-semibold text-emerald-700">Already installed on this device</span>}
                </span>
              </button>

              {showInstallHelp && !isInstalled && (
                <div className="rounded-xl border border-indigo-200 bg-white p-4 text-sm text-slate-700">
                  <div className="flex gap-3">
                    <Share2 className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
                    <div>
                      <strong className="block text-slate-900">Manual browser installation</strong>
                      <p className="mt-1"><strong>iPhone/iPad:</strong> Open this website in Safari, tap Share, then <strong>Add to Home Screen</strong>.</p>
                      <p className="mt-2"><strong>Android:</strong> Open the browser menu, then select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>
                    </div>
                  </div>
                </div>
              )}

              <a href={apkDownloadUrl} download="KCC_Assessment_Test_v1.apk" className="flex min-h-20 w-full items-center gap-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4 text-left hover:border-emerald-400 hover:bg-emerald-100">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white"><Smartphone className="h-6 w-6" /></span>
                <span>
                  <strong className="block text-emerald-950">Download Android APK</strong>
                  <span className="mt-1 block text-sm text-emerald-800">Direct Android application. Android may ask permission to install from this source.</span>
                </span>
              </a>
            </div>

            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900"><strong>iPhone/iPad:</strong> APK files only work on Android. Use the browser installation option on iOS. A native iOS version would require Apple signing and distribution through TestFlight or the App Store.</p>
          </div>
        </div>
      )}
    </div>
  );
}
