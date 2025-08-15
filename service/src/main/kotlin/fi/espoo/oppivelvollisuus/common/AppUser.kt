// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

package fi.espoo.oppivelvollisuus.common

import org.jdbi.v3.core.Handle
import org.jdbi.v3.core.kotlin.bindKotlin
import org.jdbi.v3.core.kotlin.mapTo
import org.jdbi.v3.core.mapper.PropagateNull
import java.util.UUID
import kotlin.jvm.optionals.getOrNull

data class AdUser(
    val externalId: String,
    val firstName: String,
    val lastName: String,
    val email: String?
)

data class AppUser(
    val id: UUID,
    val externalId: String,
    val firstName: String,
    val lastName: String,
    val email: String?
)

data class UserBasics(
    @param:PropagateNull val id: UUID,
    val name: String
)

fun Handle.upsertAppUserFromAd(adUser: AdUser): AppUser =
    createQuery(
        // language=SQL
        """
INSERT INTO users (external_id, first_names, last_name, email)
VALUES (:externalId, :firstName, :lastName, :email)
ON CONFLICT (external_id) DO UPDATE
SET updated = now(), first_names = :firstName, last_name = :lastName, email = :email
RETURNING id, external_id, first_name, last_name, email
        """.trimIndent()
    ).bindKotlin(adUser)
        .mapTo<AppUser>()
        .one()

fun Handle.getAppUsers(): List<AppUser> =
    createQuery(
        """
    SELECT id, external_id, first_name, last_name, email
    FROM users
    WHERE NOT system_user
"""
    ).mapTo<AppUser>().list()

fun Handle.getAppUser(id: UUID) =
    createQuery(
        // language=SQL
        """
SELECT id, external_id, first_name, last_name, email
FROM users 
WHERE id = :id AND NOT system_user
        """.trimIndent()
    ).bind("id", id)
        .mapTo<AppUser>()
        .findOne()
        .getOrNull()
