import {
  User,
  Account,
  Transaction,
  Investment,
  UserSettings,
  DashboardStats,
} from '../types';
import { localDb } from './localDb';

const TOKEN_KEY = 'wealthtrack_auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Track if server backend is reachable
let isServerAvailable: boolean | null = null;

async function checkServer(): Promise<boolean> {
  if (isServerAvailable !== null) return isServerAvailable;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    // If it's a 404 HTML (typical of static GitHub Pages routing), server is not available
    if (res.status === 404 && !contentType.includes('application/json')) {
      isServerAvailable = false;
      return false;
    }

    // Server exists
    isServerAvailable = true;
    return true;
  } catch {
    isServerAvailable = false;
    return false;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Non-JSON response from server');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async register(email: string, password: string, name?: string): Promise<{ token: string; user: User }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        const res = await request<{ token: string; user: User }>('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        });
        setAuthToken(res.token);
        return res;
      } catch (err: any) {
        if (err.message === 'Non-JSON response from server') {
          isServerAvailable = false;
        } else {
          throw err;
        }
      }
    }

    // Static / Offline fallback for GitHub Pages
    const localRes = localDb.register(email, password, name);
    setAuthToken(localRes.token);
    return localRes;
  },

  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        const res = await request<{ token: string; user: User }>('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        setAuthToken(res.token);
        return res;
      } catch (err: any) {
        if (err.message === 'Non-JSON response from server') {
          isServerAvailable = false;
        } else {
          throw err;
        }
      }
    }

    // Static / Offline fallback for GitHub Pages
    const localRes = localDb.login(email, password);
    setAuthToken(localRes.token);
    return localRes;
  },

  async getCurrentUser(): Promise<{ user: User }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ user: User }>('/api/auth/me');
      } catch (err: any) {
        if (err.message === 'Non-JSON response from server') {
          isServerAvailable = false;
        } else {
          throw err;
        }
      }
    }

    return localDb.getCurrentUser();
  },

  // Accounts
  async getAccounts(): Promise<{ accounts: Account[] }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ accounts: Account[] }>('/api/accounts');
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.getAccounts();
  },

  async createAccount(data: {
    name: string;
    type: 'bank' | 'cash' | 'ewallet';
    balance: number;
    accountNumber?: string;
    color?: string;
  }): Promise<{ account: Account }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ account: Account }>('/api/accounts', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.createAccount(data);
  },

  async updateAccount(id: string, data: Partial<Account>): Promise<{ account: Account }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ account: Account }>(`/api/accounts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.updateAccount(id, data);
  },

  async deleteAccount(id: string): Promise<{ success: boolean }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ success: boolean }>(`/api/accounts/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.deleteAccount(id);
  },

  // Transactions
  async getTransactions(params?: { type?: string; accountId?: string; limit?: number }): Promise<{ transactions: Transaction[] }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        const query = new URLSearchParams();
        if (params?.type) query.append('type', params.type);
        if (params?.accountId) query.append('accountId', params.accountId);
        if (params?.limit) query.append('limit', String(params.limit));

        const qs = query.toString() ? `?${query.toString()}` : '';
        return await request<{ transactions: Transaction[] }>(`/api/transactions${qs}`);
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.getTransactions(params);
  },

  async createTransaction(data: {
    type: 'expense' | 'income';
    amount: number;
    accountId: string;
    category: string;
    date: string;
    notes?: string;
  }): Promise<{ transaction: Transaction; updatedAccount: Account }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ transaction: Transaction; updatedAccount: Account }>('/api/transactions', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.createTransaction(data);
  },

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<{ transaction: Transaction }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ transaction: Transaction }>(`/api/transactions/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.updateTransaction(id, data);
  },

  async deleteTransaction(id: string): Promise<{ success: boolean }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ success: boolean }>(`/api/transactions/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.deleteTransaction(id);
  },

  // Transfers
  async executeTransfer(data: {
    type: 'account_to_account' | 'bank_to_investment';
    fromAccountId: string;
    toAccountId?: string;
    toInvestmentId?: string;
    amountIdr: number;
    exchangeRate?: number;
    date?: string;
    notes?: string;
  }): Promise<{ success: boolean; transaction: Transaction }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ success: boolean; transaction: Transaction }>('/api/transfers', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.executeTransfer(data);
  },

  // Investments
  async getInvestments(): Promise<{ investments: Investment[] }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ investments: Investment[] }>('/api/investments');
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.getInvestments();
  },

  async createInvestment(data: {
    name: string;
    category: 'USD' | 'Bitcoin' | 'Saham' | 'RDPU' | 'ETF USA';
    amountInvested: number;
    currentValue?: number;
    units?: number;
    platform?: string;
    notes?: string;
  }): Promise<{ investment: Investment }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ investment: Investment }>('/api/investments', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.createInvestment(data);
  },

  async updateInvestment(id: string, data: Partial<Investment>): Promise<{ investment: Investment }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ investment: Investment }>(`/api/investments/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.updateInvestment(id, data);
  },

  async deleteInvestment(id: string): Promise<{ success: boolean }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ success: boolean }>(`/api/investments/${id}`, {
          method: 'DELETE',
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.deleteInvestment(id);
  },

  // Settings
  async getSettings(): Promise<{ settings: UserSettings }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ settings: UserSettings }>('/api/settings');
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.getSettings();
  },

  async updateSettings(data: Partial<UserSettings>): Promise<{ settings: UserSettings }> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<{ settings: UserSettings }>('/api/settings', {
          method: 'PUT',
          body: JSON.stringify(data),
        });
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.updateSettings(data);
  },

  // Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const hasServer = await checkServer();
    if (hasServer) {
      try {
        return await request<DashboardStats>('/api/stats/dashboard');
      } catch (err) {
        isServerAvailable = false;
      }
    }
    return localDb.getDashboardStats();
  },
};
