const mongoose = require("mongoose")
const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Source account is required."], // from account
        index: true
    },
    toAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "account",
        required: [true, "Recipient account is required."], // to account
        index: true
    }
    , status: {
        type: String,
        enum: {
            values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
            message: "Status must be PENDING, COMPLETE, FAILED, or REVERSED"
        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "Transaction amount is required."],
        min: [1, "Amount must be above 0."]
    },
    idempotencyKey: { //An **idempotencyKey** is a code that makes sure the same action isn’t done twice by mistake.
        type: String,
        required: [true, "Idempotency Key is required."],
        index: true,
        unique: true
    }
}, {
    timestamps: true
})

const transactionModel = mongoose.model("transaction", transactionSchema)

module.exports = transactionModel