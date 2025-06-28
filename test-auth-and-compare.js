const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    viewport: { width: 390, height: 844 }
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    // Add session cookie to simulate authentication
    storageState: {
      cookies: [{
        name: 'session',
        value: 'test-session-token',
        domain: 'learn-parent-sharing-app.netlify.app',
        path: '/',
        expires: Date.now() / 1000 + 3600,
        httpOnly: true,
        secure: true,
        sameSite: 'Lax'
      }]
    }
  });
  const page = await context.newPage();

  try {
    console.log('Testing page styling differences...\n');
    
    // Visit homepage first
    console.log('1. Visiting homepage...');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-homepage-style.png' });
    
    // Check homepage styling
    const homePostCard = await page.locator('.mb-8').first();
    if (await homePostCard.isVisible()) {
      console.log('   ✓ Homepage post card found');
      const homeActionButtons = await homePostCard.locator('button').count();
      console.log(`   - Found ${homeActionButtons} action buttons`);
      
      // Check for specific elements
      const hasHeartIcon = await homePostCard.locator('svg').count() > 0;
      const hasBottomNav = await page.locator('.fixed.bottom-0').count() > 0;
      
      console.log(`   - Has SVG icons: ${hasHeartIcon}`);
      console.log(`   - Has bottom nav: ${hasBottomNav}`);
    }
    
    // Try to navigate to feed
    console.log('\n2. Navigating to feed page...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/feed');
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('/feed')) {
      console.log('   ✓ Successfully on feed page');
      await page.screenshot({ path: 'test-feed-style.png' });
      
      // Check feed styling
      const feedPostCard = await page.locator('.bg-dark-surface.rounded-2xl').first();
      if (await feedPostCard.isVisible()) {
        console.log('   ✓ Feed post card found');
        
        // Check for differences
        const hasEmojis = await feedPostCard.locator('text=/❤️|🤍|💬/').count() > 0;
        const hasBottomNav = await page.locator('.fixed.bottom-0').count() > 0;
        
        console.log(`   - Has emoji buttons: ${hasEmojis}`);
        console.log(`   - Has bottom nav: ${hasBottomNav}`);
      }
    } else {
      console.log('   ! Redirected to:', currentUrl);
      
      // Let's try clicking the profile button if visible
      const profileButton = await page.locator('.bg-brand-yellow.rounded-avatar').first();
      if (await profileButton.isVisible()) {
        console.log('\n3. Clicking profile button...');
        await profileButton.click();
        await page.waitForTimeout(2000);
        
        const newUrl = page.url();
        console.log('   New URL:', newUrl);
        
        if (newUrl.includes('/feed')) {
          await page.screenshot({ path: 'test-feed-via-profile.png' });
          console.log('   ✓ Reached feed page via profile button');
        }
      }
    }
    
    console.log('\n✓ Test completed! Check screenshots to see styling differences.');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    // Keep browser open for 10 seconds to observe
    await page.waitForTimeout(10000);
    await browser.close();
  }
})();