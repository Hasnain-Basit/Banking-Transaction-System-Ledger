const userModel = require("../models/user.model")
const tokenBlackListModel = require("../models/blacklist.model")
const jwt = require("jsonwebtoken")
// const emailService = require("../services/email.service")

async function userRegisterController(req, res) {
    const { email, password, name } = req.body
    const isExist = await userModel.findOne({
        email: email
    })
    if (isExist) {
        return res.status(422).json({
            message: "Email already exist",
            status: "Failed"
        })
    }
    const user = await userModel.create({
        email, password, name
    })
    const token = jwt.sign({
        userId: user._id
    }, process.env.JWT_SECRET, {
        expiresIn: "3d"
    })
    res.cookie("token", token)
    return res.status(201).json({
        message: "User registered successfully",
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })
}

async function userLoginController(req, res) {
    const { email, password } = req.body
    const user = await userModel.findOne({ email }).select("+password") // select:false was set for password
    // using the comparePassword created in user.model.js
    const isValidPassword = await user.comparePassword(password)
    if (!user || !isValidPassword) {
        return res.status(401).json({
            message: "Invalid credentials"
        })
    }
    const token = jwt.sign({
        userId: user._id
    }, process.env.JWT_SECRET, {
        expiresIn: "3d"
    })
    res.cookie("token", token)
    return res.status(201).json({
        message: "Login successful",
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        },
        token
    })
    // await emailService.sendRegistrationEmail(user.email, user.name)
}

async function userLogoutController(req, res) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if (!token) {
        return res.status(200).json({
            message: "User logged out successfully OR Token not found"
        })
    }
    res.clearCookie("token")
    await tokenBlackListModel.create({
        token: token
    })
    return res.status(200).json({
        message: "User logged out successfully"
    })
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController
}