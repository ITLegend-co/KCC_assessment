import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { describeError } from '../lib/appError';

export default function AppError() {
  const routeError = useRouteError();
  const error = isRouteErrorResponse(routeError)
    ? describeError(new Error(`${routeError.status} ${routeError.statusText}`), 'The page could not be opened.')
    : describeError(routeError, 'An unexpected application error occurred.');

  return <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
    <section className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl sm:p-8" role="alert">
      <AlertTriangle className="h-12 w-12 text-red-600" />
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-2 text-slate-700">{error.message}</p>
      <dl className="mt-5 space-y-2 rounded-lg bg-slate-50 p-4 text-sm">
        <div><dt className="font-semibold">Page</dt><dd className="break-all">{window.location.hash || '/'}</dd></div>
        <div><dt className="font-semibold">Time</dt><dd>{error.time}</dd></div>
        <div><dt className="font-semibold">Error code</dt><dd className="font-mono">{error.code}</dd></div>
        <div><dt className="font-semibold">Technical detail</dt><dd className="break-words font-mono text-xs">{error.technical}</dd></div>
      </dl>
      <p className="mt-4 text-sm text-slate-600">Try reloading first. If it happens again, take a screenshot containing the error code and technical detail.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <button onClick={() => window.location.reload()} className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white"><RefreshCw className="h-5 w-5" />Reload Page</button>
        <a href="#/" className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-3 font-semibold text-white"><Home className="h-5 w-5" />Return Home</a>
      </div>
    </section>
  </main>;
}
