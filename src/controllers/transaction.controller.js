const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const mongoose = require("mongoose")
/**
 * - Create a new transaction (02:09:08)
 * transfer Flow
    * 1. Validate Request
    * Validate Idempotency Key (goto uuid generator)
    * Check Account Status
    * Derive Sender Balance from Ledger
    * Create Transaction (Pending)
    * Create Debit Ledger Entry
    * Create Credit Ledger Entry
    * Mark Transaction Completed
    * Commit MongoDB
    * Send Email (Optional)
 */

async function createTransaction(req, res) {
    // Validate Request
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body
    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "Source account, recipient account, amount, and idempotency key are required."
        })
    }
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount
    })
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })
    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid Source Account or Recipient Account."
        })
    }
    if (amount < 100) {
        return res.status(400).json({
            message: "Minimum transfer amount is 100."
        })
    }
    // Validate Idempotency Key

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })
    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is Pending",
                // transaction: isTransactionAlreadyExists
            })

        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction Failed",
                // transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was Reversed, retry after some time",
                // transaction: isTransactionAlreadyExists
            })
        }
    }

    // Check Account Status
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Sender and Recipient account status must be ACTIVE to process transaction"
        })
    }

    // getting sender's balance
    const balance = await fromUserAccount.getBalance()
    if (balance < amount) {
        return res.status(400).json({
            message: `Insufficient Balance, Current Balance: ${balance}, Transfer Request Amount: ${amount}`
        })
    }
    let transaction;
    try {
        const session = await mongoose.startSession() //MongoDB needs a session object to group multiple operations under one transactional context
        session.startTransaction() // tells MongoDB to stop applying changes immediately and instead stage them safely
        transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0]
        const debitLedgerEntry = await ledgerModel.create([{
            account: fromAccount,
            amount,
            transaction: transaction._id,
            type: "DEBIT"
        }], { session })


        // simulation that the transaction is taking time (amount debit but not credit)
        // await (() => {
        //     return new Promise((resolve) => setTimeout(resolve, 10 * 1000))
        // })()
        const creditLedgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount,
            transaction: transaction._id,
            type: "CREDIT"
        }], { session })

        //If everything is successful, update the transaction status from "PENDING" to "COMPLETE".   
        await transactionModel.findOneAndUpdate(
            { _id: transaction._id }, { status: "COMPLETED" }, { session }
        )
        await session.commitTransaction() // confirms and permanently saves all staged changes as one atomic unit
        session.endSession() // frees resources and closes the transactional context so the server doesn't keep unused sessions open
    }
    catch (err) {
        return res.status(500).json({
            message: "Transaction in progress. Please try again later."
        })
    }
    // send email, (for now email is not running)

    return res.status(200).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body
    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount, idempotencyKey are required"
        })
    }
    const toUserAccount = await accountModel.findOne({
        _id: toAccount
    })
    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid Recipient Account"
        })
    }
    const fromUserAccount = await accountModel.findOne({
        // systemUser: true,
        user: req.user._id
    })
    console.log("req.user._id", req.user._id)
    if (!fromUserAccount) {
        return res.status(400).json({
            message: "Error, SYSTEM USER account not found"
        })
    }
    const session = await mongoose.startSession()
    session.startTransaction()
    const transaction = new transactionModel({
        fromAccount: fromUserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitLedgerEntry = await ledgerModel.create([{
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"
    }], { session })

    const creditLedgerEntry = await ledgerModel.create([{
        account: toUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"
    }], { session })
    transaction.status = "COMPLETED"
    await transaction.save({ session })
    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transactions completed successfully",
        transaction: transaction
    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}