//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

// Add your routes here
router.get('/toggle-theme', (req, res) => {
	const currentTheme = req.session.data.theme || 'CCS'
	req.session.data.theme = currentTheme === 'CCS' ? 'GOVUK' : 'CCS'

	res.redirect(req.get('referer') || '/')
})
