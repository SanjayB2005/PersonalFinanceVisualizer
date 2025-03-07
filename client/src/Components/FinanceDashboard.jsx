import React, { useState, useEffect, useRef } from "react";
import Header from "./Header.jsx";
import DashboardGrid from "./DashboardGrid";
import SavingsSection from "./SavingsSection";
import ExpenseAnalysis from "./ExpenseAnalysis";
import TransactionsHistory from "./TransactionsHistory";
import AddTransactionModal from "./AddTransactionModal";
import axios from "axios";

function FinanceDashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force re-fetch
  
  // Add states for search result handling
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedSavingsPlan, setSelectedSavingsPlan] = useState(null);
  
  // Refs for scrolling to sections
  const savingsSectionRef = useRef(null);
  const transactionsHistoryRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get("https://personalfinancevisualizer.onrender.com/api/transactions");
      setTransactions(response.data);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {  //  "refreshKey" technique that triggers component re-renders and data
                      // refetching when transactions are modified
    fetchTransactions();
  }, [refreshKey]);

  const handleTransactionAdded = () => {
    // Refresh data after a transaction is added
    setRefreshKey(prevKey => prevKey + 1);
  };

  const handleBalanceUpdate = () => {
    // Simply refresh transactions to recalculate balance
    setRefreshKey(prevKey => prevKey + 1);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result) => {
    if (result.type === 'transaction') {
      // Select this transaction for highlighting
      setSelectedTransaction(result._id);
      
      // Scroll to transactions section
      if (transactionsHistoryRef.current) {
        transactionsHistoryRef.current.scrollIntoView({ behavior: 'smooth' });
        
        // Clear the selection after a delay (to allow highlighting animation)
        setTimeout(() => {
          setSelectedTransaction(null);
        }, 3000);
      }
    } else if (result.type === 'savings') {
      // Select this savings plan for highlighting
      setSelectedSavingsPlan(result._id);
      
      // Scroll to savings section
      if (savingsSectionRef.current) {
        savingsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        
        // Clear the selection after a delay
        setTimeout(() => {
          setSelectedSavingsPlan(null);
        }, 3000);
      }
    }
  };

  return (
    <>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        crossOrigin="anonymous"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
        rel="stylesheet"
      />
      
      <main className="p-3 sm:p-5 min-h-screen bg-slate-900">
        <Header onSearchResultSelect={handleSearchResultSelect} />

        <section className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl bg-opacity-10 bg-slate-900">
          <h1 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-semibold text-white">
            Welcome back, Sanjay !
          </h1>

          <div className="flex flex-wrap gap-4 mb-6">
            <button 
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors text-sm sm:text-base"
              onClick={openModal}
            >
              <i className="ti ti-plus"></i>
              Add Transaction
            </button>
          </div>

          <DashboardGrid 
            transactions={transactions} 
            onBalanceUpdate={handleBalanceUpdate} 
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
            <div ref={savingsSectionRef}>
              <SavingsSection 
                transactions={transactions} 
                onAddTransaction={handleTransactionAdded}
                highlightedPlanId={selectedSavingsPlan}
              />
            </div>

            <div>
              <ExpenseAnalysis transactions={transactions} />
              <div ref={transactionsHistoryRef}>
                <TransactionsHistory 
                  key={refreshKey} 
                  highlightedTransactionId={selectedTransaction}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <AddTransactionModal 
          onClose={closeModal} 
          onTransactionAdded={handleTransactionAdded} 
        />
      )}
    </>
  );
}

export default FinanceDashboard;