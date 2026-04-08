import express from "express";
import {
  createExpense,
  getExpenses,
  updateExpense,
  deleteExpense,
  getBalances
} from "../controllers/expenseController.js";

import verifyFirebaseToken from "../middlewares/firebaseAuth.middleware.js";

const router = express.Router();

// 🔐 protect all routes using Firebase auth
router.use(verifyFirebaseToken);

// 🔥 IMPORTANT: static routes first
router.get("/balances", getBalances);   // dashboard balances

// CRUD routes
router.post("/", createExpense);        // create expense
router.get("/", getExpenses);           // get all expenses for user
router.put("/:expenseId", updateExpense);
router.delete("/:expenseId", deleteExpense);

export default router;
