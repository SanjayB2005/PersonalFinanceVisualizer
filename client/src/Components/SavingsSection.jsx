import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

function SavingsSection({ transactions = [], onAddTransaction }) {
  const [savingsPlans, setSavingsPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSavingPlan, setNewSavingPlan] = useState({
    name: "",
    target: "",
    icon: "ti ti-piggy-bank",
    iconBg: "bg-indigo-500",
    category: "Other"
  });
  const [addingMoney, setAddingMoney] = useState({
    isOpen: false,
    planId: null,
    amount: ""
  });
  // States for edit and delete functionality
  const [activePlanMenu, setActivePlanMenu] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Available icon options
  const categoryOptions = [
    { category: "Car", icon: "ti ti-car", bg: "bg-blue-500" },
    { category: "House", icon: "ti ti-home", bg: "bg-green-500" },
    { category: "Vacation", icon: "ti ti-plane", bg: "bg-yellow-500" },
    { category: "Education", icon: "ti ti-book", bg: "bg-red-500" },
    { category: "Electronics", icon: "ti ti-device-laptop", bg: "bg-purple-500" },
    { category: "Gift", icon: "ti ti-gift", bg: "bg-pink-500" },
    { category: "Health", icon: "ti ti-heart", bg: "bg-orange-500" },
    { category: "Other", icon: "ti ti-piggy-bank", bg: "bg-indigo-500" }
  ];

  // Fetch all savings plans
  useEffect(() => {
    const fetchSavingsPlans = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("https://personalfinancevisualizer.onrender.com/api/savings-plans");
        setSavingsPlans(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching savings plans:", err);
        setError("Failed to load savings plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSavingsPlans();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (activePlanMenu && !e.target.closest('.plan-menu-container')) {
        setActivePlanMenu(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [activePlanMenu]);

  // Calculate total savings from all plans
  const totalSavings = useMemo(() => {
    return savingsPlans.reduce((sum, plan) => sum + plan.currentAmount, 0);
  }, [savingsPlans]);

  // Calculate overall savings progress
  const overallTarget = useMemo(() => {
    return savingsPlans.reduce((sum, plan) => sum + plan.targetAmount, 0);
  }, [savingsPlans]);

  const overallProgress = useMemo(() => {
    if (overallTarget === 0) return 0;
    return (totalSavings / overallTarget) * 100;
  }, [totalSavings, overallTarget]);

  // Toggle menu for a specific plan
  const togglePlanMenu = (planId, e) => {
    e.stopPropagation(); // Prevent event bubbling
    setActivePlanMenu(currentActive => currentActive === planId ? null : planId);
  };

  // Handle icon selection
  const handleIconSelect = (icon, bg) => {
    setNewSavingPlan({ ...newSavingPlan, icon, iconBg: bg });
  };

  // Handle edit icon selection
  const handleEditIconSelect = (icon, bg) => {
    setEditingPlan({ ...editingPlan, icon, iconBg: bg });
  };

  // Handle form change for new saving plan
  const handleNewPlanChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'target') {
      if (value === '' || (/^\d*\.?\d*$/.test(value))) {
        setNewSavingPlan({
          ...newSavingPlan,
          [name]: value
        });
      }
    } else if (name === 'category') {
      // Find the matching category option
      const selectedOption = categoryOptions.find(option => option.category === value);
      if (selectedOption) {
        // Set both the category and corresponding icon
        setNewSavingPlan({
          ...newSavingPlan,
          category: value,
          icon: selectedOption.icon,
          iconBg: selectedOption.bg
        });
      }
    } else {
      setNewSavingPlan({
        ...newSavingPlan,
        [name]: value
      });
    }
  };

  // Handle edit plan changes
  const handleEditPlanChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'target') {
      if (value === '' || (/^\d*\.?\d*$/.test(value))) {
        setEditingPlan({
          ...editingPlan,
          [name]: value
        });
      }
    } else if (name === 'category') {
      // Find the matching category option
      const selectedOption = categoryOptions.find(option => option.category === value);
      if (selectedOption) {
        // Set both the category and corresponding icon
        setEditingPlan({
          ...editingPlan,
          category: value,
          icon: selectedOption.icon,
          iconBg: selectedOption.bg
        });
      }
    } else {
      setEditingPlan({
        ...editingPlan,
        [name]: value
      });
    }
  };

  // Add new saving plan
  const handleAddPlan = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    
    // Basic validation
    if (!newSavingPlan.name.trim()) {
      setError("Please enter a name for your savings goal");
      return;
    }
    
    if (!newSavingPlan.target || parseFloat(newSavingPlan.target) <= 0) {
      setError("Please enter a valid target amount greater than zero");
      return;
    }
    
    try {
      // Parse the target as a number
      const targetAmount = parseFloat(newSavingPlan.target);
      
      const requestData = {
        name: newSavingPlan.name,
        targetAmount: targetAmount,
        currentAmount: 0,
        icon: newSavingPlan.icon,
        iconBg: newSavingPlan.iconBg
      };
      
      // Send request with properly formatted data
      const response = await fetch("https://personalfinancevisualizer.onrender.com/api/savings-plans", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Server error");
      }
      
      const data = await response.json();
      
      // Update UI state with the new plan
      setSavingsPlans([...savingsPlans, data]);
      
      // Reset form and close modal
      setNewSavingPlan({
        name: "",
        target: "",
        icon: "ti ti-piggy-bank",
        iconBg: "bg-indigo-500"
      });
      setShowAddModal(false);
    } catch (err) {
      console.error("Error adding saving plan:", err);
      setError("Failed to create savings plan. Please try again.");
    }
  };

  // Start editing a plan
  const handleStartEdit = (plan) => {
    // Find the category based on the icon
    const category = categoryOptions.find(opt => opt.icon === plan.icon)?.category || "Other";
    
    setEditingPlan({
      ...plan,
      target: plan.targetAmount.toString(),
      category: category
    });
    setActivePlanMenu(null);
};

  // Save edited plan
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    
    // Clear any previous errors
    setError(null);
    
    // Basic validation
    if (!editingPlan.name.trim()) {
      setError("Please enter a name for your savings goal");
      return;
    }
    
    if (!editingPlan.target || parseFloat(editingPlan.target) <= 0) {
      setError("Please enter a valid target amount greater than zero");
      return;
    }
    
    try {
      const targetAmount = parseFloat(editingPlan.target);
      
      const requestData = {
        name: editingPlan.name,
        targetAmount: targetAmount,
        currentAmount: editingPlan.currentAmount,
        icon: editingPlan.icon,
        iconBg: editingPlan.iconBg
      };
      
      // Send request to update
      const response = await fetch(`https://personalfinancevisualizer.onrender.com/api/savings-plans/${editingPlan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Server error");
      }
      
      const updatedPlan = await response.json();
      
      // Update UI state with the updated plan
      setSavingsPlans(savingsPlans.map(plan => 
        plan._id === editingPlan._id ? updatedPlan : plan
      ));
      
      // Close edit modal
      setEditingPlan(null);
    } catch (err) {
      console.error("Error updating saving plan:", err);
      setError("Failed to update savings plan. Please try again.");
    }
  };

  // Delete a plan
  const handleDelete = async () => {
    if (!confirmDelete) return;
    
    try {
      // Send delete request
      const response = await fetch(`https://personalfinancevisualizer.onrender.com/api/savings-plans/${confirmDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Server error");
      }
      
      // Remove from state
      setSavingsPlans(savingsPlans.filter(plan => plan._id !== confirmDelete));
      
      // Close confirm modal
      setConfirmDelete(null);
    } catch (err) {
      console.error("Error deleting saving plan:", err);
      setError("Failed to delete savings plan. Please try again.");
      setConfirmDelete(null);
    }
  };

  // Open add money modal
  const openAddMoneyModal = (planId) => {
    setAddingMoney({
      isOpen: true,
      planId,
      amount: ""
    });
  };

  // Handle add money to plan
  const handleAddMoney = async () => {
    const amount = parseFloat(addingMoney.amount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      // Find the plan
      const plan = savingsPlans.find(p => p._id === addingMoney.planId);
      if (!plan) return;

      // Update the plan with the new amount
      const updatedPlan = {
        ...plan,
        currentAmount: plan.currentAmount + amount
      };

      await axios.put(`https://personalfinancevisualizer.onrender.com/api/savings-plans/${plan._id}`, updatedPlan);

      // Add a transaction record
      await axios.post("https://personalfinancevisualizer.onrender.com/api/transactions", {
        description: `Savings: ${plan.name}`,
        amount,
        type: "expense", // It's an expense from your main balance
        category: "Savings",
        date: new Date()
      });

      // Update local state
      setSavingsPlans(savingsPlans.map(p => 
        p._id === plan._id ? updatedPlan : p
      ));

      // Call the onAddTransaction callback to update parent component
      if (onAddTransaction) {
        onAddTransaction();
      }

      // Close modal
      setAddingMoney({
        isOpen: false,
        planId: null,
        amount: ""
      });

    } catch (err) {
      console.error("Error adding money to saving plan:", err);
      setError("Failed to add money to saving plan");
    }
  };

  return (
    <section className="p-6 rounded-2xl bg-slate-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base text-white">Savings Plans</h2>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md text-sm transition-colors"
        >
          <i className="ti ti-plus"></i>
          Add Plan
        </button>
      </div>

      {/* Total Savings Card */}
      <div className="mb-6 p-4 bg-slate-700 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-white text-sm">Total Savings</h3>
          <span className="text-white font-semibold">₹{totalSavings.toLocaleString('en-IN')}</span>
        </div>
        <div className="w-full h-2 bg-slate-600 rounded-full mb-2">
          <div 
            className="h-full rounded-full bg-indigo-500" 
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span>{overallProgress.toFixed(0)}% of goal reached</span>
          <span>Target: ₹{overallTarget.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg text-white text-center">
          {error}
        </div>
      ) : savingsPlans.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <i className="ti ti-piggy-bank text-4xl mb-2"></i>
          <p>No savings plans yet</p>
          <p className="text-sm">Click "Add Plan" to create your first savings goal</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {savingsPlans.map((plan) => (
            <div key={plan._id} className="bg-slate-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-3">
                  <div className={`${plan.iconBg} h-10 w-10 rounded-full flex items-center justify-center`}>
                    <i className={`${plan.icon} text-white`}></i>
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{plan.name}</h3>
                    <p className="text-xs text-slate-400">
                      ₹{plan.currentAmount.toLocaleString('en-IN')} of ₹{plan.targetAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddMoneyModal(plan._id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1 rounded transition-colors"
                  >
                    Add Money
                  </button>
                  
                  {/* Three-dot menu */}
                  <div className="relative plan-menu-container">
                    <button 
                      onClick={(e) => togglePlanMenu(plan._id, e)}
                      className="p-1 rounded-full hover:bg-slate-600 text-white"
                    >
                      <i className="ti ti-dots-vertical"></i>
                    </button>
                    
                    {activePlanMenu === plan._id && (
                      <div className="absolute right-0 mt-1 w-32 bg-slate-800 rounded shadow-lg z-10">
                        <button
                          onClick={() => handleStartEdit(plan)}
                          className="w-full text-left px-3 py-2 text-sm text-white hover:bg-slate-700 flex items-center gap-2 rounded-t-lg"
                        >
                          <i className="ti ti-edit text-indigo-400 text-sm"></i>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setConfirmDelete(plan._id)}
                          className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2 rounded-b-lg"
                        >
                          <i className="ti ti-trash text-sm"></i>
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-600 rounded-full">
                <div 
                  className="h-full rounded-full bg-indigo-500" 
                  style={{ width: `${Math.min((plan.currentAmount / plan.targetAmount) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="mt-2 flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  {((plan.currentAmount / plan.targetAmount) * 100).toFixed(0)}% complete
                </span>
                <span className="text-slate-400">
                  ₹{(plan.targetAmount - plan.currentAmount).toLocaleString('en-IN')} remaining
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Savings Plan Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">Create New Savings Plan</h3>
            {error && (
              <div className="mb-4 p-2 bg-red-900 bg-opacity-30 border border-red-800 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleAddPlan}>
              <div className="mb-4">
                <label className="block text-slate-300 text-sm mb-1">Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={newSavingPlan.name}
                  onChange={handleNewPlanChange}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="e.g. New Car, Vacation, etc."
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-slate-300 text-sm mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  name="target"
                  value={newSavingPlan.target}
                  onChange={handleNewPlanChange}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="50000"
                  required
                  min="1"
                  step="any" // Allow decimals if needed
                />
              </div>
              
              <div className="mb-4">
                  <label className="block text-slate-300 text-sm mb-1">Category</label>
                  <select
                    name="category"
                    value={newSavingPlan.category}
                    onChange={handleNewPlanChange}
                    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                    required
                  >
                    {categoryOptions.map((option) => (
                      <option key={option.category} value={option.category}>
                        {option.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-slate-300 text-sm mb-1">Selected Icon</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 border border-slate-600 rounded">
                    <div className={`${newSavingPlan.iconBg} h-12 w-12 rounded-md flex items-center justify-center`}>
                      <i className={`${newSavingPlan.icon} text-white text-lg`}></i>
                    </div>
                    <div className="text-white">{newSavingPlan.category}</div>
                  </div>
                </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-600 text-white rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">Edit Savings Plan</h3>
            {error && (
              <div className="mb-4 p-2 bg-red-900 bg-opacity-30 border border-red-800 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSaveEdit}>
              <div className="mb-4">
                <label className="block text-slate-300 text-sm mb-1">Goal Name</label>
                <input
                  type="text"
                  name="name"
                  value={editingPlan.name}
                  onChange={handleEditPlanChange}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="e.g. New Car, Vacation, etc."
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-slate-300 text-sm mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  name="target"
                  value={editingPlan.target}
                  onChange={handleEditPlanChange}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  placeholder="50000"
                  required
                  min="1"
                  step="any"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-slate-300 text-sm mb-1">Category</label>
                <select
                  name="category"
                  value={editingPlan.category}
                  onChange={handleEditPlanChange}
                  className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                  required
                >
                  {categoryOptions.map((option) => (
                    <option key={option.category} value={option.category}>
                      {option.category}
                    </option>
                  ))}
                </select>
                </div>

                <div className="mb-4">
                  <label className="block text-slate-300 text-sm mb-1">Selected Icon</label>
                  <div className="flex items-center gap-3 p-3 bg-slate-700 border border-slate-600 rounded">
                    <div className={`${editingPlan.iconBg} h-12 w-12 rounded-md flex items-center justify-center`}>
                      <i className={`${editingPlan.icon} text-white text-lg`}></i>
                    </div>
                    <div className="text-white">{editingPlan.category}</div>
                  </div>
                </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 border border-slate-600 text-white rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">Delete Savings Plan</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this savings plan? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 border border-slate-600 text-white rounded hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {addingMoney.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-sm mx-4">
            <h3 className="text-white text-lg font-semibold mb-4">
              Add Money to Savings
            </h3>
            
            <div className="mb-4">
              <label className="block text-slate-300 text-sm mb-1">Amount (₹)</label>
              <input
                type="number"
                value={addingMoney.amount}
                onChange={(e) => setAddingMoney({...addingMoney, amount: e.target.value})}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white"
                placeholder="1000"
                min="1"
                autoFocus
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setAddingMoney({isOpen: false, planId: null, amount: ""})}
                className="px-4 py-2 border border-slate-600 text-white rounded hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMoney}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default SavingsSection;