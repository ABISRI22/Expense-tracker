import incomeModel from "../models/incomeModel.js";
import XLSX from 'xlsx';
import getDateRange from "../utils/dataFilter.js";


//add income 
export async function addIncome(req,res) {
    const userId = req.user._id 
    const {description,amount,category,date} =req.body;
    try {
        if(!description || amount == null || !category || !date){
            return res.status(400).json({
             success : false,
             message : "All fields are required"
            });
        }
        
       const newIncome = new incomeModel({
        userId,
        description,
        amount,
        category,
        date : new Date(date)
       });

       await newIncome.save()
       res.json({
        success : true,
        message : "Income added successfully"
       });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Server Error"
        });
    }
}


// to get all income
export async function getAllIncome(req,res){
    const userId = req.user._id
    try {
        const incomes = await incomeModel.find({userId}).sort({date : -1});
        res.json(incomes);
    }
    
    catch (error) {
         console.log(error);
        res.status(500).json({
            success : false,
            message : "Server Error"
        });
    }
}


//to update income
export async function updateIncome(req,res) {
    const {id} = req.params;
    const userId = req.user._id
    const {description,amount,category,date} = req.body;

    try {
        const updatedIncome = await incomeModel.findOneAndUpdate(
            {_id : id,userId},
            {description,amount,category,date},
            {new : true}
        );

        if(!updatedIncome){
            return res.status(404).json({
                success : false,
                message : "Income not found"
            });
        }
        
        res.json({
            success : true,
            message :"Income updated successfully.",
            data : updatedIncome
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Server Error"
        });
    }
}


//to delete an income
export async function deleteIncome(req,res) {
    try {
        const userId = req.user._id;

        const income = await incomeModel.findOneAndDelete({
            _id : req.params.id,
            userId
        });

        if(!income){
          return res.status(404).json({
            success : false,
            message : "Income not found."
          });
        }
       
        return res.json({
            success : true,
            message : "Income deleted successfully!"
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Server Error"
        });
    }
}


//to download the data in excel sheet
export async function downloadIncomeExcel(req,res) {
    const userId = req.user._id
    try {
        const income = await incomeModel.find({userId}).sort({date : -1});

        const plainData = income.map((inc) => ({
            Description : inc.description,
            Amount : inc.amount,
            Category : inc.category,
            Date : new Date(inc.date).toLocaleDateString(),        
        }));
      
        const worksheet = XLSX.utils.json_to_sheet(plainData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook,worksheet,"incomeModel");

        XLSX.writeFile(workbook,"income_details.xlsx"); 
        res.download("income_details.xlsx");

    } catch (error) {
        console.log(error);
        res.status(500).json({
            success : false,
            message : "Server Error"
        });
    }
}



// to get income overview 
export async function getIncomeOverview(req, res) {
  try {
    const userId = req.user._id;
    const { range = "monthly" } = req.query;

    const { start, end } = getDateRange(range);
             
      

    //Timezone
    const startDate = new Date(start);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    //Fetch filtered data
   
   const incomes = await incomeModel.find({
  userId,
  date: {
    $gte: new Date(startDate.toISOString()),
    $lte: new Date(endDate.toISOString()),
  },
}).sort({ date: -1 });

         console.log("All incomes:", await incomeModel.find({ userId }));



    // for debugging
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);
    console.log("Filtered incomes:", incomes);

  
    const totalIncome = incomes.reduce(
      (acc, cur) => acc + Number(cur.amount || 0),
      0
    );

    const averageIncome =
      incomes.length > 0 ? totalIncome / incomes.length : 0;

    const numberOfTransactions = incomes.length;

    const recentTransactions = incomes.slice(0, 9);

    
    res.json({
      success: true,
      data: {
        monthlyIncome: totalIncome,   
        averageIncome,
        numberOfTransactions,
        incomeTransactions: recentTransactions,
        range,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}