const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Logging in as admin to show Admin Dashboard link...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Go to test auth page
    console.log('📍 Navigating to login page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    // 2. Enter password
    console.log('🔑 Entering password...');
    await page.fill('input[type="password"]', 'test-learn-2025');
    
    // 3. Login as devtest (admin user)
    console.log('👤 Logging in as devtest (admin)...');
    await page.waitForSelector('button:has-text("Login as devtest")', { state: 'visible' });
    await page.click('button:has-text("Login as devtest")');
    
    // Wait for login and redirect
    console.log('⏳ Waiting for login to complete...');
    await page.waitForTimeout(5000);
    
    // Should be on homepage now
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 }).catch(() => {
      console.log('📍 Navigating to homepage manually...');
      return page.goto('https://learn-parent-sharing-app.netlify.app/');
    });
    
    await page.waitForLoadState('networkidle');
    console.log('✅ Successfully logged in!');
    
    // 4. Open user menu
    console.log('\n🔍 Opening user menu...');
    await page.waitForSelector('.w-12.h-12.rounded-full.bg-brand-yellow', { state: 'visible' });
    const profileButton = await page.locator('.w-12.h-12.rounded-full.bg-brand-yellow');
    await profileButton.click();
    await page.waitForTimeout(1000);
    
    // 5. Take screenshot of menu with admin link
    await page.screenshot({ path: 'admin-menu-visible.png' });
    console.log('📸 Screenshot saved: admin-menu-visible.png');
    
    // Check what's visible
    const menuItems = {
      'View Profile': await page.locator('a:has-text("View Profile")').isVisible(),
      'Admin Dashboard': await page.locator('a:has-text("Admin Dashboard")').isVisible(),
      'Sign Out': await page.locator('button:has-text("Sign Out")').isVisible()
    };
    
    console.log('\n📋 Menu Items:');
    Object.entries(menuItems).forEach(([item, visible]) => {
      console.log(`${visible ? '✅' : '❌'} ${item}`);
    });
    
    if (menuItems['Admin Dashboard']) {
      console.log('\n🎉 Admin Dashboard link is now visible!');
      console.log('This link only appears for users with admin privileges.');
      
      // Click on Admin Dashboard
      console.log('\n🎯 Clicking Admin Dashboard...');
      await page.click('a:has-text("Admin Dashboard")');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of admin dashboard
      await page.screenshot({ path: 'admin-dashboard-page.png' });
      console.log('📸 Admin dashboard screenshot saved');
      
      console.log('\n✅ You are now on the Admin Dashboard!');
    }
    
    console.log('\n📝 Summary:');
    console.log('1. Logged in as devtest (admin user)');
    console.log('2. Admin Dashboard link appears in the user menu');
    console.log('3. Clicking it takes you to the admin panel');
    console.log('\nThe browser will remain open so you can explore the admin features.');
    
    // Keep browser open for 30 seconds
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Demo completed');
  }
})();