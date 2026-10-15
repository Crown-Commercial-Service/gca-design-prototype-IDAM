const path = require('path')

require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local') })

const { findAddressesByPostcode } = require('../services/os-places')
const { findCompanyByNumber } = require('../services/companies-house')
const countries = require('../data/countries')
const fallbackAddressLines = ['123 Example Street', 'London', 'SW1A 1AA', 'United Kingdom']
const sensitiveFields = [
	'password', 'confirm-password', 'loginPassword', 'emailCode', 'code',
	'authenticatorCode', 'loginTextCode', 'loginAuthenticatorCode'
]
const text = value => typeof value === 'string' ? value.trim() : ''
const selections = value => (value === undefined ? [] : Array.isArray(value) ? value : [value])
	.filter(item => item !== '_unchecked')
const isUKPostcode = value => /^(GIR0AA|[A-Z][A-HJ-Y]?\d[A-Z\d]?\d[ABD-HJLNP-UW-Z]{2})$/i.test(value.replace(/\s+/g, ''))

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
	const data = additionalData.data || getData(req)
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
		errors: {},
		errorList: [],
		backUrl: data.matchingOrganisationSource === 'companies-house'
			? '/v1/registration/companies-house-check'
			: '/v1/registration/organisation-name',
		countryItems: [
			{ value: '', text: 'Choose a country', selected: !data.internationalCountry },
			...countries.map(country => ({ ...country, selected: country.value === data.internationalCountry }))
		],
		...additionalData
	})
}

const redirectAfterPost = (req, res, pageId, nextPage, oneLoginPage = false) => {
	getData(req).previousPage = pageId
	res.redirect(nextPage === 'home' ? '/v1/registration' : `/v1/registration/${oneLoginPage ? 'one-login/' : ''}${nextPage}`)
}

const renderValidationErrors = (req, res, pageId, messages, inputIds = {}) => {
	const errors = {}
	const errorList = []
	for (const [field, message] of Object.entries(messages)) {
		errors[field] = { text: message }
		errorList.push({ text: message, href: `#${inputIds[field] || field}` })
	}
	return renderPage(req, res, `v1/registration/${pageId}`, pageId, { errors, errorList })
}

module.exports = router => {
	router.use((req, res, next) => {
		if (req.method !== 'POST') return next()
		const match = req.path.match(/^\/v1\/registration\/((?:one-login\/)?[^/]+)\/?$/)
		if (!match) return next()
		const data = getData(req)
		// The Prototype Kit stores POST bodies before these routes run.
		for (const field of sensitiveFields) {
			delete data[field]
			if (res.locals.data) delete res.locals.data[field]
		}
		next()
	})

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
		data.firstName = text((req.body || {}).firstName)
		data.lastName = text((req.body || {}).lastName)
		const errors = {}
		if (!data.firstName) errors.firstName = 'Enter your first name'
		if (!data.lastName) errors.lastName = 'Enter your last name'
		if (Object.keys(errors).length) {
			return renderValidationErrors(req, res, 'enter-your-name', errors)
		}
		redirectAfterPost(req, res, 'enter-your-name', 'register-your-organisation')
	})

	router.get('/v1/registration/organisation-select', (req, res) => renderPage(req, res, 'v1/registration/organisation-select', 'organisation-select'))
	router.get('/v1/registration/org-account-already-exists', (req, res) => {
		const data = getData(req)
		if (data.matchingOrganisationName !== 'Test Limited') {
			return res.redirect('/v1/registration/register-your-organisation')
		}
		renderPage(req, res, 'v1/registration/org-account-already-exists', 'org-account-already-exists')
	})
	router.post('/v1/registration/org-account-already-exists', (req, res) => {
		const data = getData(req)
		data.requestToJoin = text((req.body || {}).requestToJoin)
		data.shareDetailsConsent = selections((req.body || {}).shareDetailsConsent).filter(value => value === 'yes')
		const errors = {}
		if (!['yes', 'no'].includes(data.requestToJoin)) {
			errors.requestToJoin = 'Select yes if you want to request to join this organisation'
		}
		if (data.requestToJoin === 'yes' && !data.shareDetailsConsent.includes('yes')) {
			errors.shareDetailsConsent = 'Confirm that you understand your name and email address will be shared with the administrator for this organisation'
		}
		if (Object.keys(errors).length) {
			return renderValidationErrors(req, res, 'org-account-already-exists', errors)
		}
		redirectAfterPost(req, res, 'org-account-already-exists', data.requestToJoin === 'yes' ? 'request-access-sent' : 'cannot-continue')
	})
	router.get('/v1/registration/request-access-sent', (req, res) => renderPage(req, res, 'v1/registration/request-access-sent', 'request-access-sent'))
	router.post('/v1/registration/organisation-select', (req, res) => {
		const data = getData(req)
		data.organisationChoice = text((req.body || {}).organisationChoice)
		if (!['new', 'existing'].includes(data.organisationChoice)) {
			return renderValidationErrors(req, res, 'organisation-select', {
				organisationChoice: 'Select an organisation to register or request to join'
			}, { organisationChoice: 'organisationToRegister' })
		}
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
		data.hasCompaniesHouseNumber = text(body.hasCompaniesHouseNumber)
		data.companiesHouseNumber = text(body.companiesHouseNumber)
		const errors = {}
		if (!['yes', 'no'].includes(data.hasCompaniesHouseNumber)) {
			errors.hasCompaniesHouseNumber = 'Select yes if your organisation has a Companies House number'
		}
		if (data.hasCompaniesHouseNumber === 'yes') {
			if (!data.companiesHouseNumber) {
				errors.companiesHouseNumber = 'Enter your Companies House number'
			} else if (!/^[A-Z\d]{8}$/i.test(data.companiesHouseNumber.replace(/\s+/g, ''))) {
				errors.companiesHouseNumber = 'Enter a Companies House number using 8 letters or numbers'
			}
		}
		if (Object.keys(errors).length) {
			return renderValidationErrors(req, res, 'companies-house-check', errors)
		}
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
			try {
				data.companiesHouseDetails = await findCompanyByNumber(data.companiesHouseNumber)
				if (!data.companiesHouseDetails) {
					return renderValidationErrors(req, res, 'companies-house-check', {
						companiesHouseNumber: 'No company found with this Companies House number. Check the number and try again'
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
				const message = error.code === 'COMPANIES_HOUSE_HTTP_429'
					? 'The Companies House service is busy. Try again later.'
					: 'We could not retrieve company details just now. Try again later.'
				return renderPage(req, res, 'v1/registration/companies-house-check', 'companies-house-check', {
					serviceError: message
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
		data.selectedRegistry = text((req.body || {}).selectedRegistry)
		const registries = [
			'Charity Commission (England and Wales)', 'Scottish Charity Register',
			'Charity Commission for Northern Ireland', 'Mutuals Public Register', 'Guernsey Registry',
			'Jersey Financial Services Commission Registry', 'Isle of Man Companies Registry',
			'NHS Organisation Data Service', 'UK Register of Learning Providers (UKPRN number)', 'no'
		]
		if (!registries.includes(data.selectedRegistry)) {
			return renderValidationErrors(req, res, 'registry-check', {
				selectedRegistry: 'Select a registry your organisation is on, or select none of these'
			}, { selectedRegistry: 'hasOtherRegistry' })
		}
		data.hasCompletedRegistryCheck = true
		if (data.organisationDetailsRoute !== 'companies-house') {
			data.organisationDetailsRoute = 'manual'
		}
		redirectAfterPost(req, res, 'registry-check', data.selectedRegistry !== 'no' ? 'registry-number' : 'organisation-name')
	})

	router.get('/v1/registration/registry-number', (req, res) => renderPage(req, res, 'v1/registration/registry-number', 'registry-number'))
	router.post('/v1/registration/registry-number', (req, res) => {
		const data = getData(req)
		data.registryNumber = text((req.body || {}).registryNumber)
		if (!data.registryNumber) {
			const registryName = data.selectedRegistry && data.selectedRegistry !== 'no' ? data.selectedRegistry : 'registry'
			return renderValidationErrors(req, res, 'registry-number', {
				registryNumber: `Enter your organisation's ${registryName} number`
			})
		}
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
		data.organisationIsCorrect = text((req.body || {}).organisationIsCorrect)
		if (!['yes', 'no'].includes(data.organisationIsCorrect)) {
			return renderValidationErrors(req, res, 'organisation-correct', {
				organisationIsCorrect: 'Select yes if these organisation details are correct'
			}, { organisationIsCorrect: 'organisationIsCorrect-yes' })
		}
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
		if (!data.organisationName) {
			return renderValidationErrors(req, res, 'organisation-name', {
				organisationName: "Enter your organisation's name"
			})
		}
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
		if (!data.organisationPostcode) {
			return renderValidationErrors(req, res, 'organisation-postcode', {
				organisationPostcode: 'Enter a postcode'
			})
		}
		if (!isUKPostcode(data.organisationPostcode)) {
			return renderValidationErrors(req, res, 'organisation-postcode', {
				organisationPostcode: 'Enter a full UK postcode'
			})
		}
		data.organisationAddresses = []
		data.selectedOrganisationAddress = undefined

		try {
			const addresses = await findAddressesByPostcode(data.organisationPostcode)
			data.organisationAddresses = addresses.map(address => ({ text: address, value: address }))
			data.selectedOrganisationAddress = undefined
		} catch (error) {
			console.error('OS Places postcode lookup failed:', error.code || error.message)
			const message = error.code === 'MISSING_OS_PLACES_CREDENTIALS'
				? 'Address lookup is not available. Enter your organisation’s address manually.'
				: 'We could not look up that postcode just now. Try again.'
			return renderPage(req, res, 'v1/registration/organisation-postcode', 'organisation-postcode', {
				serviceError: message,
				showManualAddressLink: true
			})
		}
		redirectAfterPost(req, res, 'organisation-postcode', 'organisation-address-select')
	})

	router.get('/v1/registration/organisation-address-select', (req, res) => renderPage(req, res, 'v1/registration/organisation-address-select', 'organisation-address-select'))
	router.post('/v1/registration/organisation-address-select', (req, res) => {
		const data = getData(req)
		const selectedAddress = text((req.body || {}).selectedOrganisationAddress)
		data.selectedOrganisationAddress = selectedAddress
		const isAddressFromLookup = Array.isArray(data.organisationAddresses) &&
			data.organisationAddresses.some(address => address.value === selectedAddress)
		if (!isAddressFromLookup) {
			return renderValidationErrors(req, res, 'organisation-address-select', {
				selectedOrganisationAddress: "Select your organisation's address"
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
		data.addressLine1 = text((req.body || {}).addressLine1)
		data.addressLine2 = text((req.body || {}).addressLine2)
		data.addressTown = text((req.body || {}).addressTown)
		data.addressPostcode = text((req.body || {}).addressPostcode)
		const errors = {}
		if (!data.addressLine1) errors.addressLine1 = 'Enter address line 1, typically the building and street'
		if (!data.addressTown) errors.addressTown = 'Enter a town or city'
		if (!data.addressPostcode) errors.addressPostcode = 'Enter a postcode'
		else if (!isUKPostcode(data.addressPostcode)) errors.addressPostcode = 'Enter a full UK postcode'
		if (Object.keys(errors).length) {
			return renderValidationErrors(req, res, 'organisation-address', errors)
		}
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

	router.get('/v1/registration/international-organisation-address', (req, res) => renderPage(req, res, 'v1/registration/international-organisation-address', 'international-organisation-address'))
	router.post('/v1/registration/international-organisation-address', (req, res) => {
		const data = getData(req)
		data.internationalAddressLine1 = text((req.body || {}).internationalAddressLine1)
		data.internationalAddressLine2 = text((req.body || {}).internationalAddressLine2)
		data.internationalTown = text((req.body || {}).internationalTown)
		data.internationalPostcode = text((req.body || {}).internationalPostcode)
		data.internationalCountry = text((req.body || {}).internationalCountry)
		const errors = {}
		if (!data.internationalAddressLine1) errors.internationalAddressLine1 = 'Enter address line 1, typically the building and street'
		if (!data.internationalTown) errors.internationalTown = 'Enter a town or city'
		if (!countries.some(country => country.value === data.internationalCountry)) {
			errors.internationalCountry = 'Select a country'
		}
		if (Object.keys(errors).length) {
			return renderValidationErrors(req, res, 'international-organisation-address', errors)
		}
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
		data.isOrganisationAdmin = text((req.body || {}).isOrganisationAdmin)
		if (!['yes', 'no'].includes(data.isOrganisationAdmin)) {
			return renderValidationErrors(req, res, 'organisation-admin', {
				isOrganisationAdmin: 'Select yes if you want to be the administrator for your organisation'
			}, { isOrganisationAdmin: 'isOrganisationAdmin-yes' })
		}
		const nextPage = data.organisationActivities === 'buyer' ? 'organisation-type' : 'organisation-description'
		redirectAfterPost(req, res, 'organisation-admin', data.isOrganisationAdmin === 'yes' ? nextPage : 'cannot-continue')
	})

	router.get('/v1/registration/join-organisation', (req, res) => renderPage(req, res, 'v1/registration/join-organisation', 'join-organisation'))
	router.post('/v1/registration/join-organisation', (req, res) => {
		const data = getData(req)
		data.joinOrganisation = text((req.body || {}).joinOrganisation)
		data.shareDetailsConsent = selections((req.body || {}).shareDetailsConsent).filter(value => value === 'yes')
		const errors = {}
		if (!['yes', 'no'].includes(data.joinOrganisation)) {
			errors.joinOrganisation = 'Select yes if you want to request to join this organisation'
		}
		if (data.joinOrganisation === 'yes' && !data.shareDetailsConsent.includes('yes')) {
			errors.shareDetailsConsent = 'Confirm that you understand your name and email address will be shared with the administrator for this organisation'
		}
		if (Object.keys(errors).length) {
			return renderValidationErrors(req, res, 'join-organisation', errors)
		}
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
		const selectedActivities = text((req.body || {}).organisationActivities)
		if (!['buyer', 'supplier', 'both'].includes(selectedActivities)) {
			data.organisationActivities = selectedActivities
			return renderValidationErrors(req, res, 'organisation-activities', {
				organisationActivities: 'Select whether you want to register your organisation as a buyer, supplier or both'
			})
		}
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
		const selected = selections((req.body || {}).organisationDescription)
		const options = ['sme', 'vcse', 'supported-employment-provider', 'public-service-mutual', 'none']
		data.organisationDescription = selected.filter(value => options.includes(value))
		if (!selected.length || selected.some(value => !options.includes(value))) {
			return renderValidationErrors(req, res, 'organisation-description', {
				organisationDescription: 'Select which descriptions apply to your organisation, or select none of these'
			})
		}
		if (selected.includes('none') && selected.length > 1) {
			return renderValidationErrors(req, res, 'organisation-description', {
				organisationDescription: 'Select descriptions that apply to your organisation, or select none of these, not both'
			})
		}
		redirectAfterPost(req, res, 'organisation-description', data.organisationActivities === 'both' ? 'organisation-type' : 'devolved-regulations')
	})

	router.get('/v1/registration/organisation-type', (req, res) => renderPage(req, res, 'v1/registration/organisation-type', 'organisation-type'))
	router.post('/v1/registration/organisation-type', (req, res) => {
		const data = getData(req)
		data.organisationType = text((req.body || {}).organisationType)
		if (!['central-government', 'local-government', 'public-body', 'private-sector', 'other'].includes(data.organisationType)) {
			return renderValidationErrors(req, res, 'organisation-type', {
				organisationType: 'Select your buyer organisation type'
			})
		}
		redirectAfterPost(req, res, 'organisation-type', 'devolved-regulations')
	})

	router.get('/v1/registration/devolved-regulations', (req, res) => renderPage(req, res, 'v1/registration/devolved-regulations', 'devolved-regulations'))
	router.post('/v1/registration/devolved-regulations', (req, res) => {
		const data = getData(req)
		data.devolvedRegulations = text((req.body || {}).devolvedRegulations)
		if (!['Northern Ireland', 'Scotland', 'Wales', 'none'].includes(data.devolvedRegulations)) {
			return renderValidationErrors(req, res, 'devolved-regulations', {
				devolvedRegulations: 'Select which devolved nation regulations apply to your organisation'
			})
		}
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
