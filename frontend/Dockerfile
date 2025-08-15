# syntax=docker/dockerfile:1.17.1
# SPDX-FileCopyrightText: 2023-2024 City of Espoo
#
# SPDX-License-Identifier: LGPL-2.1-or-later

ARG NGINX_VERSION=1.29.0

FROM node:22.18.0-bookworm-slim AS builder

ARG CACHE_BUST=2025-W07

WORKDIR /project

COPY ./.yarn ./.yarn
COPY ./package.json ./yarn.lock ./.yarnrc.yml ./
RUN yarn install --immutable

COPY . .

RUN yarn build

FROM builder AS test

RUN yarn lint
RUN yarn type-check

FROM nginx:${NGINX_VERSION}

ARG CACHE_BUST=2025-W07

ENV NGINX_ENV=local \
    TZ=UTC

RUN apt-get update \
 && apt-get -y dist-upgrade \
 && apt-get -y --no-install-recommends install ruby \
 && apt-get remove --auto-remove -y nginx-module-image-filter \
 && curl -sSfL https://github.com/espoon-voltti/s3-downloader/releases/download/v1.4.1/s3downloader-linux-amd64 \
       -o /bin/s3download \
 && chmod +x /bin/s3download \
 && echo "520ea232e83a7cefe2a87d4f2af8433e383a4351464e213b7dd3b78ca0dc200f  /bin/s3download" | sha256sum -c - \
 && rm -rf /var/lib/apt/lists/*


COPY ./nginx/bin/ /bin/
COPY ./nginx/etc/ /etc/

ENTRYPOINT ["/bin/proxy-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

COPY --from=builder /project/dist/esbuild/oppivelvollisuus/ /static/

ARG build=none
ARG commit=none

ENV APP_BUILD="$build" \
    APP_COMMIT="$commit"
LABEL fi.espoo.build="$build" \
      fi.espoo.commit="$commit"
