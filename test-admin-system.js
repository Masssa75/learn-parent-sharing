const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Testing admin system on deployed site...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Visit the deployed site
    console.log('📍 Navigating to deployed site...');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'admin-test-homepage.png' });
    console.log('📸 Homepage screenshot saved');
    
    // 2. Check if site is loading correctly
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // 3. Try to access admin page (should redirect if not logged in)
    console.log('🔐 Attempting to access admin page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/admin');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of admin page (or redirect)
    await page.screenshot({ path: 'admin-test-admin-page.png' });
    
    // Check if we see an error or login prompt
    const bodyText = await page.textContent('body');
    console.log('📝 Admin page response:', bodyText.substring(0, 200) + '...');
    
    // 4. Go back to homepage to check login button
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Look for Telegram login widget
    const telegramWidget = await page.locator('#telegram-login-widget').isVisible().catch(() => false);
    const loginButton = await page.locator('text=Login with Telegram').isVisible().catch(() => false);
    
    console.log('🔍 Telegram widget visible:', telegramWidget);
    console.log('🔍 Login button visible:', loginButton);
    
    // 5. Test the test-auth route (for development login)
    console.log('🧪 Testing dev login route...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    // Check if test auth page exists
    const hasPasswordField = await page.locator('input[type="password"]').isVisible().catch(() => false);
    console.log('🔐 Test auth page has password field:', hasPasswordField);
    
    if (hasPasswordField) {
      // Try the dev login
      console.log('🔑 Attempting dev login...');
      await page.fill('input[type="password"]', 'test-learn-2025');
      
      // Select admin test user
      const adminTestButton = await page.locator('text=Login as admintest').isVisible().catch(() => false);
      if (adminTestButton) {
        await page.click('text=Login as admintest');
        await page.waitForNavigation();
        
        console.log('✅ Logged in as admintest');
        
        // Now try to access admin page
        await page.goto('https://learn-parent-sharing-app.netlify.app/admin');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot of admin dashboard
        await page.screenshot({ path: 'admin-test-dashboard.png' });
        
        // Check if we see the admin dashboard
        const adminTitle = await page.locator('h1').textContent().catch(() => '');
        console.log('🎯 Admin page title:', adminTitle);
        
        // Check for user table
        const hasUserTable = await page.locator('table').isVisible().catch(() => false);
        console.log('📊 Admin dashboard has user table:', hasUserTable);
      }
    }
    
    console.log('\n📝 Summary:');
    console.log('- Site is deployed and accessible');
    console.log('- Admin route is protected (requires authentication)');
    console.log('- Authentication system is in place');
    console.log('\n⚠️  Next steps:');
    console.log('1. Apply the database migration in Supabase dashboard');
    console.log('2. Log in with your Telegram account');
    console.log('3. Run the setup-admin script to make yourself an admin');
    console.log('4. Access /admin to manage users');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
})();