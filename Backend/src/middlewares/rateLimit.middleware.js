const rateLimit = require("express-rate-limit")

/**
 * Rate limits protect your Gemini quota and stop password-guessing.
 * Limits can be changed in .env without touching code.
 * Responses are JSON, so Postman / the frontend show a clear message.
 */

const json = (message) => (req, res) => res.status(429).json({ message })

// login / register: per IP
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.AUTH_RATE_LIMIT) || 50,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: json("Too many login attempts. Please try again in 15 minutes."),
})

// AI-powered routes: per logged-in user (falls back to IP)
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: Number(process.env.AI_RATE_LIMIT) || 60,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?.id || req.ip),
    handler: json("You've used the AI a lot in the last hour. Please try again a bit later."),
})

module.exports = { authLimiter, aiLimiter }
