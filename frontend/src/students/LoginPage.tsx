import React from 'react'
import styled from 'styled-components'

import { FlexColWithGaps } from '../shared/layout'
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
    <Wrapper>
      <FlexColWithGaps $gapSize="L">
        <H2>Kirjaudu sisään Espoo-AD:lla</H2>
        <a href={getLoginUrl()}>Kirjaudu sisään</a>
      </FlexColWithGaps>
    </Wrapper>
  )
})
