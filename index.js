const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { loginUser, updateUserFinance, getUserFinance } = require("./users/UsersService");
const {
  createExpense,
  updateExpense,
  getAllExpense,
  deleteExpenseById,
  deleteExpenseTypeById,
  getAllExpenseType,
  createExpenseType,
  getLast30DaysExpense
} = require("./expense/ExpenseService");
const { createEarning, updateEarning, getAllEarning, deleteEarningById, getAllEarningType, createEarningType, deleteEarningTypeById } = require("./earning/EarningService");
const { createMutualFund, getAllMutualFund, deleteMutualFundById, updateMutualFund } = require("./mututalFunds/MutualFundService");
const { createStock, getAllStock, deleteStockById, updateStock } = require("./stock/StockService");
const { contactUs } = require("./mail/Mailservice");
const { getAllAsset, deleteAsset, sellAsset } = require("./asset/assetService");
const { getAllLiability, createLiability, deleteLiability, updateLiability } = require("./liability/liabilityService");
const { getAllLoan, createLoan, deleteLoanById, updateLoan } = require("./loan/LoanService");
const { financeSummary, getLast10Transactions, getEarningSummaryBetween, getExpenseSummaryBetween, getIncomeExpenseSummary } = require("./dashboard/dashboardService");
require("dotenv").config();

const app = express();
app.use(express.json());
const corsOpts = {
  origin: '*',
  methods: [
    'GET','POST', 'PUT', "DELETE"
  ],
  allowedHeaders: [
    'Content-Type',
  ],
};

app.use(cors(corsOpts));

  
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: "TrackXpenseDB",
});

// last 30 days expense 
app.post("/expense/30days", async (req, res) => {
  await getLast30DaysExpense(req, res);
})

app.post("/latest-transactions", async (req, res) => {
  await getLast10Transactions(req, res);
});

app.post("/earning-summary", async (req, res) => {
  await getEarningSummaryBetween(req, res);
});

app.post("/expense-summary", async (req, res) => {
  await getExpenseSummaryBetween(req, res);
});

app.post("/income-expense-summary", async (req, res) => {
  await getIncomeExpenseSummary(req, res);
});

// dashboard
app.post("/finance-summary", async (req, res) => {
  await financeSummary(req, res);
});

// get Asset
app.post("/asset", async (req, res) => {
  await getAllAsset(req, res);
});
app.delete("/asset", async(req, res) => {
  await deleteAsset(req, res);
});
app.put("/asset", async (req, res) => {
  await sellAsset(req, res);
});

//get liability
app.post("/liability", async (req, res) => {
  await getAllLiability(req, res);
});
app.delete("/liability", async(req, res) => {
  await deleteLiability(req, res);
});
app.put("/liability", async (req, res) => {
  await updateLiability(req, res);
});

// get loan
app.post("/loan/all", async (req, res) => {
  await getAllLoan(req, res);
});
app.post("/loan/add", async (req, res) =>{
  await createLoan(req, res);
});

app.delete("/loan", async (req, res) => {
  await deleteLoanById(req, res);
});

app.put("/loan", async (req, res) => {
  await updateLoan(req, res);
});

// user resource
app.post("/login", async (req, res) => {
  await loginUser(req, res);
});

// send mai
app.post("/contact-us", async (req, res) => {
  await contactUs(req, res);
});

// expense resource
app.post("/expense/add", async (req, res) => {
  await createExpense(req, res);
});

app.put("/expense", async (req, res) => {
  await updateExpense(req, res);
});

app.post("/expense/all", async (req, res) => {
  await getAllExpense(req, res);
});

app.delete("/expense", async (req, res) => {
  await deleteExpenseById(req, res);
});

// earning resource
app.post("/earning/add", async (req, res) => {
  await createEarning(req, res);
});

app.put("/earning", async (req, res) => {
  await updateEarning(req, res);
});

app.post("/earning/all", async (req, res) => {
  await getAllEarning(req, res);
});

app.delete("/earning", async (req, res) => {
  await deleteEarningById(req, res);
});

// mutual fund
app.post("/mutual-fund/add", async (req, res) => {
  await createMutualFund(req, res);
});

app.post("/mutual-fund/all", async (req, res) => {
  await getAllMutualFund(req, res);
});

app.delete("/mutual-fund", async (req, res) => {
  await deleteMutualFundById(req, res);
});

app.put("/mutual-fund", async (req, res) => {
  await updateMutualFund(req, res);
});

// stocks
app.post("/stock/add", async (req, res) => {
  await createStock(req, res);
});

app.post("/stock/all", async (req, res) => {
  await getAllStock(req, res);
});

app.delete("/stock", async (req, res) => {
  await deleteStockById(req, res);
});

app.put("/stock", async (req, res) => {
  await updateStock(req, res);
});

// expense type
app.post("/expense-type/all", async (req, res) => {
  await getAllExpenseType(req, res);
});
app.post("/expense-type/add", async (req, res) => {
  await createExpenseType(req, res);
});
app.delete("/expense-type", async (req, res) => {
  await deleteExpenseTypeById(req, res);
})

// earning type
app.post("/earning-type/all", async (req, res) => {
  await getAllEarningType(req, res);
});
app.post("/earning-type/add", async (req, res) => {
  await createEarningType(req, res);
});
app.delete("/earning-type", async (req, res) => {
  await deleteEarningTypeById(req, res);
})

// User finance
app.post("/user-finance", async (req, res) => {
  await getUserFinance(req, res);
});

app.put("/user-finance", async (req, res) => {
  await updateUserFinance(req, res);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
