import React, { useState, useMemo, useEffect } from 'react'
import { dashboardStyles, trendStyles, chartStyles } from '../assets/dummyStyles'
import {
  GAUDE_COLORS,
  COLORS,
  INCOME_COLORS,
  EXPENSE_CATEGORY_ICONS
} from '../assets/dummyStyles';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { getTimeFrameRange, getPreviousTimeFrameRange, calculateData } from '../components/Helpers';
import { 
  ArrowDown, BarChart2, ChevronDown, ChevronUp, DollarSign, 
  PiggyBank, Plus, ShoppingCart, TrendingDown, TrendingUp, 
  Wallet, TrendingUp as ProfitIcon, PieChart as PieChartIcon, 
   X,
  BarChart
} from "lucide-react"
import Financialcard from '../components/Financialcard';
import GaugeCard from '../components/GaugeCard';
import { Bar, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import AddTransactionModal from '../components/Add';

const API_BASE = "http://localhost:4000";

const getAuthHeader = () => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Helper function to convert date to ISO timeline
function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);
    const combined = new Date(`${dateValue}T${hhmmss}`);
    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch (err) {
    return new Date().toISOString();
  }
}

console.log("Hi")


const Dashboard = () => {
  const { 
    transactions: outletTransactions = [], 
    timeFrame = "monthly", 
    setTimeFrame = () => {},
    refreshTransactions 
  } = useOutletContext();

  console.log("Outlet Transactions:", outletTransactions);

  const [showModal, setShowModal] = useState(false);
  const [gaugeData, setGaugeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [overviewMeta, setOverviewMeta] = useState({});
  const [showAllIncome, setShowAllIncome] = useState(false);
  const [showAllExpense, setShowAllExpense] = useState(false);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense",
    category: "Food",
  });

  const timeFrameRange = useMemo(() => getTimeFrameRange(timeFrame), [timeFrame]);
  const prevTimeFrameRange = useMemo(() => getPreviousTimeFrameRange(timeFrame), [timeFrame]);

  // Function to check if a date is within range
 const isDateInRange = (date, start, end) => {
  const transactionDate = new Date(date);
  const startDate = new Date(start);
  const endDate = new Date(end);

  console.log("Transaction Date:", transactionDate);
  console.log("Start Date:", startDate);
  console.log("End Date:", endDate);

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  return transactionDate >= startDate && transactionDate <= endDate;
};
 

const filteredTransactions = useMemo(
  () => outletTransactions || [],
  [outletTransactions]
);

  const prevFilteredTransactions = useMemo(
    () => (outletTransactions || []).filter((t) => 
      t && isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end)
    ),
    [outletTransactions, prevTimeFrameRange]
  );

  console.log(filteredTransactions);

  // Calculate current timeframe data
  const currentTimeFrameData = useMemo(() => {
  const income = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return {
    income,
    expenses,
    savings: income - expenses,
  };
}, [filteredTransactions]);

  const prevTimeFrameData = useMemo(() => {
    const data = calculateData(prevFilteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [prevFilteredTransactions]);

  // Update gauge when time frame changes
  useEffect(() => {
    const maxValues = {
      income: Math.max(currentTimeFrameData.income, 5000),
      expenses: Math.max(currentTimeFrameData.expenses, 3000),
      savings: Math.max(Math.abs(currentTimeFrameData.savings), 2000),
    };

    setGaugeData([
      { name: "Income", value: currentTimeFrameData.income, max: maxValues.income },
      { name: "Spent", value: currentTimeFrameData.expenses, max: maxValues.expenses },
      { name: "Savings", value: currentTimeFrameData.savings, max: maxValues.savings },
    ]);
  }, [currentTimeFrameData, timeFrame]);

  const displayIncome = currentTimeFrameData.income;
  const displayExpenses = currentTimeFrameData.expenses;
  const displaySavings = currentTimeFrameData.savings;

  // Expense percentage change
  const expenseChange = useMemo(() => {
    const prev = prevTimeFrameData.expenses;
    const curr = displayExpenses;
    if (!prev) {
      if (!curr) return 0;
      return 100;
    }
    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayExpenses]);

  //Expense distribution for all time frames
  const financialOverviewData = useMemo(() => {
    // For monthly view, try to use backend data first
    if (timeFrame === "monthly" && overviewMeta.expenseDistribution && Array.isArray(overviewMeta.expenseDistribution) && overviewMeta.expenseDistribution.length > 0) {
      console.log("Using backend expense distribution:", overviewMeta.expenseDistribution);
      return overviewMeta.expenseDistribution.map((d) => ({
        name: d.category,
        value: Math.round(Number(d.amount) || 0),
      })).filter(item => item.value > 0);
    }

    // For all time frames (daily, weekly, monthly), calculate from filtered transactions
    const categories = {};
    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "expense" && transaction.amount > 0) {
        const category = transaction.category || "Other";
        categories[category] = (categories[category] || 0) + transaction.amount;
      }
    });

    const result = Object.keys(categories).map((category) => ({
      name: category,
      value: Math.round(categories[category]),
    })).filter(item => item.value > 0);
    
    console.log("Calculated expense distribution:", result);
    return result;
  }, [filteredTransactions, overviewMeta, timeFrame]);

  // Build server-provided recent list
  const serverRecent = overviewMeta.recentTransactions || [];

  const serverRecentIncome = serverRecent
    .filter((t) => t.type === "income")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const serverRecentExpense = serverRecent
    .filter((t) => t.type === "expense")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const incomeTransactions = useMemo(
    () => filteredTransactions
      .filter((t) => t.type === "income")
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions]
  );

  const expenseTransactions = useMemo(
    () => filteredTransactions
      .filter((t) => t.type === "expense")
      .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions]
  );

  const incomeListForDisplay = timeFrame === "monthly" && serverRecentIncome.length > 0
    ? serverRecentIncome
    : incomeTransactions;

  const expenseListForDisplay = timeFrame === "monthly" && serverRecentExpense.length > 0
    ? serverRecentExpense
    : expenseTransactions;

  const displayedIncome = showAllIncome 
    ? incomeListForDisplay 
    : incomeListForDisplay.slice(0, 3);

  const displayedExpense = showAllExpense 
    ? expenseListForDisplay 
    : expenseListForDisplay.slice(0, 3);

  // Fetch dashboard data
  const fetchDashboardOverview = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        console.warn("No token found, user might not be logged in");
        return;
      }

      console.log("Fetching dashboard from:", `${API_BASE}/dashboard/`);
      const res = await axios.get(`${API_BASE}/dashboard/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      
         
      if (res?.data?.success) {
        const data = res.data.data;
        
        console.log("Dashboard data received:", data);
        console.log("Expense distribution from backend:", data.expenseDistribution);

        setOverviewMeta({
          monthlyIncome: data.monthlyIncome || 0,
          monthlyExpense: data.monthlyExpense || 0,
          savings: data.savings || 0,
          savingsRate: data.savingsRate || 0,
          spendByCategory: data.spendByCategory || {},
          expenseDistribution: data.expenseDistribution || [],
          recentTransactions: data.recentTransactions || [],
        });
      } else {
        console.warn("Dashboard endpoint returned success:false", res?.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard overview:", error?.response?.data || error?.response || error?.message || error);
      if (error?.response?.status === 401) {
        console.error("Authentication failed - please login again");
      }
    }
  };

  // Load data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        if (refreshTransactions) {
          await refreshTransactions();
        }
        await fetchDashboardOverview();
      } catch (err) {
        console.error("Error loading initial data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Refresh when timeFrame changes
  useEffect(() => {
    if (timeFrame === "monthly") {
      fetchDashboardOverview();
    }
  }, [timeFrame]);

  // Handle add transaction
  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    const payload = {
      date: toIsoWithClientTime(newTransaction.date),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
    };
    
    try {
      setLoading(true);
      if (newTransaction.type === "income") {
        await axios.post(`${API_BASE}/api/income/add`, payload, {
          headers: getAuthHeader(),
        });
      } else {
        await axios.post(`${API_BASE}/api/expense/add`, payload, {
          headers: getAuthHeader(),
        });
      }

      if (refreshTransactions) {
        await refreshTransactions();
      }
      await fetchDashboardOverview();

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
      });
      setShowModal(false);
    } catch (error) {
      console.error("Failed to add transactions:", error?.response || error.message || error);
      alert("Failed to add transaction: " + (error?.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
 
    

  // Loading state
  if (loading && !outletTransactions.length) {
    return (
      <div className={dashboardStyles.container}>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }
  console.log("Income:", displayIncome);
console.log("Expenses:", displayExpenses);
console.log("Savings:", displaySavings);
console.log("Gauge Data:", gaugeData);
console.log("Filtered Transactions:", filteredTransactions);

  return (
    <div className={dashboardStyles.container}>
      {/* Header */}
      <div className={dashboardStyles.headerContainer}>
        <div className={dashboardStyles.headerContent}>
          <div>
            <h1 className={dashboardStyles.headerTitle}>Finance Dashboard</h1>
            <p className={dashboardStyles.headerSubtitle}>
              Track your income and expenses
            </p>
          </div>
          <button onClick={() => setShowModal(true)} className={dashboardStyles.addButton}>
            <Plus size={20}/>
            Add transactions
          </button>
        </div>
           
        <div className={dashboardStyles.timeFrameContainer}>
          <div className={dashboardStyles.timeFrameWrapper}>
            {["daily", "weekly", "monthly"].map((frame) => (
              <button
                key={frame}
                className={dashboardStyles.timeFrameButton(timeFrame === frame)} 
                onClick={() => setTimeFrame(frame)}
              >
                {frame.charAt(0).toUpperCase() + frame.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={dashboardStyles.summaryGrid}>
        <Financialcard 
          icon={
            <div className={dashboardStyles.walletIconContainer}>
              <Wallet className="w-5 h-5 text-teal-600"/>
            </div>
          } 
          label="Total Balance" 
          value={`₹${Math.round(displayIncome - displayExpenses).toLocaleString()}`}
          additionalContent={
            <div className="flex items-center gap-2 mt-2 text-sm">
              <span className={dashboardStyles.balanceBadge}>
                +₹{Math.round(displayIncome).toLocaleString()}
              </span>
              <span className={dashboardStyles.expenseBadge}>
                -₹{Math.round(displayExpenses).toLocaleString()}
              </span>
            </div>
          }
        />

        <Financialcard 
          icon={
            <div className={dashboardStyles.arrowDownIconContainer}>
              <ArrowDown className="w-5 h-5 text-orange-600"/>
            </div>
          } 
          label={`${timeFrameRange.label} Expenses`}
          value={`₹${Math.round(displayExpenses).toLocaleString()}`}
          additionalContent={
            <div
              className={`mt-2 text-xs flex items-center gap-1 ${
                expenseChange >= 0 ? trendStyles.positive : trendStyles.negative
              }`}
            >
              {expenseChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>   
                {Math.abs(expenseChange)}% {expenseChange >= 0 ? "increase" : "decrease"} from {prevTimeFrameRange.label}
              </span>
            </div>
          }
        />

        <Financialcard 
          icon={
            <div className={dashboardStyles.piggyBankIconContainer}>
              <PiggyBank className="w-5 h-5 text-cyan-600"/>
            </div>
          } 
          label={`${timeFrameRange.label} Savings`}
          value={`₹${Math.round(displaySavings).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-cyan-600 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <BarChart2 className="w-4 h-4"/>
                <span>
                  {displayIncome > 0 ? Math.round((displaySavings / displayIncome) * 100) : 0}% of income
                </span>
              </div>
              {typeof overviewMeta.savingsRate === "number" && overviewMeta.savingsRate > 0 && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    overviewMeta.savingsRate < 0 ? trendStyles.negativeRate : trendStyles.positiveRate
                  }`}
                >
                  {overviewMeta.savingsRate}%
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Gauges */}
      <div className={`${dashboardStyles.gaugeGrid} w-full`}>
        {gaugeData.map((gauge) => (
          <div
            key={gauge.name}
            className="min-w-0 flex-1 w-full min-h-[320px]"
          >
            <GaugeCard 
              gauge={gauge}
              colorInfo={GAUDE_COLORS[gauge.name]}
              timeFrameLabel={timeFrameRange.label}
            />
          </div>
        ))}
      </div>
            
     
     {/* Expense distribution pie */}
<div className={dashboardStyles.pieChartContainer}>

  <div className={dashboardStyles.pieChartHeader}>
    <h3 className={dashboardStyles.pieChartTitle}>
      <PieChartIcon className="w-6 h-6 text-teal-500" />
      Expense Distribution
      <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
    </h3>
  </div>

  <div style={{ width: '100%', aspectRatio: '1 / 1', maxWidth: '500px', margin: '0 auto' }}>
    {financialOverviewData && financialOverviewData.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={financialOverviewData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={true}
          >
            {financialOverviewData.map((entry, index) => {
              const PIE_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={PIE_COLORS[index % PIE_COLORS.length]} 
                  stroke="#fff" 
                  strokeWidth={2} 
                />
              );
            })}
          </Pie>
          <Tooltip 
            formatter={(value) => [`₹${value.toLocaleString()}`, 'Amount']}
            contentStyle={{ backgroundColor: 'white', borderRadius: '8px', padding: '8px', border: '1px solid #ccc' }}
          />
          <Legend 
            layout="horizontal" 
            verticalAlign="bottom" 
            align="center"
            wrapperStyle={{ paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <div className="flex justify-center items-center h-[300px] bg-gray-50 rounded-lg">
        <div className="text-center">
          <PieChartIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No expense data for {timeFrameRange.label}</p>
          <p className="text-sm text-gray-400 mt-1">Add expenses to see distribution</p>
        </div>
      </div>
    )}
  </div>
</div>


      <div className={dashboardStyles.listsGrid}>
        {/* Income Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className={dashboardStyles.listTitle}>
              <ProfitIcon className="w-6 h-6 text-green-500" /> Recent Income{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.incomeCountBadge}>
              {incomeListForDisplay.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedIncome.map((transaction) => {
              const IconComponent = INCOME_COLORS?.[transaction.category]?.icon || <DollarSign className="w-5 h-5" />;
              return (
                <div key={transaction._id || transaction.id} className={dashboardStyles.incomeTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.incomeIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.incomeAmount}>+₹{Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {incomeListForDisplay.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-green-50")}>
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No income transactions</p>
              </div>
            )}

            {incomeListForDisplay.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button 
                  onClick={() => setShowAllIncome(!showAllIncome)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllIncome ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Income ({incomeListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Expense Column */}
        <div className={dashboardStyles.listContainer}>
          <div className={dashboardStyles.listHeader}>
            <h3 className={dashboardStyles.listTitle}>
              <ArrowDown className="w-6 h-6 text-orange-500" /> Recent Expenses{" "}
              <span className={dashboardStyles.listSubtitle}> ({timeFrameRange.label})</span>
            </h3>
            <span className={dashboardStyles.expenseCountBadge}>
              {expenseListForDisplay.length} records
            </span>
          </div>

          <div className={dashboardStyles.transactionList}>
            {displayedExpense.map((transaction) => {
              const IconComponent = EXPENSE_CATEGORY_ICONS?.[transaction.category] || <ShoppingCart className="w-5 h-5" />;
              return (
                <div key={transaction._id || transaction.id} className={dashboardStyles.expenseTransactionItem}>
                  <div className={dashboardStyles.transactionContent}>
                    <div className={dashboardStyles.expenseIconContainer}>
                      {IconComponent}
                    </div>
                    <div>
                      <p className={dashboardStyles.transactionDescription}>{transaction.description}</p>
                      <p className={dashboardStyles.transactionCategory}>{transaction.category}</p>
                    </div>
                  </div>
                  <div className={dashboardStyles.transactionAmount}>
                    <p className={dashboardStyles.expenseAmount}>-₹{Math.abs(transaction.amount).toLocaleString()}</p>
                    <p className={dashboardStyles.transactionDate}>{new Date(transaction.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}

            {expenseListForDisplay.length === 0 && (
              <div className={dashboardStyles.emptyState}>
                <div className={dashboardStyles.emptyIconContainer("bg-orange-50")}>
                  <ShoppingCart className="w-8 h-8 text-orange-400" />
                </div>
                <p className={dashboardStyles.emptyText}>No expense transactions</p>
              </div>
            )}

            {expenseListForDisplay.length > 3 && (
              <div className={dashboardStyles.viewAllContainer}>
                <button 
                  onClick={() => setShowAllExpense(!showAllExpense)}
                  className={dashboardStyles.viewAllButton}
                >
                  {showAllExpense ? (
                    <>
                      <ChevronUp className="w-5 h-5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-5 h-5" />
                      View All Expenses ({expenseListForDisplay.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

     <AddTransactionModal
     showModal={showModal}
     setShowModal={setShowModal}
     newTransaction={newTransaction}
     setNewTransaction={setNewTransaction}
     handleAddTransaction={handleAddTransaction}
     loading={loading}
     />

    </div>
  )
}

export default Dashboard;