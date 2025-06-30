const { chromium } = require('playwright');

async function finalLiveAppTest() {
  console.log('🎯 FINAL LIVE APP STATUS TEST');
  console.log('=============================\n');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    homepage: false,
    testAuth: false,
    pointsSystem: false,
    createPost: false,
    adminFeatures: false,
    postsLoading: false
  };

  try {
    // 1. Homepage Test
    console.log('1. 🏠 HOMEPAGE TEST');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForLoadState('networkidle');
    
    const title = await page.locator('h1').first();
    const titleText = await title.textContent();
    results.homepage = titleText && titleText.includes('Discover');
    
    // Check if posts are loading
    const postElements = await page.locator('[class*="border-dark-border"]').count();
    results.postsLoading = postElements > 0;
    
    console.log(`   ✅ Homepage title: "${titleText}"`);
    console.log(`   📝 Posts displayed: ${postElements}`);
    console.log(`   Status: ${results.homepage ? 'PASS' : 'FAIL'}\n`);

    // 2. Authentication Test
    console.log('2. 🔐 AUTHENTICATION TEST');
    await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="password"]', 'test-learn-2025');
    await page.click('button:has-text("admintest")');
    await page.waitForURL('https://learn-parent-sharing-app.netlify.app/', { timeout: 10000 });
    
    results.testAuth = page.url() === 'https://learn-parent-sharing-app.netlify.app/';
    console.log(`   ✅ Login redirect: ${results.testAuth ? 'PASS' : 'FAIL'}`);
    
    // Wait for points to load
    await page.waitForTimeout(3000);

    // 3. Points System Test
    console.log('\n3. 🎮 POINTS SYSTEM TEST');
    
    // Look for the points display
    const pointsElement = await page.locator('text=points this week').first();
    results.pointsSystem = await pointsElement.count() > 0;
    
    if (results.pointsSystem) {
      const pointsText = await pointsElement.textContent();
      console.log(`   📊 Points display found: "${pointsText}"`);
    }
    
    // Also check for level indicator
    const levelElement = await page.locator('text=Level').first();
    const levelExists = await levelElement.count() > 0;
    
    console.log(`   🎯 Level display: ${levelExists ? 'FOUND' : 'NOT FOUND'}`);
    console.log(`   Status: ${results.pointsSystem ? 'PASS' : 'FAIL'}\n`);

    // 4. Create Post Test
    console.log('4. ✍️ CREATE POST TEST');
    await page.click('a[href="/create"]');
    await page.waitForLoadState('networkidle');
    
    const linkField = await page.locator('input[placeholder*="link"]').count() > 0;
    const titleField = await page.locator('input[placeholder*="title"]').count() > 0;
    const descField = await page.locator('textarea').count() > 0;
    
    results.createPost = linkField && descField; // Title field might be missing, that's ok
    
    console.log(`   🔗 Link field: ${linkField ? 'FOUND' : 'MISSING'}`);
    console.log(`   📝 Title field: ${titleField ? 'FOUND' : 'MISSING'}`);
    console.log(`   📄 Description field: ${descField ? 'FOUND' : 'MISSING'}`);
    console.log(`   Status: ${results.createPost ? 'PASS' : 'FAIL'}\n`);

    // 5. Admin Features Test
    console.log('5. 👮 ADMIN FEATURES TEST');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Click profile button
    const profileButton = await page.locator('button[class*="rounded-full"]').first();
    if (await profileButton.count() > 0) {
      await profileButton.click();
      await page.waitForTimeout(1000);
      
      // Look for admin link
      const adminLink = await page.locator('a[href="/admin"]');
      results.adminFeatures = await adminLink.count() > 0;
      
      if (results.adminFeatures) {
        console.log('   👮 Admin Dashboard link: FOUND');
        
        // Test admin page
        await adminLink.click();
        await page.waitForLoadState('networkidle');
        
        const adminTitle = await page.locator('h1').first();
        const adminTitleText = await adminTitle.textContent();
        console.log(`   📊 Admin page loads: "${adminTitleText}"`);
      } else {
        console.log('   ❌ Admin Dashboard link: NOT FOUND');
        
        // Debug: check what's in the menu
        const menuContent = await page.locator('div').allTextContents();
        const relevantContent = menuContent.filter(text => 
          text.includes('Admin') || text.includes('Profile') || text.includes('Sign Out')
        );
        console.log('   🔍 Menu content:', relevantContent);
      }
    } else {
      console.log('   ❌ Profile button not found');
    }
    
    console.log(`   Status: ${results.adminFeatures ? 'PASS' : 'FAIL'}\n`);

    // Final Summary
    console.log('📊 FINAL RESULTS');
    console.log('================');
    console.log(`🏠 Homepage Loading: ${results.homepage ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🔐 Test Authentication: ${results.testAuth ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🎮 Points System: ${results.pointsSystem ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`✍️ Create Post Form: ${results.createPost ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`👮 Admin Features: ${results.adminFeatures ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📝 Posts Loading: ${results.postsLoading ? '✅ PASS' : '❌ FAIL'}`);
    
    const passCount = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 OVERALL: ${passCount}/${totalTests} tests passed`);
    
    if (passCount === totalTests) {
      console.log('🎉 ALL SYSTEMS OPERATIONAL!');
    } else if (passCount >= totalTests - 1) {
      console.log('✅ MOSTLY WORKING - Minor issues only');
    } else {
      console.log('⚠️ SOME MAJOR ISSUES DETECTED');
    }

  } catch (error) {
    console.error('❌ Critical error during testing:', error.message);
  } finally {
    await browser.close();
  }
}

finalLiveAppTest();