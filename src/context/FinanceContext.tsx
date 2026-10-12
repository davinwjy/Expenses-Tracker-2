import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Account,
  Transaction,
  Investment,
  DashboardStats,
  UserSettings,
} from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { isFirebaseActive } from '../lib/firebase';
import { firestoreService } from '../lib/firestoreService';
import { computeStats } from '../lib/statsHelper';

interface FinanceContextType {
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
  stats: DashboardStats | null;
  settings: UserSettings | null;
  usdIdrRate: number;
  isLoading: boolean;
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
  activeTab: 'dashboard' | 'expenses' | 'accounts' | 'investments' | 'stats';
  setActiveTab: (tab: 'dashboard' | 'expenses' | 'accounts' | 'investments' | 'stats') => void;
  refreshData: () => Promise<void>;

  // Account Operations
  addAccount: (data: {
    name: string;
    type: 'bank' | 'cash' | 'ewallet';
    balance: number;
    accountNumber?: string;
    color?: string;
  }) => Promise<void>;
  updateAccount: (id: string, data: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;

  // Transaction Operations
  addTransaction: (data: {
    type: 'expense' | 'income';
    amount: number;
    accountId: string;
    category: string;
    date: string;
    notes?: string;
  }) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Transfer Operations
  transferFunds: (data: {
    type: 'account_to_account' | 'bank_to_investment';
    fromAccountId: string;
    toAccountId?: string;
    toInvestmentId?: string;
    amountIdr: number;
    exchangeRate?: number;
    date?: string;
    notes?: string;
  }) => Promise<void>;

  // Investment Operations
  addInvestment: (data: {
    name: string;
    category: 'USD' | 'Bitcoin' | 'Saham' | 'RDPU' | 'ETF USA';
    amountInvested: number;
    currentValue?: number;
    units?: number;
    platform?: string;
    notes?: string;
  }) => Promise<void>;
  updateInvestment: (id: string, data: Partial<Investment>) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;

  // Settings
  updateRate: (newRate: number) => Promise<void>;

  // Modal states
  isAddExpenseOpen: boolean;
  setIsAddExpenseOpen: (v: boolean) => void;
  isTransferOpen: boolean;
  setIsTransferOpen: (v: boolean) => void;
  transferInitialMode: 'account_to_account' | 'bank_to_investment';
  setTransferInitialMode: (mode: 'account_to_account' | 'bank_to_investment') => void;
  isAddAccountOpen: boolean;
  setIsAddAccountOpen: (v: boolean) => void;
  isAddInvestmentOpen: boolean;
  setIsAddInvestmentOpen: (v: boolean) => void;
  editingAccount: Account | null;
  setEditingAccount: (a: Account | null) => void;
  editingInvestment: Investment | null;
  setEditingInvestment: (i: Investment | null) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (t: Transaction | null) => void;
  isSyncModalOpen: boolean;
  setIsSyncModalOpen: (v: boolean) => void;
  isFirebaseSetupOpen: boolean;
  setIsFirebaseSetupOpen: (v: boolean) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isFirebase } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [usdIdrRate, setUsdIdrRate] = useState<number>(15850);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'expenses' | 'accounts' | 'investments' | 'stats'>('dashboard');

  // Privacy mode persistent in localStorage
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('wealthtrack_privacy_mode') === 'true';
  });

  // Modal states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferInitialMode, setTransferInitialMode] = useState<'account_to_account' | 'bank_to_investment'>('account_to_account');
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);

  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isFirebaseSetupOpen, setIsFirebaseSetupOpen] = useState(false);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem('wealthtrack_privacy_mode', String(next));
      return next;
    });
  };

  // 1. FIREBASE REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!isFirebase || !user) return;
    setIsLoading(true);

    const unsubscribe = firestoreService.subscribeToUserData(user.id, (data) => {
      setAccounts(data.accounts);
      setTransactions(data.transactions);
      setInvestments(data.investments);
      setSettings(data.settings);
      const rate = data.settings?.usdIdrRate || 15850;
      setUsdIdrRate(rate);

      const computed = computeStats(data.accounts, data.transactions, data.investments, rate);
      setStats(computed);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isFirebase, user]);

  // 2. STANDARD SERVER / LOCAL REFRESH (when not Firebase)
  const refreshData = useCallback(async () => {
    if (!isAuthenticated) return;
    if (isFirebase) return; // Handled by realtime onSnapshot

    setIsLoading(true);
    try {
      const [accRes, txRes, invRes, statsRes, setRes] = await Promise.all([
        api.getAccounts(),
        api.getTransactions(),
        api.getInvestments(),
        api.getDashboardStats(),
        api.getSettings(),
      ]);

      setAccounts(accRes.accounts);
      setTransactions(txRes.transactions);
      setInvestments(invRes.investments);
      setStats(statsRes);
      setSettings(setRes.settings);
      if (setRes.settings?.usdIdrRate) {
        setUsdIdrRate(setRes.settings.usdIdrRate);
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, isFirebase]);

  useEffect(() => {
    if (isAuthenticated && !isFirebase) {
      refreshData();
    } else if (!isAuthenticated) {
      setAccounts([]);
      setTransactions([]);
      setInvestments([]);
      setStats(null);
    }
  }, [isAuthenticated, isFirebase, refreshData]);

  // ---------------- OPERATIONS ----------------

  // Accounts
  const addAccount = async (data: {
    name: string;
    type: 'bank' | 'cash' | 'ewallet';
    balance: number;
    accountNumber?: string;
    color?: string;
  }) => {
    if (isFirebase && user) {
      const now = new Date().toISOString();
      const newAccount: Account = {
        id: 'acc_' + Date.now(),
        userId: user.id,
        name: data.name,
        type: data.type,
        balance: data.balance,
        accountNumber: data.accountNumber,
        color: data.color || '#3b82f6',
        createdAt: now,
        updatedAt: now,
      };
      await firestoreService.saveAccount(newAccount);
      return;
    }

    await api.createAccount(data);
    await refreshData();
  };

  const updateAccount = async (id: string, data: Partial<Account>) => {
    if (isFirebase && user) {
      const target = accounts.find((a) => a.id === id);
      if (target) {
        await firestoreService.saveAccount({
          ...target,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    await api.updateAccount(id, data);
    await refreshData();
  };

  const deleteAccount = async (id: string) => {
    if (isFirebase) {
      await firestoreService.deleteAccount(id);
      return;
    }

    await api.deleteAccount(id);
    await refreshData();
  };

  // Transactions
  const addTransaction = async (data: {
    type: 'expense' | 'income';
    amount: number;
    accountId: string;
    category: string;
    date: string;
    notes?: string;
  }) => {
    if (isFirebase && user) {
      const now = new Date().toISOString();
      const txId = 'tx_' + Date.now();
      const newTx: Transaction = {
        id: txId,
        userId: user.id,
        type: data.type,
        amount: data.amount,
        accountId: data.accountId,
        category: data.category,
        date: data.date,
        notes: data.notes,
        createdAt: now,
      };
      await firestoreService.saveTransaction(newTx);

      // Adjust account balance
      const targetAcc = accounts.find((a) => a.id === data.accountId);
      if (targetAcc) {
        const newBal =
          data.type === 'expense'
            ? targetAcc.balance - data.amount
            : targetAcc.balance + data.amount;
        await firestoreService.saveAccount({
          ...targetAcc,
          balance: newBal,
          updatedAt: now,
        });
      }
      return;
    }

    await api.createTransaction(data);
    await refreshData();
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (isFirebase && user) {
      const target = transactions.find((t) => t.id === id);
      if (target) {
        await firestoreService.saveTransaction({ ...target, ...data });
      }
      return;
    }

    await api.updateTransaction(id, data);
    await refreshData();
  };

  const deleteTransaction = async (id: string) => {
    if (isFirebase && user) {
      const target = transactions.find((t) => t.id === id);
      if (target) {
        // Reverse account balance change
        const targetAcc = accounts.find((a) => a.id === target.accountId);
        if (targetAcc) {
          const newBal =
            target.type === 'expense'
              ? targetAcc.balance + target.amount
              : targetAcc.balance - target.amount;
          await firestoreService.saveAccount({
            ...targetAcc,
            balance: newBal,
            updatedAt: new Date().toISOString(),
          });
        }
        await firestoreService.deleteTransaction(id);
      }
      return;
    }

    await api.deleteTransaction(id);
    await refreshData();
  };

  // Transfers
  const transferFunds = async (data: {
    type: 'account_to_account' | 'bank_to_investment';
    fromAccountId: string;
    toAccountId?: string;
    toInvestmentId?: string;
    amountIdr: number;
    exchangeRate?: number;
    date?: string;
    notes?: string;
  }) => {
    if (isFirebase && user) {
      const now = new Date().toISOString();
      const txId = 'tx_' + Date.now();

      if (data.type === 'account_to_account' && data.toAccountId) {
        const fromAcc = accounts.find((a) => a.id === data.fromAccountId);
        const toAcc = accounts.find((a) => a.id === data.toAccountId);
        if (fromAcc && toAcc) {
          await firestoreService.saveAccount({
            ...fromAcc,
            balance: fromAcc.balance - data.amountIdr,
            updatedAt: now,
          });
          await firestoreService.saveAccount({
            ...toAcc,
            balance: toAcc.balance + data.amountIdr,
            updatedAt: now,
          });
          const tx: Transaction = {
            id: txId,
            userId: user.id,
            type: 'transfer',
            amount: data.amountIdr,
            accountId: data.fromAccountId,
            toAccountId: data.toAccountId,
            category: `Transfer to ${toAcc.name}`,
            date: data.date || now.split('T')[0],
            notes: data.notes,
            createdAt: now,
          };
          await firestoreService.saveTransaction(tx);
        }
      } else if (data.type === 'bank_to_investment' && data.toInvestmentId) {
        const fromAcc = accounts.find((a) => a.id === data.fromAccountId);
        const toInv = investments.find((i) => i.id === data.toInvestmentId);
        if (fromAcc && toInv) {
          await firestoreService.saveAccount({
            ...fromAcc,
            balance: fromAcc.balance - data.amountIdr,
            updatedAt: now,
          });
          const rate = data.exchangeRate || usdIdrRate;
          let addedCost = data.amountIdr;
          let addedVal = data.amountIdr;
          if (toInv.currency === 'USD') {
            const addedUsd = data.amountIdr / rate;
            addedCost = addedUsd;
            addedVal = addedUsd;
          }
          await firestoreService.saveInvestment({
            ...toInv,
            amountInvested: toInv.amountInvested + addedCost,
            currentValue: toInv.currentValue + addedVal,
            updatedAt: now,
          });
          const tx: Transaction = {
            id: txId,
            userId: user.id,
            type: 'bank_to_investment',
            amount: data.amountIdr,
            accountId: data.fromAccountId,
            toInvestmentId: data.toInvestmentId,
            amountUsd: toInv.currency === 'USD' ? data.amountIdr / rate : undefined,
            exchangeRate: toInv.currency === 'USD' ? rate : undefined,
            category: `Funded ${toInv.name}`,
            date: data.date || now.split('T')[0],
            notes: data.notes,
            createdAt: now,
          };
          await firestoreService.saveTransaction(tx);
        }
      }
      return;
    }

    await api.executeTransfer(data);
    await refreshData();
  };

  // Investments
  const addInvestment = async (data: {
    name: string;
    category: 'USD' | 'Bitcoin' | 'Saham' | 'RDPU' | 'ETF USA';
    amountInvested: number;
    currentValue?: number;
    units?: number;
    platform?: string;
    notes?: string;
  }) => {
    if (isFirebase && user) {
      const now = new Date().toISOString();
      const newInv: Investment = {
        id: 'inv_' + Date.now(),
        userId: user.id,
        name: data.name,
        category: data.category,
        currency:
          data.category === 'USD' || data.category === 'Bitcoin' || data.category === 'ETF USA'
            ? 'USD'
            : 'IDR',
        amountInvested: data.amountInvested,
        currentValue: data.currentValue ?? data.amountInvested,
        units: data.units,
        platform: data.platform,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      };
      await firestoreService.saveInvestment(newInv);
      return;
    }

    await api.createInvestment(data);
    await refreshData();
  };

  const updateInvestment = async (id: string, data: Partial<Investment>) => {
    if (isFirebase && user) {
      const target = investments.find((i) => i.id === id);
      if (target) {
        await firestoreService.saveInvestment({
          ...target,
          ...data,
          updatedAt: new Date().toISOString(),
        });
      }
      return;
    }

    await api.updateInvestment(id, data);
    await refreshData();
  };

  const deleteInvestment = async (id: string) => {
    if (isFirebase) {
      await firestoreService.deleteInvestment(id);
      return;
    }

    await api.deleteInvestment(id);
    await refreshData();
  };

  const updateRate = async (newRate: number) => {
    setUsdIdrRate(newRate);
    if (isFirebase && user) {
      if (settings) {
        await firestoreService.saveSettings({ ...settings, usdIdrRate: newRate });
      }
      return;
    }

    await api.updateSettings({ usdIdrRate: newRate });
    await refreshData();
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        transactions,
        investments,
        stats,
        settings,
        usdIdrRate,
        isLoading,
        isPrivacyMode,
        togglePrivacyMode,
        activeTab,
        setActiveTab,
        refreshData,
        addAccount,
        updateAccount,
        deleteAccount,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        transferFunds,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        updateRate,

        // Modal states
        isAddExpenseOpen,
        setIsAddExpenseOpen,
        isTransferOpen,
        setIsTransferOpen,
        transferInitialMode,
        setTransferInitialMode,
        isAddAccountOpen,
        setIsAddAccountOpen,
        isAddInvestmentOpen,
        setIsAddInvestmentOpen,
        editingAccount,
        setEditingAccount,
        editingInvestment,
        setEditingInvestment,
        editingTransaction,
        setEditingTransaction,
        isSyncModalOpen,
        setIsSyncModalOpen,
        isFirebaseSetupOpen,
        setIsFirebaseSetupOpen,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
