const { chromium } = require('playwright')

async function testPointsWithWait() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    console.log('Testing points system with proper wait...')
    
    // Navigate to test auth page
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth')
    await page.waitForLoadState('networkidle')
    
    // Enter password
    console.log('Entering test password...')
    await page.fill('input[type="password"]', 'test-learn-2025')
    
    // Login as admintest
    console.log('Logging in as admintest...')
    await page.click('button:has-text("Login as admintest")')
    
    // Wait for navigation and auth to complete
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 })
    await page.waitForLoadState('networkidle')
    
    // Wait for the profile button to appear (indicates auth is complete)
    console.log('Waiting for authentication to complete...')
    await page.waitForSelector('button[title*="Admin Test"], button[title*="Profile"]', { timeout: 10000 })
    
    // Additional wait to ensure components have rendered
    await page.waitForTimeout(2000)
    
    // Take screenshot
    console.log('Taking screenshot of authenticated state...')
    await page.screenshot({ path: 'points-authenticated.png', fullPage: true })
    
    // Check for points display
    console.log('Looking for points display...')
    
    // Look for the points display container
    const pointsDisplay = await page.locator('.flex.items-center.gap-4.p-4.bg-dark-background').first()
    const isVisible = await pointsDisplay.isVisible()
    
    if (isVisible) {
      console.log('✅ Points display is visible!')
      
      // Try to get the level badge
      const levelBadge = await page.locator('.w-12.h-12.bg-primary.rounded-full').first()
      if (await levelBadge.isVisible()) {
        const level = await levelBadge.textContent()
        console.log(`User level: ${level}`)
      }
      
      // Try to get points
      const pointsText = await page.locator('.text-2xl.font-bold.text-primary').first()
      if (await pointsText.isVisible()) {
        const points = await pointsText.textContent()
        console.log(`Current points: ${points}`)
      }
    } else {
      console.log('❌ Points display not found')
      
      // Debug: Check what's actually on the page
      const bodyText = await page.locator('body').textContent()
      console.log('Page contains "Discover":', bodyText.includes('Discover'))
      console.log('Page contains "SIGN IN":', bodyText.includes('SIGN IN'))
      console.log('Page contains profile button:', await page.locator('button[title]').count() > 0)
    }
    
    // Test the points API directly
    console.log('\nTesting points API directly...')
    const pointsResponse = await page.evaluate(async () => {
      // Get the user ID from the auth check
      const authRes = await fetch('/api/auth/check')
      const authData = await authRes.json()
      
      if (authData.authenticated && authData.user) {
        const pointsRes = await fetch(`/api/users/${authData.user.id}/points`)
        return await pointsRes.json()
      }
      return { error: 'Not authenticated' }
    })
    
    console.log('Points API response:', pointsResponse)
    
  } catch (error) {
    console.error('Error:', error)
    await page.screenshot({ path: 'points-error.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

testPointsWithWait()