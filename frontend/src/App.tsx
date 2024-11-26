// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import React, { Fragment } from 'react'
import { Navigate, createBrowserRouter, Outlet } from 'react-router-dom'
import styled from 'styled-components'

import { AuthGuard } from './auth/AuthGuard'
import { LoginPage } from './auth/LoginPage'
import { UserContextProvider } from './auth/UserContext'
import { UserHeader } from './auth/UserHeader'
import { useAuthStatus } from './auth/auth-status'
import { ReportsPage } from './reports/ReportsPage'
import { FlexRowWithGaps } from './shared/layout'
import { H1 } from './shared/typography'
import { CreateStudentPage } from './students/CreateStudentPage'
import { StudentPage } from './students/StudentPage'
import { StudentSearchProvider } from './students/StudentSearchContext'
import { StudentsSearchPage } from './students/StudentsSearchPage'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const EspooLogo = require('./images/EspooLogoPrimary.svg') as string

const Header = styled.nav`
  height: 80px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px double #888;
  margin-bottom: 32px;
  padding: 0 32px;
  background-color: #fff;
`

function App() {
  const authStatus = useAuthStatus()
  if (!authStatus) return null

  const user = authStatus.loggedIn && authStatus.user ? authStatus.user : null

  return (
    <UserContextProvider user={user}>
      <StudentSearchProvider>
        <Fragment>
          <Header>
            <FlexRowWithGaps>
              <img src={EspooLogo} width="100px" alt="Espoon kaupunki" />
              <H1>Oppivelvollisuuden seuranta</H1>
            </FlexRowWithGaps>
            <UserHeader />
          </Header>
          <Outlet />
        </Fragment>
      </StudentSearchProvider>
    </UserContextProvider>
  )
}

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/kirjaudu',
        element: (
          <AuthGuard allow="UNAUTHENTICATED_ONLY">
            <LoginPage />
          </AuthGuard>
        )
      },
      {
        path: '/oppivelvolliset',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <StudentsSearchPage />
          </AuthGuard>
        )
      },
      {
        path: '/oppivelvolliset/uusi',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <CreateStudentPage />
          </AuthGuard>
        )
      },
      {
        path: '/oppivelvolliset/:id',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <StudentPage />
          </AuthGuard>
        )
      },
      {
        path: '/raportointi',
        element: (
          <AuthGuard allow="AUTHENTICATED_ONLY">
            <ReportsPage />
          </AuthGuard>
        )
      },
      {
        path: '/*',
        element: <Navigate replace to="/oppivelvolliset" />
      },
      {
        index: true,
        element: <Navigate replace to="/oppivelvolliset" />
      }
    ]
  }
])
