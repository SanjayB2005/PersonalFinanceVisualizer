import React, { useState, useMemo, useEffect } from "react";

function SecurityCard({ income = 0, transactions = [] }) {
  const [timeframe, setTimeframe] = useState("weekly"); // "daily", "weekly", "monthly"
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Calculate current period income and previous period income for comparison
  const periodData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return { 
        currentAmount: income, 
        previousAmount: 0, 
        percentageChange: 0,
        savingsAmount: 0,
        savingsPercentage: 0 
      };
    }

    const now = new Date();
    let currentPeriodStart, previousPeriodStart;

    // Set date ranges based on selected timeframe
    if (timeframe === "daily") {
      // Today vs Yesterday
      currentPeriodStart = new Date(now);
      currentPeriodStart.setHours(0, 0, 0, 0);
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
    } else if (timeframe === "weekly") {
      // This week vs Last week
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - dayOfWeek);
      currentPeriodStart.setHours(0, 0, 0, 0);
      previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    } else if (timeframe === "monthly") {
      // This month vs Last month
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    }

    const previousPeriodEnd = new Date(currentPeriodStart);
    previousPeriodEnd.setMilliseconds(-1);
    
    // Filter transactions for current and previous periods
    const currentPeriodIncome = transactions
      .filter(t => 
        t.type === 'income' && 
        new Date(t.date) >= currentPeriodStart && 
        new Date(t.date) <= now
      )
      .reduce((sum, t) => sum + t.amount, 0);
      
    const previousPeriodIncome = transactions
      .filter(t => 
        t.type === 'income' && 
        new Date(t.date) >= previousPeriodStart && 
        new Date(t.date) <= previousPeriodEnd
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate expense for the current period
    const currentPeriodExpense = transactions
      .filter(t => 
        t.type === 'expense' && 
        new Date(t.date) >= currentPeriodStart && 
        new Date(t.date) <= now
      )
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Calculate savings (income - expense)
    const savingsAmount = currentPeriodIncome - currentPeriodExpense;
    
    // Calculate savings percentage (if income > 0)
    const savingsPercentage = currentPeriodIncome > 0 
      ? (savingsAmount / currentPeriodIncome) * 100 
      : 0;
      
    // Calculate percentage change
    const percentageChange = previousPeriodIncome > 0 
      ? ((currentPeriodIncome - previousPeriodIncome) / previousPeriodIncome) * 100 
      : (currentPeriodIncome > 0 ? 100 : 0);
    
    return {
      currentAmount: currentPeriodIncome,
      previousAmount: previousPeriodIncome,
      percentageChange,
      savingsAmount,
      savingsPercentage
    };
  }, [transactions, timeframe, income]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.timeframe-dropdown-toggle') && !e.target.closest('.timeframe-dropdown-menu')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Get timeframe label
  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      default: return timeframe;
    }
  };
  
  // Get comparison label
  const getComparisonLabel = () => {
    switch (timeframe) {
      case 'daily': return 'yesterday';
      case 'weekly': return 'last week';
      case 'monthly': return 'last month';
      default: return 'previous period';
    }
  };
  
  // Toggle dropdown
  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };
  
  // Change timeframe handler
  const changeTimeframe = (newTimeframe) => {
    setTimeframe(newTimeframe);
    setShowDropdown(false);
  };

  return (
    <article className="p-4 md:p-6 rounded-2xl bg-slate-800 relative">
      <header className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="text-sm text-white flex items-center">
          <span className="mr-2">Income Security</span>
          <i className="ti ti-shield-check text-indigo-500"></i>
        </h3>
        <div className="relative">
          <button 
            onClick={toggleDropdown}
            className="flex items-center gap-1 text-white hover:text-indigo-300 transition-colors timeframe-dropdown-toggle"
          >
            <span>{getTimeframeLabel()}</span>
            <i className={`ti ti-chevron-${showDropdown ? 'up' : 'down'}`}></i>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-36 bg-slate-700 rounded-lg shadow-lg z-10 timeframe-dropdown-menu">
              <button 
                onClick={() => changeTimeframe("daily")}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 rounded-t-lg ${timeframe === "daily" ? "text-indigo-300" : "text-white"}`}
              >
                Today
              </button>
              <button 
                onClick={() => changeTimeframe("weekly")}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 ${timeframe === "weekly" ? "text-indigo-300" : "text-white"}`}
              >
                This Week
              </button>
              <button 
                onClick={() => changeTimeframe("monthly")}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 rounded-b-lg ${timeframe === "monthly" ? "text-indigo-300" : "text-white"}`}
              >
                This Month
              </button>
            </div>
          )}
        </div>
      </header>
      
      <div className={`mb-1 text-xs ${periodData.percentageChange >= 0 ? "text-green-500" : "text-red-500"}`}>
        {periodData.percentageChange >= 0 ? "+" : ""}
        {periodData.percentageChange.toFixed(1)}% from {getComparisonLabel()}
      </div>
      
      <p className="mb-4 text-xl md:text-2xl font-semibold text-white">
        {formatCurrency(periodData.currentAmount)}
      </p>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm flex-wrap gap-1">
          <span className="text-slate-400">Income Rate</span>
          <span className="text-white font-medium">
            {formatCurrency(periodData.currentAmount)} / {timeframe === "daily" ? "day" : timeframe === "weekly" ? "week" : "month"}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm flex-wrap gap-1">
          <span className="text-slate-400">Savings</span>
          <div className="flex items-center">
            <span className={`text-sm font-medium ${periodData.savingsAmount >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatCurrency(periodData.savingsAmount)}
            </span>
            <span className={`text-xs ml-1 ${periodData.savingsPercentage >= 0 ? "text-green-500" : "text-red-500"}`}>
              ({periodData.savingsPercentage.toFixed(0)}%)
            </span>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${periodData.savingsPercentage > 15 ? "bg-green-500" : periodData.savingsPercentage > 0 ? "bg-yellow-500" : "bg-red-500"}`}></div>
            <span className="text-xs text-slate-400">
              {periodData.savingsPercentage > 15 ? "Healthy savings rate" : 
              periodData.savingsPercentage > 0 ? "Moderate savings" : "Low/negative savings"}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default SecurityCard;