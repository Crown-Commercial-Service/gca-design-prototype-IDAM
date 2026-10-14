const API_BASE_URL = 'https://api.os.uk/search/places/v1'
const TOKEN_URL = 'https://api.os.uk/oauth2/token/v1'
const REQUEST_TIMEOUT_MS = 10000
const MAX_RESULTS = 100

let cachedAccessToken
let accessTokenExpiresAt = 0

const request = async (url, options = {}) => {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

	try {
		return await fetch(url, { ...options, signal: controller.signal })
	} finally {
		clearTimeout(timeout)
	}
}

const getAccessToken = async () => {
	const apiKey = process.env.OS_PLACES_API_KEY
	const apiSecret = process.env.OS_PLACES_API_SECRET

	if (!apiKey || !apiSecret) {
		const error = new Error('OS Places API credentials are not configured')
		error.code = 'MISSING_OS_PLACES_CREDENTIALS'
		throw error
	}

	if (cachedAccessToken && Date.now() < accessTokenExpiresAt) {
		return cachedAccessToken
	}

	const response = await request(TOKEN_URL, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({ grant_type: 'client_credentials' })
	})

	if (!response.ok) {
		throw new Error(`OS Places OAuth token request failed with status ${response.status}`)
	}

	const token = await response.json()
	if (typeof token.access_token !== 'string' || !token.access_token || !Number.isFinite(Number(token.expires_in))) {
		throw new Error('OS Places OAuth token response was invalid')
	}

	cachedAccessToken = token.access_token
	accessTokenExpiresAt = Date.now() + Math.max(0, Number(token.expires_in) - 30) * 1000
	return cachedAccessToken
}

const findAddressesByPostcode = async postcode => {
	const accessToken = await getAccessToken()
	const url = new URL(`${API_BASE_URL}/postcode`)
	url.searchParams.set('postcode', postcode)
	url.searchParams.set('dataset', 'DPA')
	url.searchParams.set('maxresults', String(MAX_RESULTS))

	const response = await request(url, {
		headers: { Authorization: `Bearer ${accessToken}` }
	})

	if (!response.ok) {
		throw new Error(`OS Places postcode lookup failed with status ${response.status}`)
	}

	const result = await response.json()
	if (!Array.isArray(result.results)) {
		throw new Error('OS Places postcode response did not contain an address list')
	}

	return [...new Set(result.results
		.map(item => item.DPA && item.DPA.ADDRESS)
		.filter(address => typeof address === 'string' && address.trim())
		.map(address => address.trim()))]
}

module.exports = { findAddressesByPostcode }
