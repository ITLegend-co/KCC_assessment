export interface AppErrorDetails {
  code: string;
  message: string;
  technical: string;
  time: string;
}

export function describeError(error: unknown, fallback: string): AppErrorDetails {
  const candidate = error as { code?: string; message?: string } | null;
  return {
    code: candidate?.code || 'UNKNOWN_ERROR',
    message: candidate?.message || fallback,
    technical: error instanceof Error ? `${error.name}: ${error.message}` : String(error || fallback),
    time: new Date().toLocaleString(),
  };
}
