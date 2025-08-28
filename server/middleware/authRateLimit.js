// server/middleware/authRateLimit.js
const rateLimit = require('express-rate-limit');

const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60000);
const max = Number(process.env.RATE_LIMIT_MAX || 5);

// Skip CORS preflight and health
const skip = (req) => (
	req.method === 'OPTIONS' ||
	req.path === '/api/health'
);


const handler = (req, res /* , next */) => {
	return res.status(429).json({
		error: 'too_many_requests',
		message: 'יותר מדי ניסיונות, המתינו רגע ונסו שוב.'
	});
};

const authLimiter = rateLimit({
	windowMs,
	max,
	standardHeaders: true,
	legacyHeaders: false,
	skip,
		// Use default IP-based key generator (respects trust proxy)
	handler
});

module.exports = { authLimiter };
