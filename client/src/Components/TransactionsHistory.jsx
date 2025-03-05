import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function TransactionsHistory({ highlightedTransactionId }) {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [sortOption, setSortOption] = useState("dateDesc");
  const [filterDates, setFilterDates] = useState({
    startDate: "",
    endDate: ""
  });
  
  // Add responsive state to track current view
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  
  // Reference to the highlighted transaction for scrolling
  const highlightedTransactionRef = useRef(null);
  
  // Fetch all transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get("https://personalfinancevisualizer.onrender.com/api/transactions");
      setTransactions(response.data);
      
      // Apply any existing filters
      applyFiltersAndSort(response.data);
      
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  // Initial fetch
  useEffect(() => {
    fetchTransactions();
    
    // Close dropdown menus when clicking outside
    const handleClickOutside = (e) => {
      if (!e.target.closest('.filter-button') && !e.target.closest('.filter-dropdown')) {
        setIsFilterOpen(false);
      }
      if (!e.target.closest('.options-button') && !e.target.closest('.options-dropdown')) {
        setIsOptionsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Add resize listener to detect mobile/desktop view
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Scroll to highlighted transaction
  useEffect(() => {
    if (highlightedTransactionId && highlightedTransactionRef.current) {
      highlightedTransactionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [highlightedTransactionId, filteredTransactions]);
  
  // Apply filters and sorting
  const applyFiltersAndSort = (data = transactions) => {
    let filtered = [...data];
    
    // Filter by date range if set
    if (filterDates.startDate) {
      const startDate = new Date(filterDates.startDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }
    
    if (filterDates.endDate) {
      const endDate = new Date(filterDates.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => new Date(t.date) <= endDate);
    }
    
    // Sort based on selected option
    switch(sortOption) {
      case "dateDesc":
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        break;
      case "dateAsc":
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
        break;
      case "amountDesc":
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case "amountAsc":
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      default:
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    setFilteredTransactions(filtered);
  };
  
  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterDates(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterDates({
      startDate: "",
      endDate: ""
    });
    setSortOption("dateDesc");
    applyFiltersAndSort(transactions);
  };
  
  // Apply new filters
  useEffect(() => {
    applyFiltersAndSort();
  }, [sortOption, filterDates.startDate, filterDates.endDate]);
  
  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedTransactions([]);
    setIsOptionsOpen(false);
  };
  
  // Toggle selection of a transaction
  const toggleTransactionSelection = (id) => {
    if (selectedTransactions.includes(id)) {
      setSelectedTransactions(selectedTransactions.filter(tId => tId !== id));
    } else {
      setSelectedTransactions([...selectedTransactions, id]);
    }
  };
  
  // Delete selected transactions
  const deleteSelectedTransactions = async () => {
    if (!selectedTransactions.length) return;
    
    try {
      // Delete each selected transaction
      await Promise.all(
        selectedTransactions.map(id => 
          axios.delete(`https://personalfinancevisualizer.onrender.com/api/transactions/${id}`)
        )
      );
      
      // Update local state
      setTransactions(transactions.filter(t => !selectedTransactions.includes(t._id)));
      setFilteredTransactions(filteredTransactions.filter(t => !selectedTransactions.includes(t._id)));
      
      // Reset selection
      setSelectedTransactions([]);
      setSelectionMode(false);
    } catch (err) {
      console.error("Error deleting transactions:", err);
      setError("Failed to delete transactions. Please try again.");
    }
  };
  
  // Format date for display (e.g., "Jun 12, 2023")
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };
  
  // Format time for display (e.g., "14:30")
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Get icon based on category
  const getCategoryIcon = (category) => {
    const iconMap = {
      "Food": "ti ti-pizza",
      "Shopping": "ti ti-shopping-cart",
      "Entertainment": "ti ti-device-tv",
      "Bills": "ti ti-receipt",
      "Transportation": "ti ti-car",
      "Health": "ti ti-heartbeat",
      "Savings": "ti ti-piggy-bank",
      "Travel": "ti ti-plane",
      "Subscription": "ti ti-calendar-event",
      "Investment": "ti ti-chart-pie",
      "Income": "ti ti-wallet",
      "Other": "ti ti-circle"
    };
    
    return iconMap[category] || "ti ti-circle";
  };

  return (
    <section className="gap-4 p-4 rounded-2xl bg-slate-800">
      <header className="flex flex-wrap justify-between items-center mb-6 gap-2">
        <h2 className="text-sm text-white">
          Transactions History
          {selectionMode && selectedTransactions.length > 0 && (
            <span className="ml-2 text-indigo-400">
              ({selectedTransactions.length} selected)
            </span>
          )}
        </h2>
        <div className="flex gap-4 text-white">
          <button 
            onClick={fetchTransactions}
            aria-label="Refresh transactions"
            className="hover:text-indigo-400 transition-colors"
          >
            <i className="ti ti-refresh" />
          </button>
          <div className="relative">
            <button 
              onClick={() => {
                setIsFilterOpen(!isFilterOpen);
                setIsOptionsOpen(false);
              }}
              aria-label="Filter transactions"
              className={`filter-button hover:text-indigo-400 transition-colors ${isFilterOpen ? 'text-indigo-400' : ''}`}
            >
              <i className="ti ti-filter" />
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-slate-700 rounded-lg shadow-lg z-10 p-4 filter-dropdown">
                <h3 className="text-white text-sm font-medium mb-3">Filter Transactions</h3>
                
                <div className="mb-3">
                  <label className="block text-slate-300 text-xs mb-1">Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      name="startDate"
                      value={filterDates.startDate}
                      onChange={handleFilterChange}
                      className="bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs w-full"
                      placeholder="Start Date"
                    />
                    <input 
                      type="date" 
                      name="endDate"
                      value={filterDates.endDate}
                      onChange={handleFilterChange}
                      className="bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs w-full"
                      placeholder="End Date"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-slate-300 text-xs mb-1">Sort By</label>
                  <select 
                    value={sortOption} 
                    onChange={(e) => setSortOption(e.target.value)}
                    className="bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs w-full"
                  >
                    <option value="dateDesc">Date (Newest first)</option>
                    <option value="dateAsc">Date (Oldest first)</option>
                    <option value="amountDesc">Amount (High to Low)</option>
                    <option value="amountAsc">Amount (Low to High)</option>
                  </select>
                </div>
                
                <div className="flex justify-between">
                  <button 
                    onClick={resetFilters}
                    className="text-slate-300 text-xs hover:text-white"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="bg-indigo-600 text-white text-xs px-3 py-1 rounded hover:bg-indigo-700"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
          
          <div className="relative">
            <button 
              onClick={() => {
                setIsOptionsOpen(!isOptionsOpen);
                setIsFilterOpen(false);
              }}
              aria-label="More options"
              className={`options-button hover:text-indigo-400 transition-colors ${isOptionsOpen ? 'text-indigo-400' : ''}`}
            >
              <i className="ti ti-dots" />
            </button>
            
            {isOptionsOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-slate-700 rounded-lg shadow-lg z-10 options-dropdown">
                <button 
                  onClick={toggleSelectionMode}
                  className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600 rounded-t-lg"
                >
                  {selectionMode ? "Cancel Selection" : "Select Transactions"}
                </button>
                {selectionMode && selectedTransactions.length > 0 && (
                  <button 
                    onClick={deleteSelectedTransactions}
                    className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-600 rounded-b-lg"
                  >
                    Delete Selected
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {loading && (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-white text-center">
          {error} <button onClick={fetchTransactions} className="underline ml-2">Retry</button>
        </div>
      )}

      {!loading && !error && filteredTransactions.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <i className="ti ti-receipt text-4xl mb-2"></i>
          <p>No transactions found</p>
        </div>
      )}

      {selectionMode && selectedTransactions.length > 0 && (
        <div className="mb-4 p-3 bg-indigo-900 bg-opacity-30 rounded-lg flex flex-wrap justify-between items-center gap-2">
          <span className="text-white text-sm">
            {selectedTransactions.length} transaction(s) selected
          </span>
          <button 
            onClick={deleteSelectedTransactions}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
          >
            Delete Selected
          </button>
        </div>
      )}

      {!loading && !error && filteredTransactions.length > 0 && (
        <>
          {/* Desktop view (table layout) */}
          {!isMobileView && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {selectionMode && (
                      <th className="p-3 text-xs text-left text-slate-500 w-10">
                        <input 
                          type="checkbox" 
                          className="rounded bg-slate-700 border-slate-600 text-indigo-600"
                          checked={selectedTransactions.length === filteredTransactions.length}
                          onChange={() => {
                            if (selectedTransactions.length === filteredTransactions.length) {
                              setSelectedTransactions([]);
                            } else {
                              setSelectedTransactions(filteredTransactions.map(t => t._id));
                            }
                          }}
                        />
                      </th>
                    )}
                    <th className="p-3 text-xs text-left text-slate-500">Name</th>
                    <th className="p-3 text-xs text-left text-slate-500">Type</th>
                    <th className="p-3 text-xs text-left text-slate-500">Date</th>
                    <th className="p-3 text-xs text-left text-slate-500">Amount</th>
                    <th className="p-3 text-xs text-left text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr 
                      key={transaction._id}
                      ref={transaction._id === highlightedTransactionId ? highlightedTransactionRef : null}
                      className={`${
                        transaction._id === highlightedTransactionId ? 'bg-indigo-900 animate-pulse' : 
                        selectedTransactions.includes(transaction._id) ? 'bg-indigo-900 bg-opacity-20' : 
                        'hover:bg-slate-700'
                      } cursor-pointer transition-colors`}
                      onClick={() => selectionMode && toggleTransactionSelection(transaction._id)}
                    >
                      {selectionMode && (
                        <td className="p-3 text-sm">
                          <input 
                            type="checkbox" 
                            className="rounded bg-slate-700 border-slate-600 text-indigo-600"
                            checked={selectedTransactions.includes(transaction._id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleTransactionSelection(transaction._id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                      )}
                      <td className="p-3 text-sm text-white">
                        <div className="flex gap-2 items-center">
                          <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                            <i className={`${getCategoryIcon(transaction.category)} text-xs`} />
                          </div>
                          <span>{transaction.description}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-white capitalize">{transaction.type}</td>
                      <td className="p-3 text-sm text-white">
                        <span>{formatDate(transaction.date)}</span>
                        <div className="text-xs text-slate-500">{formatTime(transaction.date)}</div>
                      </td>
                      <td className={`p-3 text-sm ${transaction.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                        {transaction.type === 'income' ? '+' : ''} ₹{transaction.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-sm">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-900 bg-opacity-50 text-green-300">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile view (card layout) */}
          {isMobileView && (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction._id} 
                  ref={transaction._id === highlightedTransactionId ? highlightedTransactionRef : null}
                  className={`p-3 rounded-lg ${
                    transaction._id === highlightedTransactionId ? 'bg-indigo-900 animate-pulse' : 
                    selectedTransactions.includes(transaction._id) ? 'bg-indigo-900 bg-opacity-20' : 
                    'bg-slate-700'
                  }`}
                  onClick={() => selectionMode && toggleTransactionSelection(transaction._id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <input 
                          type="checkbox" 
                          className="rounded bg-slate-700 border-slate-600 text-indigo-600"
                          checked={selectedTransactions.includes(transaction._id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleTransactionSelection(transaction._id);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                      <div className="flex-shrink-0 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                        <i className={`${getCategoryIcon(transaction.category)} text-xs`} />
                      </div>
                      <span className="text-sm text-white font-medium truncate max-w-[150px]">
                        {transaction.description}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${transaction.type === 'income' ? 'text-green-500' : 'text-white'}`}>
                      {transaction.type === 'income' ? '+' : ''} ₹{transaction.amount.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Type: </span>
                      <span className="text-white capitalize">{transaction.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Date: </span>
                      <span className="text-white">{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-slate-400">{formatTime(transaction.date)}</span>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-900 bg-opacity-50 text-green-300">
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default TransactionsHistory;