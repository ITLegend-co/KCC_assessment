import { AlertCircle, Loader2, WifiOff } from 'lucide-react';

export function LoadingMessage({ text = 'Loading data…' }: { text?: string }) {
  return <div role="status" className="flex items-center justify-center gap-2 rounded-lg bg-slate-50 p-4 text-slate-600"><Loader2 className="h-5 w-5 animate-spin" />{text}</div>;
}

export function ErrorMessage({ message, code }: { message: string; code?: string }) {
  return <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"><div className="flex items-center gap-2 font-semibold"><AlertCircle className="h-5 w-5" />Unable to load data</div><p className="mt-1 text-sm">{message}</p>{code && <p className="mt-1 font-mono text-xs">Code: {code}</p>}</div>;
}

export function OfflineMessage() {
  return <div role="status" className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><WifiOff className="h-4 w-4" />You appear to be offline. Changes may not be saved.</div>;
}
