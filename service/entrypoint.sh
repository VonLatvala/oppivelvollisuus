#!/usr/bin/env bash

# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

set -euo pipefail

# For log tagging (with a default value and error logging without crashing)
# shellcheck disable=SC2155
if [ "${INFRA}" != "azure" ] && [ -z "$HOST_IP" ]; then
    export HOST_IP=$(curl --max-time 10 --silent --fail --show-error http://169.254.169.254/latest/meta-data/local-ipv4 || printf 'UNAVAILABLE')
elif [ -z "$HOST_IP" ] && [ "$INFRA" = "azure" ]; then
    # This is for the latest revision
    export HOST_IP="${CONTAINER_APP_NAME}.${CONTAINER_APP_ENV_DNS_SUFFIX}"
    # This is for the specific revision running
    # export HOST_IP="${CONTAINER_APP_HOSTNAME}"
else
    export HOST_IP=UNAVAILABLE
fi

if [ "${INFRA}" != "azure" ] && [ "${VOLTTI_ENV:-local}" != "local" ]; then
  s3download "$DEPLOYMENT_BUCKET" config /config
fi

# shellcheck disable=SC2086
exec java -cp . -server $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher "$@"
