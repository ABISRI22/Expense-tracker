import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js'; 
import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js';
import expenseRouter from './routes/expenseRoute.js';
import dashboardRouter from './routes/dashboardRoute.js';

const app = express();
const port = 4000;

//middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Before all routes, add this middleware
app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.url}`);
    next();
});

// Make sure dashboard router is mounted
app.use('/dashboard', dashboardRouter);
console.log(" Dashboard router mounted at /dashboard");

console.log("Dashboard router routes:");
dashboardRouter.stack.forEach(layer => {
    if (layer.route) {
        console.log(`  ${Object.keys(layer.route.methods)} ${layer.route.path}`);
    }
});


//Routes
app.use("/api/user",userRouter);
app.use("/api/income",incomeRouter);
app.use("/api/expense",expenseRouter);
//app.use("/api/dashboard",dashboardRouter);


app.get('/', (req, res) => {
    res.send("API WORKING");
});

//DB + Server start
connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server Started on http://localhost:${port}`);
    });
});