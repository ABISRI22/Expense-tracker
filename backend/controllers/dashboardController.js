import incomeModel from '../models/incomeModel.js'
import expenseModel from '../models/expenseModel.js'

export async function getDashBoardOverview(req,res) {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
        const incomes = await incomeModel.find({
            userId,
            date : { $gte : startOfMonth, $lte : now },
        }).lean();

        const expenses = await expenseModel.find({ 
            userId,
            date : { $gte : startOfMonth, $lte : now },
        }).lean();
        
        console.log("Dashboard working");

        const monthlyIncome = incomes.reduce((acc, cur) => acc + (+cur.amount || 0), 0);
        const monthlyExpense = expenses.reduce((acc, cur) => acc + (+cur.amount || 0), 0);

        const savings = monthlyIncome - monthlyExpense;
        const savingsRate = monthlyIncome === 0 ? 0 : Math.round((savings / monthlyIncome) * 100);

        const recentTransactions = [
            ...incomes.map((i) => ({ ...i, type: "income" })),
            ...expenses.map((e) => ({ ...e, type: "expense" })),
        ]
        .sort((a, b) => new Date(b.date) - new Date(a.date)) 
        .slice(0, 10); 

        const spendByCategory = {};
        for (const exp of expenses) {
            const cat = exp.category || "Other";
            spendByCategory[cat] = (spendByCategory[cat] || 0) + (+exp.amount || 0);
        }

        const expenseDistribution = Object.entries(spendByCategory).map(([category, amount]) => ({
            category,
            amount,
            percent: monthlyExpense === 0 ? 0 : Math.round((amount / monthlyExpense) * 100),
        }));

        return res.status(200).json({
            success : true,
            data: {
                monthlyIncome,
                monthlyExpense,
                savings,
                savingsRate,
                recentTransactions,
                spendByCategory,
                expenseDistribution
            }
        });

    } catch (error) {
        console.error("GetDashboardOverviewError:", error);
        return res.status(500).json({
            success : false,
            message : "Dashboard Fetch failed"
        });
    }
}