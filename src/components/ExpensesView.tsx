import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Filter,
  Search,
  Calendar,
  Trash2,
  Edit2,
  ArrowDownRight,
  TrendingUp,
  ArrowRightLeft,
  X,
  CreditCard,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import {
  formatIdr,
  formatUsd,
  formatMasked,
  formatDate,
  CATEGORY_COLORS,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from '../lib/formatters';
import { Transaction } from '../types';

export const ExpensesView: React.FC = () => {
  const {
    transactions,
    accounts,
    investments,
    isPrivacyMode,
    setIsAddExpenseOpen,
    setTransactionInitialType,
    setEditingTransaction,
    deleteTransaction,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Date, Month, Year filter states
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'this_month' | 'this_year' | 'custom'>('all');

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const MONTH_OPTIONS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  // Available years based on transactions + current year
  const availableYears = React.useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const yearSet = new Set<string>([currentYear]);
    transactions.forEach((tx) => {
      if (tx.date) {
        const parts = tx.date.split('-');
        if (parts[0] && parts[0].length === 4) {
          yearSet.add(parts[0]);
        }
      }
    });
    return Array.from(yearSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Available categories based on selected type filter
  const availableCategories = React.useMemo(() => {
    if (selectedTypeFilter === 'expense') {
      return [...EXPENSE_CATEGORIES];
    }
    if (selectedTypeFilter === 'income') {
      return [...INCOME_CATEGORIES];
    }
    const set = new Set<string>();
    EXPENSE_CATEGORIES.forEach((c) => set.add(c));
    INCOME_CATEGORIES.forEach((c) => set.add(c));
    transactions.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [selectedTypeFilter, transactions]);

  const applyPreset = (preset: 'all' | 'today' | 'this_month' | 'this_year') => {
    const today = getTodayStr();
    setDatePreset(preset);
    if (preset === 'all') {
      setSelectedYear('all');
      setSelectedMonth('all');
      setSelectedDate('');
    } else if (preset === 'today') {
      setSelectedDate(today);
      setSelectedYear(today.slice(0, 4));
      setSelectedMonth(today.slice(5, 7));
    } else if (preset === 'this_month') {
      setSelectedDate('');
      setSelectedYear(today.slice(0, 4));
      setSelectedMonth(today.slice(5, 7));
    } else if (preset === 'this_year') {
      setSelectedDate('');
      setSelectedYear(today.slice(0, 4));
      setSelectedMonth('all');
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedDate('');
    setDatePreset('custom');
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedDate('');
    setDatePreset('custom');
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    if (date) {
      const parts = date.split('-');
      if (parts[0]) setSelectedYear(parts[0]);
      if (parts[1]) setSelectedMonth(parts[1]);
      setDatePreset(date === getTodayStr() ? 'today' : 'custom');
    } else {
      setDatePreset('custom');
    }
  };

  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    selectedAccountFilter !== 'all' ||
    selectedTypeFilter !== 'all' ||
    selectedCategoryFilter !== 'all' ||
    selectedYear !== 'all' ||
    selectedMonth !== 'all' ||
    selectedDate !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedAccountFilter('all');
    setSelectedTypeFilter('all');
    setSelectedCategoryFilter('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDate('');
    setDatePreset('all');
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = tx.category.toLowerCase().includes(q);
      const matchNotes = tx.notes ? tx.notes.toLowerCase().includes(q) : false;
      if (!matchCat && !matchNotes) return false;
    }

    // Account filter
    if (selectedAccountFilter !== 'all') {
      if (tx.accountId !== selectedAccountFilter && tx.toAccountId !== selectedAccountFilter) {
        return false;
      }
    }

    // Type filter
    if (selectedTypeFilter !== 'all') {
      if (tx.type !== selectedTypeFilter) return false;
    }

    // Category filter
    if (selectedCategoryFilter !== 'all') {
      if (tx.category !== selectedCategoryFilter) return false;
    }

    // Date, Month, Year filter
    if (selectedDate) {
      if (tx.date !== selectedDate) return false;
    } else {
      if (selectedYear !== 'all') {
        const txYear = tx.date ? tx.date.split('-')[0] : '';
        if (txYear !== selectedYear) return false;
      }
      if (selectedMonth !== 'all') {
        const txMonth = tx.date ? tx.date.split('-')[1] : '';
        if (txMonth !== selectedMonth) return false;
      }
    }

    return true;
  });

  // Calculate totals for filtered list
  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      setDeletingId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header & Main CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Expenses & Transactions</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
              {filteredTransactions.length}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Track daily living expenses with Bank and Cash funding sources
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setTransactionInitialType('expense');
              setIsAddExpenseOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => {
              setEditingTransaction(null);
              setTransactionInitialType('income');
              setIsAddExpenseOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Income</span>
          </button>
        </div>
      </div>

      {/* Filter and Summary Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Search & Dropdown Primary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes or memo..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Accounts (Banks & Cash)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setSelectedCategoryFilter('all');
              }}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">All Transaction Types</option>
              <option value="expense">Expenses Only (-)</option>
              <option value="income">Incomes Only (+)</option>
              <option value="transfer">Bank ↔ Cash Transfers</option>
              <option value="bank_to_investment">Bank → Investments</option>
            </select>
          </div>

          <div>
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              <option value="all">
                {selectedTypeFilter === 'income'
                  ? 'All Income Categories'
                  : selectedTypeFilter === 'expense'
                  ? 'All Expense Categories'
                  : 'All Categories'}
              </option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date, Month & Year Filters */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Quick Period Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                Period:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  datePreset === 'all' && selectedYear === 'all' && selectedMonth === 'all' && !selectedDate
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => applyPreset('today')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  datePreset === 'today' || (selectedDate && selectedDate === getTodayStr())
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_month')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  datePreset === 'this_month'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                This Month
              </button>
              <button
                type="button"
                onClick={() => applyPreset('this_year')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer ${
                  datePreset === 'this_year'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
                }`}
              >
                This Year
              </button>
            </div>

            {/* Clear all filters shortcut if active */}
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 font-medium flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          {/* Granular Year, Month, and Exact Date Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Year Selector */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Filter by Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => handleYearChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all">All Years</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Filter by Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all">All Months</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label} ({m.value})
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Exact Date Picker */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Specific Date
                </label>
                {selectedDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate('');
                      setDatePreset('custom');
                    }}
                    className="text-[10px] text-rose-500 dark:text-rose-400 hover:text-rose-600 dark:hover:text-rose-300 cursor-pointer flex items-center gap-0.5"
                  >
                    <X className="w-2.5 h-2.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Filtered Summary Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Total Expenses:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400 font-mono text-sm">
                {formatMasked(totalFilteredExpense, 'IDR', isPrivacyMode)}
              </span>
            </div>

            {totalFilteredIncome > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400">Total Incomes:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                  {formatMasked(totalFilteredIncome, 'IDR', isPrivacyMode)}
                </span>
              </div>
            )}
          </div>

          {/* Active Period / Filter summary tag */}
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] flex-wrap">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filteredTransactions.length}</strong> of{' '}
              <strong className="text-slate-800 dark:text-slate-200">{transactions.length}</strong>
            </span>
            {(selectedYear !== 'all' || selectedMonth !== 'all' || selectedDate) && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                {selectedDate
                  ? formatDate(selectedDate)
                  : `${
                      selectedMonth !== 'all'
                        ? MONTH_OPTIONS.find((m) => m.value === selectedMonth)?.label + ' '
                        : ''
                    }${selectedYear !== 'all' ? selectedYear : ''}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <Receipt className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">No transactions found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Try adjusting your date, month, year, or search filters.
            </p>
            {isAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5 text-rose-500" />
                <span>Reset All Filters</span>
              </button>
            )}
          </div>
        ) : (
          filteredTransactions.map((tx) => {
            const sourceAcc = accounts.find((a) => a.id === tx.accountId);
            const destAcc = accounts.find((a) => a.id === tx.toAccountId);
            const targetInv = investments.find((i) => i.id === tx.toInvestmentId);
            const catColor = CATEGORY_COLORS[tx.category] || '#94a3b8';

            return (
              <div
                key={tx.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition-all gap-3"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'expense'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        : tx.type === 'income'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : tx.type === 'bank_to_investment'
                        ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {tx.type === 'expense' && <Receipt className="w-5 h-5" />}
                    {tx.type === 'income' && <ArrowDownRight className="w-5 h-5" />}
                    {tx.type === 'bank_to_investment' && <TrendingUp className="w-5 h-5" />}
                    {tx.type === 'transfer' && <ArrowRightLeft className="w-5 h-5" />}
                  </div>

                  {/* Details */}
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                        {tx.type === 'bank_to_investment'
                          ? `Funded ${targetInv?.name || 'Investment'}`
                          : tx.type === 'transfer'
                          ? `Moved to ${destAcc?.name || 'Cash'}`
                          : tx.category}
                      </span>
                      {(tx.type === 'expense' || tx.type === 'income') && tx.category && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-slate-950"
                          style={{ backgroundColor: catColor }}
                        >
                          {tx.category}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.2 rounded font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                        {tx.type.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {sourceAcc?.name || 'Account'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        {formatDate(tx.date)}
                      </span>
                      {tx.notes && (
                        <>
                          <span>•</span>
                          <span className="italic text-slate-600 dark:text-slate-300">"{tx.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pl-12 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 dark:border-slate-800/80">
                  <div className="text-left sm:text-right">
                    <span
                      className={`text-base sm:text-lg font-black font-mono ${
                        tx.type === 'expense'
                          ? 'text-rose-600 dark:text-rose-400'
                          : tx.type === 'income'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : tx.type === 'bank_to_investment'
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {tx.type === 'expense' ? '-' : tx.type === 'income' ? '+' : ''}
                      {formatMasked(tx.amount, 'IDR', isPrivacyMode)}
                    </span>
                    {tx.type === 'bank_to_investment' && tx.amountUsd && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                        +{formatUsd(tx.amountUsd)}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {tx.type === 'expense' && (
                      <button
                        onClick={() => {
                          setEditingTransaction(tx);
                          setIsAddExpenseOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {deletingId === tx.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-1.5 py-1 text-slate-500 dark:text-slate-400 text-[11px] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(tx.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
