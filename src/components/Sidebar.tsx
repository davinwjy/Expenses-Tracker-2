import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  Receipt,
  WalletCards,
  TrendingUp,
  PieChart,
  Plus,
  ArrowRightLeft,
  ArrowDownRight,
  LogOut,
  User as UserIcon,
  RefreshCw,
  ChevronDown,
  Building2,
  Flame,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  X,
  Wallet,
  Sparkles,
  Shield,
  Coins,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatIdr, formatUsd, formatMasked } from '../lib/formatters';
import { isUserAdmin } from '../lib/admin';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { user, logout, isFirebase } = useAuth();
  const {
    activeTab,
    setActiveTab,
    accounts,
    transactions,
    investments,
    stats,
    usdIdrRate,
    isPrivacyMode,
    togglePrivacyMode,
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

  // Close menus on outside click
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

  const isAdmin = isUserAdmin(user);

  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      description: 'Wealth overview',
    },
    {
      id: 'expenses' as const,
      label: 'Transactions',
      icon: Receipt,
      badge: transactions.length > 0 ? transactions.length : null,
      description: 'Income & expenses',
    },
    {
      id: 'accounts' as const,
      label: 'Accounts',
      icon: WalletCards,
      badge: accounts.length > 0 ? accounts.length : null,
      description: 'Banks & wallets',
    },
    {
      id: 'investments' as const,
      label: 'Portfolio',
      icon: TrendingUp,
      badge: investments.length > 0 ? investments.length : null,
      description: 'Investment assets',
    },
    {
      id: 'stats' as const,
      label: 'Analytics',
      icon: PieChart,
      badge: null,
      description: 'Reports & trends',
    },
    ...(isAdmin
      ? [
          {
            id: 'admin' as const,
            label: 'Admin Panel',
            icon: Shield,
            badge: 'Admin',
            description: 'Site management',
          },
        ]
      : []),
  ];

  const netWorthIdr = stats?.totalNetWorthIdr || 0;
  const netWorthUsd = usdIdrRate > 0 ? netWorthIdr / usdIdrRate : 0;

  const handleSelectNav = (tabId: 'dashboard' | 'expenses' | 'accounts' | 'investments' | 'stats' | 'admin') => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0d121d] border-r border-slate-800/80 text-slate-200 select-none">
      {/* 1. BRAND HEADER */}
      <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
        <button
          onClick={() => handleSelectNav('dashboard')}
          className="flex items-center gap-3 text-left focus:outline-none cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Wallet className="w-4.5 h-4.5 text-slate-950 stroke-[2.5]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                  WealthTrack
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">Private Wealth OS</p>
            </div>
          )}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/70 transition-colors cursor-pointer"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. NET WORTH GLIMPSE CARD (Shown when expanded) */}
      {!isCollapsed && (
        <div className="px-4 py-3.5 border-b border-slate-800/70 bg-slate-900/40">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Total Net Worth</span>
              <button
                onClick={togglePrivacyMode}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                title={isPrivacyMode ? 'Show nominal' : 'Hide nominal'}
              >
                {isPrivacyMode ? (
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <div className="font-mono font-bold text-sm text-white truncate">
              {formatMasked(netWorthIdr, 'IDR', isPrivacyMode)}
            </div>
            {!isPrivacyMode && (
              <div className="text-[11px] font-mono text-slate-400 truncate">
                ≈ {formatUsd(netWorthUsd)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. PRIMARY ACTION: '+ NEW' BUTTON */}
      <div className="p-3 relative" ref={newMenuRef}>
        <button
          onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all cursor-pointer ${
            isCollapsed ? 'p-2.5' : ''
          }`}
          title="Create New Transaction / Asset"
        >
          <Plus className="w-4 h-4 stroke-[2.8]" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">Quick Action</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isNewMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>

        {/* Dropdown Popover */}
        {isNewMenuOpen && (
          <div
            className={`absolute z-50 mt-2 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
              isCollapsed ? 'left-16 top-0 w-64' : 'left-3 right-3 top-14'
            }`}
          >
            <div className="px-3.5 py-2 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Create & Record
              </span>
              <span className="text-[10px] text-slate-500">Fast action</span>
            </div>

            <div className="p-1.5 space-y-1">
              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  setEditingTransaction(null);
                  setTransactionInitialType('expense');
                  setIsAddExpenseOpen(true);
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                  <Receipt className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">Record Expense</div>
                  <div className="text-[10px] text-slate-400 truncate">Deduct from cash or bank</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  setEditingTransaction(null);
                  setTransactionInitialType('income');
                  setIsAddExpenseOpen(true);
                  onCloseMobile();
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
                  onCloseMobile();
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
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/15 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">Transfer Between Accounts</div>
                  <div className="text-[10px] text-slate-400 truncate">Bank to cash or e-wallet</div>
                </div>
              </button>

              <div className="border-t border-slate-800/80 my-1" />

              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  setEditingInvestment(null);
                  setIsAddInvestmentOpen(true);
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">Add Investment Asset</div>
                  <div className="text-[10px] text-slate-400 truncate">Create portfolio holding</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsNewMenuOpen(false);
                  setEditingAccount(null);
                  setIsAddAccountOpen(true);
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-slate-800 transition-colors group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white">Add Bank / Account</div>
                  <div className="text-[10px] text-slate-400 truncate">New bank or e-wallet</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN NAVIGATION LINKS */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 pb-1.5">
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Navigation
            </span>
          )}
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleSelectNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group cursor-pointer ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
              title={item.label}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              />

              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}

        {/* CLOUD & SHORTCUT SECTION */}
        <div className="pt-4 px-2">
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Integrations
            </span>
          )}
        </div>

        {/* Real-time Firebase Cloud button */}
        <button
          onClick={() => {
            setIsFirebaseSetupOpen(true);
            onCloseMobile();
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            isFirebase
              ? 'bg-amber-500/10 border border-amber-500/25 text-amber-300 hover:bg-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          } ${isCollapsed ? 'justify-center px-2' : ''}`}
          title={isFirebase ? 'Firebase Real-Time Cloud: Connected' : 'Setup Firebase Sync'}
        >
          <Flame
            className={`w-4 h-4 shrink-0 ${
              isFirebase ? 'text-amber-400 fill-amber-400/30' : 'text-slate-400'
            }`}
          />
          {!isCollapsed && (
            <div className="flex-1 text-left flex items-center justify-between">
              <span>Cloud Sync</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  isFirebase
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isFirebase ? 'Active' : 'Setup'}
              </span>
            </div>
          )}
        </button>

        {/* Refresh data button */}
        <button
          onClick={() => refreshData()}
          disabled={isLoading}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all cursor-pointer ${
            isCollapsed ? 'justify-center px-2' : ''
          }`}
          title="Refresh Data from Cloud"
        >
          <RefreshCw
            className={`w-4 h-4 shrink-0 ${isLoading ? 'animate-spin text-emerald-400' : ''}`}
          />
          {!isCollapsed && <span className="flex-1 text-left">Sync Now</span>}
        </button>
      </div>

      {/* 5. FOOTER: USER PROFILE */}
      <div className="p-3 border-t border-slate-800/70 bg-slate-900/30 relative" ref={userMenuRef}>
        <button
          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800/70 transition-all text-left cursor-pointer group ${
            isCollapsed ? 'justify-center p-1.5' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700/80 flex items-center justify-center text-xs font-extrabold text-slate-200 shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
          </div>

          {!isCollapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">{user?.name || 'Account'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </>
          )}
        </button>

        {/* User Popover Menu */}
        {isUserMenuOpen && (
          <div
            className={`absolute z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1.5 w-56 space-y-1 animate-in fade-in zoom-in-95 ${
              isCollapsed ? 'left-16 bottom-2' : 'left-3 right-3 bottom-16'
            }`}
          >
            <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px]">
              <p className="font-bold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setActiveTab('admin');
                  onCloseMobile();
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-emerald-300 hover:bg-emerald-500/10 rounded-lg cursor-pointer font-semibold"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Panel</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 px-1 rounded text-emerald-300">Manage</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                setIsFirebaseSetupOpen(true);
                onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-amber-300 hover:bg-amber-500/10 rounded-lg cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Cloud Settings</span>
              </span>
              <span className="text-[10px]">{isFirebase ? 'Active' : 'Setup'}</span>
            </button>

            <button
              onClick={() => {
                togglePrivacyMode();
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <span className="flex items-center gap-2">
                {isPrivacyMode ? (
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>Privacy Mode</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {isPrivacyMode ? 'Masked' : 'Visible'}
              </span>
            </button>

            <div className="border-t border-slate-800 my-1" />

            <button
              onClick={() => {
                setIsUserMenuOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer font-semibold"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        <div className="fixed inset-y-0 left-0 z-30 transition-all duration-300 ease-in-out" style={{ width: isCollapsed ? '4.5rem' : '16rem' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer (with backdrop) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
