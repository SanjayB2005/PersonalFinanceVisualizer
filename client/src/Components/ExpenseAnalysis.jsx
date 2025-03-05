import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

function ExpenseAnalysis({ transactions = [] }) {
  // State for time period selection
  const [timePeriod, setTimePeriod] = useState("weekly");
  const [showTimeOptions, setShowTimeOptions] = useState(false);
  
  // Constants
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const timeSegments = ["Morning", "Afternoon", "Evening", "Night"];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  // Time period options
  const timeOptions = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "yearly", label: "Yearly" },
  ];
  
  // Calculate expense data based on selected time period
  const chartData = useMemo(() => {
    const today = new Date();
    let data = [];
    
    switch (timePeriod) {
      case "daily":
        // Last 24 hours broken into 4 segments
        const hourlyData = Array(4).fill(0);
        
        const dayStart = new Date();
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date();
        dayEnd.setHours(23, 59, 59, 999);
        
        transactions
          .filter(
            (transaction) =>
              transaction.type === "expense" &&
              new Date(transaction.date) >= dayStart &&
              new Date(transaction.date) <= dayEnd
          )
          .forEach((transaction) => {
            const hour = new Date(transaction.date).getHours();
            if (hour >= 5 && hour < 12) hourlyData[0] += transaction.amount;       // Morning
            else if (hour >= 12 && hour < 17) hourlyData[1] += transaction.amount; // Afternoon
            else if (hour >= 17 && hour < 22) hourlyData[2] += transaction.amount; // Evening
            else hourlyData[3] += transaction.amount;                              // Night
          });
        
        data = hourlyData.map((amount, index) => ({
          name: timeSegments[index],
          value: amount
        }));
        break;
        
      case "weekly":
        // Days of the current week
        const expensesByDay = Array(7).fill(0);
        
        const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
        
        const weekStart = new Date();
        weekStart.setDate(today.getDate() - dayOfWeek);
        weekStart.setHours(0, 0, 0, 0);
        
        const weekEnd = new Date();
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        
        transactions
          .filter(
            (transaction) =>
              transaction.type === "expense" &&
              new Date(transaction.date) >= weekStart &&
              new Date(transaction.date) <= weekEnd
          )
          .forEach((transaction) => {
            const dayIndex = new Date(transaction.date).getDay();
            expensesByDay[dayIndex] += transaction.amount;
          });
        
        data = expensesByDay.map((amount, index) => ({
          name: daysOfWeek[index],
          value: amount
        }));
        break;
        
      case "monthly":
        // Last 4 weeks
        const weeksData = Array(4).fill(0);
        
        const monthStart = new Date();
        monthStart.setDate(today.getDate() - 28);
        monthStart.setHours(0, 0, 0, 0);
        
        transactions
          .filter(
            (transaction) =>
              transaction.type === "expense" &&
              new Date(transaction.date) >= monthStart &&
              new Date(transaction.date) <= today
          )
          .forEach((transaction) => {
            const daysDiff = Math.floor(
              (today - new Date(transaction.date)) / (1000 * 60 * 60 * 24)
            );
            const weekIndex = Math.min(3, Math.floor(daysDiff / 7));
            weeksData[weekIndex] += transaction.amount;
          });
        
        // Reverse to get chronological order
        weeksData.reverse();
        data = weeksData.map((amount, index) => ({
          name: `Week ${index + 1}`,
          value: amount
        }));
        break;
        
      case "yearly":
        // Last 12 months
        const monthsData = Array(12).fill(0);
        
        const yearStart = new Date();
        yearStart.setMonth(today.getMonth() - 11);
        yearStart.setDate(1);
        yearStart.setHours(0, 0, 0, 0);
        
        transactions
          .filter(
            (transaction) =>
              transaction.type === "expense" &&
              new Date(transaction.date) >= yearStart &&
              new Date(transaction.date) <= today
          )
          .forEach((transaction) => {
            const transDate = new Date(transaction.date);
            const monthIndex = transDate.getMonth();
            monthsData[monthIndex] += transaction.amount;
          });
        
        data = monthsData.map((amount, index) => ({
          name: monthNames[index],
          value: amount
        }));
        break;
        
      default:
        data = [];
    }
    
    return data;
  }, [transactions, timePeriod]);
  
  // Calculate total expenses and max expense
  const totalExpenses = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);
  
  const maxExpense = useMemo(() => {
    return Math.max(...chartData.map(item => item.value), 0);
  }, [chartData]);
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-700 p-3 rounded-md shadow-lg border border-slate-600">
          <p className="text-white font-medium">{payload[0].payload.name}</p>
          <p className="text-indigo-300">₹{payload[0].value.toFixed(2)}</p>
        </div>
      );
    }
    
    return null;
  };

  return (
    <section className="p-6 rounded-2xl bg-slate-800 mb-6">
      <header className="flex justify-between items-center mb-6">
        <h2 className="text-sm text-white">Expense Analysis</h2>
        <div className="relative">
          <div 
            className="text-white flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md hover:bg-slate-700"
            onClick={() => setShowTimeOptions(!showTimeOptions)}
          >
            <span>{timeOptions.find(option => option.value === timePeriod).label}</span>
            <i className={`ti ti-chevron-${showTimeOptions ? 'up' : 'down'}`} />
          </div>
          
          {showTimeOptions && (
            <div className="absolute right-0 mt-1 w-36 bg-slate-700 shadow-lg rounded-md z-10 py-1 border border-slate-600">
              {timeOptions.map(option => (
                <div
                  key={option.value}
                  className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                    timePeriod === option.value
                      ? "text-indigo-300 bg-slate-800"
                      : "text-white hover:bg-slate-600"
                  }`}
                  onClick={() => {
                    setTimePeriod(option.value);
                    setShowTimeOptions(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Total Expenses</p>
          <p className="text-lg text-white font-medium">₹{totalExpenses.toFixed(2)}</p>
        </div>
        <div className="bg-slate-700 rounded-lg p-3">
          <p className="text-xs text-slate-400">Highest Expense</p>
          <p className="text-lg text-white font-medium">₹{maxExpense.toFixed(2)}</p>
        </div>
      </div>
      
      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, bottom: 20, left: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis 
              tickFormatter={(value) => `₹${value}`}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.value === maxExpense ? '#8b5cf6' : '#6366f1'}
                  fillOpacity={0.9}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Period description */}
      <div className="text-center mt-4 text-xs text-slate-400">
        {timePeriod === 'daily' && "Today's expenses by time of day"}
        {timePeriod === 'weekly' && "This week's expenses by day"}
        {timePeriod === 'monthly' && "Last 30 days' expenses by week"}
        {timePeriod === 'yearly' && "Last 12 months' expenses"}
      </div>
    </section>
  );
}

export default ExpenseAnalysis;