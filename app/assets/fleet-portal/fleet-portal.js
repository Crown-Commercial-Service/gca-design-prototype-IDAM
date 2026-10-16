const hasSeenCookieMessage = document.cookie
  .split(';')
  .some(cookie => cookie.trim() === 'fleet_portal_seen_cookie_message=yes')

if (!hasSeenCookieMessage) {
  document.getElementById('global-cookie-message').style.display = 'block'
}

document.cookie = 'fleet_portal_seen_cookie_message=yes; Max-Age=3122064000; Path=/v1/candidates/fleet-portal; SameSite=Lax'
