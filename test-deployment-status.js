const { chromium } = require('playwright')

async function testDeploymentStatus() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    console.log('Testing deployment status...')
    
    // Go directly to homepage
    await page.goto('https://learn-parent-sharing-app.netlify.app/')
    await page.waitForLoadState('networkidle')
    
    // Check console for any errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text())
      }
    })
    
    // Login
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth')
    await page.fill('input[type="password"]', 'test-learn-2025')
    await page.click('button:has-text("Login as admintest")')
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/')
    
    // Wait for auth
    await page.waitForSelector('button[title]', { timeout: 10000 })
    await page.waitForTimeout(2000)
    
    // Check if SimplePointsDisplay component exists in the DOM
    console.log('\nChecking for points display component...')
    
    // Look for any element with "points" or "level" text
    const elementsWithPoints = await page.locator('*:has-text("points")').count()
    const elementsWithLevel = await page.locator('*:has-text("Level")').count()
    
    console.log(`Elements containing "points": ${elementsWithPoints}`)
    console.log(`Elements containing "Level": ${elementsWithLevel}`)
    
    // Check the specific container
    const pointsContainer = await page.locator('div.max-w-2xl.mx-auto.px-5').nth(2)
    if (await pointsContainer.isVisible()) {
      const content = await pointsContainer.innerHTML()
      console.log('\nPoints container HTML length:', content.length)
      console.log('Contains SimplePointsDisplay:', content.includes('SimplePointsDisplay'))
      console.log('First 200 chars:', content.substring(0, 200))
    }
    
    // Try to call the points API manually
    console.log('\nManually testing points API...')
    await page.goto('https://learn-parent-sharing-app.netlify.app/api/users/de2f7130-7682-4bc0-aad1-e1b83c07cb43/points')
    await page.waitForLoadState('networkidle')
    
    const pageContent = await page.content()
    console.log('API response (first 500 chars):', pageContent.substring(0, 500))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

testDeploymentStatus()