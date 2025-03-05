import React, { useState } from "react";
import axios from "axios";

const AddTransactionModal = ({ onClose, onTransactionAdded }) => {
  const [formData, setFormData] = useState({
    description: "",
    type: "expense",
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Format data according to backend model schema
      const transactionData = {
        description: formData.name || formData.description, // Use name as description if available
        amount: parseFloat(formData.amount),
        type: formData.type.toLowerCase(), // Backend expects lowercase
        category: formData.category,
        date: new Date(`${formData.date}T${formData.time || '00:00'}:00`),
      };

      // Send data to the backend
      const response = await axios.post('http://localhost:8000/api/transactions', transactionData);

      // Call the callback to notify parent component that a transaction was added
      if (onTransactionAdded) {
        onTransactionAdded(response.data);
      }

      // Close modal after successful submission
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add transaction");
      console.error("Error adding transaction:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md animate-fadeIn shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Add Transaction</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white"
            aria-label="Close modal"
          >
            <i className="ti ti-x text-xl"></i>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-white text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
              Transaction Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="e.g. Netflix Subscription"
              required
            />
          </div>
          
          {/* Transaction Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1">
              Transaction Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
          
          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-1">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">Select a category</option>
              <option value="Food">Food & Dining</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Bills">Bills & Utilities</option>
              <option value="Transportation">Transportation</option>
              <option value="Health">Health & Fitness</option>
              <option value="Travel">Travel</option>
              <option value="Subscription">Subscription</option>
              <option value="Investment">Investment</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-1">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
            />
          </div>
          
          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-slate-300 mb-1">
                Time
              </label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Add notes about this transaction..."
            ></textarea>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-slate-600 rounded-lg text-white hover:bg-slate-700 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Add Transaction'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTransactionModal;