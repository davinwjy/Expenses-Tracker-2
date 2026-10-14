import React, { useState, useEffect } from 'react';
import {
  PieChart,
  TrendingUp,
  Receipt,
  SlidersHorizontal,
  Shield,
  Layers,
  Building,
  Landmark,
  Coins,
  Globe,
  Wallet,
  Check,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatIdr, formatUsd, formatMasked, CATEGORY_COLORS } from '../lib/formatters';

export const StatsView: React.FC = () => {
  const {
    stats,
    accounts,
    investments,
    isPrivacyMode,
    togglePrivacyMode,
    usdIdrRate,
    rateSource,
    rateLastUpdated,
    isRateAutoUpdate,
    setIsRateAutoUpdate,
    isRateFetching,
    fetchLatestRate,
    updateRate,
  } = useFinance();

  const [rateInput, setRateInput] = useState(usdIdrRate.toString());
  const [rateSaved, setRateSaved] = useState(false);
  const [fetchToast, setFetchToast] = useState<string | null>(null);
  const [categoryTab, setCategoryTab] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    setRateInput(usdIdrRate.toString());
  }, [usdIdrRate]);

  const handleUpdateRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(rateInput);
    if (!isNaN(val) && val > 0) {
      await updateRate(val, 'Manual Custom');
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
    }
  };

  const handleFetchNow = async () => {
    const res = await fetchLatestRate();
    if (res.success && res.rate) {
      setFetchToast(`Live Google rate: Rp ${Math.round(res.rate).toLocaleString('id-ID')}`);
      setTimeout(() => setFetchToast(null), 3500);
    } else {
      setFetchToast('Failed to fetch from Google');
      setTimeout(() => setFetchToast(null), 3500);
    }
  };

  const formatLastUpdated = (iso?: string | null) => {
    if (!iso) return 'Not synced yet';
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' (' + date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ')';
    } catch {
      return iso;
    }
  };

  const netWorth = stats?.totalNetWorthIdr || 0;
  const liquidCash = stats?.totalLiquidCashIdr || 0;
  const totalInvestment = stats?.totalInvestmentValueIdr || 0;
  const expenseByCategory = stats?.expenseByCategory || {};
  const incomeByCategory = stats?.incomeByCategory || {};
  const expenseByAccount = stats?.expenseByAccount || {};
  const monthlyExpenses = stats?.monthlyExpenses || 0;
  const monthlyIncomes = stats?.monthlyIncomes || 0;
  const categoryAllocations = stats?.categoryAllocations || {};

  // Asset allocation percentages
  const cashPercent = netWorth > 0 ? (liquidCash / netWorth) * 100 : 0;
  const sahamPercent = netWorth > 0 ? ((categoryAllocations['Saham']?.idrValue || 0) / netWorth) * 100 : 0;
  const rdpuPercent = netWorth > 0 ? ((categoryAllocations['RDPU']?.idrValue || 0) / netWorth) * 100 : 0;
  const btcPercent = netWorth > 0 ? ((categoryAllocations['Bitcoin']?.idrValue || 0) / netWorth) * 100 : 0;
  const etfPercent = netWorth > 0 ? ((categoryAllocations['ETF USA']?.idrValue || 0) / netWorth) * 100 : 0;
  const usdPercent = netWorth > 0 ? ((categoryAllocations['USD']?.idrValue || 0) / netWorth) * 100 : 0;

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <span>Financial Statistics & Analytics</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          In-depth asset allocation, spending patterns, and exchange rate configuration
        </p>
      </div>

      {/* ASSET ALLOCATION BREAKDOWN */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Comprehensive Asset Allocation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution of your total net worth across liquid and investment classes
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
            Total: {formatMasked(netWorth, 'IDR', isPrivacyMode)}
          </span>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex border border-slate-200 dark:border-slate-800">
          <div style={{ width: `${cashPercent}%` }} className="bg-sky-500 h-full transition-all" title={`Cash & Banks: ${cashPercent.toFixed(1)}%`} />
          <div style={{ width: `${sahamPercent}%` }} className="bg-blue-600 h-full transition-all" title={`Saham: ${sahamPercent.toFixed(1)}%`} />
          <div style={{ width: `${rdpuPercent}%` }} className="bg-teal-500 h-full transition-all" title={`RDPU: ${rdpuPercent.toFixed(1)}%`} />
          <div style={{ width: `${btcPercent}%` }} className="bg-amber-500 h-full transition-all" title={`Bitcoin: ${btcPercent.toFixed(1)}%`} />
          <div style={{ width: `${etfPercent}%` }} className="bg-purple-500 h-full transition-all" title={`ETF USA: ${etfPercent.toFixed(1)}%`} />
          <div style={{ width: `${usdPercent}%` }} className="bg-emerald-500 h-full transition-all" title={`USD Cash: ${usdPercent.toFixed(1)}%`} />
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-sky-600 dark:text-sky-400 font-semibold mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              <span>Cash & Banks</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {cashPercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {formatMasked(liquidCash, 'IDR', isPrivacyMode)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Saham (ID)</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {sahamPercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {formatMasked(categoryAllocations['Saham']?.idrValue || 0, 'IDR', isPrivacyMode)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-teal-600 dark:text-teal-400 font-semibold mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span>RDPU (Fund)</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {rdpuPercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {formatMasked(categoryAllocations['RDPU']?.idrValue || 0, 'IDR', isPrivacyMode)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Bitcoin (Crypto)</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {btcPercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {formatMasked(categoryAllocations['Bitcoin']?.idrValue || 0, 'IDR', isPrivacyMode)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <span>ETF USA</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {etfPercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {formatMasked(categoryAllocations['ETF USA']?.idrValue || 0, 'IDR', isPrivacyMode)}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>USD Cash</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-white font-mono">
              {usdPercent.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {formatMasked(categoryAllocations['USD']?.idrValue || 0, 'IDR', isPrivacyMode)}
            </p>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS: MONTHLY EXPENSE CATEGORIES & FUNDING SOURCE BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown (Toggleable between Expense & Income) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {categoryTab === 'expense' ? 'Expense Categories' : 'Income Categories'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {categoryTab === 'expense'
                  ? 'Current month spending distribution'
                  : 'Current month income source distribution'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Mini Tab Switcher */}
              <div className="flex p-0.5 bg-slate-100 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setCategoryTab('expense')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    categoryTab === 'expense'
                      ? 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Expenses
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('income')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    categoryTab === 'income'
                      ? 'bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Income
                </button>
              </div>

              <span
                className={`text-xs font-mono font-bold ${
                  categoryTab === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatMasked(
                  categoryTab === 'expense' ? monthlyExpenses : monthlyIncomes,
                  'IDR',
                  isPrivacyMode
                )}
              </span>
            </div>
          </div>

          {categoryTab === 'expense' ? (
            Object.keys(expenseByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No expenses recorded this month.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expenseByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const pct = monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0;
                    const color = CATEGORY_COLORS[category] || '#f97316';

                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-900 dark:text-white">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-mono">{pct.toFixed(1)}%</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {formatMasked(amount, 'IDR', isPrivacyMode)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
          ) : (
            Object.keys(incomeByCategory).length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No income recorded this month.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(incomeByCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([category, amount]) => {
                    const pct = monthlyIncomes > 0 ? (amount / monthlyIncomes) * 100 : 0;
                    const color = CATEGORY_COLORS[category] || '#10b981';

                    return (
                      <div key={category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-900 dark:text-white">{category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-mono">{pct.toFixed(1)}%</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                              {formatMasked(amount, 'IDR', isPrivacyMode)}
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )
          )}
        </div>

        {/* Funding Source Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Funding Source Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Which bank or cash is used most for expenses</p>
          </div>

          {Object.keys(expenseByAccount).length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">No expenses recorded this month.</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(expenseByAccount)
                .sort((a, b) => b[1].amount - a[1].amount)
                .map(([accId, item]) => {
                  const pct = monthlyExpenses > 0 ? (item.amount / monthlyExpenses) * 100 : 0;

                  return (
                    <div key={accId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-900 dark:text-white">
                          {item.name} <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">({item.type})</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400 font-mono">{pct.toFixed(1)}%</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {formatMasked(item.amount, 'IDR', isPrivacyMode)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* SYSTEM & EXCHANGE RATE SETTINGS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* USD / IDR Exchange Rate Setting */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>USD / IDR Exchange Rate Setting</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Used to calculate net worth and convert US ETF and USD holdings into IDR equivalents.
              </p>
            </div>

            {/* Live Source Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>{rateSource || 'Google Finance'}</span>
            </div>
          </div>

          {/* Rate Highlight Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Current Market Rate</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                    Rp {Math.round(usdIdrRate).toLocaleString('id-ID')}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">/ 1 USD</span>
                </div>
              </div>

              {/* One-click Refresh Button */}
              <button
                type="button"
                onClick={handleFetchNow}
                disabled={isRateFetching}
                className="self-start sm:self-center flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRateFetching ? 'animate-spin' : ''}`} />
                <span>{isRateFetching ? 'Fetching Google...' : 'Refresh from Google'}</span>
              </button>
            </div>

            {/* Status & Timestamp */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>Last updated: <strong className="text-slate-700 dark:text-slate-300">{formatLastUpdated(rateLastUpdated)}</strong></span>
              </div>
              {fetchToast && (
                <span className="text-emerald-600 dark:text-emerald-400 font-medium animate-in fade-in">
                  ✓ {fetchToast}
                </span>
              )}
            </div>
          </div>

          {/* Auto-Update Every 12 Hours Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/60 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Auto-update every 12 hours</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pulls live rates from Google in the background every 12 hours and keeps portfolio values synchronized.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsRateAutoUpdate(!isRateAutoUpdate)}
              role="switch"
              aria-checked={isRateAutoUpdate}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isRateAutoUpdate ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isRateAutoUpdate ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Manual Rate Override Form */}
          <div className="pt-1 border-t border-slate-200 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>Manual Custom Rate:</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Overrides live rate until next auto-sync</span>
            </div>
            <form onSubmit={handleUpdateRate} className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 dark:text-slate-400">1 USD = Rp</span>
                <input
                  type="number"
                  value={rateInput}
                  onChange={(e) => setRateInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-24 pr-3 py-2 text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition-all shrink-0"
              >
                {rateSaved ? <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 stroke-[2.5]" /> : null}
                <span>{rateSaved ? 'Saved!' : 'Set Custom'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Privacy & Safe Mode Toggle Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
            <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Public Privacy Shield</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Instantly hide net worth and nominal balances on screen when entering expenses in public cafes, trains, or offices.
          </p>

          <div className="pt-1">
            <button
              onClick={togglePrivacyMode}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isPrivacyMode
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{isPrivacyMode ? 'Privacy Shield Is ACTIVE (Nominals Masked)' : 'Enable Privacy Shield (Mask Balances)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
