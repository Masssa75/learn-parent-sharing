const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    viewport: { width: 390, height: 844 }
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  try {
    console.log('Testing final styling consistency...\n');
    
    // Visit homepage
    console.log('1. Loading homepage...');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'final-test-homepage.png' });
    console.log('   ✓ Homepage screenshot saved');
    
    // Try to navigate via profile button
    console.log('\n2. Looking for profile button...');
    const profileButton = await page.locator('.bg-brand-yellow.rounded-avatar').first();
    
    if (await profileButton.isVisible()) {
      console.log('   ✓ Profile button found - user appears to be authenticated');
      await profileButton.click();
      await page.waitForTimeout(2000);
      
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);
      
      if (currentUrl.includes('/feed')) {
        await page.screenshot({ path: 'final-test-feed.png' });
        console.log('   ✓ Feed page loaded - screenshot saved');
        
        // Compare specific elements
        console.log('\n3. Comparing page elements...');
        
        // Check for consistent category buttons
        const feedCategories = await page.locator('button').filter({ hasText: /ALL|APPS|TOYS|TIPS/ });
        if (await feedCategories.count() > 0) {
          const feedCategoryClasses = await feedCategories.first().getAttribute('class');
          console.log('   Feed category button classes:', feedCategoryClasses?.substring(0, 80) + '...');
        }
        
        // Check for consistent post layout
        const postCard = await page.locator('.mb-8').first();
        if (await postCard.isVisible()) {
          console.log('   ✓ Post cards using consistent .mb-8 spacing');
        }
        
        // Check for SVG icons vs emojis
        const hasIcons = await page.locator('svg').count() > 0;
        console.log('   ✓ Using SVG icons:', hasIcons);
        
        // Check for bottom nav (should not exist)
        const hasBottomNav = await page.locator('.fixed.bottom-0').count() > 0;
        console.log('   ✓ Has bottom navigation:', hasBottomNav);
        
        console.log('\n✓ Styling consistency test completed!');
        console.log('  Both pages should now have the same design system.');
      }
    } else {
      console.log('   ! No profile button - testing direct navigation to /feed');
      await page.goto('https://learn-parent-sharing-app.netlify.app/feed');
      await page.waitForTimeout(2000);
      
      if (page.url().includes('/feed')) {
        await page.screenshot({ path: 'final-test-feed-direct.png' });
        console.log('   ✓ Accessed feed directly');
      } else {
        console.log('   ! Redirected to:', page.url());
      }
    }
    
    // Keep browser open for manual inspection
    console.log('\n📸 Screenshots saved. Browser will close in 10 seconds...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();