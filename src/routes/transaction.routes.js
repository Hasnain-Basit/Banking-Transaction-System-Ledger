const express = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")
const transactionRoutes = express.Router()


transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)
transactionRoutes.post("/system/initial-fund", authMiddleware.authSystemUserMiddleware, transactionController.createInitialFundsTransaction)



module.exports = transactionRoutes