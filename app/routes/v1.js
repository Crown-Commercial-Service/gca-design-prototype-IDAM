const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') })

const { findAddressesByPostcode } = require('../services/os-places')
const { findCompanyByNumber } = require('../services/companies-house')
const countries = require('../data/countries')
const fallbackAddressLines = ['123 Example Street', 'London', 'SW1A 1AA', 'United Kingdom']

const getData = req => {
	if (!req.session.data) {
		req.session.data = {}
	}

	return req.session.data
}

const getOrganisationDisplay = data => {
	if (data.organisationDetailsRoute === 'companies-house' &&
		data.organisationIsCorrect === 'yes' &&
		data.companiesHouseDetails) {
		const address = data.companiesHouseDetails.address || {}
		const addressLines = [
			address.care_of,
			address.po_box,
			address.address_line_1,
			address.address_line_2,
			address.locality,
			address.region,
			address.postal_code,
			address.country
		].filter(Boolean)

		return {
			name: data.companiesHouseDetails.name,
			addressLines: addressLines.length ? addressLines : fallbackAddressLines
		}
	}

	let addressLines = []
	if (data.organisationAddressRoute === 'manual-international') {
		addressLines = [
			data.internationalAddressLine1,
			data.internationalAddressLine2,
			data.internationalTown,
			data.internationalPostcode,
			data.internationalCountry
		].filter(Boolean)
	} else if (data.organisationAddressRoute === 'manual-uk') {
		addressLines = [
			data.addressLine1,
			data.addressLine2,
			data.addressTown,
			data.addressPostcode
		].filter(Boolean)
	} else if (data.organisationAddressRoute === 'os-places') {
		addressLines = (data.selectedOrganisationAddress || '')
			.split(',')
			.map(line => line.trim())
			.filter(Boolean)
		const normalizedAddressLines = addressLines.map(line => line.replace(/\s/g, '').toUpperCase())
		const normalizedPostcode = (data.organisationPostcode || '').replace(/\s/g, '').toUpperCase()
		if (normalizedPostcode && !normalizedAddressLines.includes(normalizedPostcode)) {
			addressLines.push(data.organisationPostcode)
		}
	} else {
		addressLines = fallbackAddressLines
	}

	return {
		name: data.organisationName || 'Test organisation',
		addressLines
	}
}

const renderPage = (req, res, view, pageId, additionalData = {}) => {
	const data = getData(req)
	const phoneEnding = data.phoneNumber
		? String(data.phoneNumber).slice(-4)
		: pageId === 'check-your-phone' ? '1234' : ''

	res.render(view, {
		version: 'v1',
		pageId,
		data,
		summaryData: data,
		organisationDisplay: getOrganisationDisplay(data),
		phoneEnding,
		...additionalData
	})
}

const redirectAfterPost = (req, res, pageId, nextPage, oneLoginPage = false) => {
	getData(req).previousPage = pageId
	res.redirect(nextPage === 'home' ? '/v1/registration' : `/v1/registration/${oneLoginPage ? 'one-login/' : ''}${nextPage}`)
}

module.exports = router => {
	router.get('/v1', (req, res) => res.redirect('/v1/registration'))

	router.get('/v1/registration', (req, res) => {
		const data = getData(req)
		data.entryPoint = 'idam'
		if (!data.previousPage) {
			data.previousPage = 'home'
		}
		res.render('v1/registration/index', { version: 'v1' })
	})

	router.get('/v1/home', (req, res) => res.redirect('/v1/registration'))
	router.get('/v1/registration/home', (req, res) => res.redirect('/v1/registration'))

	router.get('/v1/registration/candidate-start', (req, res) => {
		const data = getData(req)
		data.entryPoint = 'candidate'
		data.previousPage = 'home'
		res.redirect('/v1/registration/one-login/sign-up-start')
	})

	router.get('/v1/registration/one-login/sign-up-start', (req, res) => renderPage(req, res, 'v1/registration/one-login/sign-up-start', 'sign-up-start'))
	router.post('/v1/registration/one-login/sign-up-start', (req, res) => {
		const data = getData(req)
		const accountAction = (req.body || {}).accountAction
		if (accountAction !== 'sign-in' && accountAction !== 'create-account') {
			return res.sendStatus(400)
		}
		data.accountAction = accountAction
		redirectAfterPost(req, res, 'sign-up-start', accountAction === 'sign-in' ? 'login-email' : 'create-email', true)
	})

	router.get('/v1/registration/one-login/create-email', (req, res) => renderPage(req, res, 'v1/registration/one-login/create-email', 'create-email'))
	router.post('/v1/registration/one-login/create-email', (req, res) => {
		getData(req).email = (req.body || {}).email
		redirectAfterPost(req, res, 'create-email', 'verify-email', true)
	})

	router.get('/v1/registration/one-login/verify-email', (req, res) => renderPage(req, res, 'v1/registration/one-login/verify-email', 'verify-email'))
	router.post('/v1/registration/one-login/verify-email', (req, res) => {
		delete getData(req).emailCode
		redirectAfterPost(req, res, 'verify-email', 'create-password', true)
	})

	router.get('/v1/registration/one-login/create-password', (req, res) => renderPage(req, res, 'v1/registration/one-login/create-password', 'create-password'))
	router.post('/v1/registration/one-login/create-password', (req, res) => {
		const data = getData(req)
		delete data.password
		delete data['confirm-password']
		redirectAfterPost(req, res, 'create-password', 'get-security-codes', true)
	})

	router.get('/v1/registration/one-login/get-security-codes', (req, res) => renderPage(req, res, 'v1/registration/one-login/get-security-codes', 'get-security-codes'))
	router.post('/v1/registration/one-login/get-security-codes', (req, res) => {
		getData(req).mfaOptions = (req.body || {}).mfaOptions
		redirectAfterPost(req, res, 'get-security-codes', getData(req).mfaOptions === 'AUTH_APP' ? 'authenticator-app' : 'mobile-phone', true)
	})

	router.get('/v1/registration/one-login/mobile-phone', (req, res) => renderPage(req, res, 'v1/registration/one-login/mobile-phone', 'mobile-phone'))
	router.post('/v1/registration/one-login/mobile-phone', (req, res) => {
		getData(req).phoneNumber = (req.body || {}).phoneNumber
		redirectAfterPost(req, res, 'mobile-phone', 'check-your-phone', true)
	})

	router.get('/v1/registration/one-login/check-your-phone', (req, res) => renderPage(req, res, 'v1/registration/one-login/check-your-phone', 'check-your-phone'))
	router.post('/v1/registration/one-login/check-your-phone', (req, res) => {
		delete getData(req).code
		const isLogin = getData(req).previousPage === 'login-password'
		redirectAfterPost(req, res, 'check-your-phone', isLogin ? 'continue-service' : 'account-created', !isLogin)
	})

	router.get('/v1/registration/one-login/authenticator-app', (req, res) => renderPage(req, res, 'v1/registration/one-login/authenticator-app', 'authenticator-app'))
	router.post('/v1/registration/one-login/authenticator-app', (req, res) => {
		delete getData(req).authenticatorCode
		redirectAfterPost(req, res, 'authenticator-app', 'account-created', true)
	})

	router.get('/v1/registration/one-login/account-created', (req, res) => renderPage(req, res, 'v1/registration/one-login/account-created', 'account-created'))
	router.post('/v1/registration/one-login/account-created', (req, res) => redirectAfterPost(req, res, 'account-created', 'enter-your-name'))

	router.get('/v1/registration/one-login/login-email', (req, res) => renderPage(req, res, 'v1/registration/one-login/login-email', 'login-email'))
	router.post('/v1/registration/one-login/login-email', (req, res) => {
		getData(req).email = (req.body || {}).email
		redirectAfterPost(req, res, 'login-email', 'login-password', true)
	})

	router.get('/v1/registration/one-login/login-password', (req, res) => renderPage(req, res, 'v1/registration/one-login/login-password', 'login-password'))
	router.post('/v1/registration/one-login/login-password', (req, res) => {
		delete getData(req).loginPassword
		redirectAfterPost(req, res, 'login-password', 'login-check-your-phone', true)
	})

	router.get('/v1/registration/one-login/login-check-your-phone', (req, res) => renderPage(req, res, 'v1/registration/one-login/login-check-your-phone', 'login-check-your-phone'))
	router.post('/v1/registration/one-login/login-check-your-phone', (req, res) => {
		delete getData(req).code
		redirectAfterPost(req, res, 'login-check-your-phone', 'enter-your-name')
	})

	router.get('/v1/registration/one-login/reset-password-check-email', (req, res) => res.render('v1/registration/one-login/reset-password-check-email'))

	router.get('/v1/registration/one-login/login-second-factor', (req, res) => renderPage(req, res, 'v1/registration/one-login/login-second-factor', 'login-second-factor'))
	router.post('/v1/registration/one-login/login-second-factor', (req, res) => {
		const data = getData(req)
		data.loginTwoFactorMethod = (req.body || {}).loginTwoFactorMethod
		redirectAfterPost(req, res, 'login-second-factor', data.loginTwoFactorMethod === 'authenticator' ? 'authenticator-code' : 'check-phone', true)
	})

	router.get('/v1/registration/one-login/check-phone', (req, res) => renderPage(req, res, 'v1/registration/one-login/check-phone', 'check-phone'))
	router.post('/v1/registration/one-login/check-phone', (req, res) => {
		delete getData(req).loginTextCode
		redirectAfterPost(req, res, 'check-phone', 'continue-service')
	})

	router.get('/v1/registration/one-login/authenticator-code', (req, res) => renderPage(req, res, 'v1/registration/one-login/authenticator-code', 'authenticator-code'))
	router.post('/v1/registration/one-login/authenticator-code', (req, res) => {
		delete getData(req).loginAuthenticatorCode
		redirectAfterPost(req, res, 'authenticator-code', 'continue-service')
	})

	router.get('/v1/registration/continue-service', (req, res) => res.redirect('/v1/registration/enter-your-name'))
	router.post('/v1/registration/continue-service', (req, res) => redirectAfterPost(req, res, 'continue-service', 'enter-your-name'))

	router.get('/v1/registration/enter-your-name', (req, res) => renderPage(req, res, 'v1/registration/enter-your-name', 'enter-your-name'))
	router.post('/v1/registration/enter-your-name', (req, res) => {
		const data = getData(req)
		data.firstName = (req.body || {}).firstName
		data.lastName = (req.body || {}).lastName
		redirectAfterPost(req, res, 'enter-your-name', 'register-your-organisation')
	})

	router.get('/v1/registration/organisation-select', (req, res) => renderPage(req, res, 'v1/registration/organisation-select', 'organisation-select'))
	router.get('/v1/registration/org-account-already-exists', (req, res) => {
		const data = getData(req)
		if (data.matchingOrganisationName !== 'Test Limited') {
			return res.redirect('/v1/registration/register-your-organisation')
		}
		renderPage(req, res, 'v1/registration/org-account-already-exists', 'org-account-already-exists', {
			backUrl: data.matchingOrganisationSource === 'companies-house'
				? '/v1/registration/companies-house-check'
				: '/v1/registration/organisation-name'
		})
	})
	router.post('/v1/registration/org-account-already-exists', (req, res) => {
		const data = getData(req)
		data.requestToJoin = (req.body || {}).requestToJoin
		data.shareDetailsConsent = (req.body || {}).shareDetailsConsent
		redirectAfterPost(req, res, 'org-account-already-exists', data.requestToJoin === 'yes' ? 'request-access-sent' : 'cannot-continue')
	})
	router.get('/v1/registration/request-access-sent', (req, res) => renderPage(req, res, 'v1/registration/request-access-sent', 'request-access-sent'))
	router.post('/v1/registration/organisation-select', (req, res) => {
		const data = getData(req)
		data.organisationChoice = (req.body || {}).organisationChoice
		if (data.organisationChoice !== 'existing') {
			delete data.matchingOrganisationName
			delete data.matchingOrganisationSource
		}
		redirectAfterPost(req, res, 'organisation-select', data.organisationChoice === 'existing' ? 'join-organisation' : 'register-your-organisation')
	})

	router.get('/v1/registration/register-your-organisation', (req, res) => renderPage(req, res, 'v1/registration/register-your-organisation', 'register-your-organisation'))
	router.post('/v1/registration/register-your-organisation', (req, res) => redirectAfterPost(req, res, 'register-your-organisation', 'organisation-activities'))

	router.get('/v1/registration/companies-house-check', (req, res) => {
		if (getData(req).organisationActivities === 'buyer') {
			return res.redirect('/v1/registration/registry-check')
		}
		renderPage(req, res, 'v1/registration/companies-house-check', 'companies-house-check')
	})
	router.post('/v1/registration/companies-house-check', async (req, res) => {
		const data = getData(req)
		if (data.organisationActivities === 'buyer') {
			return res.redirect('/v1/registration/registry-check')
		}
		const body = req.body || {}
		data.hasCompaniesHouseNumber = body.hasCompaniesHouseNumber
		data.companiesHouseNumber = data.hasCompaniesHouseNumber === 'yes' && typeof body.companiesHouseNumber === 'string'
			? body.companiesHouseNumber.trim().replace(/\s+/g, '').toUpperCase()
			: undefined
		delete data.companiesHouseDetails
		delete data.organisationIsCorrect
		delete data.organisationDetailsRoute
		delete data.matchingOrganisationName
		delete data.matchingOrganisationSource
		delete data.matchingOrganisationSource
		delete data.organisationAddressRoute
		delete data.hasCompletedRegistryCheck
		delete data.selectedRegistry
		delete data.registryNumber
		delete data.organisationName
		delete data.organisationPostcode
		delete data.organisationAddresses
		delete data.selectedOrganisationAddress
		delete data.addressLine1
		delete data.addressLine2
		delete data.addressTown
		delete data.addressPostcode
		delete data.internationalAddressLine1
		delete data.internationalAddressLine2
		delete data.internationalTown
		delete data.internationalPostcode
		delete data.internationalCountry

		if (data.hasCompaniesHouseNumber === 'yes') {
			if (!/^[A-Z0-9]{8}$/.test(data.companiesHouseNumber || '')) {
				return renderPage(req, res, 'v1/registration/companies-house-check', 'companies-house-check', {
					companiesHouseError: { text: 'Enter a valid companies house number' }
				})
			}

			try {
				data.companiesHouseDetails = await findCompanyByNumber(data.companiesHouseNumber)
				if (!data.companiesHouseDetails) {
					return renderPage(req, res, 'v1/registration/companies-house-check', 'companies-house-check', {
						companiesHouseError: { text: 'No company details found' }
					})
				}
				data.organisationDetailsRoute = 'companies-house'
				if (data.companiesHouseNumber === '04301762' ||
					data.companiesHouseDetails.name.trim().toLowerCase() === 'test limited') {
					data.matchingOrganisationName = 'Test Limited'
					data.matchingOrganisationSource = 'companies-house'
				}
			} catch (error) {
				console.error('Companies House lookup failed:', error.code || error.message)
				let message = 'We could not retrieve company details just now. Try again.'
				if (error.code === 'MISSING_COMPANIES_HOUSE_API_KEY') {
					message = 'The Companies House lookup is not configured. Check the API key setting and restart the prototype.'
				} else if (error.code === 'COMPANIES_HOUSE_HTTP_401') {
					message = 'The Companies House API did not accept the API key. Check the key and restart the prototype.'
				} else if (error.code === 'COMPANIES_HOUSE_HTTP_403') {
					message = 'The Companies House API key does not have permission to make this lookup.'
				} else if (error.code === 'COMPANIES_HOUSE_HTTP_429') {
					message = 'The Companies House service is receiving too many requests. Try again shortly.'
				}
				return renderPage(req, res, 'v1/registration/companies-house-check', 'companies-house-check', {
					companiesHouseError: { text: message }
				})
			}
		} else {
			data.organisationDetailsRoute = 'manual'
		}

		const nextPage = data.hasCompaniesHouseNumber === 'yes' ? 'organisation-correct' : 'registry-check'
		redirectAfterPost(req, res, 'companies-house-check', nextPage)
	})

	router.get('/v1/registration/registry-check', (req, res) => renderPage(req, res, 'v1/registration/registry-check', 'registry-check'))
	router.post('/v1/registration/registry-check', (req, res) => {
		const data = getData(req)
		data.selectedRegistry = (req.body || {}).selectedRegistry
		data.hasCompletedRegistryCheck = true
		if (data.organisationDetailsRoute !== 'companies-house') {
			data.organisationDetailsRoute = 'manual'
		}
		redirectAfterPost(req, res, 'registry-check', data.selectedRegistry !== 'no' ? 'registry-number' : 'organisation-name')
	})

	router.get('/v1/registration/registry-number', (req, res) => renderPage(req, res, 'v1/registration/registry-number', 'registry-number'))
	router.post('/v1/registration/registry-number', (req, res) => {
		getData(req).registryNumber = (req.body || {}).registryNumber
		redirectAfterPost(req, res, 'registry-number', 'organisation-name')
	})

	router.get('/v1/registration/organisation-correct', (req, res) => {
		const data = getData(req)
		if (data.hasCompaniesHouseNumber !== 'yes' || !data.companiesHouseDetails) {
			return res.redirect('/v1/registration/companies-house-check')
		}
		renderPage(req, res, 'v1/registration/organisation-correct', 'organisation-correct')
	})
	router.post('/v1/registration/organisation-correct', (req, res) => {
		const data = getData(req)
		if (data.hasCompaniesHouseNumber !== 'yes' || !data.companiesHouseDetails) {
			return res.redirect('/v1/registration/companies-house-check')
		}
		data.organisationIsCorrect = (req.body || {}).organisationIsCorrect
		if (data.organisationIsCorrect !== 'yes') {
			delete data.organisationDetailsRoute
			delete data.hasCompletedRegistryCheck
		}
		const nextPage = data.organisationIsCorrect !== 'yes'
			? 'companies-house-check'
			: data.matchingOrganisationSource === 'companies-house'
				? 'org-account-already-exists'
				: 'organisation-admin'
		redirectAfterPost(req, res, 'organisation-correct', nextPage)
	})

	router.get('/v1/registration/organisation-name', (req, res) => renderPage(req, res, 'v1/registration/organisation-name', 'organisation-name'))
	router.post('/v1/registration/organisation-name', (req, res) => {
		const data = getData(req)
		data.organisationName = typeof (req.body || {}).organisationName === 'string'
			? req.body.organisationName.trim()
			: ''
		if (data.organisationName.toLowerCase() === 'test limited') {
			data.matchingOrganisationName = 'Test Limited'
			data.matchingOrganisationSource = 'organisation-name'
			return redirectAfterPost(req, res, 'organisation-name', 'org-account-already-exists')
		}
		delete data.matchingOrganisationName
		delete data.matchingOrganisationSource
		redirectAfterPost(req, res, 'organisation-name', 'organisation-postcode')
	})

	router.get('/v1/registration/organisation-postcode', (req, res) => renderPage(req, res, 'v1/registration/organisation-postcode', 'organisation-postcode'))
	router.post('/v1/registration/organisation-postcode', async (req, res) => {
		const data = getData(req)
		const submittedPostcode = (req.body || {}).organisationPostcode
		data.organisationPostcode = typeof submittedPostcode === 'string' ? submittedPostcode.trim() : ''
		data.organisationAddresses = []
		data.selectedOrganisationAddress = undefined
		if (!data.organisationPostcode) {
			return renderPage(req, res, 'v1/registration/organisation-postcode', 'organisation-postcode', {
				postcodeLookupError: {
					text: 'Enter a UK postcode to find your organisation’s address.'
				}
			})
		}
		if (!/^([A-Za-z][A-Ha-hJ-Yj-y]?[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}|[Gg][Ii][Rr] ?0[Aa]{2})$/.test(data.organisationPostcode)) {
			return renderPage(req, res, 'v1/registration/organisation-postcode', 'organisation-postcode', {
				postcodeLookupError: {
					text: 'Enter a valid UK postcode'
				}
			})
		}

		try {
			const addresses = await findAddressesByPostcode(data.organisationPostcode)
			data.organisationAddresses = addresses.map(address => ({ text: address, value: address }))
			data.selectedOrganisationAddress = undefined
		} catch (error) {
			console.error('OS Places postcode lookup failed:', error.code || error.message)
			const message = error.code === 'MISSING_OS_PLACES_CREDENTIALS'
				? 'Address lookup is not configured. Enter your organisation’s address manually.'
				: 'We could not look up that postcode just now. Try again.'
			return renderPage(req, res, 'v1/registration/organisation-postcode', 'organisation-postcode', {
				postcodeLookupError: {
					text: message,
					manualLink: true
				}
			})
		}
		redirectAfterPost(req, res, 'organisation-postcode', 'organisation-address-select')
	})

	router.get('/v1/registration/organisation-address-select', (req, res) => renderPage(req, res, 'v1/registration/organisation-address-select', 'organisation-address-select'))
	router.post('/v1/registration/organisation-address-select', (req, res) => {
		const data = getData(req)
		const selectedAddress = (req.body || {}).selectedOrganisationAddress
		const isAddressFromLookup = Array.isArray(data.organisationAddresses) &&
			data.organisationAddresses.some(address => address.value === selectedAddress)
		if (!isAddressFromLookup) {
			return renderPage(req, res, 'v1/registration/organisation-address-select', 'organisation-address-select', {
				addressSelectionError: { text: 'Select an address or enter it manually.' }
			})
		}
		delete data.addressLine1
		delete data.addressLine2
		delete data.addressTown
		delete data.addressPostcode
		delete data.internationalAddressLine1
		delete data.internationalAddressLine2
		delete data.internationalTown
		delete data.internationalPostcode
		delete data.internationalCountry
		data.selectedOrganisationAddress = selectedAddress
		data.organisationAddressRoute = selectedAddress === 'manual' ? undefined : 'os-places'
		redirectAfterPost(req, res, 'organisation-address-select', data.selectedOrganisationAddress === 'manual' ? 'organisation-address' : 'organisation-admin')
	})

	router.get('/v1/registration/organisation-address', (req, res) => renderPage(req, res, 'v1/registration/organisation-address', 'organisation-address'))
	router.post('/v1/registration/organisation-address', (req, res) => {
		const data = getData(req)
		data.addressLine1 = (req.body || {}).addressLine1
		data.addressLine2 = (req.body || {}).addressLine2
		data.addressTown = (req.body || {}).addressTown
		data.addressPostcode = (req.body || {}).addressPostcode
		data.organisationAddressRoute = 'manual-uk'
		delete data.internationalAddressLine1
		delete data.internationalAddressLine2
		delete data.internationalTown
		delete data.internationalPostcode
		delete data.internationalCountry
		delete data.selectedOrganisationAddress
		if (typeof data.organisationName === 'string' &&
			data.organisationName.trim().toLowerCase() === 'test limited') {
			data.matchingOrganisationName = 'Test Limited'
			data.matchingOrganisationSource = 'manual-address'
			return redirectAfterPost(req, res, 'organisation-address', 'org-account-already-exists')
		}
		redirectAfterPost(req, res, 'organisation-address', 'organisation-admin')
	})

	router.get('/v1/registration/international-organisation-address', (req, res) => {
		const data = getData(req)
		renderPage(req, res, 'v1/registration/international-organisation-address', 'international-organisation-address', {
			countryItems: [
				{ value: '', text: 'Choose a country', selected: !data.internationalCountry },
				...countries.map(country => ({
					...country,
					selected: country.value === data.internationalCountry
				}))
			]
		})
	})
	router.post('/v1/registration/international-organisation-address', (req, res) => {
		const data = getData(req)
		data.internationalAddressLine1 = (req.body || {}).internationalAddressLine1
		data.internationalAddressLine2 = (req.body || {}).internationalAddressLine2
		data.internationalTown = (req.body || {}).internationalTown
		data.internationalPostcode = (req.body || {}).internationalPostcode
		data.internationalCountry = (req.body || {}).internationalCountry
		data.organisationAddressRoute = 'manual-international'
		delete data.addressLine1
		delete data.addressLine2
		delete data.addressTown
		delete data.addressPostcode
		delete data.selectedOrganisationAddress
		if (typeof data.organisationName === 'string' &&
			data.organisationName.trim().toLowerCase() === 'test limited') {
			data.matchingOrganisationName = 'Test Limited'
			data.matchingOrganisationSource = 'manual-address'
			return redirectAfterPost(req, res, 'international-organisation-address', 'org-account-already-exists')
		}
		redirectAfterPost(req, res, 'international-organisation-address', 'organisation-admin')
	})

	router.get('/v1/registration/organisation-admin', (req, res) => renderPage(req, res, 'v1/registration/organisation-admin', 'organisation-admin'))
	router.post('/v1/registration/organisation-admin', (req, res) => {
		const data = getData(req)
		data.isOrganisationAdmin = (req.body || {}).isOrganisationAdmin
		const nextPage = data.organisationActivities === 'buyer' ? 'organisation-type' : 'organisation-description'
		redirectAfterPost(req, res, 'organisation-admin', data.isOrganisationAdmin === 'yes' ? nextPage : 'cannot-continue')
	})

	router.get('/v1/registration/join-organisation', (req, res) => renderPage(req, res, 'v1/registration/join-organisation', 'join-organisation'))
	router.post('/v1/registration/join-organisation', (req, res) => {
		const data = getData(req)
		data.joinOrganisation = (req.body || {}).joinOrganisation
		redirectAfterPost(req, res, 'join-organisation', data.joinOrganisation === 'yes' ? 'invite-sent' : 'cannot-continue')
	})

	router.get('/v1/registration/invite-sent', (req, res) => renderPage(req, res, 'v1/registration/invite-sent', 'invite-sent'))
	router.post('/v1/registration/invite-sent', (req, res) => {
		redirectAfterPost(req, res, 'invite-sent', getData(req).entryPoint === 'candidate' ? 'candidate-service' : 'home')
	})

	router.get('/v1/registration/cannot-continue', (req, res) => renderPage(req, res, 'v1/registration/cannot-continue', 'cannot-continue'))
	router.post('/v1/registration/cannot-continue', (req, res) => redirectAfterPost(req, res, 'cannot-continue', 'home'))

	router.get('/v1/registration/organisation-activities', (req, res) => renderPage(req, res, 'v1/registration/organisation-activities', 'organisation-activities'))
	router.post('/v1/registration/organisation-activities', (req, res) => {
		const data = getData(req)
		const selectedActivities = (req.body || {}).organisationActivities
		if (selectedActivities !== data.organisationActivities) {
			delete data.hasCompaniesHouseNumber
			delete data.companiesHouseNumber
			delete data.companiesHouseDetails
			delete data.organisationIsCorrect
			delete data.selectedRegistry
			delete data.matchingOrganisationName
			delete data.registryNumber
			delete data.organisationName
			delete data.organisationPostcode
			delete data.organisationAddresses
			delete data.selectedOrganisationAddress
			delete data.addressLine1
			delete data.addressLine2
			delete data.addressTown
			delete data.addressPostcode
			delete data.internationalAddressLine1
			delete data.internationalAddressLine2
			delete data.internationalTown
			delete data.internationalPostcode
			delete data.internationalCountry
			delete data.organisationAddressRoute
			delete data.organisationDetailsRoute
		}
		data.organisationActivities = selectedActivities
		if (data.organisationActivities === 'buyer') {
			data.organisationDetailsRoute = 'manual'
			return redirectAfterPost(req, res, 'organisation-activities', 'registry-check')
		}
		redirectAfterPost(req, res, 'organisation-activities', 'companies-house-check')
	})

	router.get('/v1/registration/organisation-description', (req, res) => renderPage(req, res, 'v1/registration/organisation-description', 'organisation-description'))
	router.post('/v1/registration/organisation-description', (req, res) => {
		const data = getData(req)
		data.organisationDescription = (req.body || {}).organisationDescription
		redirectAfterPost(req, res, 'organisation-description', data.organisationActivities === 'both' ? 'organisation-type' : 'devolved-regulations')
	})

	router.get('/v1/registration/organisation-type', (req, res) => renderPage(req, res, 'v1/registration/organisation-type', 'organisation-type'))
	router.post('/v1/registration/organisation-type', (req, res) => {
		getData(req).organisationType = (req.body || {}).organisationType
		redirectAfterPost(req, res, 'organisation-type', 'devolved-regulations')
	})

	router.get('/v1/registration/devolved-regulations', (req, res) => renderPage(req, res, 'v1/registration/devolved-regulations', 'devolved-regulations'))
	router.post('/v1/registration/devolved-regulations', (req, res) => {
		getData(req).devolvedRegulations = (req.body || {}).devolvedRegulations
		redirectAfterPost(req, res, 'devolved-regulations', 'check-answers')
	})

	router.get('/v1/registration/check-answers', (req, res) => renderPage(req, res, 'v1/registration/check-answers', 'check-answers'))
	router.post('/v1/registration/check-answers', (req, res) => {
		const value = (req.body || {}).privacyNotice
		getData(req).privacyNotice = value === undefined ? [] : Array.isArray(value) ? value : [value]
		redirectAfterPost(req, res, 'check-answers', getData(req).entryPoint === 'candidate' ? 'candidate-service' : 'home')
	})

	router.get('/v1/registration/candidate-service', (req, res) => renderPage(req, res, 'v1/registration/candidate-service', 'candidate-service'))
	router.post('/v1/registration/candidate-service', (req, res) => redirectAfterPost(req, res, 'candidate-service', 'home'))
}
