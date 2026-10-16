const cookieBanner = document.getElementById('cookie-consent-container')
const cookieName = 'gca_prototype_seen_cookie_message'
if (!document.cookie.split('; ').some(cookie => cookie.startsWith(`${cookieName}=`))) {
  cookieBanner.style.display = 'block'
}
cookieBanner.querySelector('.gtm--accept-cookies-in-banner').addEventListener('click', () => {
  document.cookie = `${cookieName}=yes; Path=/v1/candidates/gca; SameSite=Lax`
  cookieBanner.style.display = 'none'
})

const menuButton = document.querySelector('[data-toggler="nav"]')
const navigation = document.querySelector('[data-toggle="nav"]')
const desktop = window.matchMedia('(min-width: 769px)')
const setMenuExpanded = expanded => {
  menuButton.setAttribute('aria-expanded', String(expanded))
  navigation.setAttribute('aria-hidden', String(!expanded))
  menuButton.querySelector('.icon-menu-closed').style.display = expanded ? 'none' : ''
  menuButton.querySelector('.icon-menu-open').style.display = expanded ? '' : 'none'
}
setMenuExpanded(desktop.matches)
desktop.addEventListener('change', event => setMenuExpanded(event.matches))
menuButton.addEventListener('click', () => {
  setMenuExpanded(menuButton.getAttribute('aria-expanded') !== 'true')
})

document.querySelectorAll('.dropbtn').forEach(button => {
  button.setAttribute('aria-expanded', 'false')
  button.addEventListener('click', () => {
    const expanded = button.nextElementSibling.classList.toggle('open-dropdown')
    button.setAttribute('aria-expanded', String(expanded))
  })
})

document.querySelectorAll('.news-listing-title a').forEach(heading => {
  if (heading.innerText.length > 75) {
    heading.innerText = `${heading.innerText.substring(0, 75)}...`
  }
})
