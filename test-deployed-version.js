const { chromium } = require('playwright')

async function testDeployedVersion() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    console.log('Testing what version is actually deployed...')
    
    // Check the commit hash or add a test endpoint
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth')
    await page.waitForLoadState('networkidle')
    
    // Login first
    await page.fill('input[type="password"]', 'test-learn-2025')
    await page.click('button:has-text("Login as admintest")')
    await page.waitForTimeout(3000)
    
    // Create a test endpoint check
    console.log('Checking if auth check has debug logging...')
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('User profiles data:')) {
        console.log('✅ Found debug log in console:', msg.text())
      }
    })
    
    // Make the auth check request and observe console
    await page.evaluate(async () => {
      const res = await fetch('/api/auth/check')
      return await res.json()
    })
    
    await page.waitForTimeout(2000)
    
    // Check network logs
    console.log('Checking response directly...')
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/auth/check')
      const text = await res.text()
      return { text, headers: Object.fromEntries(res.headers.entries()) }
    })
    
    console.log('Raw response text length:', response.text.length)
    console.log('Response headers:', response.headers)
    
    // Parse the response
    try {
      const data = JSON.parse(response.text)
      console.log('Auth response keys:', Object.keys(data))
      if (data.user) {
        console.log('User object keys:', Object.keys(data.user))
      }
    } catch (e) {
      console.log('Failed to parse response as JSON')
      console.log('Response text:', response.text)
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

testDeployedVersion()