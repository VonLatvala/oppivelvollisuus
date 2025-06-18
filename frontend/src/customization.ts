// SPDX-FileCopyrightText: 2025 City of Tampere
//
// SPDX-License-Identifier: LGPL-2.1-or-later

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EspooLogo = require('./images/EspooLogoPrimary.svg') as string
// eslint-disable-next-line @typescript-eslint/no-require-imports
const TampereLogo = require('./images/logo-tampere-default.svg') as string

export enum TENANT {
  DEV,
  ESPOO,
  TAMPERE
}

let currentTenant: TENANT = TENANT.DEV

const envTenant = process.env.REACT_APP_TENANT
if (envTenant) {
  if (envTenant === `ESPOO`) {
    currentTenant = TENANT.ESPOO
  } else if (envTenant === `TAMPERE`) {
    currentTenant = TENANT.TAMPERE
  } else {
    // Default
    console.warn('No tenant selected, defaulting to DEV')
    currentTenant = TENANT.DEV
  }
}

export const appLocalization = {
  tenants: {
    [TENANT.ESPOO]: {
      logo: EspooLogo,
      logoAlt: `Espoon kaupunki`,
      loginText: `Kirjaudu sisään Espoo-AD:lla`
    },
    [TENANT.TAMPERE]: {
      logo: TampereLogo,
      logoAlt: `Tampereen Kaupunki`,
      loginText: `Kirjaudu sisään Tampere-AD:lla`
    },
    [TENANT.DEV]: {
      logo: TampereLogo,
      logoAlt: `NO TENANT SELECTED`,
      loginText: `Login not possible when tenant not selected. Please feed REACT_APP_TENANT on build time. Valid options are 'ESPOO' and 'TAMPERE'.`
    }
  },
  currentTenant
}

export const logo = appLocalization.tenants[appLocalization.currentTenant].logo
export const logoAlt =
  appLocalization.tenants[appLocalization.currentTenant].logo
export const loginText =
  appLocalization.tenants[appLocalization.currentTenant].loginText

export const frontendVersion =
  process.env.REACT_APP_VERSION || `Unavailable (env REACT_APP_VERSION)`
