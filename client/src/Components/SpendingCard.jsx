import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

function SpendingCard({ transactions = [], spent = 0 }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState("weekly");
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const [spendingLimit, setSpendingLimit] = useState({
    limit: 10000, // Default limit
    period: "weekly"
  });
  const [newLimit, setNewLimit] = useState(spendingLimit.limit.toString());

  // Fetch spending limit from server
  useEffect(() => {
    const fetchSpendingLimit = async () => {
      try {
        const response = await axios.get(`https://personalfinancevisualizer.onrender.com/api/spending-limits/${period}`);
        if (response.data) {
          setSpendingLimit(response.data);
        }
      } catch (err) {
        console.error("Error fetching spending limit:", err);
      }
    };

    fetchSpendingLimit();

    // Close dropdown when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.period-dropdown-button') && !e.target.closest('.period-dropdown-menu')) {
        setPeriodDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [period]);

  // Calculate relevant spent amount based on the period
  const periodSpending = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return 0;
    }

    const now = new Date();
    let startDate;

    // Define start date based on period
    if (period === 'daily') {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      // Start of week (Sunday)
      startDate = new Date(now);
      const day = startDate.getDay(); // 0 = Sunday, 6 = Saturday
      startDate.setDate(startDate.getDate() - day);
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      // Start of month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Filter and sum transactions from the start date until now
    return transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= startDate)
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, period]);
  
  // Calculate percentage used
  const percentageUsed = Math.min(
    Math.round((periodSpending / spendingLimit.limit) * 100), 
    100
  );
  
  // Determine color based on percentage
  const getProgressColor = () => {
    if (percentageUsed < 50) return "bg-green-500";
    if (percentageUsed < 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleEditClick = () => {
    setNewLimit(spendingLimit.limit.toString());
    setIsEditing(true);
    setPeriodDropdownOpen(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    const limitValue = parseFloat(newLimit);
    if (isNaN(limitValue) || limitValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Update or create spending limit
      await axios.post("https://personalfinancevisualizer.onrender.com/api/spending-limits", {
        category: "Total", // This represents the total spending limit
        limit: limitValue,
        period: period
      });

      setSpendingLimit({
        ...spendingLimit,
        limit: limitValue
      });
      
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update spending limit");
      console.error("Error updating spending limit:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePeriodDropdown = () => {
    setPeriodDropdownOpen(!periodDropdownOpen);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setPeriodDropdownOpen(false);
  };

  // Get period-specific label
  const getPeriodLabel = () => {
    switch (period) {
      case 'daily':
        return "Today";
      case 'weekly':
        return "This Week";
      case 'monthly':
        return "This Month";
      default:
        return period;
    }
  };

  // Calculate amount remaining
  const amountRemaining = Math.max(0, spendingLimit.limit - periodSpending);

  return (
    <article className="p-4 md:p-6 rounded-2xl bg-slate-800 relative">
      <header className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <h3 className="text-sm text-white flex items-center">
          Spending limit
          <button 
            onClick={handleEditClick}
            className="ml-2 text-slate-400 hover:text-white transition-colors"
            aria-label="Edit spending limit"
          >
            <i className="ti ti-edit text-sm"></i>
          </button>
        </h3>
        <div className="text-white relative">
          <button 
            onClick={togglePeriodDropdown}
            className="flex items-center gap-1 cursor-pointer hover:text-indigo-300 transition-colors period-dropdown-button"
          >
            <span className="capitalize">{getPeriodLabel()}</span>
            <i className={`ti ti-chevron-${periodDropdownOpen ? 'up' : 'down'}`} />
          </button>
          
          {periodDropdownOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-slate-700 rounded-lg shadow-lg z-10 period-dropdown-menu">
              <button 
                onClick={() => handlePeriodChange("daily")}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 rounded-t-lg ${period === "daily" ? "text-indigo-300" : "text-white"}`}
              >
                Today
              </button>
              <button 
                onClick={() => handlePeriodChange("weekly")}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 ${period === "weekly" ? "text-indigo-300" : "text-white"}`}
              >
                This Week
              </button>
              <button 
                onClick={() => handlePeriodChange("monthly")}
                className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-600 rounded-b-lg ${period === "monthly" ? "text-indigo-300" : "text-white"}`}
              >
                This Month
              </button>
            </div>
          )}
        </div>
      </header>
      
      {!isEditing ? (
        <>
          <div className="mb-2">
            <p className="text-xl md:text-2xl font-semibold text-white">
              <span>₹{periodSpending.toFixed(2)}</span>
            </p>
            <p className="text-sm text-slate-500">
              used from ₹{spendingLimit.limit.toFixed(2)}
            </p>
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-700 rounded-full mb-2">
            <div 
              className={`h-full rounded-full ${getProgressColor()}`} 
              style={{ width: `${percentageUsed}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-xs mb-2">
            <div className="text-slate-400">
              <span className="font-medium text-white">₹{periodSpending.toFixed(2)}</span> used
            </div>
            <div className="text-slate-400">
              <span className="font-medium text-white">₹{amountRemaining.toFixed(2)}</span> remaining
            </div>
          </div>
          
          {percentageUsed >= 90 && (
            <div className="text-xs text-red-400">
              <i className="ti ti-alert-circle mr-1"></i>
              You're approaching your spending limit!
            </div>
          )}
        </>
      ) : (
        <div className="mb-4">
          {error && (
            <div className="mb-2 text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="relative">
            <span className="absolute left-3 top-3 text-lg text-slate-300">₹</span>
            <input 
              type="number" 
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="w-full pl-8 p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg"
              placeholder="Enter spending limit"
              autoFocus
            />
            <div className="text-xs text-slate-400 mt-1">
              This limit applies to your {period === "daily" ? "daily" : period === "weekly" ? "weekly" : "monthly"} spending only
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-3 py-2 border border-slate-600 text-white hover:bg-slate-700 rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default SpendingCard;