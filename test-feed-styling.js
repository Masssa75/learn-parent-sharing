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
    console.log('Testing feed page styling...\n');
    
    // Try to navigate directly to feed
    console.log('1. Attempting to access feed page directly...');
    await page.goto('https://learn-parent-sharing-app.netlify.app/feed');
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('   Current URL:', currentUrl);
    
    if (currentUrl.includes('/feed')) {
      console.log('   ✓ Successfully accessed feed page');
      
      // Take screenshot
      await page.screenshot({ path: 'feed-page-styling.png' });
      
      // Check for the fixed CSS
      const categoryButtons = await page.locator('button').filter({ hasText: /APPS|TOYS|TIPS/ });
      const count = await categoryButtons.count();
      
      if (count > 0) {
        console.log(`\n2. Found ${count} category buttons`);
        
        // Check the first button's classes
        const firstButton = categoryButtons.first();
        const classes = await firstButton.getAttribute('class');
        console.log('   Button classes:', classes);
        
        if (classes && classes.includes('border-dark-border')) {
          console.log('   ✓ CSS fix verified - using border-dark-border');
        } else if (classes && classes.includes('border-border-primary')) {
          console.log('   ✗ Old CSS still present - border-border-primary');
        }
      }
      
    } else {
      console.log('   ! Redirected away from feed (probably to login or home)');
      console.log('   ! This is expected behavior if not authenticated');
      
      // Let's check the homepage styling instead
      console.log('\n2. Checking homepage styling...');
      await page.screenshot({ path: 'homepage-current-styling.png' });
      
      const homeCategories = await page.locator('button').filter({ hasText: /ALL|APPS|TOYS|TIPS/ });
      const homeCount = await homeCategories.count();
      
      if (homeCount > 0) {
        console.log(`   Found ${homeCount} category buttons on homepage`);
        const firstHomeButton = homeCategories.first();
        const homeClasses = await firstHomeButton.getAttribute('class');
        console.log('   Homepage button classes:', homeClasses);
      }
    }
    
    console.log('\n✓ Styling test completed!');
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
})();