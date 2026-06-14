// ui-check driver — headless screenshots of the KabaRent frontend at several
// viewport widths. Driven by playwright-core against the system Chromium
// browser (Microsoft Edge by default, so no browser download is needed).
//
// Run it FROM the frontend/ directory (so `playwright-core` resolves from
// frontend/node_modules). See .claude/skills/ui-check/SKILL.md for the full flow.
//
// Args (all optional):
//   --route=/            route to load (default "/")
//   --selector=footer    CSS selector to crop to; omit for a full-page shot
//   --widths=375,768,1280  comma-separated viewport widths
//   --out=ui-shots       output directory
//   --base=http://localhost:5173   dev server origin
//   --channel=msedge     Playwright browser channel (msedge | chrome)
//
// Example: node ui-check.mjs --route=/ --selector=footer --widths=375,768,1280

import { mkdirSync } from 'fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

// Resolve playwright-core from the CURRENT WORKING DIR (run this from frontend/),
// not from this script's location under .claude/skills/.
const require = createRequire(join(process.cwd(), 'package.json'))
const { chromium } = require('playwright-core')

const args = Object.fromEntries(
  process.argv.slice(2).map(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/)
    return m ? [m[1], m[2] ?? true] : [a, true]
  })
)

const base = (args.base || 'http://localhost:5173').replace(/\/$/, '')
const route = args.route || '/'
const selector = typeof args.selector === 'string' ? args.selector : null
const widths = String(args.widths || '375,768,1280').split(',').map(Number)
const out = args.out || 'ui-shots'
const channel = args.channel || 'msedge'

const url = base + (route.startsWith('/') ? route : '/' + route)
const sanitize = s => s.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '')
const slug =
  (route === '/' ? 'home' : sanitize(route)) +
  (selector ? '-' + sanitize(selector) : '')

mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ channel, args: ['--no-sandbox'] })
const errors = []

for (const width of widths) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } })
  const page = await ctx.newPage()
  page.on('console', m => { if (m.type() === 'error') errors.push(`[${width}px] ${m.text()}`) })

  await page.goto(url, { waitUntil: 'domcontentloaded' })

  const file = `${out}/${slug}-${width}.png`
  if (selector) {
    await page.waitForSelector(selector, { timeout: 15000 })
    const el = page.locator(selector).first()
    await el.scrollIntoViewIfNeeded()
    await el.screenshot({ path: file })
  } else {
    await page.screenshot({ path: file, fullPage: true })
  }
  console.log('saved', file)
  await ctx.close()
}

await browser.close()

if (errors.length) {
  console.log('\nconsole errors during load:')
  for (const e of errors) console.log('  ', e)
}
console.log('done')
