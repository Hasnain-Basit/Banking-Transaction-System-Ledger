const mongoose = require("mongoose")
function connectDB() {
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("Connected to DB")
    }).catch(err => {
        console.log("Error in connecting to DB", err)
        console.log(err.message)
        process.exit(1)
    })
}

module.exports = connectDB;