import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, AlertCircle, ArrowDownRight, Receipt } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatIdr, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../lib/formatters';

export const AddExpenseModal: React.FC = () => {
  const {
    isAddExpenseOpen,
    setIsAddExpenseOpen,
    transactionInitialType,
    accounts,
    addTransaction,
    editingTransaction,
    setEditingTransaction,
    updateTransaction,
  } = useFinance();

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clean form every time modal opens or resets
  useEffect(() => {
    if (isAddExpenseOpen) {
      if (editingTransaction) {
        const txType = editingTransaction.type === 'income' ? 'income' : 'expense';
        setType(txType);
        setAmount(editingTransaction.amount.toString());
        setAccountId(editingTransaction.accountId);
        const fallbackCat = txType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0];
        setCategory(editingTransaction.category || fallbackCat);
        setDate(editingTransaction.date);
        setNotes(editingTransaction.notes || '');
      } else {
        const initType = transactionInitialType || 'expense';
        setType(initType);
        setAmount('');
        setAccountId(accounts.length > 0 ? accounts[0].id : '');
        setCategory(initType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
        setDate(new Date().toISOString().split('T')[0]);
        setNotes('');
      }
      setError('');
    }
  }, [isAddExpenseOpen, editingTransaction, accounts, transactionInitialType]);

  const resetForm = () => {
    const initType = transactionInitialType || 'expense';
    setType(initType);
    setAmount('');
    setAccountId(accounts.length > 0 ? accounts[0].id : '');
    setCategory(initType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]);
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setError('');
  };

  const handleTypeChange = (newType: 'expense' | 'income') => {
    if (newType === type) return;
    setType(newType);
    if (newType === 'income') {
      // Switch category if current category is not in income categories
      if (!(INCOME_CATEGORIES as readonly string[]).includes(category)) {
        setCategory(INCOME_CATEGORIES[0]);
      }
    } else {
      // Switch category if current category is not in expense categories
      if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
        setCategory(EXPENSE_CATEGORIES[0]);
      }
    }
  };

  const handleClose = () => {
    resetForm();
    setEditingTransaction(null);
    setIsAddExpenseOpen(false);
  };

  const handleQuickAdd = (inc: number) => {
    const current = Number(amount) || 0;
    setAmount((current + inc).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    if (!accountId) {
      setError('Please select a Bank or Cash account');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, {
          type,
          amount: parsedAmount,
          accountId,
          category,
          date,
          notes,
        });
      } else {
        await addTransaction({
          type,
          amount: parsedAmount,
          accountId,
          category,
          date,
          notes,
        });
      }

      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAddExpenseOpen) return null;

  // Active categories for select dropdown
  const activeCategories: readonly string[] = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const categoryOptions = activeCategories.includes(category)
    ? [...activeCategories]
    : [category, ...activeCategories];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog Card (Bottom sheet on mobile, centered modal on desktop) */}
      <div className="relative w-full max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] z-10 overflow-hidden animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:fade-in sm:zoom-in-95">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-slate-700/80" />
        </div>

        {/* Sticky Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 border-b border-slate-800 bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                type === 'expense'
                  ? 'bg-rose-500/20 text-rose-400'
                  : 'bg-emerald-500/20 text-emerald-400'
              }`}
            >
              {type === 'expense' ? (
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-tight">
                {editingTransaction
                  ? editingTransaction.type === 'income'
                    ? 'Edit Income Record'
                    : 'Edit Expense Record'
                  : type === 'expense'
                  ? 'Record Daily Expense'
                  : 'Record Income / Pemasukan'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                {type === 'expense'
                  ? 'Deducts from chosen Bank or Cash'
                  : 'Adds & credits to chosen Bank or Cash'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={resetForm}
              title="Reset fields"
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="expense-modal-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain"
        >
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Type Toggle */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Transaction Type
            </div>
            <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Expense (-)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ArrowDownRight className="w-3.5 h-3.5" />
                <span>Income (+)</span>
              </button>
            </div>
          </div>

          {/* Amount in IDR */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {type === 'expense' ? 'Expense Amount (IDR)' : 'Income Amount (IDR)'}{' '}
              <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="50,000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-11 pr-4 py-3 text-lg font-bold text-white placeholder-slate-600 focus:outline-none font-mono"
                required
                autoFocus
              />
            </div>

            {/* Live Formatted IDR Preview */}
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
              <div className="mt-1.5 flex items-center justify-between px-1 text-xs font-mono">
                <span className="text-slate-400 font-sans text-[11px]">Nominal terformat:</span>
                <span className="font-bold text-emerald-400">{formatIdr(Number(amount))}</span>
              </div>
            )}

            {/* Quick Increment Buttons */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10000, 50000, 100000, 250000, 500000, 1000000, 5000000].map((inc) => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleQuickAdd(inc)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-xs font-medium text-slate-300 border border-slate-700 hover:border-slate-600 transition-colors cursor-pointer font-mono"
                >
                  +{inc >= 1000000 ? `${inc / 1000000}M` : `${inc / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Source Account (Bank / Cash) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              {type === 'expense'
                ? 'Source Account (Deduct from)'
                : 'Deposit Account (Receive into)'}{' '}
              <span className="text-rose-400">*</span>
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none"
              required
            >
              {accounts.length === 0 && <option value="">No accounts found - add one first</option>}
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type.toUpperCase()}) — Balance: {formatIdr(acc.balance)}
                </option>
              ))}
            </select>
          </div>

          {/* Category - Specific to Expense or Income */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category <span className="text-rose-400">*</span>
              </label>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                  type === 'income'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                }`}
              >
                {type === 'income' ? 'Kategori Pemasukan' : 'Kategori Pengeluaran'}
              </span>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none font-medium"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              {type === 'income'
                ? 'Pilih kategori sumber penghasilan (Gaji, Bonus, Freelance, Dividen, dll.)'
                : 'Pilih pos alokasi pengeluaran bulanan (Makanan, Transport, Tagihan, dll.)'}
            </p>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  type === 'income'
                    ? 'e.g. Monthly salary from PT..., Q1 bonus'
                    : 'e.g. Lunch with team, Taxi ride...'
                }
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-slate-600 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Sticky Docked Footer (Always visible above keyboard & home bar) */}
        <div className="shrink-0 p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="expense-modal-form"
            disabled={isSubmitting}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 transition-all cursor-pointer shadow-lg ${
              type === 'expense'
                ? 'bg-rose-400 hover:bg-rose-300 shadow-rose-500/20'
                : 'bg-emerald-400 hover:bg-emerald-300 shadow-emerald-500/20'
            } disabled:opacity-50`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isSubmitting
                ? 'Saving...'
                : editingTransaction
                ? type === 'income'
                  ? 'Update Income'
                  : 'Update Expense'
                : type === 'income'
                ? 'Save Income'
                : 'Save Expense'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
