const { chromium } = require('playwright');

async function checkAdminStatus() {
  console.log('🔍 Checking Admin Status for admintest user...\n');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login and check user data
    console.log('1. Logging in as admintest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("admintest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    
    // Wait for auth to load
    await page.waitForTimeout(3000);
    
    // Check what the auth check endpoint returns
    console.log('\n2. Checking auth endpoint...');
    const response = await page.goto('https://learn-parent-sharing-app.netlify.app/api/auth/check');
    const userData = await response.json();
    
    console.log('   👤 User data from API:', JSON.stringify(userData, null, 2));
    
    if (userData.isAdmin) {
      console.log('   ✅ User is marked as admin');
    } else {
      console.log('   ❌ User is NOT marked as admin');
    }
    
    // Also check in browser console
    await page.goto('https://learn-parent-sharing-app.netlify.app/');
    await page.waitForLoadState('networkidle');
    
    const clientUserData = await page.evaluate(() => {
      return fetch('/api/auth/check')
        .then(r => r.json())
        .catch(e => ({ error: e.message }));
    });
    
    console.log('\n3. Client-side auth check:', JSON.stringify(clientUserData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

checkAdminStatus();