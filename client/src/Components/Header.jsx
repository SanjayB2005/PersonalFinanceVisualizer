import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

function Header({ onSearchResultSelect }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  // Handle search input changes
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.length >= 2) {
      setIsSearching(true);
      performSearch(query);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  // Search through transactions and savings plans
  const performSearch = async (query) => {
    try {
      // Convert query to lowercase for case-insensitive comparison
      const lowerQuery = query.toLowerCase();
      
      // Fetch transactions and savings plans
      const [transactionsRes, savingsRes] = await Promise.all([
        axios.get("https://personalfinancevisualizer.onrender.com/api/transactions"),
        axios.get("https://personalfinancevisualizer.onrender.com/api/savings-plans")
      ]);

      // Filter transactions that match the query
      const matchingTransactions = transactionsRes.data.filter(transaction => 
        transaction.description.toLowerCase().includes(lowerQuery) ||
        transaction.category.toLowerCase().includes(lowerQuery) ||
        transaction.amount.toString().includes(lowerQuery)
      ).slice(0, 5).map(transaction => ({
        ...transaction,
        type: 'transaction',
        displayText: `${transaction.description} (₹${transaction.amount})`,
        icon: 'ti ti-receipt'
      }));

      // Filter savings plans that match the query
      const matchingSavings = savingsRes.data.filter(plan => 
        plan.name.toLowerCase().includes(lowerQuery) ||
        plan.category.toLowerCase().includes(lowerQuery) ||
        plan.targetAmount.toString().includes(lowerQuery)
      ).slice(0, 3).map(plan => ({
        ...plan,
        type: 'savings',
        displayText: `${plan.name} (₹${plan.currentAmount}/₹${plan.targetAmount})`,
        icon: plan.icon
      }));

      // Combine results
      const combinedResults = [...matchingTransactions, ...matchingSavings];
      
      setSearchResults(combinedResults);
      setShowResults(combinedResults.length > 0);
      setIsSearching(false);
    } catch (error) {
      console.error("Error searching:", error);
      setIsSearching(false);
    }
  };

  // Handle click on search result
  const handleResultClick = (result) => {
    // Instead of navigating, we'll pass the result to the parent component
    if (onSearchResultSelect) {
      onSearchResultSelect(result);
    }
    
    // Clear search
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  // Handle clicks outside search results to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Add debouncing for search performance
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performSearch(searchQuery);
      }
    }, 300); // 300ms delay

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  return (
    <header className="flex justify-between items-center mb-6 sm:mb-10">
      <div className="flex gap-2 items-center text-lg sm:text-xl font-semibold text-white">
        <i className="ti ti-chart-pie" />
        <a href="/"><span>FinViz.io</span></a>
      </div>

      {/* Mobile Menu Button */}
      <div className="sm:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white p-1"
          ref={menuRef}
        >
          <i className={`ti ${isMenuOpen ? 'ti-x' : 'ti-menu-2'}`} />
        </button>
      </div>

      {/* Desktop Menu */}
      <div className="hidden sm:flex gap-6 items-center">
        <div ref={searchRef} className="relative">
          <div className="flex gap-2 items-center px-4 py-2 rounded-lg bg-white bg-opacity-10">
            <i className="ti ti-search" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search transactions, goals..."
              className="text-sm text-white border-[none] w-[200px] bg-transparent outline-none"
            />
            {isSearching && (
              <div className="animate-spin h-4 w-4">
                <i className="ti ti-loader text-slate-300 text-xs"></i>
              </div>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
              <div className="p-2">
                <div className="text-xs text-slate-400 px-3 py-1">
                  {searchResults.length} results found
                </div>
                
                {searchResults.length > 0 && (
                  <div className="max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result._id}`}
                        onClick={() => handleResultClick(result)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-700 rounded-md flex items-center gap-3 transition-colors"
                      >
                        <div className={`flex-shrink-0 h-8 w-8 ${result.type === 'savings' ? result.iconBg : 'bg-indigo-600'} rounded-full flex items-center justify-center`}>
                          <i className={`${result.icon} text-white text-xs`}></i>
                        </div>
                        <div>
                          <div className="text-white text-sm">{result.displayText}</div>
                          <div className="text-slate-400 text-xs">
                            {result.type === 'transaction' ? 
                              `${result.category} · ${new Date(result.date).toLocaleDateString()}` : 
                              `${result.category} · ${Math.round((result.currentAmount/result.targetAmount)*100)}% complete`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <button
          className="text-white cursor-pointer"
          aria-label="Notifications"
        >
          <i className="ti ti-bell" />
        </button>
        <div
          className="w-8 h-8 bg-blue-500 rounded-full"
          aria-label="Profile picture"
        />
      </div>
      
      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-16 right-3 left-3 bg-slate-800 rounded-lg shadow-lg z-50 sm:hidden">
          <div className="p-4">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white bg-opacity-10 mb-4">
              <i className="ti ti-search" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search transactions, goals..."
                className="text-sm text-white border-[none] w-full bg-transparent outline-none"
              />
              {isSearching && (
                <div className="animate-spin h-4 w-4">
                  <i className="ti ti-loader text-slate-300 text-xs"></i>
                </div>
              )}
            </div>
            
            {/* Search Results in Mobile Menu */}
            {showResults && (
              <div className="mb-4">
                <div className="text-xs text-slate-400 px-1 py-1">
                  {searchResults.length} results found
                </div>
                
                {searchResults.length > 0 && (
                  <div className="max-h-60 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result._id}`}
                        onClick={() => {
                          handleResultClick(result);
                          setIsMenuOpen(false);
                        }}
                        className="w-full text-left px-2 py-2 hover:bg-slate-700 rounded-md flex items-center gap-3 transition-colors"
                      >
                        <div className={`flex-shrink-0 h-8 w-8 ${result.type === 'savings' ? result.iconBg : 'bg-indigo-600'} rounded-full flex items-center justify-center`}>
                          <i className={`${result.icon} text-white text-xs`}></i>
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-white text-sm truncate">{result.displayText}</div>
                          <div className="text-slate-400 text-xs">
                            {result.type === 'transaction' ? 
                              `${result.category} · ${new Date(result.date).toLocaleDateString()}` : 
                              `${result.category} · ${Math.round((result.currentAmount/result.targetAmount)*100)}% complete`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
              <button
                className="text-white flex items-center gap-2 p-2"
                aria-label="Notifications"
              >
                <i className="ti ti-bell" />
                <span>Notifications</span>
              </button>
              <div
                className="w-8 h-8 bg-blue-500 rounded-full"
                aria-label="Profile picture"
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;