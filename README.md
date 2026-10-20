# gca-design-prototype-IDAM
gca-design-prototype-IDAM

## Deployment stylesheets

The `dev`, `serve` and `start` npm scripts set `SASS_PATH=node_modules` so Sass
can resolve CCS Frontend's GOV.UK Frontend imports from the installed packages.
No forwarding stylesheet or changes to installed packages are needed.
These commands use shell environment-variable syntax supported on macOS and
Linux, including Railway. On Windows, use WSL or a compatible shell.

## Candidate service entry pages

The [GCA homepage](app/views/v1/candidates/gca.html) is available at
`/v1/candidates/gca` and linked from the prototype index. It reproduces
[www.gca.gov.uk](https://www.gca.gov.uk/) for prototype route testing, with
permission confirmed for the branding and images. Visual assets are stored
locally in `app/assets/gca`. The unavailable legacy CCS print-logo asset is
replaced with the GCA logo. Production analytics, surveys and tracking scripts
are excluded; a local script handles the cookie banner and mobile navigation.
Only a prototype cookie is set by Accept all cookies.

The header and mobile navigation **Create account** and **Sign in** links lead
retain GCA as the candidate service. With Auth0 selected, Create account goes
directly to email entry and Sign in goes directly to the sign-in form, clearing
previous registration answers while retaining theme, provider and GCA context.
With One Login selected, both links go to its shared start page.
The confirmation page returns to the local GCA homepage, where **Sign out**
replaces these account links. Signing out resets that simulated GCA sign-in
state. Links to other services, search forms and other content retain their
live destinations.

The [Fleet Portal homepage](app/views/v1/candidates/fleet-portal.html) is available
at `/v1/candidates/fleet-portal`. It reproduces the public
[Fleet Portal](https://fleetportal.gca.gov.uk/) homepage for prototype route testing,
with permission confirmed for this use. Original styles, fonts, images and icons
are stored in [app/assets/fleet-portal](app/assets/fleet-portal) and are isolated
from the prototype's newer GOV.UK/CCS styles.

The combined Login/Register header button and Register today link enter the selected
login flow via `/v1/registration/sign-up-start`, setting the candidate entry point.
Other links retain
their live destinations, and the original YouTube embeds require internet access.
Production analytics, unrelated production scripts and Font Awesome Pro are not
included. Cookie-banner behaviour uses a separate prototype-only cookie. The
original Crown copyright attribution is retained and the page is marked noindex.

Completed registrations go to `/v1/registration/account-created`, using the
GOV.UK confirmation panel and next steps pattern. Candidate entry routes retain
the service name and show a **Return to Fleet Portal** button linking to the local
Fleet Portal homepage. Normal registration shows **Continue to [organisation name]
home**, linking to the placeholder at `/v1/registration/organisation-home`.
Starting from the normal registration route clears the candidate service context.
The confirmation page shows a generated prototype organisation ID, retained in the
session so it stays the same on refresh. It confirms the selected buyer or supplier
role and administrator responsibilities. No organisation account or email is
created outside the prototype. Requests to join an existing organisation do not
show the organisation-account-created confirmation.
Reaching the organisation-account-created confirmation from Fleet Portal marks
the prototype session as signed in to Fleet Portal. Its header then shows
**Sign out** instead of **Login/Register**. Signing out clears this simulated
Fleet Portal sign-in state and returns to the local homepage; registration
answers remain available for prototype testing.

## Login setup

Use **Setup** in the footer to open `/v1/setup`, outside the registration journey.
Select OneLogin (the default) or Auth0. Saving clears registration data, candidate
context and signed-in status while retaining the CCS/GOV.UK theme and login settings.
Normal registration, GCA and Fleet Portal entry routes use the selected provider.
The `/v1/registration` landing page is shown for both providers. When Auth0 is
selected, its Continue button starts a fresh registration at the Auth0 email-entry
page, skipping the Auth0 account-choice page.

Auth0 has separate page templates in [app/views/v1/registration/auth0](app/views/v1/registration/auth0),
alongside the existing One Login folder, and uses [layouts/auth0.html](app/views/layouts/auth0.html).
Its routes live under `/v1/registration/auth0/`. Account creation includes email
entry, a simulated verification-link page, password creation and a choice of text
message, authenticator app or no two-factor authentication. Choosing none asks for
confirmation; choosing No returns to the method selection. All completed branches
show a basic next-steps page explaining that users can create an organisation
account or access GCA services on behalf of an organisation they are already part
of. Continue then opens the first name and last name page.

Auth0 sign-in collects email and password on one page, then always shows the
text-message code page before continuing to the organisation journey.
Auth0 validates email presence and format, mobile phone presence and format, and required
two-factor choices. Errors use the shared GOV.UK summary, inline messages and
Error-prefixed page title. Validation stays in each page's POST handler.
Non-sensitive answers are retained; passwords and codes are not.
Passwords are not validated during creation or sign-in. Blank, weak or mismatched
passwords are accepted; the displayed requirements are guidance only.
There is no real authentication, email delivery or security-code verification.
All security-code pages accept blank or arbitrary codes, including authenticator
setup. One Login remains unvalidated.
The Check your email page links to an example in
[auth0/emails/confirm-email.html](app/views/v1/registration/auth0/emails/confirm-email.html).
Its confirmation link opens Create your password. Email content is a visual
example only: no notifications are sent, and expiry or single-use limits are
not enforced.

## Input validation

Selecting Sign in or Create account on either provider's start page
clears previous form answers, generated organisation IDs and simulated sign-in
state. The selected CCS/GOV.UK theme, login settings and entry-service context are retained.

Organisation registration input pages validate submissions on the
server. Errors use the GOV.UK error summary and inline error message components,
with an `Error:` page title and links to the affected inputs. Answers are preserved
when validation fails. API outages are shown as service notifications, not as
incorrect user answers.

Each page's validation conditions and error messages are defined in its
`router.post` handler in [app/routes/v1.js](app/routes/v1.js). The shared
`renderValidationErrors` helper only builds the inline errors and summary links;
it does not decide which answers are acceptable.

Validation follows the [GOV.UK validation pattern](https://design-system.service.gov.uk/patterns/validation/),
[error message guidance](https://design-system.service.gov.uk/components/error-message/),
and [Service Manual writing guidance](https://www.gov.uk/service-manual/design/writing-for-user-interfaces).
Postcode messages follow the corresponding Design System pattern.

- All displayed organisation registration radio questions require an answer.
- Organisation descriptions require at least one selection. "None of these"
  cannot be combined with another description, including with JavaScript disabled.
- Requesting to join an organisation requires confirmation of name and email
  sharing. Answering No does not require that confirmation.
- Address line 2 and international postal/ZIP codes are optional. UK postcodes
  accept spaces and lowercase letters.
- Registry numbers are required but are not restricted to one format because
  the available registries use different numbering schemes.
- One Login is simulated and has no input validation. Email addresses, passwords,
  mobile numbers and security codes can be left blank or entered in any format.
  No real authentication or code verification is performed.
- Passwords and security codes are removed from the Prototype Kit's automatically
  stored session data.
