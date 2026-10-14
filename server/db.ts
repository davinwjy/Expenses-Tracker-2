import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'wealthtrack.json');

export type AccountType = 'bank' | 'cash' | 'ewallet';
export type InvestmentCategory = 'USD' | 'Bitcoin' | 'Saham' | 'RDPU' | 'ETF USA';
export type Currency = 'IDR' | 'USD';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role?: 'admin' | 'user';
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number; // in IDR
  accountNumber?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'expense' | 'income' | 'transfer' | 'bank_to_investment';
  amount: number; // in IDR
  accountId: string; // source account
  toAccountId?: string; // for transfer
  toInvestmentId?: string; // for bank_to_investment
  amountUsd?: number; // for USD investments
  exchangeRate?: number;
  category: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  category: InvestmentCategory;
  currency: Currency;
  amountInvested: number; // Cost basis in asset currency (IDR for Saham/RDPU, USD for USD/Bitcoin/ETF USA)
  currentValue: number; // Current value in asset currency
  units?: number; // e.g. shares, lots, crypto amount
  platform?: string; // e.g. GoTrade, Bibit, Ajaib, Indodax, etc.
  notes?: string;
  updatedAt: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  usdIdrRate: number; // e.g. 15850
  autoUpdateRate?: boolean;
  rateLastUpdated?: string;
  rateSource?: string;
  privacyModeDefault: boolean;
  theme: 'dark' | 'light';
}

export interface SystemAnnouncement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  enabled: boolean;
  updatedAt: string;
}

export interface SystemSettings {
  announcement: SystemAnnouncement;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  adminEmails: string[];
  defaultUsdIdrRate: number;
}

export interface DatabaseSchema {
  users: User[];
  accounts: Account[];
  transactions: Transaction[];
  investments: Investment[];
  settings: UserSettings[];
  systemSettings?: SystemSettings;
}

// In-memory cache synced with JSON file
let dbData: DatabaseSchema = {
  users: [],
  accounts: [],
  transactions: [],
  investments: [],
  settings: [],
  systemSettings: {
    announcement: {
      id: 'ann_default',
      message: 'System running normally. All wealth tracking modules active.',
      type: 'info',
      enabled: false,
      updatedAt: new Date().toISOString(),
    },
    maintenanceMode: false,
    allowNewRegistrations: true,
    adminEmails: ['davinwijaya16@gmail.com', 'davinwijaya1996@gmail.com', 'davin@wealthtrack.app'],
    defaultUsdIdrRate: 15850,
  },
};

// Initialize data directory and file
export function initDB(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      dbData = JSON.parse(raw);
      if (!dbData.systemSettings) {
        dbData.systemSettings = {
          announcement: {
            id: 'ann_default',
            message: 'System running normally. All wealth tracking modules active.',
            type: 'info',
            enabled: false,
            updatedAt: new Date().toISOString(),
          },
          maintenanceMode: false,
          allowNewRegistrations: true,
          adminEmails: ['davinwijaya16@gmail.com', 'davinwijaya1996@gmail.com', 'davin@wealthtrack.app'],
          defaultUsdIdrRate: 15850,
        };
        persistDB();
      } else {
        // Ensure davinwijaya16@gmail.com is in adminEmails
        if (!dbData.systemSettings.adminEmails.includes('davinwijaya16@gmail.com')) {
          dbData.systemSettings.adminEmails.push('davinwijaya16@gmail.com');
          persistDB();
        }
      }
    } catch (e) {
      console.error('Error reading db file, re-initializing:', e);
      persistDB();
    }
  } else {
    persistDB();
  }
}

export function persistDB(): void {
  try {
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(dbData, null, 2), 'utf-8');
    fs.renameSync(tempFile, DATA_FILE);
  } catch (err) {
    console.error('Failed to write database file:', err);
  }
}

export const db = {
  get data() {
    return dbData;
  },
  save() {
    persistDB();
  },
};
