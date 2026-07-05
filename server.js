require("dotenv").config()
const connectDB = require("./src/config/db")
const app = require("./src/app")
connectDB()
app.listen(3000, () => {
    console.log(process.env.MONGO_URI)
    console.log("Server is running on localhost:3000")
})