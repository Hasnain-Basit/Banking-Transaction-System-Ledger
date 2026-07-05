const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../models/blacklist.model")



async function authMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized Access, Access Denied! (Token not found)"
        })
    }
    const isTokenBlacklisted = await tokenBlackListModel.findOne({ token })
    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized Access, Token is invalid"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET) // returns user._id if valid token
        const user = await userModel.findById(decoded.userId)
        req.user = user
        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized Access, Invalid Token!"
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1]
    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token now found"
        })
    }
    const isTokenBlacklisted = await tokenBlackListModel.findOne({ token })
    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "Unauthorized Access, Token is invalid"
        })
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await userModel.findById(decoded.userId).select("+systemUser")
        if (!user.systemUser) {
            return res.status(403).json({
                message: "Access not granted, not a SYSTEM USER"
            })
        }
        req.user = user
        console.log("req.user = user", req.user)
        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized Access, token is invalid"
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}