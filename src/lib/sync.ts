import { localDb } from './localDb';
import { setAuthToken } from './api';

export interface SyncPayload {
  version: number;
  timestamp: string;
  user: {
    id: string;
    email: string;
    name: string;
    password?: string;
    createdAt?: string;
  };
  accounts: any[];
  transactions: any[];
  investments: any[];
  settings: any[];
}

export function exportUserData(userId?: string): SyncPayload {
  const storeRaw = localStorage.getItem('wealthtrack_offline_db');
  const store = storeRaw ? JSON.parse(storeRaw) : null;

  if (!store || !store.users || store.users.length === 0) {
    throw new Error('No user data found to export');
  }

  const targetUserId = userId || store.currentUserId || store.users[0].id;
  const user = store.users.find((u: any) => u.id === targetUserId) || store.users[0];

  const userAccounts = (store.accounts || []).filter((a: any) => a.userId === user.id);
  const userTransactions = (store.transactions || []).filter((t: any) => t.userId === user.id);
  const userInvestments = (store.investments || []).filter((i: any) => i.userId === user.id);
  const userSettings = (store.settings || []).filter((s: any) => s.userId === user.id);

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.password,
      createdAt: user.createdAt,
    },
    accounts: userAccounts,
    transactions: userTransactions,
    investments: userInvestments,
    settings: userSettings,
  };
}

export function encodeSyncString(payload: SyncPayload): string {
  const jsonStr = JSON.stringify(payload);
  // Base64 encode safely for UTF-8
  return btoa(encodeURIComponent(jsonStr));
}

export function decodeSyncString(encoded: string): SyncPayload {
  try {
    const jsonStr = decodeURIComponent(atob(encoded.trim()));
    return JSON.parse(jsonStr) as SyncPayload;
  } catch (err) {
    throw new Error('Invalid sync key or corrupted data format');
  }
}

export function generateSyncUrl(): string {
  const payload = exportUserData();
  const encoded = encodeSyncString(payload);
  const base = `${window.location.origin}${window.location.pathname}`;
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}?sync=${encodeURIComponent(encoded)}`;
}

export function importUserData(payload: SyncPayload): { userId: string; email: string } {
  if (!payload.user || !payload.user.email) {
    throw new Error('Invalid backup file: missing user profile');
  }

  const storeRaw = localStorage.getItem('wealthtrack_offline_db');
  let store: any = storeRaw ? JSON.parse(storeRaw) : { users: [], accounts: [], transactions: [], investments: [], settings: [] };

  const importedUser = payload.user;

  // Merge or replace user
  const existingUserIdx = store.users.findIndex((u: any) => u.email.toLowerCase() === importedUser.email.toLowerCase());
  if (existingUserIdx !== -1) {
    store.users[existingUserIdx] = { ...store.users[existingUserIdx], ...importedUser };
  } else {
    store.users.push(importedUser);
  }

  // Remove old records for this user to avoid duplicates, then insert imported records
  store.accounts = (store.accounts || []).filter((a: any) => a.userId !== importedUser.id).concat(payload.accounts || []);
  store.transactions = (store.transactions || []).filter((t: any) => t.userId !== importedUser.id).concat(payload.transactions || []);
  store.investments = (store.investments || []).filter((i: any) => i.userId !== importedUser.id).concat(payload.investments || []);
  store.settings = (store.settings || []).filter((s: any) => s.userId !== importedUser.id).concat(payload.settings || []);

  store.currentUserId = importedUser.id;
  localStorage.setItem('wealthtrack_offline_db', JSON.stringify(store));

  const token = 'loc_token_' + importedUser.id;
  setAuthToken(token);

  return { userId: importedUser.id, email: importedUser.email };
}
