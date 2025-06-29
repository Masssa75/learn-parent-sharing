const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Checking current user admin status...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to homepage
    console.log('📍 Going to homepage...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/');
    await page.waitForLoadState('networkidle');
    
    // Check auth status via API
    console.log('\n📡 Checking authentication status...');
    const response = await page.evaluate(async () => {
      const res = await fetch('/api/auth/check');
      return await res.json();
    });
    
    console.log('\n📊 Current User Status:');
    if (response.authenticated) {
      console.log('✅ Authenticated: Yes');
      console.log('👤 User ID:', response.user?.id);
      console.log('📱 Telegram ID:', response.user?.telegramId);
      console.log('📛 Username:', response.user?.username);
      console.log('📝 Display Name:', response.user?.displayName);
      console.log('🔐 Is Admin:', response.user?.isAdmin || false);
      
      if (!response.user?.isAdmin) {
        console.log('\n⚠️  This user is NOT an admin!');
        console.log('That\'s why the Admin Dashboard link is not visible.');
        console.log('\nTo see the admin link, login as one of these admin users:');
        console.log('- devtest (999999999) - Admin');
        console.log('- admindev (777777777) - Admin');
      } else {
        console.log('\n✅ This user IS an admin!');
        console.log('The Admin Dashboard link should be visible in the menu.');
      }
    } else {
      console.log('❌ Not authenticated');
      console.log('\nPlease login first at: /test-auth');
    }
    
    // Check the actual menu
    console.log('\n🔍 Checking user menu...');
    const profileButton = await page.locator('.w-12.h-12.rounded-full.bg-brand-yellow');
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(1000);
      
      // Check what links are visible
      const viewProfile = await page.locator('a:has-text("View Profile")').isVisible();
      const adminDashboard = await page.locator('a:has-text("Admin Dashboard")').isVisible();
      const signOut = await page.locator('button:has-text("Sign Out")').isVisible();
      
      console.log('\n📋 Menu Items Visible:');
      console.log('- View Profile:', viewProfile);
      console.log('- Admin Dashboard:', adminDashboard);
      console.log('- Sign Out:', signOut);
      
      // Take screenshot
      await page.screenshot({ path: 'current-user-menu.png' });
      console.log('\n📸 Screenshot saved: current-user-menu.png');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Check completed');
  }
})();