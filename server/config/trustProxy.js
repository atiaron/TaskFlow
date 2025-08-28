// server/config/trustProxy.js
module.exports = function applyTrustProxy(app) {
	const trustFlag = process.env.TRUST_PROXY === '1';
	// Enable trust proxy only when actually behind a proxy (prod/PAAS/LB/CDN)
	app.set('trust proxy', trustFlag ? 1 : false);
	console.log(`🔐 trust proxy = ${app.get('trust proxy')}`);
};
