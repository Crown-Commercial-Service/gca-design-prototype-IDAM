# gca-design-prototype-IDAM
gca-design-prototype-IDAM

## Deployment stylesheets

The `dev`, `serve` and `start` npm scripts set `SASS_PATH=node_modules` so Sass
can resolve CCS Frontend's GOV.UK Frontend imports from the installed packages.
No forwarding stylesheet or changes to installed packages are needed.
These commands use shell environment-variable syntax supported on macOS and
Linux, including Railway. On Windows, use WSL or a compatible shell.

## Input validation

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
