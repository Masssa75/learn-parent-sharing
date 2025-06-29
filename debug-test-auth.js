const { chromium } = require('playwright')

async function debugTestAuth() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    console.log('Debugging test auth page...')
    
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth')
    await page.waitForLoadState('networkidle')
    
    // Take screenshot
    await page.screenshot({ path: 'debug-test-auth.png', fullPage: true })
    
    // Check what elements are present
    const buttons = await page.locator('button').all()
    console.log(`Found ${buttons.length} buttons`)
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i]
      const text = await button.textContent()
      const id = await button.getAttribute('data-telegram-id')
      console.log(`Button ${i}: "${text}" (telegram-id: ${id})`)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

debugTestAuth()