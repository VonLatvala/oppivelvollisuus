#!/bin/sh
# SPDX-FileCopyrightText: 2025 City of Tampere
#
# SPDX-License-Identifier: LGPL-2.1-or-later
set -eux

echo "Booting Oppivelvollisuus frontend"

echo "Checking node_modules"

ls -l node_modules || echo "No node_modules present"
ls -l .yarn

echo "Installing dependencies"
yarn
# yarn install
echo "Starting dev server"
yarn dev
echo "Shutting down"
