const { chromium } = require('playwright')

async function testPointsSystem() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    console.log('Testing tokenization/points system...')
    
    // Navigate to test auth page
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth')
    await page.waitForLoadState('networkidle')
    
    // Enter password
    console.log('Entering test password...')
    await page.fill('input[type="password"]', 'test-learn-2025')
    
    // Login as admintest (level 1 user)
    console.log('Logging in as admintest...')
    await page.click('button:has-text("Login as admintest")')
    await page.waitForURL(/.*\/$/) // Wait for redirect to home
    await page.waitForLoadState('networkidle')
    
    // Take screenshot of points display
    console.log('Taking screenshot of points system...')
    await page.screenshot({ path: 'points-system-initial.png', fullPage: true })
    
    // Check if points display is visible
    const pointsDisplay = await page.locator('.flex.items-center.gap-4.p-4.bg-dark-background').first()
    if (await pointsDisplay.isVisible()) {
      console.log('✅ Points display is visible')
      
      // Get current points
      const pointsText = await page.locator('span.text-2xl.font-bold.text-primary').textContent()
      console.log(`Current points: ${pointsText}`)
      
      // Get current level
      const levelText = await page.locator('div.w-12.h-12.bg-primary.rounded-full').textContent()
      console.log(`Current level: ${levelText}`)
    } else {
      console.log('❌ Points display not found')
    }
    
    // Try to like a post to test action system
    console.log('Looking for posts to test actions...')
    const likeButtons = page.locator('button:has-text("Like")')
    const likeCount = await likeButtons.count()
    
    if (likeCount > 0) {
      console.log(`Found ${likeCount} like buttons`)
      
      // Click first like button
      console.log('Clicking like button...')
      await likeButtons.first().click()
      
      // Wait for potential points animation
      await page.waitForTimeout(2000)
      
      // Take screenshot after action
      await page.screenshot({ path: 'points-system-after-action.png', fullPage: true })
      
      console.log('✅ Action performed, check for point changes')
    } else {
      console.log('⚠️ No posts found to test actions')
    }
    
    // Check for rate limiting info
    const actionsRemaining = await page.locator('div:has-text("actions left")').first()
    if (await actionsRemaining.isVisible()) {
      const remainingText = await actionsRemaining.textContent()
      console.log(`Actions remaining: ${remainingText}`)
    }
    
    console.log('✅ Points system test completed')
    
  } catch (error) {
    console.error('❌ Error testing points system:', error)
    await page.screenshot({ path: 'points-system-error.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

testPointsSystem()