import rateLimit from "express-rate-limit";


// COMMON HANDLER (Consistent JSON)
const jsonHandler = (req, res) => {
    return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later."
    });
};

// ======================================================
// 1️. AUTH LIMITER (Strict IP-based)
// Protect login/register brute force
// ======================================================
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 attempts per IP
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, //  only count failed attempts
    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: "Too many authentication attempts. Try again later."
        });
    }
});


// ======================================================
// 2. GLOBAL API LIMITER (IP-based safety net)
// Prevent general spam
// ======================================================
export const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 120, // 120 requests per minute per IP
    standardHeaders: true,
    legacyHeaders: false,
    handler: jsonHandler
});


// ======================================================
// 3. USER ACTION LIMITER (User-based)
// For normal session actions
// ======================================================
export const userActionLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60, // must match heartbeat frequency
    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        if (req.user?.userId) {
            return `user-${req.user.userId}`;
        }
        return `ip-${req.ip}`;
    },

    handler: (req, res) => {
        return res.status(429).json({
            success: false,
            message: "Too many actions. Slow down."
        });
    }
});


// ======================================================
// 4️. AI LIMITER (Critical — Protect AI Costs)
// Strict user-based limiter for video-event
// ======================================================
export const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 🔥 lower than general actions
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        if (req.user && req.user.userId) {
            return `ai-user-${req.user.userId}`;
        }
        return `ai-ip-${req.ip}`;
    },
    message: {
        success: false,
        message: "Too many AI validation attempts."
    }
});
