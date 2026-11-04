/* global GOVUKFrontend */

const navigation = document.querySelector('[data-module="govuk-service-navigation"]')
if (navigation.querySelector('.govuk-service-navigation__toggle')) {
  new GOVUKFrontend.ServiceNavigation(navigation)
}
