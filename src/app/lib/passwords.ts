import { ref, set } from 'firebase/database';
import { database } from './firebase';

export interface PasswordResetRequest {
  username: string;
  requestedAt: string;
  status: 'pending';
}

export function passwordResetRequestKey(username: string) {
  return encodeURIComponent(username.trim().toLowerCase()).replace(/\./g, '%2E');
}

export async function requestPasswordReset(username: string) {
  const cleanUsername = username.trim();
  if (!cleanUsername) throw new Error('Enter your username');

  await set(ref(database, `passwordResetRequests/${passwordResetRequestKey(cleanUsername)}`), {
    username: cleanUsername,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  } satisfies PasswordResetRequest);
}
