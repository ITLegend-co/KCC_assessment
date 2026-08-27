import { database } from './firebase';
import { ref, get, set, update } from 'firebase/database';

export interface User {
  username: string;
  password: string;
  role: 'administrator' | 'chief-judge' | 'judge' | 'registry';
  createdAt: string;
  key?: string;
}

export interface CurrentUser {
  username: string;
  role: 'administrator' | 'chief-judge' | 'judge' | 'registry';
}

// Initialize default admin user
export const initializeDefaultAdmin = async () => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    const adminRef = ref(database, 'users/admin');
    await set(adminRef, {
      username: 'admin',
      password: 'admin1234', // In production, this should be hashed
      role: 'administrator',
      createdAt: new Date().toISOString(),
    });
  }
};

// Login function
export const login = async (username: string, password: string): Promise<CurrentUser | null> => {
  const usersRef = ref(database, 'users');
  const snapshot = await get(usersRef);

  if (!snapshot.exists()) {
    return null;
  }

  const users = snapshot.val();
  const userKey = Object.keys(users).find((key) => {
    const user = users[key];
    return user.username === username && user.password === password;
  });

  if (userKey) {
    const user = users[userKey];
    return {
      username: user.username,
      role: user.role,
    };
  }

  return null;
};

// Get current user from session storage
export const getCurrentUser = (): CurrentUser | null => {
  const userJson = sessionStorage.getItem('currentUser');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }
  return null;
};

// Set current user in session storage
export const setCurrentUser = (user: CurrentUser) => {
  sessionStorage.setItem('currentUser', JSON.stringify(user));
};

// Logout function
export const logout = () => {
  sessionStorage.removeItem('currentUser');
};

// Check if user has permission
export const hasPermission = (user: CurrentUser | null, requiredRoles: string[]): boolean => {
  if (!user) return false;
  return requiredRoles.includes(user.role);
};
