const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    viewport: { width: 390, height: 844 } // iPhone size
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }
  });
  const page = await context.newPage();

  try {
    console.log('Testing style consistency on deployed site...\n');
    
    // Visit homepage
    console.log('1. Visiting homepage...');
    await page.goto('https://learn-parent-sharing-app.netlify.app');
    await page.waitForTimeout(2000);
    
    // Take screenshot of homepage
    await page.screenshot({ path: 'style-test-homepage.png' });
    console.log('   ✓ Homepage loaded and screenshot saved');
    
    // Click on profile button to go to feed
    console.log('\n2. Clicking profile button to navigate to feed...');
    const profileButton = await page.locator('.bg-brand-yellow.rounded-avatar').first();
    
    if (await profileButton.isVisible()) {
      await profileButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of feed page
      await page.screenshot({ path: 'style-test-feed.png' });
      console.log('   ✓ Feed page loaded and screenshot saved');
      
      // Check if styles are consistent
      console.log('\n3. Checking style consistency...');
      
      // Check category buttons
      const categoryButtons = await page.locator('button:has-text("APPS")').first();
      if (await categoryButtons.isVisible()) {
        const buttonClasses = await categoryButtons.getAttribute('class');
        console.log('   ✓ Category button classes:', buttonClasses);
        
        if (buttonClasses.includes('border-dark-border')) {
          console.log('   ✓ CSS fix applied successfully - using border-dark-border');
        } else if (buttonClasses.includes('border-border-primary')) {
          console.log('   ✗ CSS issue still present - border-border-primary found');
        }
      }
      
      console.log('\n✓ Style consistency test completed!');
      console.log('  Screenshots saved: style-test-homepage.png, style-test-feed.png');
      
    } else {
      console.log('   ! Profile button not visible - user might not be authenticated');
      console.log('   ! Cannot test feed page without authentication');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();