import puppeteer from 'puppeteer'

const BASE = 'http://localhost:3002'
const pages = [
  { path: '/', name: 'dashboard' },
  { path: '/viral', name: 'viral' },
  { path: '/settings', name: 'settings' },
  { path: '/media', name: 'media' },
]

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })

for (const { path, name } of pages) {
  await page.goto(BASE + path, { waitUntil: 'networkidle0', timeout: 20000 })
  // wait for fonts + styles
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: `/tmp/l9_${name}.png`, fullPage: false })
  console.log(`✓ ${name}`)
}

await browser.close()
