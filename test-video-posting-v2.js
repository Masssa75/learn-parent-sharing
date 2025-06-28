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
  
  // Check if we're in manual mode (if not, switch to it)
  const manualModeButton = await page.locator('button:has-text("Write")');
  if (await manualModeButton.isVisible()) {
    await manualModeButton.click();
    console.log('   ✓ Switched to manual mode');
    await page.waitForTimeout(1000);
  }
  
  // Fill in the form
  console.log('3. Filling in form...');
  
  // Enter link
  const linkInput = await page.locator('input[placeholder="Paste link to app, video, or website"]');
  await linkInput.fill('https://www.youtube.com/watch?v=2ZtG5Ba6iT0');
  console.log('   ✓ Added YouTube link');
  
  // Wait for YouTube preview to load
  await page.waitForTimeout(2000);
  
  // Enter title
  await page.fill('input[placeholder="What made parenting easier today?"]', 'Great TV Series to Watch With Young Kids');
  console.log('   ✓ Added title');
  
  // Enter description
  const description = "anything just affects kids badly. On top of that, most kids shows are super high frequency. They very quickly copy that behaviour. on top of that, most kids shows are just for entertainment, not really educational. I think bluey is a very cute show. It's not as high frequency as other shows and every episode has a very beautiful lesson. I still prefer my kids to not watch anything. But if it must be, then bluey is a pretty good choice.";
  await page.fill('textarea[placeholder*="Tell other parents"]', description);
  console.log('   ✓ Added description');
  
  // Select category from dropdown - use Activities for TV shows
  const categorySelect = await page.locator('select').first();
  await categorySelect.selectOption('activities');
  console.log('   ✓ Selected Activities category');
  
  // Select age range from dropdown
  const ageSelect = await page.locator('select').nth(1);
  await ageSelect.selectOption('5-7');
  console.log('   ✓ Selected age range 5-7');
  
  // Take screenshot before submitting
  await page.screenshot({ path: 'before-submit-video-v2.png', fullPage: true });
  console.log('   ✓ Screenshot saved');
  
  // Submit the form
  console.log('\n4. Submitting form...');
  const shareButton = await page.locator('button:has-text("Share")').last();
  await shareButton.click();
  
  // Wait for response
  await page.waitForTimeout(5000);
  
  // Check for any alert dialogs
  page.on('dialog', async dialog => {
    console.log('   ⚠️  Alert:', dialog.message());
    await dialog.accept();
  });
  
  // Check current URL
  const currentUrl = page.url();
  console.log('   Current URL:', currentUrl);
  
  if (currentUrl.includes('/feed') || currentUrl.endsWith('/')) {
    console.log('   ✅ Post created successfully!');
    
    // Take screenshot of feed
    await page.screenshot({ path: 'feed-after-video-post-v2.png', fullPage: true });
    
    // Check if the new post appears
    const posts = await page.locator('h2').filter({ hasText: 'Great TV Series' }).count();
    if (posts > 0) {
      console.log('   ✅ New post is visible in the feed!');
    }
  } else if (currentUrl.includes('/create')) {
    console.log('   ❌ Still on create page - check for errors');
    
    // Look for any error messages
    const pageContent = await page.content();
    if (pageContent.includes('Failed to create post')) {
      console.log('   ❌ Error creating post');
    }
  }
  
  await browser.close();
  console.log('\n✅ Test completed!');
})();