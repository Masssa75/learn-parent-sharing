const { chromium } = require('playwright')

async function testNewEndpoints() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    console.log('Testing new debug endpoints...')
    
    // Login first and then test endpoints
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="password"]', 'test-learn-2025')
    await page.click('button:has-text("Login as admintest")')
    await page.waitForTimeout(3000)
    
    // Test deployment endpoint
    console.log('\n1. Testing deployment endpoint...')
    const deployResponse = await page.evaluate(async () => {
      const res = await fetch('/api/test-deployment')
      return await res.json()
    })
    console.log('Deployment test:', deployResponse)
    
    // Test new auth endpoint
    console.log('\n2. Testing new auth check with points...')
    const authResponse = await page.evaluate(async () => {
      const res = await fetch('/api/auth/check-with-points')
      return { status: res.status, data: await res.json() }
    })
    
    console.log('New auth check response:')
    console.log(JSON.stringify(authResponse.data, null, 2))
    
    if (authResponse.data.authenticated && authResponse.data.user) {
      console.log('✅ New auth endpoint working!')
      console.log(`Points: ${authResponse.data.user.points}`)
      console.log(`Level: ${authResponse.data.user.level}`)
      console.log(`Actions remaining: ${authResponse.data.user.actionsRemaining}`)
    } else {
      console.log('❌ New auth endpoint not working')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await browser.close()
  }
}

testNewEndpoints()