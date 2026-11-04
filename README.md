# gca-design-prototype-IDAM
gca-design-prototype-IDAM

## Deployment stylesheets

The `dev`, `serve` and `start` npm scripts set `SASS_PATH=node_modules` so Sass
can resolve CCS Frontend's GOV.UK Frontend imports from the installed packages.
No forwarding stylesheet or changes to installed packages are needed.
These commands use shell environment-variable syntax supported on macOS and
Linux, including Railway. On Windows, use WSL or a compatible shell.

## Candidate service entry pages

The [Digital Foundation agreement selector](app/views/v1/candidates/digital-foundation.html)
is available at `/v1/candidates/digital-foundation` and linked from the prototype
index and buyer-only organisation service list. All six agreements on
[the live homepage](https://marketplace.service.gca.gov.uk/) have local start
pages under `/v1/candidates/digital-foundation/<service>/<framework>/start`:
Facilities Management RM6232 and RM6378, Management Consultancy RM6309,
Legal Panel for Government RM6360, Supply Teachers RM6376 and Public Sector
Legal Services RM6374. The corresponding URLs without `/start` also render
these pages.

The [framework templates](app/views/v1/candidates/digital-foundation) retain
each agreement's original content, service navigation, survey link and
framework-specific footer destinations, including the DfE branding and
additional Supply Teachers guidance. The shared GCA shell and both original
stylesheet variants are isolated from the main prototype styles. CSS, fonts,
DfE logo and decorative assets are stored in `app/assets/digital-foundation`;
font imports and asset paths are localised. The cookie banner, production
scripts, tracking and CSRF tokens are excluded. The existing locally bundled
GOV.UK service navigation handles mobile menus.

Every **Start now**, **Create an account** and **Sign in** control enters the
selected One Login/Auth0 flow via `/v1/candidates/digital-foundation/login`,
retaining Digital Foundation as the return destination. Completed registrations,
existing-organisation selection and password resets mark this service as signed
in. **Sign out** replaces account links, clears only the simulated Digital
Foundation state and returns to the agreement selector. The organisation-home
link opens the signed-in selector via `/v1/candidates/digital-foundation/launch`.
Guidance and other content links retain their live destinations, including
references to DfE Sign-in; actual prototype authentication uses the selected
IDAM provider. All pages are marked noindex and retain Crown copyright.

The [RMI landing page](app/views/v1/candidates/rmi.html) at `/v1/candidates/rmi`
matches [Report management information to GCA](https://www.reportmi.gca.gov.uk/),
excluding the cookie banner. Original CSS, logos and footer assets are stored
locally in `app/assets/rmi`; existing local fonts are reused. Production scripts,
analytics and CSRF tokens are excluded.

**Sign in** enters the usual One Login/Auth0 journey through
`/v1/candidates/rmi/login`, retaining RMI as the return destination. Completed
registration, organisation selection and password resets return to RMI with
**Sign out** replacing **Sign in**. Signing out clears only the RMI state.
The prototype index and public services guidance link to the landing page;
the supplier-only organisation-home link uses `/v1/candidates/rmi/launch`
to open its signed-in state. Support and policy links retain live destinations.

The [Digital Marketplace homepage](app/views/v1/candidates/digital-marketplace.html)
is available at `/v1/candidates/digital-marketplace`, linked from the prototype
index. **Become a supplier** opens the local
[supplier page](app/views/v1/candidates/digital-marketplace/supply.html) at
`/v1/candidates/digital-marketplace/suppliers/supply`.
Both pages reproduce the content and layout from
[the development Marketplace](https://www.development.marketplace.team/),
including their distinct footer link lists. The cookie banner is deliberately
omitted. Original CSS, fonts, favicon and copyright crest are stored locally in
`app/assets/digital-marketplace`; CSS asset paths are rewritten for local use.
The installed GOV.UK Frontend service-navigation bundle handles the mobile menu.
Production scripts, analytics and cookies are not included.

**Create a Digital Marketplace supplier account** and header **Log in** enter
the selected One Login/Auth0 journey through `/v1/registration/sign-up-start`,
retaining Digital Marketplace as the candidate return destination. Completed
registrations, existing-organisation selection and password resets mark the
local service as signed in; **Log out** then replaces **Log in** on both pages.
Logging out clears only this service's simulated sign-in state. The Digital
Marketplace link on organisation home opens the signed-in homepage through
`/v1/candidates/digital-marketplace/launch`.
Other content links keep their original live destinations. The downloaded
application deadline and framework availability text are retained verbatim,
not inferred from the current date. Crown copyright and Open Government Licence
attributions are retained, and both pages are marked noindex.

The [Kahootz landing page](app/views/v1/candidates/kahootz.html) is available at
`/v1/candidates/kahootz` and linked from the prototype index. Its standalone
layout matches the public [Market Strategy Collaboration site](https://categorystrategy.kahootz.com/),
using its downloaded site stylesheet, combined GCA logo, icon font and favicon,
stored locally in `app/assets/kahootz`. The original stylesheet is unmodified;
`kahootz.css` selects local logo/font assets and sizes the account box.
The header, responsive layout and footer use the live site's markup and classes.
A single **Log in or register** box replaces the live site's separate login and
registration forms, using its original panel and button styling.
Production scripts, analytics and session tokens
are excluded.
**Log in** and **Register** use the same selected-provider flow as Fleet Portal,
retaining Kahootz as the return destination. Simulated authentication remains
in the existing prototype provider pages.
The **Log in or register** button opens the selected prototype provider,
where users can log in, create an account or recover their password.
No credentials are collected on the landing page.
Completed registration, existing-organisation selection and password resets
return to Kahootz with **Log out** replacing the login and registration controls.
Logging out clears only the simulated Kahootz sign-in state.
The buyer-only Kahootz link on organisation home opens the signed-in page via
`/v1/candidates/kahootz/launch`.

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
For the One Login provider, this first shows a single-option halt page (`/v1/registration/sign-in-options`)
explaining that GOV.UK One Login can be used to access the GCA account, before the One Login create/sign-in page.
Other links retain
their live destinations, and the original YouTube embeds require internet access.
Production analytics, unrelated production scripts and Font Awesome Pro are not
included. Cookie-banner behaviour uses a separate prototype-only cookie. The
original Crown copyright attribution is retained and the page is marked noindex.

Completed registrations go to `/v1/registration/account-created`, using the
GOV.UK confirmation panel and next steps pattern. Candidate entry routes retain
the service name and show a **Return to Fleet Portal** button linking to the local
Fleet Portal homepage. Normal registration shows **Continue to [organisation name]
home**, linking to `/v1/organisation-home`.
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

The organisation home at `/v1/organisation-home` shows an organisation
banner, an Edit organisation link to `/v1/edit-organisation-details`, and a service
list covering 13 procurement and collaboration services,
including Fleet Portal, Digital Marketplace and RMI. The single-column list uses
GOV.UK Services and information-style linked headings, descriptions, dividers and
chevrons. Fleet Portal opens the signed-in local candidate page through
`/v1/candidates/fleet-portal/launch`, which sets the existing simulated sign-in
state without restarting registration. Kahootz uses the equivalent
`/v1/candidates/kahootz/launch` route. Digital Marketplace uses
`/v1/candidates/digital-marketplace/launch`, and Digital Foundation uses
`/v1/candidates/digital-foundation/launch`. The other services use
placeholder `href="#"` links.
The list uses the organisation's buyer/supplier registration choice: Digital
Foundation, Contract Award Service and Kahootz are buyer-only; RMI is supplier-only.
The other nine services are shown to both buyers and suppliers. Organisations
registered as both see all 13 services.
Candidate-service return destinations remain unchanged.

Edit organisation details shows independently editable organisation fields,
excluding registration-path choices such as buyer/supplier, registry selection
and administrator status. Change links use the existing validated input pages
with a request-scoped `editOrganisation=true` query parameter. Their form actions
and Back links preserve edit mode; successful submissions return to the edit
summary instead of continuing registration. Edits are held in a separate session
draft and applied to organisation data only when **Save changes** is selected.
Leaving the edit journey without saving discards the draft. Validation errors
retain input on the current page without changing the draft or saved data.
Companies House name and address
remain read-only. Address lookup results can be replaced through manual address
entry. Normal registration routing is unchanged.

## Login setup

The One Login introduction at `/v1/registration/sign-in-options` uses the reviewed
**Create your GCA service account or sign in** content and links to `/v1/services`.
This public guidance page lists all 13 buyer and supplier services without
organisation details, role filtering or simulated sign-in. It shares the service
catalogue and list rendering with organisation home; candidate links open public
landing pages rather than signed-in launch routes.

The shared name-entry page at `/v1/registration/enter-your-name` now asks for
**Full name** under **Complete your GCA service account**, for both providers.
Empty or whitespace-only submissions show **Enter your full name**. Names are
stored as entered (trimmed), without splitting into assumed first/last names,
and used on confirmation and check-answers pages. Existing session first/last
names remain readable until the full name is updated. Registering an additional
organisation retains the full name.
Changing the full name from check your answers returns directly to that summary,
including after validation errors, without repeating account creation.

For both Auth0 and One Login, completing a password reset that started from
Fleet Portal returns directly to `/v1/candidates/fleet-portal`, bypassing name
entry and organisation selection. The session is marked as signed in to Fleet
Portal, so its header shows **Sign out**. For One Login, the return happens when
**Continue to service** is selected on its signed-in page.

One Login sign-in (including alternative security-code methods) and password
reset show **You are signed in** at `/v1/registration/one-login/signed-in`.
Its **Continue to service** button resumes the existing onward journey:
organisation selection for existing accounts or completed resets, name entry
for other normal sign-ins, or signed-in Fleet Portal after a Fleet Portal reset.
The signed-in page reuses the registration confirmation template and its
**Continue to service** button, with a sign-in heading and message. Account
creation retains its original content. Auth0 is unchanged.

One Login password resets start from **I've forgotten my password** on
**Enter your password**, after the existing email-entry step.
The journey is **Check your email** → **Check your phone** → **Reset your password**.
The pages use One Login wording, the entered email address and a masked phone
number (ending `9066` if no number is stored). Email and phone codes have resend
links and displayed 15-minute expiry guidance. Password reset reuses the existing
One Login password controls, guidance and show/hide buttons.
Except when returning directly to Fleet Portal, Submitting the new password shows **You are signed in**. **Continue to service**
opens the organisation chooser for any email address,
without another sign-in or name-entry step. It offers Test Company LTD, Example
Council and Register a new organisation, plus the saved organisation if present.
Choosing an organisation and continuing opens organisation home or returns to the
originating candidate service. Normal sign-in routing is unchanged. Authentication, delivery and
expiry are simulated; codes and passwords are not validated or stored.

After entering their full name, new users see a **User account created**
confirmation at `/v1/registration/user-account-created`. Continue opens the
organisation registration introduction. `test@test.com` bypasses both name entry
and this confirmation and goes to the organisation chooser instead.

Use `test@test.com` with either login provider to simulate an account already
linked to organisations. After the provider steps, the journey skips name entry
and organisation registration and opens `/v1/registration/select-your-organisation`.
Choose Test Company, which always has the buyer role. Continue opens organisation home with the
selected organisation's name, stable prototype ID and role-based service list.
If the journey started from a candidate service such as Fleet Portal or GCA,
Continue returns directly to that service's signed-in page instead.
Other email addresses keep the existing registration journey.
When an organisation is already registered in the session, the chooser also
shows its name as the selected radio option without duplicating example names.
Selecting it preserves its saved role, ID, address and registration details.

Selecting **Register a new organisation** in the organisation chooser opens a
variant of the registration introduction. It acknowledges existing organisation
links, explains administrator responsibilities and links Back to the chooser.
Continuing uses the normal organisation registration questions, without asking
for the user's name again.

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
of. Continue then opens the full name page.

Auth0 sign-in collects email and password on one page, then always shows the
text-message code page before continuing to the organisation journey.
Alternatively, entering `test@test.com` on Auth0's email-entry page opens a
separate **Enter your password** page, followed by **Check your phone** to enter
the text-message code. These pages follow the One Login content and input layout
while retaining the selected GCA theme. Continuing opens the organisation chooser.
Email matching ignores case and surrounding spaces; other addresses continue to
email verification and account creation as before.

The **I've forgotten my password** link on Auth0's password-entry and sign-in
pages opens **Check your email** directly, without asking for the email again.
It uses the account email already entered; on the combined sign-in form, the
forgotten-password control submits and validates the current email field.
The page uses a 6 digit email security-code input, a 15-minute expiry message
and a **Problems with the code?** section with resend and example-email links.
Continue opens **Check your phone** at
`/v1/registration/auth0/reset-password-check-phone`, with a masked phone number,
a 6 digit code input, a 15-minute expiry message and a resend link.
The phone number uses the last four digits of the session's phone number, or
the prototype ending `9066` if no number has been entered.
Continuing from the phone-code page opens **Enter your new password**, reusing
the account-creation password fields and guidance.
Except when returning directly to Fleet Portal, **Reset password** continues through the normal post-login route without asking
the user to sign in again: `test@test.com` opens the organisation chooser, while
other addresses follow the existing name-entry journey. Candidate-service context
is retained so choosing an organisation can return the user to their service.
This is simulated: no email or SMS is sent, no password is changed or stored, and codes
are not verified or subject to expiry enforcement. Blank or arbitrary codes are
accepted and removed from session data. As with account creation, new passwords
are not validated.

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
