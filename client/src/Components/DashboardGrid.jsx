import React, { useMemo } from "react";
import BalanceCard from "./BalanceCard";
import SpendingCard from "./SpendingCard";
import SecurityCard from "./SecurityCard";

function DashboardGrid({ transactions = [], onBalanceUpdate }) {
  // Calculate totals based on actual transaction data
  const financialData = useMemo(() => {
    // Calculate total balance (income - expenses)
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const balance = totalIncome - totalExpenses;
    
    return {
      balance,
      totalIncome,
      totalExpenses
    };
  }, [transactions]);
  
  return (
    <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-3">
      <BalanceCard 
        balance={financialData.balance} 
        onBalanceUpdate={onBalanceUpdate}
      />
      <SpendingCard 
        transactions={transactions} 
        spent={financialData.totalExpenses} 
      />
      <SecurityCard 
        income={financialData.totalIncome}
        transactions={transactions}
        className="sm:col-span-2 lg:col-span-1"
      />
    </div>
  );
}

export default DashboardGrid;