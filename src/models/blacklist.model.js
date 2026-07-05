const mongoose = require("mongoose")


// completely black list the token after logout so even its copied cant be used. 
const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: [true, "Token is required"],
        unqiue: true
    },
}, {
    timestamps: true
})

tokenBlacklistSchema.index(
    { createdAt: 1 },
    {
        expireAfterSeconds: 259200 // 3 days
    })

const tokenBlackListModel = mongoose.model("tokenBlackList", tokenBlacklistSchema)

module.exports = tokenBlackListModel