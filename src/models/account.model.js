const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")
const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Account must be associated with a user"],
        // Index improves query performance for lookups, filtering, and relationships on this field.
        index: true,
    },
    status: {
        type: String,
        enum: {
            values: ["ACTIVE", "PENDING", "FROZEN", "SUSPENDED", "CLOSED"],
            message: "Status can be one of: ACTIVE, PENDING, FROZEN, SUSPENDED, CLOSED."
        },
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "PKR"
    },
}, {
    timestamps: true
})

// Compound index to speed up queries filtering by user and status together
accountSchema.index({ user: 1, status: 1 })

accountSchema.methods.getBalance = async function () {

    const balanceData = await ledgerModel.aggregate([

        // Get only this account's ledger entries
        { $match: { account: this._id } },

        {
            // Combine all entries
            $group: {
                _id: null,

                // Sum debit amounts only
                totalDebit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "DEBIT"] },
                            "$amount",
                            0
                        ]
                    }
                },

                // Sum credit amounts only
                totalCredit: {
                    $sum: {
                        $cond: [
                            { $eq: ["$type", "CREDIT"] },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },

        {
            // Final balance calculation
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalCredit", "$totalDebit"] }
            }
        }
    ])

    // If no transactions exist, balance is 0
    if (balanceData.length === 0) {
        return 0
    }

    return balanceData[0].balance
}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel