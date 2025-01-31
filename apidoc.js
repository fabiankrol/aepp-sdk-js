#!/usr/bin/env node
/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */

'use strict'

const jsdoc2md = require('jsdoc-to-markdown')
const fs = require('fs')
const path = require('path')

const outputDir = path.join(__dirname, 'docs')
const prefix = /^@aeternity\/aepp-sdk\/es\//
const templateData = jsdoc2md.getTemplateDataSync({
  configure: '.jsdoc.json',
  files: 'src/**'
})

function createDirs (path) {
  const paths = path.split(/\//).slice(1, -1)
    .reduce((acc, e) => acc.concat([`${acc[acc.length - 1]}/${e}`]), ['']).slice(1)

  paths.forEach(dir => {
    try {
      fs.openSync(dir, 'r')
    } catch (e) {
      fs.mkdirSync(dir)
    }
  })
}

const modules = templateData
  .filter(({ kind }) => kind === 'module')
  .map(({ name }) => {
    return { name, out: `api/${name.replace(prefix, '')}` }
  })

Object.values(modules).forEach(({ name, out }) => {
  const template = `{{#module name="${name}"}}{{>docs}}{{/module}}`
  console.log(`rendering ${name}`)
  const dest = path.resolve(outputDir, `${out}.md`)
  const output = jsdoc2md.renderSync({
    data: templateData,
    template,
    partial: [
      'tooling/docs/header.hbs',
      'tooling/docs/link.hbs',
      'tooling/docs/customTags.hbs'
    ]
  })
  createDirs(dest)
  fs.writeFileSync(dest, output)
})

const output = jsdoc2md.renderSync({
  data: modules,
  template: '{{>toc}}',
  partial: ['tooling/docs/toc.hbs']
})

fs.writeFileSync(path.resolve(outputDir, 'api.md'), output)
