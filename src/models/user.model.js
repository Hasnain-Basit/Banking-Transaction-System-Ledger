const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Email is invalid"], // regex
        unique: true
    },
    name: {
        type: String,
        required: [true, "Name is required"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [4, 'Password should contain atleast 4 characters'],
        select: false //means the field won’t show when you get data, unless you specifically ask for it.
    },
    systemUser: { // to create initial funcding for all user account
        type: Boolean,
        default: false,
        immutable: true,
        select: false
    }
}, { timestamps: true })

/*
This runs before saving a user:

If password is changed → hash it
If not → do nothing
*/
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return
    }
    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash
    return
})

/*
It checks if the entered password matches the saved hashed password and returns:
true → if correct
false → if wrong
*/
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password)
}

const userModel = mongoose.model("user", userSchema)


module.exports = userModel