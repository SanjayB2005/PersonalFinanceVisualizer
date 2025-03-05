import React, { useState } from "react";
import axios from "axios";

function BalanceCard({ balance = 0, onBalanceUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [newBalance, setNewBalance] = useState(balance.toFixed(2));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleEditClick = () => {
    setNewBalance(balance.toFixed(2));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    // Validate input
    const balanceValue = parseFloat(newBalance);
    if (isNaN(balanceValue)) {
      setError("Please enter a valid number");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Create a balance adjustment transaction directly
      // This is simpler than using a separate API endpoint
      await axios.post("https://personalfinancevisualizer.onrender.com/api/transactions", {
        description: "Balance Adjustment",
        amount: Math.abs(balanceValue - balance),
        type: balanceValue > balance ? "income" : "expense",
        category: "Adjustment",
        date: new Date(),
      });

      // Call parent component's update function
      if (onBalanceUpdate) {
        onBalanceUpdate();
      }
      
      setIsEditing(false);
    } catch (err) {
      setError("Failed to update balance");
      console.error("Error updating balance:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="p-6 rounded-2xl bg-slate-800 relative">
      <header className="flex justify-between items-center mb-4">
        <h3 className="text-sm text-white">Total Balance</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleEditClick}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Edit balance"
          >
            <i className="ti ti-edit text-sm"></i>
          </button>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-indigo-400">
            <rect x="3" y="5" width="18" height="14" rx="3" stroke="currentColor" strokeWidth="2" />
            <path d="M3 10H21" stroke="currentColor" strokeWidth="2" />
            <path d="M7 15H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      </header>
      
      {!isEditing ? (
        <p className="mb-4 text-2xl font-semibold text-white">
          ₹{balance.toFixed(2)}
        </p>
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
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full pl-8 p-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-lg"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm transition-colors"
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 px-3 py-1 border border-slate-600 text-white hover:bg-slate-700 rounded-md text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {!isEditing && (
        <div className="flex gap-2 items-center text-sm text-slate-500">
          <span>Last updated</span>
          <span className="text-xs text-green-500">{new Date().toLocaleDateString()}</span>
        </div>
      )}
    </article>
  );
}

export default BalanceCard;