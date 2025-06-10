// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React from 'react'
import styled from 'styled-components'

import { appLocalization } from '../App'
import { LinkStyledAsButton } from '../shared/buttons/LinkStyledAsButton'
import {
  FlexColWithGaps,
  PageContainer,
  SectionContainer
} from '../shared/layout'
import { H2 } from '../shared/typography'

const Wrapper = styled.div`
  width: 100%;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
`

const redirectUri = (() => {
  if (window.location.pathname === '/kirjaudu') {
    return '/'
  }

  const params = new URLSearchParams(window.location.search)
  params.delete('loginError')

  const searchParams = params.toString()

  return `${window.location.pathname}${
    searchParams.length > 0 ? '?' : ''
  }${searchParams}${window.location.hash}`
})()

const getLoginUrl = () => {
  const relayState = encodeURIComponent(redirectUri)
  return `/api/auth/saml/login?RelayState=${relayState}`
}

export const LoginPage = React.memo(function LoginPage() {
  return (
    <PageContainer>
      <SectionContainer>
        <Wrapper>
          <FlexColWithGaps $gapSize="L" style={{ alignItems: 'center' }}>
            <H2>
              {appLocalization.tenants[appLocalization.currentTenant].loginText}
            </H2>
            <LinkStyledAsButton href={getLoginUrl()} data-qa="start-login">
              Kirjaudu sisään
            </LinkStyledAsButton>
          </FlexColWithGaps>
        </Wrapper>
      </SectionContainer>
    </PageContainer>
  )
})
