const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('Testing Title Case functionality on deployed app...\n');

    // Navigate to the app
    await page.goto('https://parentshare.netlify.app/', { waitUntil: 'networkidle' });
    console.log('✓ Page loaded');
    
    // Take a screenshot to see current state
    await page.screenshot({ path: 'title-case-test-page.png' });
    console.log('✓ Screenshot saved as title-case-test-page.png');

    // Check if we're already logged in or need to login
    const loginButton = await page.$('a[href="/login"]');
    
    if (loginButton) {
      console.log('\n1. Logging in...');
      await loginButton.click();
      await page.waitForSelector('iframe');
      
      const telegramFrame = page.frameLocator('iframe');
      await telegramFrame.locator('button:has-text("marc.schwyn")').click();
      
      await page.waitForURL('https://parentshare.netlify.app/', { timeout: 10000 });
      console.log('✓ Logged in successfully');
    } else {
      console.log('✓ Already logged in');
    }

    // Navigate to create post page  
    console.log('\n2. Navigating to create post page...');
    
    // Try different selectors
    const createButton = await page.$('button[aria-label="Create a post"]') || 
                        await page.$('a[href="/create"]') ||
                        await page.$('button:has-text("Create")');
    
    if (createButton) {
      await createButton.click();
    } else {
      // Try direct navigation
      await page.goto('https://parentshare.netlify.app/create');
    }
    
    await page.waitForLoadState('networkidle');
    console.log('✓ On create post page');

    // Test a simple Title Case conversion
    console.log('\n3. Testing Title Case conversion...');
    
    // Fill in the form
    await page.fill('input[placeholder*="link"]', 'https://example.com');
    await page.fill('input[placeholder*="parenting"]', 'this amazing app helps kids learn math');
    await page.fill('textarea', 'Testing Title Case functionality - this app is great for helping kids with math skills.');
    
    // Select category
    await page.selectOption('select', { index: 1 }); // First non-empty option
    
    // Select age range
    const ageSelects = await page.$$('select');
    if (ageSelects.length > 1) {
      await ageSelects[1].selectOption({ index: 1 }); // First non-empty option
    }
    
    // Take screenshot before submitting
    await page.screenshot({ path: 'title-case-form-filled.png' });
    console.log('✓ Form filled, screenshot saved');
    
    // Submit the form
    await page.click('button:has-text("Share")');
    
    // Wait for redirect
    await page.waitForURL('https://parentshare.netlify.app/', { timeout: 10000 });
    await page.waitForSelector('h3', { timeout: 10000 });
    
    // Get the most recent post title
    const postTitles = await page.$$eval('h3', titles => titles.map(t => t.textContent));
    const mostRecentTitle = postTitles[0];
    
    console.log(`\nSubmitted: "this amazing app helps kids learn math"`);
    console.log(`Displayed: "${mostRecentTitle}"`);
    console.log(`Expected:  "This Amazing App Helps Kids Learn Math"`);
    
    if (mostRecentTitle === 'This Amazing App Helps Kids Learn Math') {
      console.log('\n✅ Title Case conversion is working correctly!');
    } else {
      console.log('\n⚠️  Title may not match expected format exactly');
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
  }
})();