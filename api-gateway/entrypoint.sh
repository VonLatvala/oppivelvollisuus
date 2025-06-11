#!/bin/bash

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -euo pipefail

if [ "${VOLTTI_ENV:-local}" != "local" ]; then
  if [ "${INFRA:-aws}" == "aws" ]; then
    s3download "$DEPLOYMENT_BUCKET" config /config
  fi
fi

exec "$@"
