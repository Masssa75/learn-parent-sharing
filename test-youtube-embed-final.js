const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing YouTube video embedding after fix...\n');
  
  // First, login
  console.log('1. Logging in...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/test-auth');
  await page.waitForTimeout(2000);
  
  await page.fill('input[type="password"]', process.env.DEV_LOGIN_PASSWORD || 'dev-test-2024');
  await page.click('button:has-text("Login")');
  await page.waitForTimeout(2000);
  
  // Navigate to create page
  console.log('2. Creating a new YouTube post...');
  await page.goto('https://learn-parent-sharing-app.netlify.app/create');
  await page.waitForTimeout(3000);
  
  // Switch to Write mode if needed
  const writeButton = await page.locator('button:has-text("Write")');
  if (await writeButton.isVisible()) {
    await writeButton.click();
    await page.waitForTimeout(1000);
  }
  
  // Fill form with YouTube video
  await page.fill('input[placeholder="Paste link to app, video, or website"]', 'https://www.youtube.com/watch?v=2ZtG5Ba6iT0');
  await page.waitForTimeout(2000);
  
  await page.fill('input[placeholder="What made parenting easier today?"]', 'Bluey - Amazing Show for Kids');
  await page.fill('textarea[placeholder*="Tell other parents"]', 'This is a test of YouTube embedding. Bluey is great!');
  
  // Select category
  const categorySelect = await page.locator('select').first();
  await categorySelect.selectOption('activities');
  
  // Select age
  const ageSelect = await page.locator('select').nth(1);
  await ageSelect.selectOption('5-7');
  
  // Submit
  console.log('3. Submitting post...');
  await page.click('button:has-text("Share")');
  
  // Wait for redirect to feed
  await page.waitForTimeout(5000);
  
  // Check if we're on the feed
  console.log('4. Checking feed for YouTube embed...');
  
  // Look for our post
  const postTitle = await page.locator('h2:has-text("Bluey - Amazing Show for Kids")').count();
  console.log(`   - Post found: ${postTitle > 0 ? 'Yes' : 'No'}`);
  
  // Check for YouTube iframe
  const youtubeIframe = await page.locator('iframe[src*="youtube.com/embed"]').count();
  console.log(`   - YouTube embeds on page: ${youtubeIframe}`);
  
  if (youtubeIframe > 0) {
    // Get the iframe src to verify it has the correct video ID
    const iframeSrc = await page.locator('iframe[src*="youtube.com/embed"]').first().getAttribute('src');
    console.log(`   - Embed URL: ${iframeSrc}`);
    console.log(`   - Contains correct video ID: ${iframeSrc?.includes('2ZtG5Ba6iT0') ? 'Yes' : 'No'}`);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'youtube-embed-test-final.png', fullPage: true });
  console.log('\n✅ Screenshot saved as youtube-embed-test-final.png');
  
  await browser.close();
})();