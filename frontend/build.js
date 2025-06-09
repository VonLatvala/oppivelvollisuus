// SPDX-FileCopyrightText: 2023-2024 City of Espoo
//
// SPDX-License-Identifier: LGPL-2.1-or-later

const fs = require('fs/promises')

const esbuild = require('esbuild')
const express = require('express')
const proxy = require('express-http-proxy')
const _ = require('lodash')
const yargs = require('yargs')

const outdir = `dist/esbuild/oppivelvollisuus`
const publicPath = '/'

/* eslint-disable no-console */

async function main() {
  const args = yargs
    .option('--dev', {
      describe: 'Make a development build',
      type: 'boolean',
      default: false
    })
    .option('--watch', {
      describe: 'Watch for file changes and rebuild',
      type: 'boolean',
      default: false
    })
    .option('--serve', {
      describe: 'Serve the result at localhost:9099',
      type: 'boolean',
      default: false
    }).argv

  const config = {
    dev: args.dev,
    watch: args.watch
  }

  await buildProject(config)

  if (args.serve) {
    serve()
  } else {
    process.exit(0)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

async function buildProject(config) {
  const { dev, watch } = config

  const buildOptions = {
    bundle: true,
    sourcemap: dev,
    minify: !dev,
    resolveExtensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    publicPath,
    plugins: [],
    logLevel: 'info',
    color: dev
  }

  const context = await esbuild.context({
    ...buildOptions,
    entryPoints: ['src/index.tsx'],
    entryNames: '[name]-[hash]',
    loader: {
      '.ico': 'file',
      '.png': 'file',
      '.svg': 'file',
      '.woff': 'file',
      '.woff2': 'file'
    },
    metafile: true,
    outdir,
    plugins: [
      ...buildOptions.plugins,
      {
        name: 'oppivelvollisuus-static-files',
        setup(build) {
          build.onEnd(async (result) => {
            if (!result.metafile) return
            await staticFiles(result.metafile.outputs)
            console.log('Build done')
          })
        }
      }
    ]
  })

  if (watch) {
    await context.watch()
  } else {
    await context.rebuild()
  }
}

function serve() {
  const app = express()
  app.use(
    '/api',
    proxy(process.env.API_GATEWAY_URL ?? 'http://localhost:3000', {
      parseReqBody: false,
      proxyReqPathResolver: ({ originalUrl }) => originalUrl
    })
  )

  const middleware = express.static(outdir)

  app.use('/', middleware)
  app.get(`/{*rest}`, (req, _res, next) => {
    req.url = `index.html`
    next()
  })
  app.use('/', middleware)

  const port = 9000
  app.listen(port, '0.0.0.0', () => {
    console.info(`Server started at http://localhost:${port}`)
  })
}

async function staticFiles(outputs) {
  const indexJs = findOutputFile(outputs, 'index', 'js')
  if (!indexJs) throw new Error(`Output file for index.js not found`)
  const indexCss = findOutputFile(outputs, 'index', 'css')
  if (!indexCss) throw new Error(`Output file for index.css not found`)
  const indexHtml = _.template(await fs.readFile(`src/index.html`))

  await fs.writeFile(
    `${outdir}/index.html`,
    indexHtml({
      assets: [stylesheet(indexCss), script(indexJs)].join('\n')
    })
  )
}

function findOutputFile(obj, name, suffix) {
  const re = new RegExp(`^${outdir}/(${name}-.*\\.${suffix}$)`)
  for (const key of Object.keys(obj)) {
    const match = key.match(re)
    if (match) {
      return match[1]
    }
  }
  return undefined
}

function script(fileName) {
  return `<script defer src="${publicPath + fileName}"></script>`
}

function stylesheet(fileName) {
  return `<link rel="stylesheet" type="text/css" href="${
    publicPath + fileName
  }">`
}
