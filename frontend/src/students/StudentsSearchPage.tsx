// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

import { faBroom } from '@fortawesome/free-solid-svg-icons/faBroom'
import { faChartPie } from '@fortawesome/free-solid-svg-icons/faChartPie'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass'
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons/faTriangleExclamation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { isBefore, subWeeks } from 'date-fns'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import styled from 'styled-components'

import { apiGetEmployees, EmployeeUser } from '../employees/api'
import { AddButton } from '../shared/buttons/AddButton'
import { InlineButton } from '../shared/buttons/InlineButton'
import { formatDate } from '../shared/dates'
import { Checkbox } from '../shared/form/Checkbox'
import { InputField } from '../shared/form/InputField'
import { Select } from '../shared/form/Select'
import {
  FlexColWithGaps,
  FlexLeftRight,
  FlexRowWithGaps,
  LabeledInput,
  PageContainer,
  SectionContainer,
  Table,
  VerticalGap
} from '../shared/layout'
import { colors } from '../shared/theme'
import { Label, P } from '../shared/typography'

import { Assignee, StudentSearchContext } from './StudentSearchContext'
import { apiDeleteOldStudents, apiGetStudents, StudentSummary } from './api'
import { StatusChip } from './cases/StatusChip'
import {
  CaseSource,
  caseSourceNames,
  caseSourceNamesShort,
  caseSources
} from './cases/enums'
import { caseEventTypeNames } from './cases/events/enums'
import { caseStatuses, caseStatusNames } from './cases/status/enums'

export const StudentsSearchPage = React.memo(function StudentsSearchPage() {
  const navigate = useNavigate()

  const [employees, setEmployees] = useState<EmployeeUser[] | null>(null)
  useEffect(() => {
    void apiGetEmployees().then(setEmployees)
  }, [])

  const {
    statuses,
    setStatuses,
    sources,
    setSources,
    query,
    debouncedQuery,
    setQuery,
    assignedTo,
    setAssignedTo
  } = useContext(StudentSearchContext)

  const [studentsResponse, setStudentsResponse] = useState<
    StudentSummary[] | null
  >(null)

  const loadStudents = useCallback(() => {
    setStudentsResponse(null)
    void apiGetStudents({
      query: debouncedQuery,
      statuses: statuses.length > 0 ? statuses : [...caseStatuses],
      sources: sources.length > 0 ? sources : [...caseSources],
      assignee:
        assignedTo === null
          ? null
          : assignedTo === 'NONE'
            ? { assignedTo: null }
            : { assignedTo: assignedTo.id }
    }).then(setStudentsResponse)
  }, [debouncedQuery, statuses, sources, assignedTo])

  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  const [deletingOldStudents, setDeletingOldStudents] = useState(false)

  return (
    <PageContainer>
      <SectionContainer $minHeight="600px">
        <FlexColWithGaps $gapSize="m">
          <FlexLeftRight>
            <FlexRowWithGaps $gapSize="L">
              <InlineButton
                text="Raportointi"
                icon={faChartPie}
                onClick={() => navigate('/raportointi')}
              />
              <InlineButton
                text="Poista yli 21-vuotiaat"
                icon={faBroom}
                disabled={deletingOldStudents}
                onClick={() => {
                  if (
                    window.confirm(
                      'Haluatko varmasti poistaa kaikki yli 21-vuotiaat oppivelvolliset?'
                    )
                  ) {
                    setDeletingOldStudents(true)
                    void apiDeleteOldStudents()
                      .then(() => window.alert('Siivousoperaatio onnistui'))
                      .catch(() =>
                        window.alert(
                          'Siivousoperaatio epäonnistui: yritä uudelleen'
                        )
                      )
                      .finally(() => {
                        setDeletingOldStudents(false)
                        loadStudents()
                      })
                  }
                }}
              />
            </FlexRowWithGaps>
            <AddButton
              text="Lisää oppivelvollinen"
              onClick={() => navigate('/oppivelvolliset/uusi')}
              data-qa="create-student-button"
            />
          </FlexLeftRight>
          <LabeledInput $cols={6}>
            <Label>Haku nimellä tai hetulla</Label>
            <InputField
              value={query}
              onChange={setQuery}
              icon={faMagnifyingGlass}
            />
          </LabeledInput>
          <FlexRowWithGaps $gapSize="L">
            <LabeledInput $cols={7}>
              <Label>Näytettävät tilat</Label>
              <FlexRowWithGaps $gapSize="s">
                {caseStatuses.map((status) => (
                  <StyledCheckbox
                    key={status}
                    label={caseStatusNames[status]}
                    checked={statuses.includes(status)}
                    onChange={(checked) => {
                      if (checked) {
                        setStatuses((prev) => [...prev, status])
                      } else {
                        setStatuses((prev) => prev.filter((s) => s !== status))
                      }
                    }}
                  />
                ))}
              </FlexRowWithGaps>
            </LabeledInput>
            <LabeledInput $cols={3}>
              <Label>Ohjaaja</Label>
              {employees ? (
                <Select<Assignee>
                  items={['NONE', ...employees]}
                  selectedItem={assignedTo}
                  getItemValue={(e) => (e === 'NONE' ? 'NONE' : e.id)}
                  getItemLabel={(e) =>
                    e === 'NONE'
                      ? 'Ei ohjaajaa'
                      : `${e.firstName} ${e.lastName}`
                  }
                  placeholder="Näytä kaikki"
                  onChange={setAssignedTo}
                />
              ) : (
                <span>...</span>
              )}
            </LabeledInput>
          </FlexRowWithGaps>

          <LabeledInput $cols={7}>
            <Label>Ilmoituksen lähde</Label>
            <FlexRowWithGaps $gapSize="s" style={{ alignItems: 'baseline' }}>
              {caseSources.map((source) => (
                <StyledCheckbox
                  key={source}
                  label={caseSourceNamesShort[source]}
                  checked={sources.includes(source)}
                  onChange={(checked) => {
                    if (checked) {
                      setSources((prev) => [
                        ...prev.filter((s) => s !== source),
                        source
                      ])
                    } else {
                      setSources((prev) => prev.filter((s) => s !== source))
                    }
                  }}
                />
              ))}
            </FlexRowWithGaps>
          </LabeledInput>
        </FlexColWithGaps>

        <VerticalGap $size="L" />

        <Label>
          Oppivelvollisia{' '}
          {studentsResponse ? `(${studentsResponse.length})` : ''}
        </Label>

        <VerticalGap />

        {studentsResponse
          ? studentsResponse.length > 0 && (
              <Table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <Th style={{ width: '160px' }}>Ilmoitettu</Th>
                    <Th style={{ width: '160px' }}>Nimi</Th>
                    <Th>Viimeisin tapahtuma</Th>
                    <Th style={{ width: '160px' }}>Ohjaaja</Th>
                    <Th style={{ width: '200px' }} />
                  </tr>
                </thead>
                <tbody>
                  {studentsResponse.map((student) => (
                    <tr key={student.id}>
                      <td>
                        <FlexRowWithGaps $gapSize="s">
                          <span>
                            {student.openedAt
                              ? formatDate(student.openedAt)
                              : '-'}
                          </span>
                          {student.source && (
                            <SourceLabel
                              title={caseSourceNames[student.source]}
                            >
                              {sourceAbbreviation(student.source)}
                            </SourceLabel>
                          )}
                          {student.openedAt &&
                            isBefore(
                              student.openedAt,
                              subWeeks(new Date(), 5)
                            ) &&
                            student.status !== 'FINISHED' && (
                              <FontAwesomeIcon
                                icon={faTriangleExclamation}
                                color={
                                  student.source === 'VALPAS_NOTICE'
                                    ? colors.status.danger
                                    : colors.status.warning
                                }
                              />
                            )}
                        </FlexRowWithGaps>
                      </td>
                      <td>
                        <Link to={`/oppivelvolliset/${student.id}`}>
                          {student.lastName} {student.firstName}
                        </Link>
                      </td>
                      <td>
                        {student.lastEvent ? (
                          <FlexColWithGaps $gapSize="s">
                            <div>
                              <span>{formatDate(student.lastEvent.date)} </span>
                              {student.lastEvent.type !== 'NOTE' && (
                                <span>
                                  {caseEventTypeNames[student.lastEvent.type]}
                                </span>
                              )}
                            </div>
                            <P>{student.lastEvent.notes}</P>
                          </FlexColWithGaps>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td>{student.assignedTo?.name ?? 'Ei ohjaajaa'}</td>
                      <td>
                        {student.status ? (
                          <StatusChip status={student.status} />
                        ) : (
                          <span>Ei ilmoitusta</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )
          : '...'}
      </SectionContainer>
      <SectionContainer>
        Versio {process.env.REACT_APP_VERSION}
      </SectionContainer>
    </PageContainer>
  )
})

const StyledCheckbox = styled(Checkbox)`
  width: 200px;
`

const Th = styled.th`
  text-align: left;
`

const SourceLabel = styled.abbr`
  width: 24px;
  height: 24px;
  border-radius: 100%;
  font-size: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${colors.main.m1};
  color: ${colors.grayscale.g0};
  user-select: none;
  text-decoration: none;
`

const sourceAbbreviation = (source: CaseSource) => {
  switch (source) {
    case 'VALPAS_NOTICE':
      return 'V'
    case 'VALPAS_AUTOMATIC_CHECK':
      return 'A'
    case 'OTHER':
      return 'M'
  }
}
