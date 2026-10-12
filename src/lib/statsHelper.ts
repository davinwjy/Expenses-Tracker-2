import { Account, Transaction, Investment, DashboardStats } from '../types';

export function computeStats(
  accounts: Account[],
  transactions: Transaction[],
  investments: Investment[],
  rate: number
): DashboardStats {
  const totalLiquidCashIdr = accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  let totalInvestedCostIdr = 0;
  let totalInvestmentValueIdr = 0;
  let totalInvestmentValueUsd = 0;

  const categoryAllocations: Record<string, { idrValue: number; usdValue: number; count: number }> = {
    USD: { idrValue: 0, usdValue: 0, count: 0 },
    Bitcoin: { idrValue: 0, usdValue: 0, count: 0 },
    Saham: { idrValue: 0, usdValue: 0, count: 0 },
    RDPU: { idrValue: 0, usdValue: 0, count: 0 },
    'ETF USA': { idrValue: 0, usdValue: 0, count: 0 },
  };

  investments.forEach((inv) => {
    let costIdr = 0;
    let valIdr = 0;
    let valUsd = 0;

    if (inv.currency === 'USD') {
      costIdr = inv.amountInvested * rate;
      valIdr = inv.currentValue * rate;
      valUsd = inv.currentValue;
      totalInvestmentValueUsd += inv.currentValue;
    } else {
      costIdr = inv.amountInvested;
      valIdr = inv.currentValue;
      valUsd = rate > 0 ? inv.currentValue / rate : 0;
      totalInvestmentValueUsd += valUsd;
    }

    totalInvestedCostIdr += costIdr;
    totalInvestmentValueIdr += valIdr;

    if (categoryAllocations[inv.category]) {
      categoryAllocations[inv.category].idrValue += valIdr;
      categoryAllocations[inv.category].usdValue += valUsd;
      categoryAllocations[inv.category].count += 1;
    }
  });

  const totalNetWorthIdr = totalLiquidCashIdr + totalInvestmentValueIdr;

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTxs = transactions.filter((t) => t.date && t.date.startsWith(currentMonthPrefix));

  const monthlyExpenses = thisMonthTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyIncomes = thisMonthTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlyTransfersToInv = thisMonthTxs
    .filter((t) => t.type === 'bank_to_investment')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenseByCategory: Record<string, number> = {};
  thisMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat = t.category || 'Other';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
    });

  const expenseByAccount: Record<string, { name: string; amount: number; type: string }> = {};
  thisMonthTxs
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const acc = accounts.find((a) => a.id === t.accountId);
      const accName = acc ? acc.name : 'Unknown Account';
      const accType = acc ? acc.type : 'bank';
      if (!expenseByAccount[t.accountId]) {
        expenseByAccount[t.accountId] = { name: accName, amount: 0, type: accType };
      }
      expenseByAccount[t.accountId].amount += t.amount;
    });

  return {
    rate,
    totalNetWorthIdr,
    totalLiquidCashIdr,
    totalInvestmentValueIdr,
    totalInvestmentValueUsd,
    totalInvestedCostIdr,
    unrealizedPnlIdr: totalInvestmentValueIdr - totalInvestedCostIdr,
    unrealizedPnlPercentage:
      totalInvestedCostIdr > 0 ? ((totalInvestmentValueIdr - totalInvestedCostIdr) / totalInvestedCostIdr) * 100 : 0,
    monthlyExpenses,
    monthlyIncomes,
    monthlyTransfersToInv,
    categoryAllocations,
    expenseByCategory,
    expenseByAccount,
  };
}
