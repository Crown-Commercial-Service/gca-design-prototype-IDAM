const API_BASE_URL = 'https://api.company-information.service.gov.uk'
const REQUEST_TIMEOUT_MS = 10000

const requestJson = async (url, apiKey) => {
	const controller = new AbortController()
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

	try {
		const response = await fetch(url, {
			headers: {
				Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
				Accept: 'application/json'
			},
			signal: controller.signal
		})

		if (response.status === 404) {
			return null
		}
		if (!response.ok) {
			const error = new Error(`Companies House API request failed with status ${response.status}`)
			error.code = `COMPANIES_HOUSE_HTTP_${response.status}`
			throw error
		}

		return response.json()
	} finally {
		clearTimeout(timeout)
	}
}

const findCompanyByNumber = async companyNumber => {
	const apiKey = process.env.COMPANIES_HOUSE_API_KEY

	if (!apiKey) {
		const error = new Error('Companies House API key is not configured')
		error.code = 'MISSING_COMPANIES_HOUSE_API_KEY'
		throw error
	}

	const encodedCompanyNumber = encodeURIComponent(companyNumber)
	const company = await requestJson(`${API_BASE_URL}/company/${encodedCompanyNumber}`, apiKey)
	if (!company) {
		return null
	}
	if (typeof company.company_name !== 'string') {
		throw new Error('Companies House API returned an invalid company name')
	}

	const registeredOfficeAddress = await requestJson(
		`${API_BASE_URL}/company/${encodedCompanyNumber}/registered-office-address`,
		apiKey
	)

	return {
		name: company.company_name,
		address: registeredOfficeAddress
	}
}

module.exports = { findCompanyByNumber }
