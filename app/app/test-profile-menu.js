const { chromium } = require('playwright');

async function testProfileMenu() {
  console.log('🔍 Testing Profile Menu & Admin Features...\n');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Login as admintest
    console.log('1. Logging in as admintest...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("admintest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    
    console.log('   ✅ Logged in successfully');
    
    // Look for profile button
    console.log('\n2. Checking profile button...');
    await page.waitForTimeout(2000); // Wait for auth state to load
    
    // Try different selectors for profile button
    const profileSelectors = [
      'button[class*="rounded-full"]',
      'button:has(span:text("A"))',
      'button:has-text("A")',
      '[class*="profile"]'
    ];
    
    let profileButton = null;
    for (const selector of profileSelectors) {
      profileButton = await page.locator(selector).first();
      if (await profileButton.count() > 0) {
        console.log(`   📍 Found profile button with selector: ${selector}`);
        break;
      }
    }
    
    if (!profileButton || await profileButton.count() === 0) {
      console.log('   ❌ No profile button found');
      await page.screenshot({ path: 'no-profile-button.png' });
      return;
    }
    
    // Click profile button
    console.log('\n3. Clicking profile button...');
    await profileButton.click();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'profile-menu-open.png' });
    
    // Look for admin link
    console.log('\n4. Looking for admin link...');
    const adminLink = await page.locator('a[href="/admin"]');
    const adminLinkExists = await adminLink.count() > 0;
    
    if (adminLinkExists) {
      console.log('   ✅ Admin link found!');
      
      // Click admin link
      await adminLink.click();
      await page.waitForLoadState('networkidle');
      
      const adminTitle = await page.locator('h1').first();
      const adminTitleText = await adminTitle.textContent();
      console.log(`   📊 Admin page title: ${adminTitleText}`);
      
      await page.screenshot({ path: 'admin-dashboard.png' });
    } else {
      console.log('   ❌ Admin link not found');
      
      // Look for any menu items
      const menuItems = await page.locator('a, button').allTextContents();
      console.log('   📋 Menu items found:', menuItems.filter(text => text.trim()));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testProfileMenu();