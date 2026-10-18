/**
 * Centralized cookie configuration for authentication
 *
 * CRITICAL SECURITY NOTES:
 * - Dynamic sameSite based on environment/origin
 * - Always httpOnly: true for tokens (XSS protection)
 * - Always secure: true in production (HTTPS only)
 * - Proper domain and path settings
 *
 * CSRF PROTECTION:
 * This configuration provides multi-layer CSRF protection:
 *
 * 1. sameSite=Lax (default):
 *    - Prevents cookies from being sent with cross-origin requests
 *    - Cookies sent only for same-site requests or top-level navigations
 *    - Blocks most CSRF attacks from third-party sites
 *
 * 2. sameSite=Strict (production same-origin):
 *    - Most restrictive setting
 *    - Cookies only sent for same-site requests
 *    - Even blocks top-level navigations from external sites
 *
 * 3. sameSite=None (cross-origin production):
 *    - Required for cross-origin setups
 *    - Must use secure: true (HTTPS only)
 *    - Additional CSRF measures recommended (see below)
 *
 * 4. httpOnly=true:
 *    - Prevents JavaScript access to cookies
 *    - Blocks XSS-based CSRF attacks
 *
 * 5. secure=true (production):
 *    - Cookies only sent over HTTPS
 *    - Prevents man-in-the-middle attacks
 *
 * ADDITIONAL CSRF RECOMMENDATIONS (if needed):
 * - For cross-origin setups, consider adding CSRF tokens:
 *   - Double-submit cookie pattern
 *   - Synchronizer token pattern
 * - Validate Origin/Referer headers on sensitive endpoints
 * - Use POST for state-changing operations (already implemented)
 */

/**
 * Get effective request origin: Origin header, or origin extracted from Referer (fallback).
 * Some clients/proxies send Referer but not Origin; SameSite=None needs correct origin detection.
 */
function getEffectiveRequestOrigin(options = {}) {
	const origin = options.origin || options.req?.headers?.origin;
	if (origin) return origin;
	const referer = options.req?.headers?.referer;
	if (!referer) return null;
	try {
		const url = new URL(referer);
		return url.origin;
	} catch {
		return null;
	}
}

/**
 * Check if backend URL is a known cloud host (cross-origin with frontend by default).
 */
function isCloudBackendUrl(url) {
	if (!url || typeof url !== 'string') return false;
	return (
		url.includes('.onrender.com') ||
		url.includes('.railway.app') ||
		url.includes('.vercel.app') ||
		url.includes('.herokuapp.com')
	);
}

/**
 * Check if request Host header is a known cloud host (e.g. ibr-server-xxx.onrender.com).
 * Use when BACKEND_URL is not set on the server (e.g. Render) — then we still force SameSite=None.
 */
function isCloudBackendHost(host) {
	if (!host || typeof host !== 'string') return false;
	const h = host
		.toLowerCase()
		.replace(/:(\d+)$/, '')
		.trim();
	return (
		h.includes('.onrender.com') ||
		h.includes('.railway.app') ||
		h.includes('.vercel.app') ||
		h.includes('.herokuapp.com')
	);
}

/**
 * Get cookie options for access token
 * @param {Object} options - Configuration options
 * @param {string} options.origin - Request origin (optional, for sameSite detection)
 * @param {Object} options.req - Express request object (optional, for origin detection)
 * @returns {Object} Cookie options
 */
function getAccessTokenCookieOptions(options = {}) {
	const isProduction = process.env.NODE_ENV === 'production';
	const isDevelopment = process.env.NODE_ENV === 'development';

	// Determine sameSite based on environment and origin
	let sameSite = 'Lax'; // Default: protects most CSRF cases
	let isCrossOrigin = false;

	// CRITICAL: Prefer Origin, fallback to Referer-derived origin (some proxies omit Origin)
	const requestOrigin = getEffectiveRequestOrigin(options);
	const backendUrl = process.env.BACKEND_URL || process.env.API_URL || '';
	// When BACKEND_URL is not set, derive backend host from request (Host header)
	const backendHostFromReq = options.req?.headers?.host
		? String(options.req.headers.host)
				.replace(/:(\d+)$/, '')
				.trim()
		: '';

	const detectCrossOriginFromRequest = () => {
		if (!requestOrigin) return false;
		try {
			const requestDomain = new URL(requestOrigin).hostname.toLowerCase();
			let backendDomain = '';
			if (backendUrl) {
				backendDomain = new URL(backendUrl).hostname.toLowerCase();
			} else if (backendHostFromReq) {
				backendDomain = backendHostFromReq.toLowerCase();
			}
			if (!backendDomain) return false;
			return requestDomain !== backendDomain;
		} catch {
			return false;
		}
	};

	if (isDevelopment) {
		if (requestOrigin && (backendUrl || backendHostFromReq)) {
			try {
				// IMPORTANT:
				// SameSite is based on "site" (scheme + registrable domain), NOT the port.
				// For localhost dev, different ports (3000 vs 8000) are still same-site, so SameSite=Lax works.
				// If we set SameSite=None, browsers require Secure=true and will reject cookies on http://localhost.
				const requestHostname = new URL(requestOrigin).hostname.toLowerCase();
				const backendHostname = (
					backendUrl ? new URL(backendUrl).hostname : backendHostFromReq
				).toLowerCase();
				const hostDifferent = requestHostname !== backendHostname;
				if (hostDifferent) {
					isCrossOrigin = true;
					sameSite = 'None';
				} else {
					sameSite = 'Lax';
				}
			} catch (error) {
				sameSite = 'Lax';
			}
		} else {
			sameSite = 'Lax';
		}
	} else if (isProduction) {
		const frontendUrl = process.env.FRONTEND_URL;

		if (requestOrigin && (backendUrl || backendHostFromReq)) {
			try {
				const requestDomain = new URL(requestOrigin).hostname.toLowerCase();
				const backendDomain = (
					backendUrl ? new URL(backendUrl).hostname : backendHostFromReq
				).toLowerCase();
				if (requestDomain !== backendDomain) {
					isCrossOrigin = true;
					sameSite = 'None';
				} else {
					sameSite = 'Strict';
				}
			} catch (error) {
				console.warn('[CookieConfig] Failed to parse request origin:', error.message);
			}
		}

		if (!isCrossOrigin && frontendUrl && backendUrl) {
			try {
				const frontendDomain = new URL(frontendUrl).hostname.toLowerCase();
				const backendDomain = new URL(backendUrl).hostname.toLowerCase();
				if (frontendDomain !== backendDomain) {
					isCrossOrigin = true;
					sameSite = 'None';
				} else {
					sameSite = 'Strict';
				}
			} catch (error) {
				console.warn('[CookieConfig] Failed to parse env URLs, defaulting to Lax:', error.message);
				sameSite = 'Lax';
			}
		}

		if (!isCrossOrigin && (!frontendUrl || !backendUrl)) {
			if (backendUrl && isCloudBackendUrl(backendUrl)) {
				console.warn(
					'[CookieConfig] Backend on cloud platform but FRONTEND_URL not set. Assuming cross-origin.',
				);
				isCrossOrigin = true;
				sameSite = 'None';
			} else if (requestOrigin && backendHostFromReq) {
				if (detectCrossOriginFromRequest()) {
					isCrossOrigin = true;
					sameSite = 'None';
				} else {
					sameSite = 'Lax';
				}
			} else {
				sameSite = 'Lax';
			}
		}

		// FINAL FALLBACK (prod): backend on cloud host => assume cross-origin so cookies are accepted
		if (!isCrossOrigin && backendUrl && isCloudBackendUrl(backendUrl)) {
			console.warn(
				'[CookieConfig] Production fallback: backend is cloud host, forcing SameSite=None for cross-origin.',
			);
			isCrossOrigin = true;
			sameSite = 'None';
		}

		// CRITICAL: Fallback when BACKEND_URL/FRONTEND_URL not set on Render and Origin may be stripped.
		// If Host is *.onrender.com (etc.), frontend is always another origin — force SameSite=None.
		if (!isCrossOrigin && backendHostFromReq && isCloudBackendHost(backendHostFromReq)) {
			console.warn(
				'[CookieConfig] Production fallback: Host is cloud domain, forcing SameSite=None (set BACKEND_URL/FRONTEND_URL on Render to avoid this).',
			);
			isCrossOrigin = true;
			sameSite = 'None';
		}
	}

	// DEV FALLBACK: if Origin/Referer missing but BACKEND_URL points to different host/port, assume cross-origin
	if (isDevelopment && !isCrossOrigin && backendUrl) {
		try {
			const backendUrlObj = new URL(backendUrl);
			const backendHost = backendUrlObj.hostname.toLowerCase();
			const backendPort = backendUrlObj.port || (backendUrl.includes('https') ? '443' : '80');
			const reqHost = backendHostFromReq.toLowerCase();
			const reqPort = options.req?.headers?.host?.includes(':')
				? String(options.req.headers.host).split(':')[1]
				: '';
			if (requestOrigin) {
				const reqOriginUrl = new URL(requestOrigin);
				if (
					reqOriginUrl.hostname.toLowerCase() !== backendHost ||
					reqOriginUrl.port !== backendPort
				) {
					isCrossOrigin = true;
					sameSite = 'None';
				}
			} else if (reqHost && (backendHost !== reqHost || reqPort !== backendPort)) {
				// No origin header: if Host differs from BACKEND_URL host, we're likely behind proxy — prefer cross-origin for dev
				if (backendHost !== reqHost || (backendPort !== '' && reqPort !== backendPort)) {
					isCrossOrigin = true;
					sameSite = 'None';
				}
			}
		} catch (e) {
			// ignore
		}
	}

	// CRITICAL: For sameSite: 'None', secure MUST be true
	// Browsers reject cookies with sameSite: 'None' without secure: true
	const secure = isProduction || sameSite === 'None';

	const cookieOptions = {
		httpOnly: true, // CRITICAL: Prevents XSS attacks
		secure: secure, // HTTPS only in production OR when sameSite: 'None'
		sameSite: sameSite,
		path: '/',
		// Max age: 24 hours (matches access token expiration)
		maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
	};

	/**
	 * Third-party cookie mitigation (Chrome CHIPS)
	 *
	 * For cross-site setups (e.g. Vercel frontend + Render backend),
	 * browsers increasingly block third-party cookies even with SameSite=None; Secure.
	 *
	 * Chrome supports CHIPS via the `Partitioned` cookie attribute, allowing the cookie
	 * to be stored in a partitioned third-party context (per top-level site).
	 *
	 * Enable by default in production for SameSite=None cookies unless disabled:
	 * - COOKIE_PARTITIONED=true  -> force enable
	 * - COOKIE_PARTITIONED=false -> disable
	 */
	const cookiePartitionedEnv = String(process.env.COOKIE_PARTITIONED || '')
		.toLowerCase()
		.trim();
	const enablePartitioned =
		sameSite === 'None' &&
		secure === true &&
		(cookiePartitionedEnv === 'true' || (isProduction && cookiePartitionedEnv !== 'false'));
	if (enablePartitioned) {
		cookieOptions.partitioned = true;
	}

	// Set domain if specified (for cross-subdomain cookies)
	if (process.env.COOKIE_DOMAIN) {
		cookieOptions.domain = process.env.COOKIE_DOMAIN;
	}

	// Log cookie options in development for debugging
	if (isDevelopment || process.env.DEBUG_COOKIES === 'true') {
		console.log('🍪 [CookieConfig] AccessToken cookie options:', {
			sameSite,
			secure,
			isCrossOrigin,
			requestOrigin,
			backendUrl,
			frontendUrl: process.env.FRONTEND_URL,
		});
	}

	return cookieOptions;
}

/**
 * Get cookie options for refresh token
 * @param {Object} options - Configuration options
 * @param {string} options.origin - Request origin (optional, for sameSite detection)
 * @param {Object} options.req - Express request object (optional, for origin detection)
 * @returns {Object} Cookie options
 */
function getRefreshTokenCookieOptions(options = {}) {
	const accessTokenOptions = getAccessTokenCookieOptions(options);

	// Refresh token has longer expiration: 60 days
	const refreshTokenOptions = {
		...accessTokenOptions,
		maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days in milliseconds
	};

	// Log cookie options in development for debugging
	if (process.env.NODE_ENV === 'development' || process.env.DEBUG_COOKIES === 'true') {
		console.log('🍪 [CookieConfig] RefreshToken cookie options:', {
			sameSite: refreshTokenOptions.sameSite,
			secure: refreshTokenOptions.secure,
			maxAge: refreshTokenOptions.maxAge,
		});
	}

	return refreshTokenOptions;
}

/**
 * Get cookie options for clearing access token (logout)
 * CRITICAL: Must match EXACTLY the options used when setting the cookie
 * Express.js res.clearCookie() requires identical options (path, domain, sameSite, secure, httpOnly)
 *
 * @param {Object} options - Configuration options
 * @param {string} options.origin - Request origin (optional, for sameSite detection)
 * @param {Object} options.req - Express request object (optional, for origin detection)
 * @returns {Object} Cookie options for clearing accessToken
 */
function getClearAccessTokenCookieOptions(options = {}) {
	// Get the EXACT same options as when setting accessToken
	// CRITICAL: Must pass same options (including req) to match setting options
	const accessTokenOptions = getAccessTokenCookieOptions(options);

	// Return same options but with maxAge: 0 to expire immediately
	// CRITICAL: All other options (path, domain, sameSite, secure, httpOnly) must be IDENTICAL
	return {
		...accessTokenOptions,
		maxAge: 0, // Expire immediately
		// Do NOT use expires - use maxAge: 0 for consistency
	};
}

/**
 * Get cookie options for clearing refresh token (logout)
 * CRITICAL: Must match EXACTLY the options used when setting the cookie
 *
 * @param {Object} options - Configuration options
 * @param {string} options.origin - Request origin (optional, for sameSite detection)
 * @param {Object} options.req - Express request object (optional, for origin detection)
 * @returns {Object} Cookie options for clearing refreshToken
 */
function getClearRefreshTokenCookieOptions(options = {}) {
	// Get the EXACT same options as when setting refreshToken
	// CRITICAL: Must pass same options (including req) to match setting options
	const refreshTokenOptions = getRefreshTokenCookieOptions(options);

	// Return same options but with maxAge: 0 to expire immediately
	// CRITICAL: All other options (path, domain, sameSite, secure, httpOnly) must be IDENTICAL
	return {
		...refreshTokenOptions,
		maxAge: 0, // Expire immediately
	};
}

/**
 * @deprecated Use getClearAccessTokenCookieOptions() and getClearRefreshTokenCookieOptions() instead
 * Kept for backward compatibility but should not be used
 */
function getClearCookieOptions(options = {}) {
	// Return access token clear options as default
	// But prefer using specific functions above
	return getClearAccessTokenCookieOptions(options);
}

/**
 * Validates that cookie clearing options match setting options exactly
 * CRITICAL: Express.js res.clearCookie() requires identical options
 *
 * @param {string} cookieType - 'accessToken' or 'refreshToken'
 * @returns {boolean} true if options match, false otherwise
 */
function validateCookieOptionsMatch(cookieType = 'accessToken') {
	const setOptions =
		cookieType === 'refreshToken' ? getRefreshTokenCookieOptions() : getAccessTokenCookieOptions();

	const clearOptions =
		cookieType === 'refreshToken'
			? getClearRefreshTokenCookieOptions()
			: getClearAccessTokenCookieOptions();

	// Check all critical properties match (except maxAge which should differ)
	const criticalKeys = ['httpOnly', 'secure', 'sameSite', 'path'];
	const domainKey = 'domain';

	for (const key of criticalKeys) {
		if (setOptions[key] !== clearOptions[key]) {
			console.error(
				`❌ [CookieConfig] ${cookieType} options mismatch for '${key}':`,
				`set=${setOptions[key]}, clear=${clearOptions[key]}`,
			);
			return false;
		}
	}

	// Domain is optional, check if both have it or neither has it
	if (
		(setOptions[domainKey] !== undefined || clearOptions[domainKey] !== undefined) &&
		setOptions[domainKey] !== clearOptions[domainKey]
	) {
		console.error(
			`❌ [CookieConfig] ${cookieType} domain mismatch:`,
			`set=${setOptions[domainKey]}, clear=${clearOptions[domainKey]}`,
		);
		return false;
	}

	// Validate that clear options have maxAge: 0
	if (clearOptions.maxAge !== 0) {
		console.error(`❌ [CookieConfig] ${cookieType} clear options should have maxAge: 0`);
		return false;
	}

	return true;
}

/**
 * Self-test function to validate cookie configuration on startup
 * Call this during server initialization to catch configuration errors early
 */
function validateAllCookieOptions() {
	const accessTokenValid = validateCookieOptionsMatch('accessToken');
	const refreshTokenValid = validateCookieOptionsMatch('refreshToken');

	if (accessTokenValid && refreshTokenValid) {
		console.log('✅ [CookieConfig] All cookie options validated successfully');
		return true;
	} else {
		console.error('❌ [CookieConfig] Cookie options validation FAILED');
		console.error('   This will cause logout to fail silently!');
		return false;
	}
}

export {
	getAccessTokenCookieOptions,
	getRefreshTokenCookieOptions,
	getClearAccessTokenCookieOptions,
	getClearRefreshTokenCookieOptions,
	getClearCookieOptions, // Deprecated but kept for backward compatibility
	validateCookieOptionsMatch,
	validateAllCookieOptions,
};
