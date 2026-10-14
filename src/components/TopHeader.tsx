import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Eye,
  EyeOff,
  Flame,
  Plus,
  ChevronDown,
  Receipt,
  ArrowDownRight,
  TrendingUp,
  ArrowRightLeft,
  Building2,
  RefreshCw,
  LogOut,
  Sparkles,
  Shield,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatIdr } from '../lib/formatters';
import { isUserAdmin } from '../lib/admin';

interface TopHeaderProps {
  onOpenMobileMenu: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onOpenMobileMenu,
}) => {
  const { user, logout, isFirebase } = useAuth();
  const {
    activeTab,
    setActiveTab,
    isPrivacyMode,
    togglePrivacyMode,
    theme,
    toggleTheme,
    usdIdrRate,
    refreshData,
    isLoading,
    setIsAddExpenseOpen,
    setTransactionInitialType,
    setIsTransferOpen,
    setTransferInitialMode,
    setIsAddInvestmentOpen,
    setIsAddAccountOpen,
    setEditingTransaction,
    setEditingInvestment,
    setEditingAccount,
    setIsFirebaseSetupOpen,
  } = useFinance();

  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const newMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pageMeta: Record<string, { title: string; subtitle: string; tag: string }> = {
    dashboard: {
      title: 'Dashboard',
      subtitle: 'Net Worth & Wealth Overview',
      tag: 'Overview',
    },
    expenses: {
      title: 'Transactions',
      subtitle: 'Expense, Income & Transfer Logs',
      tag: 'Cash Flow',
    },
    accounts: {
      title: 'Accounts & Wallets',
      subtitle: 'Bank Accounts, Cash & E-Wallets',
      tag: 'Liquidity',
    },
    investments: {
      title: 'Portfolio & Assets',
      subtitle: 'Crypto, Stocks, RDPU & Precious Metals',
      tag: 'Investments',
    },
    stats: {
      title: 'Analytics & Reports',
      subtitle: 'Cash Flow Distribution & Asset Allocation',
      tag: 'Insights',
    },
    admin: {
      title: 'Admin Console',
      subtitle: 'Manage Users, davinwijaya16@gmail.com Access & System Settings',
      tag: 'Management',
    },
  };

  const currentMeta = pageMeta[activeTab] || pageMeta.dashboard;

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/60 h-16 flex items-center px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="flex items-center justify-between w-full">
        {/* Left: Mobile Menu Trigger + Dynamic Page Breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                {currentMeta.title}
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                {currentMeta.tag}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block truncate">
              {currentMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Action Suite: Currency Pill + Privacy + Cloud + Quick Action + Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* USD/IDR Currency Rate Indicator */}
          {usdIdrRate > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300">
              <span className="text-slate-500 dark:text-slate-400 font-sans font-medium text-[10px]">USD/IDR:</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatIdr(usdIdrRate)}</span>
            </div>
          )}

          {/* Privacy Shield Toggle */}
          <button
            onClick={togglePrivacyMode}
            title={isPrivacyMode ? 'Privacy Mode Active: Nominals hidden' : 'Hide nominals in public'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
              isPrivacyMode
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {isPrivacyMode ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span className="hidden sm:inline">Masked</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Privacy</span>
              </>
            )}
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ganti ke Light Mode' : 'Ganti ke Dark Mode'}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer shadow-sm"
            aria-label="Toggle dark and light mode"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline font-semibold">Dark</span>
              </>
            )}
          </button>

          {/* Firebase Cloud Sync Button */}
          <button
            onClick={() => setIsFirebaseSetupOpen(true)}
            title={isFirebase ? 'Firebase Real-Time Cloud: Connected' : 'Setup Real-Time Cloud Sync'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isFirebase
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-500/40'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${isFirebase ? 'text-amber-500 fill-amber-500/30' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isFirebase ? 'Cloud Active' : 'Firebase'}</span>
          </button>

          {/* Top Quick Action Dropdown */}
          <div className="relative" ref={newMenuRef}>
            <button
              onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
              <span className="hidden sm:inline">New</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isNewMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isNewMenuOpen && (
              <div className="absolute right-0 mt-2.5 w-64 bg-white dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-xl dark:shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Quick Action
                  </span>
                  <span className="text-[10px] text-slate-400">Shortcut</span>
                </div>

                <div className="p-1.5 space-y-1">
                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setEditingTransaction(null);
                      setTransactionInitialType('expense');
                      setIsAddExpenseOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-800 dark:text-white">Record Expense</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">Deduct from cash or bank</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setEditingTransaction(null);
                      setTransactionInitialType('income');
                      setIsAddExpenseOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">Record Income</div>
                      <div className="text-[10px] text-slate-400 truncate">Salary, selling items, bonus</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setTransferInitialMode('bank_to_investment');
                      setIsTransferOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">Bank to Investment</div>
                      <div className="text-[10px] text-slate-400 truncate">Top-up stocks, crypto, RDPU</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setTransferInitialMode('account_to_account');
                      setIsTransferOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">Account Transfer</div>
                      <div className="text-[10px] text-slate-400 truncate">Transfer between accounts</div>
                    </div>
                  </button>

                  <div className="border-t border-slate-800/80 my-1" />

                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setEditingInvestment(null);
                      setIsAddInvestmentOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">Add Investment Asset</div>
                      <div className="text-[10px] text-slate-400 truncate">Saham, Crypto, RDPU</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsNewMenuOpen(false);
                      setEditingAccount(null);
                      setIsAddAccountOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white">Add Bank / Account</div>
                      <div className="text-[10px] text-slate-400 truncate">BCA, Mandiri, Cash</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Popover */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-0.5 rounded-xl hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
            >
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-xs font-bold text-slate-200">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl dark:shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1">
                <div className="px-2.5 py-2 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name || 'Account'}</p>
                    {isUserAdmin(user) && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>

                {isUserAdmin(user) && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setActiveTab('admin');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-colors font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                      <span>Admin Console</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-mono">
                      Manage
                    </span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    setIsFirebaseSetupOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    <span className="font-semibold">Cloud Sync</span>
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                      isFirebase
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {isFirebase ? 'Active' : 'Setup'}
                  </span>
                </button>

                <button
                  onClick={() => refreshData()}
                  disabled={isLoading}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RefreshCw
                      className={`w-3.5 h-3.5 text-slate-500 dark:text-slate-400 ${
                        isLoading ? 'animate-spin text-emerald-500' : ''
                      }`}
                    />
                    <span>Sync Data</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Cloud</span>
                </button>

                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? (
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    )}
                    <span>Appearance</span>
                  </span>
                  <span className="text-[10px] text-slate-700 dark:text-slate-400 capitalize px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 font-mono">
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </span>
                </button>

                <div className="border-t border-slate-200 dark:border-slate-800 my-1" />

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer font-semibold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
