const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing video posting with correct categories...\n');
  
  // First, login with test user
  console.log('1. Logging in...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
  await page.waitForTimeout(2000);
  
  // Enter password
  await page.fill('input[type="password"]', process.env.DEV_LOGIN_PASSWORD || 'dev-test-2024');
  await page.click('button:has-text("Login")');
  await page.waitForTimeout(2000);
  
  // Navigate to create page
  console.log('2. Navigating to create page...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/create');
  await page.waitForTimeout(3000);
  
  // Fill in the form
  console.log('3. Filling in form...');
  
  // Enter link first
  const linkInput = await page.locator('input[placeholder*="link"]').first();
  await linkInput.fill('https://www.youtube.com/watch?v=2ZtG5Ba6iT0');
  console.log('   ✓ Added YouTube link');
  
  // Wait for YouTube preview to load
  await page.waitForTimeout(2000);
  
  // Enter title
  await page.fill('input[placeholder*="Title"]', 'Great TV Series to Watch With Young Kids');
  console.log('   ✓ Added title');
  
  // Enter description
  const description = "anything just affects kids badly. On top of that, most kids shows are super high frequency. They very quickly copy that behaviour. on top of that, most kids shows are just for entertainment, not really educational. I think bluey is a very cute show. It's not as high frequency as other shows and every episode has a very beautiful lesson. I still prefer my kids to not watch anything. But if it must be, then bluey is a pretty good choice.";
  await page.fill('textarea[placeholder*="description"]', description);
  console.log('   ✓ Added description');
  
  // Select category - find Activities since it seems appropriate for TV shows
  const categoryButtons = await page.locator('button').filter({ hasText: 'Activities' });
  if (await categoryButtons.count() > 0) {
    await categoryButtons.first().click();
    console.log('   ✓ Selected Activities category');
  } else {
    // Try to find any category button
    const allCategoryButtons = await page.locator('div:has-text("Category") >> button').all();
    if (allCategoryButtons.length > 0) {
      await allCategoryButtons[0].click();
      console.log('   ✓ Selected first available category');
    }
  }
  
  // Select age range
  const ageButton = await page.locator('button:has-text("5-7")').first();
  await ageButton.click();
  console.log('   ✓ Selected age range 5-7');
  
  // Take screenshot before submitting
  await page.screenshot({ path: 'before-submit-video.png', fullPage: true });
  console.log('   ✓ Screenshot saved as before-submit-video.png');
  
  // Submit the form
  console.log('\n4. Submitting form...');
  const shareButton = await page.locator('button:has-text("Share")').first();
  await shareButton.click();
  
  // Wait for response
  await page.waitForTimeout(3000);
  
  // Check if we got an error
  const errorDialog = await page.locator('text=Failed to create post').isVisible();
  if (errorDialog) {
    const errorText = await page.textContent('[role="dialog"]');
    console.log('   ❌ Error occurred:', errorText);
    await page.screenshot({ path: 'error-dialog-video.png' });
  } else {
    // Check if we were redirected to feed
    const currentUrl = page.url();
    if (currentUrl.includes('/feed') || currentUrl.endsWith('/')) {
      console.log('   ✅ Post created successfully!');
      console.log('   ✓ Redirected to:', currentUrl);
      
      // Take screenshot of feed
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'feed-after-video-post.png', fullPage: true });
    } else {
      console.log('   ⚠️  Unexpected state - current URL:', currentUrl);
    }
  }
  
  await browser.close();
  console.log('\n✅ Test completed!');
})();