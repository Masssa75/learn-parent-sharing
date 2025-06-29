const { chromium } = require('playwright')

async function testAuthAPIDirect() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    console.log('Testing auth API directly...')
    
    // First login
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="password"]', 'test-learn-2025')
    await page.click('button:has-text("Login as admintest")')
    await page.waitForTimeout(3000)
    
    // Check if we got redirected and have session
    const currentUrl = page.url()
    console.log('Current URL after login:', currentUrl)
    
    // Test auth check API directly
    console.log('Testing auth check API...')
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/auth/check')
      const data = await res.json()
      return { status: res.status, data }
    })
    
    console.log('Auth check response:')
    console.log(JSON.stringify(response, null, 2))
    
    if (response.data.authenticated) {
      console.log('✅ User is authenticated')
      console.log(`User: ${response.data.user.displayName}`)
      console.log(`Points: ${response.data.user.points}`)
      console.log(`Level: ${response.data.user.level}`)
    } else {
      console.log('❌ User is not authenticated')
    }
    
    // Take screenshot
    await page.screenshot({ path: 'auth-debug.png', fullPage: true })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

testAuthAPIDirect()