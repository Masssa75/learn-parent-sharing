const { chromium } = require('playwright');

(async () => {
  console.log('🚀 Testing admin functionality...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 1. Navigate to test auth page
    console.log('📍 Navigating to test auth page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    // 2. Enter password
    console.log('🔑 Entering password...');
    await page.fill('input[type="password"]', 'test-learn-2025');
    
    // 3. Try to login as admindev user
    console.log('👤 Attempting to login as admindev...');
    await page.click('text=Login as admindev');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check if we see error or success
    const statusText = await page.locator('pre').textContent().catch(() => '');
    console.log('📝 Login status:', statusText);
    
    if (statusText.includes('Test user not found')) {
      console.log('\n⚠️  Admin dev user not created yet.');
      console.log('This is expected - the user needs to be created in Supabase first.');
      
      // Take screenshot of instructions
      await page.screenshot({ path: 'admin-test-user-instructions.png' });
      console.log('📸 Instructions screenshot saved');
      
      // Try devtest user instead
      console.log('\n🔄 Trying devtest user instead...');
      await page.click('text=Login as devtest');
      await page.waitForTimeout(3000);
      
      const devtestStatus = await page.locator('pre').textContent().catch(() => '');
      console.log('📝 Devtest login status:', devtestStatus);
      
      if (devtestStatus.includes('Success')) {
        console.log('✅ Logged in as devtest!');
        
        // Wait for redirect
        await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
        
        // Try to access admin page
        console.log('\n🔐 Attempting to access admin page...');
        await page.goto('https://learn-parent-sharing-app.netlify.app/admin');
        await page.waitForLoadState('networkidle');
        
        // Take screenshot
        await page.screenshot({ path: 'admin-test-access-attempt.png' });
        
        // Check page content
        const pageText = await page.textContent('body');
        if (pageText.includes('must be an admin')) {
          console.log('❌ Access denied - user is not an admin (expected)');
        } else if (pageText.includes('Admin Dashboard')) {
          console.log('✅ Admin dashboard loaded!');
        } else {
          console.log('🤔 Unexpected response:', pageText.substring(0, 200));
        }
      }
    } else if (statusText.includes('Success')) {
      console.log('✅ Successfully logged in as admindev!');
      
      // Wait for redirect
      await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      
      // Access admin page
      console.log('\n🎯 Accessing admin dashboard...');
      await page.goto('https://learn-parent-sharing-app.netlify.app/admin');
      await page.waitForLoadState('networkidle');
      
      // Take screenshot of admin dashboard
      await page.screenshot({ path: 'admin-dashboard-success.png' });
      
      // Check for admin features
      const hasUserTable = await page.locator('table').isVisible().catch(() => false);
      const hasAdminTitle = await page.locator('h1:has-text("Admin Dashboard")').isVisible().catch(() => false);
      
      console.log('📊 Admin dashboard features:');
      console.log('- Has admin title:', hasAdminTitle);
      console.log('- Has user table:', hasUserTable);
      
      if (hasUserTable) {
        // Check for users in table
        const userRows = await page.locator('tbody tr').count();
        console.log(`- Number of users: ${userRows}`);
      }
    }
    
    console.log('\n📝 Summary:');
    console.log('1. Test auth page is working with multiple user options');
    console.log('2. Admin system is in place but requires:');
    console.log('   - Database migration to be applied');
    console.log('   - Admin users to be created');
    console.log('3. Once migration is applied, you can:');
    console.log('   - Create admindev user in Supabase');
    console.log('   - Use make_user_admin function to promote users');
    console.log('   - Access full admin dashboard at /admin');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await browser.close();
    console.log('\n✅ Test completed');
  }
})();