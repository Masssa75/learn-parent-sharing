const { chromium } = require('playwright');

async function testLiveApp() {
  console.log('🔍 Testing Live Learn App...\n');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    homepage: false,
    testAuth: false,
    pointsSystem: false,
    createPost: false,
    adminFeatures: false
  };

  try {
    // 1. Test Homepage
    console.log('1. Testing Homepage...');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Check for main elements
    const logo = await page.locator('text=Learn').first();
    const feedExists = await page.locator('.space-y-6').count() > 0;
    results.homepage = await logo.isVisible() && feedExists;
    
    await page.screenshot({ path: 'homepage.png' });
    console.log(`   ✅ Homepage loads: ${results.homepage}`);
    
    // Check if any posts are displayed
    const postCount = await page.locator('[class*="border-dark-border"]').count();
    console.log(`   📝 Posts displayed: ${postCount}`);

    // 2. Test Auth
    console.log('\n2. Testing Test Auth...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    // Enter password
    await page.fill('input[type="password"]', 'test-learn-2025');
    
    // Click admintest button
    await page.click('button:has-text("admintest")');
    
    // Wait for redirect
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    results.testAuth = page.url() === 'https://learn-parent-sharing-app.netlify.app/';
    
    await page.screenshot({ path: 'after-login.png' });
    console.log(`   ✅ Test auth works: ${results.testAuth}`);

    // 3. Check Points System
    console.log('\n3. Testing Points System...');
    await page.waitForTimeout(1000);
    
    // Look for points display
    const pointsDisplay = await page.locator('[class*="points-display"]').first();
    const pointsVisible = await pointsDisplay.count() > 0;
    
    if (pointsVisible) {
      const pointsText = await pointsDisplay.textContent();
      console.log(`   📊 Points display found: ${pointsText}`);
      results.pointsSystem = true;
    } else {
      // Alternative check for points in the UI
      const levelBadge = await page.locator('text=Level').first();
      results.pointsSystem = await levelBadge.count() > 0;
      if (results.pointsSystem) {
        console.log('   📊 Points system elements found');
      }
    }
    
    await page.screenshot({ path: 'points-display.png' });
    console.log(`   ✅ Points system visible: ${results.pointsSystem}`);

    // 4. Test Create Post
    console.log('\n4. Testing Create Post...');
    await page.click('a[href="/create"]');
    await page.waitForLoadState('networkidle');
    
    const createForm = await page.locator('form').first();
    results.createPost = await createForm.count() > 0;
    
    // Check for form elements
    const linkInput = await page.locator('input[placeholder*="link"]').count() > 0;
    const titleInput = await page.locator('input[placeholder*="title"]').count() > 0;
    const descTextarea = await page.locator('textarea').count() > 0;
    
    console.log(`   📝 Create form exists: ${results.createPost}`);
    console.log(`   🔗 Link input: ${linkInput}`);
    console.log(`   📝 Title input: ${titleInput}`);
    console.log(`   📄 Description textarea: ${descTextarea}`);
    
    await page.screenshot({ path: 'create-page.png' });

    // 5. Test Admin Features
    console.log('\n5. Testing Admin Features...');
    
    // Go back to homepage
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForLoadState('networkidle');
    
    // Check for profile menu
    const profileButton = await page.locator('button[class*="rounded-full"]').first();
    if (await profileButton.count() > 0) {
      await profileButton.click();
      await page.waitForTimeout(500);
      
      // Look for admin link
      const adminLink = await page.locator('a[href="/admin"]');
      results.adminFeatures = await adminLink.count() > 0;
      
      if (results.adminFeatures) {
        console.log('   👮 Admin menu link found');
        
        // Navigate to admin page
        await adminLink.click();
        await page.waitForLoadState('networkidle');
        
        const adminDashboard = await page.locator('text=Admin Dashboard').count() > 0;
        console.log(`   📊 Admin dashboard accessible: ${adminDashboard}`);
        
        await page.screenshot({ path: 'admin-page.png' });
      }
    }
    
    console.log(`   ✅ Admin features available: ${results.adminFeatures}`);

    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('================');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(v => v);
    console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  Some tests failed'}`);

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

testLiveApp();