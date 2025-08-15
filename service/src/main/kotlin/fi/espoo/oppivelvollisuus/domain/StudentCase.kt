// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.oppivelvollisuus.domain

import fi.espoo.oppivelvollisuus.common.BadRequest
import fi.espoo.oppivelvollisuus.common.NotFound
import fi.espoo.oppivelvollisuus.common.UserBasics
import fi.espoo.oppivelvollisuus.config.AuthenticatedUser
import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.mapper.Nested
import org.jdbi.v3.core.mapper.PropagateNull
import org.jdbi.v3.json.Json
import java.time.LocalDate
import java.util.UUID

enum class CaseStatus {
    TODO,
    ON_HOLD,
    FINISHED
}

enum class CaseSource {
    VALPAS_NOTICE,
    VALPAS_AUTOMATIC_CHECK,
    OTHER
}

enum class ValpasNotifier {
    PERUSOPETUS,
    AIKUISTEN_PERUSOPETUS,
    AMMATILLINEN_PERUSTUTKINTO,
    LUKIO,
    AIKUISLUKIO,
    YLEISOPPILAITOKSEN_TUVA,
    AMMATILLISEN_ERITYISOPPILAITOKSEN_PERUSTUTKINTO,
    AMMATILLISEN_ERITYISOPPILAITOKSEN_TUVA,
    TELMA,
    TOINEN_ASUINKUNTA
}

enum class OtherNotifier {
    ENNAKOIVA_OHJAUS,
    TYOLLISYYSPALVELUT,
    OMA_YHTEYDENOTTO,
    OHJAAMOTALO,
    OPPILAITOS,
    LASTENSUOJELU,
    OTHER
}

enum class SchoolBackground {
    PERUSKOULUN_PAATTOTODISTUS,
    EI_PERUSKOULUN_PAATTOTODISTUSTA,
    KESKEYTYNEET_TOISEN_ASTEEN_OPINNOT,
    KESKEYTYNEET_NIVELVAIHEEN_OPINNOT,
    VSOP_PERUSKOULUSSA,
    YLEINEN_TUKI_PERUSKOULUSSA,
    TEHOSTETTU_TUKI_PERUSKOULUSSA,
    TEHOSTETTU_HENKKOHT_TUKI_PERUSKOULUSSA,
    ERITYISEN_TUEN_PAATOS_PERUSKOULUSSA,
    YKSILOLLISTETTY_OPPIMAARA_AIDINKIELESSA_JA_MATEMATIIKASSA,
    PERUSOPETUKSEEN_VALMISTAVA_OPISKELU_SUOMESSA,
    ULKOMAILLA_SUORITETUT_PERUSOPETUSTA_VASTAAVAT_OPINNOT
}

enum class CaseBackgroundReason {
    MOTIVAATION_PUUTE,
    VAARA_ALAVALINTA,
    OPPIMISVAIKEUDET,
    ELAMANHALLINNAN_HAASTEET,
    POISSAOLOT,
    TERVEYDELLISET_PERUSTEET,
    MUUTTO_PAIKKAKUNNALLE,
    MUUTTO_ULKOMAILLE,
    MAAHAN_MUUTTANUT_NUORI_ILMAN_OPISKELUPAIKKAA,
    MUU_SYY
}

enum class NotInSchoolReason {
    KATSOTTU_ERONNEEKSI_OPPILAITOKSESTA,
    EI_OLE_VASTAANOTTANUT_SAAMAANSA_OPISKELUPAIKKAA,
    EI_OLE_ALOITTANUT_VASTAANOTTAMASSAAN_OPISKELUPAIKASSA,
    EI_OLE_HAKEUTUNUT_JATKO_OPINTOIHIN,
    EI_OPISKELUPAIKKAA_YLEISOPPILAITOKSESSA,
    EI_OPISKELUPAIKKAA_AMMATILLISESSA_ERITYISOPPILAITOKSESSA,
    EI_OLE_SAANUT_OPISKELUPAIKKAA_KIELITAIDON_VUOKSI,
    OPINNOT_ULKOMAILLA,
    MUU_SYY
}

data class StudentCaseInput(
    val openedAt: LocalDate,
    val assignedTo: UUID?,
    val source: CaseSource,
    val sourceValpas: ValpasNotifier?,
    val sourceOther: OtherNotifier?,
    val sourceContact: String,
    val schoolBackground: Set<SchoolBackground>,
    val caseBackgroundReasons: Set<CaseBackgroundReason>,
    val notInSchoolReason: NotInSchoolReason?
) {
    init {
        if ((source == CaseSource.VALPAS_NOTICE) != (sourceValpas != null)) {
            throw BadRequest("sourceValpas must be present if and only if source is VALPAS_NOTICE")
        }
        if ((source == CaseSource.OTHER) != (sourceOther != null)) {
            throw BadRequest("sourceOther must be present if and only if source is OTHER")
        }
    }
}

fun Handle.insertStudentCase(
    studentId: UUID,
    data: StudentCaseInput,
    user: AuthenticatedUser
): UUID =
    createUpdate(
        """
                INSERT INTO student_cases (created_by, student_id, opened_at, assigned_to, status, source, source_valpas, source_other, source_contact, school_background, case_background_reasons, not_in_school_reason) 
                VALUES (:user, :studentId, :openedAt, :assignedTo, 'TODO', :source, :sourceValpas, :sourceOther, :sourceContact, :schoolBackground::school_background[], :caseBackgroundReasons::case_background_reason[], :notInSchoolReason)
                RETURNING id
            """
    ).bind("studentId", studentId)
        .bindKotlin(data)
        .bind("user", user.id)
        .executeAndReturnGeneratedKeys()
        .mapTo<UUID>()
        .one()

enum class CaseFinishedReason {
    BEGAN_STUDIES,
    COMPULSORY_EDUCATION_ENDED,
    COMPULSORY_EDUCATION_SUSPENDED,
    COMPULSORY_EDUCATION_SUSPENDED_PERMANENTLY,
    MOVED_TO_ANOTHER_MUNICIPALITY,
    MOVED_ABROAD,
    ERRONEOUS_NOTICE,
    OTHER
}

enum class SchoolType {
    PERUSOPETUKSEEN_VALMISTAVA,
    AIKUISTEN_PERUSOPETUS,
    AMMATILLINEN_PERUSTUTKINTO,
    LUKIO,
    AIKUISLUKIO,
    YLEISOPPILAITOKSEN_TUVA,
    AMMATILLISEN_OPPILAITOKSEN_TUVA,
    AMMATILLISEN_ERITYISOPPILAITOKSEN_PERUSTUTKINTO,
    TELMA,
    KANSANOPISTO,
    OTHER
}

data class FinishedInfo(
    @param:PropagateNull val reason: CaseFinishedReason,
    val startedAtSchool: SchoolType?
) {
    init {
        if ((reason == CaseFinishedReason.BEGAN_STUDIES) != (startedAtSchool != null)) {
            throw BadRequest("startedAtSchool must be present if and only if finished reason is BEGAN_STUDIES")
        }
    }
}

data class StudentCase(
    val id: UUID,
    val studentId: UUID,
    val openedAt: LocalDate,
    @param:Nested("assignedTo") val assignedTo: UserBasics?,
    val status: CaseStatus,
    @param:Nested("finishedInfo") val finishedInfo: FinishedInfo?,
    val source: CaseSource,
    val sourceValpas: ValpasNotifier?,
    val sourceOther: OtherNotifier?,
    val sourceContact: String,
    val schoolBackground: Set<SchoolBackground>,
    val caseBackgroundReasons: Set<CaseBackgroundReason>,
    val notInSchoolReason: NotInSchoolReason?,
    @param:Json val events: List<CaseEvent>
) {
    init {
        if ((status == CaseStatus.FINISHED) != (finishedInfo != null)) {
            throw BadRequest("finishedInfo must be present if and only if status is FINISHED")
        }
        if ((source == CaseSource.VALPAS_NOTICE) != (sourceValpas != null)) {
            throw BadRequest("sourceValpas must be present if and only if source is VALPAS_NOTICE")
        }
        if ((source == CaseSource.OTHER) != (sourceOther != null)) {
            throw BadRequest("sourceOther must be present if and only if source is OTHER")
        }
    }
}

fun Handle.getStudentCasesByStudent(studentId: UUID): List<StudentCase> =
    createQuery(
"""
SELECT
    sc.id, sc.student_id, sc.opened_at,
    assignee.id AS assigned_to_id,
    assignee.first_name || ' ' || assignee.last_name AS assigned_to_name,
    sc.status,
    sc.finished_reason AS finished_info_reason,
    sc.started_at_school AS finished_info_started_at_school,
    sc.source,
    sc.source_valpas,
    sc.source_other,
    sc.source_contact,
    sc.school_background,
    sc.case_background_reasons,
    sc.not_in_school_reason,
    coalesce((
        SELECT jsonb_agg(jsonb_build_object(
            'id', e.id,
            'studentCaseId', e.student_case_id,
            'date', e.date,
            'type', e.type,
            'notes', e.notes,
            'created', jsonb_build_object(
                'name', creator.first_name || ' ' || creator.last_name,
                'time', e.created
            ),
            'updated', (CASE WHEN updater.id IS NOT NULL THEN jsonb_build_object(
                'name', updater.first_name || ' ' || updater.last_name,
                'time', e.updated
            ) END)
        ) ORDER BY date DESC, e.created DESC)
        FROM case_events e
        JOIN users creator ON e.created_by = creator.id
        LEFT JOIN users updater ON e.updated_by = updater.id
        WHERE student_case_id = sc.id
    ), '[]'::jsonb) AS events
FROM student_cases sc
LEFT JOIN users assignee ON sc.assigned_to = assignee.id
WHERE student_id = :studentId
ORDER BY opened_at DESC, sc.created DESC;
"""
    ).bind("studentId", studentId)
        .mapTo<StudentCase>()
        .list()

fun Handle.updateStudentCase(
    id: UUID,
    studentId: UUID,
    data: StudentCaseInput,
    user: AuthenticatedUser
) {
    createUpdate(
"""
UPDATE student_cases
SET 
    updated = now(),
    updated_by = :user,
    opened_at = :openedAt,
    assigned_to = :assignedTo,
    source = :source,
    source_valpas = :sourceValpas,
    source_other = :sourceOther,
    source_contact = :sourceContact,
    school_background = :schoolBackground::school_background[],
    case_background_reasons = :caseBackgroundReasons::case_background_reason[], 
    not_in_school_reason = :notInSchoolReason
WHERE id = :id AND student_id = :studentId
"""
    ).bind("id", id)
        .bind("studentId", studentId)
        .bindKotlin(data)
        .bind("user", user.id)
        .execute()
        .also { if (it != 1) throw NotFound() }
}

data class CaseStatusInput(
    val status: CaseStatus,
    val finishedInfo: FinishedInfo?
) {
    init {
        if ((status == CaseStatus.FINISHED) != (finishedInfo != null)) {
            throw BadRequest("finishedInfo must be present if and only if status is FINISHED")
        }
    }
}

fun Handle.updateStudentCaseStatus(
    id: UUID,
    studentId: UUID,
    data: CaseStatusInput,
    user: AuthenticatedUser
) {
    createUpdate(
        """
UPDATE student_cases
SET 
    updated = now(),
    updated_by = :user,
    status = :status,
    finished_reason = :finishedReason,
    started_at_school = :startedAtSchool
WHERE id = :id AND student_id = :studentId
"""
    ).bind("id", id)
        .bind("studentId", studentId)
        .bind("status", data.status)
        .bind("finishedReason", data.finishedInfo?.reason)
        .bind("startedAtSchool", data.finishedInfo?.startedAtSchool)
        .bind("user", user.id)
        .execute()
        .also { if (it != 1) throw NotFound() }
}

fun Handle.deleteStudentCase(
    id: UUID,
    studentId: UUID
) {
    createUpdate("DELETE FROM student_cases WHERE id = :id AND student_id = :studentId")
        .bind("id", id)
        .bind("studentId", studentId)
        .execute()
        .also { if (it != 1) throw NotFound() }
}
