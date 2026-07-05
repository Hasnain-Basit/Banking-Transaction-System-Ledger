const accountModel = require("../models/account.model")
const userModel = require("../models/user.model")

async function createAccountController(req, res) {
    const user = req.user // saved in req.user by const authMiddleware.
    const account = await accountModel.create({
        user: user._id
    })
    res.status(201).json({
        message: "Account created successfully",
        account: account
    })
}

async function getUserAccountsController(req, res) {
    const accounts = await accountModel.find({
        user: req.user._id
    })
    const user = await userModel.findById(req.user._id)
    return res.status(200).json({
        message: `${user.name.toUpperCase()} has ${accounts.length} accounts, whose details have been given.`,
        accounts: accounts
    })
}

async function getAccountBalanceController(req, res) {
    const { accountId } = req.params
    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id
        // checking if the requesting user is giving his/her account ID or someone else account ID
    })
    if (!account) {
        return res.status(404).json({
            message: "User does not have access to requested account OR Account not found"
        })
    }
    const user = await userModel.findById(req.user._id) //optional
    const balance = await account.getBalance()
    return res.status(200).json({
        message: "Balance of requested account",
        AccountID: accountId,
        AccountHolder: user.name.toUpperCase(),
        Balance: balance
    })
}
module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
}