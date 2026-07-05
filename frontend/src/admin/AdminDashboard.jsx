import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { navbarStyles } from "../assets/dummyStyles";
import img1 from '../assets/logo.png';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchExpenses();
    fetchIncome();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:4000/admin/users");
      setUsers(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get("http://localhost:4000/admin/expenses");
      setExpenses(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncome = async () => {
    try {
      const res = await axios.get("http://localhost:4000/admin/income");
      setIncome(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  // Calculate per-person totals
  const getPerPersonExpenses = () => {
    const perPersonExpenses = {};
    expenses.forEach(expense => {
      const userId = expense.userId?._id || expense.userId;
      const userName = expense.userId?.name || 'Unknown User';
      const userEmail = expense.userId?.email || 'No Email';
      
      if (!perPersonExpenses[userId]) {
        perPersonExpenses[userId] = {
          name: userName,
          email: userEmail,
          totalExpense: 0,
          transactions: []
        };
      }
      perPersonExpenses[userId].totalExpense += expense.amount;
      perPersonExpenses[userId].transactions.push(expense);
    });
    return Object.values(perPersonExpenses);
  };

  const getPerPersonIncome = () => {
    const perPersonIncome = {};
    income.forEach(incomeItem => {
      const userId = incomeItem.userId?._id || incomeItem.userId;
      const userName = incomeItem.userId?.name || 'Unknown User';
      const userEmail = incomeItem.userId?.email || 'No Email';
      
      if (!perPersonIncome[userId]) {
        perPersonIncome[userId] = {
          name: userName,
          email: userEmail,
          totalIncome: 0,
          transactions: []
        };
      }
      perPersonIncome[userId].totalIncome += incomeItem.amount;
      perPersonIncome[userId].transactions.push(incomeItem);
    });
    return Object.values(perPersonIncome);
  };

  const perPersonExpenses = getPerPersonExpenses();
  const perPersonIncome = getPerPersonIncome();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* Logo with consistent styling */}
              <div
                onClick={() => navigate("/")}
                className="flex items-center cursor-pointer space-x-2"
              >
                <div className="w-8 h-8">
                  <img src={img1} alt="logo" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold text-gray-800">Fin TrackPro</span>
              </div>
              
              {/* Divider */}
              <div className="h-6 w-px bg-gray-300"></div>
              
              {/* Admin Dashboard Title */}
              <h1 className="text-xl font-bold text-gray-800">
                Admin Dashboard
              </h1>
            </div>
            
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200 flex items-center gap-2"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">
        {loading ? (
          <div className="text-xl font-semibold text-center py-20">
            Loading...
          </div>
        ) : (
          <>
            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-blue-500">
                <h2 className="text-xl font-semibold text-gray-700">
                  Total Users
                </h2>
                <p className="text-4xl font-bold text-blue-600 mt-4">
                  {users.length}
                </p>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-red-500">
                <h2 className="text-xl font-semibold text-gray-700">
                  Total Expenses
                </h2>
                <p className="text-4xl font-bold text-red-600 mt-4">
                  {expenses.length}
                </p>
              </div>

              <div className="bg-white shadow-lg rounded-2xl p-6 border-l-4 border-green-500">
                <h2 className="text-xl font-semibold text-gray-700">
                  Total Income
                </h2>
                <p className="text-4xl font-bold text-green-600 mt-4">
                  {income.length}
                </p>
              </div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Registered Users
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id} className="border-b hover:bg-gray-100">
                        <td className="p-4">{user.name}</td>
                        <td className="p-4">{user.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PER PERSON EXPENSE TABLE */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Expenses Per Person
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-red-600 text-white">
                      <th className="p-4 text-left">User Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Total Expenses (₹)</th>
                      <th className="p-4 text-left">Transaction Count</th>
                      <th className="p-4 text-left">Recent Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perPersonExpenses.map((person, index) => (
                      <tr key={index} className="border-b hover:bg-gray-100">
                        <td className="p-4 font-medium">{person.name}</td>
                        <td className="p-4">{person.email}</td>
                        <td className="p-4 text-red-600 font-semibold">
                          ₹{person.totalExpense.toLocaleString()}
                        </td>
                        <td className="p-4">{person.transactions.length}</td>
                        <td className="p-4">
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              View {person.transactions.length} transactions
                            </summary>
                            <div className="mt-2 space-y-1">
                              {person.transactions.slice(0, 3).map((t, i) => (
                                <div key={i} className="text-sm text-gray-600">
                                  {t.description}: ₹{t.amount} ({t.category})
                                </div>
                              ))}
                              {person.transactions.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{person.transactions.length - 3} more
                                </div>
                              )}
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                    {perPersonExpenses.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">
                          No expense transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* PER PERSON INCOME TABLE */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Income Per Person
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-600 text-white">
                      <th className="p-4 text-left">User Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Total Income (₹)</th>
                      <th className="p-4 text-left">Transaction Count</th>
                      <th className="p-4 text-left">Recent Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perPersonIncome.map((person, index) => (
                      <tr key={index} className="border-b hover:bg-gray-100">
                        <td className="p-4 font-medium">{person.name}</td>
                        <td className="p-4">{person.email}</td>
                        <td className="p-4 text-green-600 font-semibold">
                          ₹{person.totalIncome.toLocaleString()}
                        </td>
                        <td className="p-4">{person.transactions.length}</td>
                        <td className="p-4">
                          <details className="cursor-pointer">
                            <summary className="text-blue-600 hover:text-blue-800">
                              View {person.transactions.length} transactions
                            </summary>
                            <div className="mt-2 space-y-1">
                              {person.transactions.slice(0, 3).map((t, i) => (
                                <div key={i} className="text-sm text-gray-600">
                                  {t.description}: ₹{t.amount} ({t.category})
                                </div>
                              ))}
                              {person.transactions.length > 3 && (
                                <div className="text-xs text-gray-500">
                                  +{person.transactions.length - 3} more
                                </div>
                              )}
                            </div>
                          </details>
                        </td>
                      </tr>
                    ))}
                    {perPersonIncome.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500">
                          No income transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;