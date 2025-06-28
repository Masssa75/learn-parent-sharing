const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  console.log('Debugging posts API...\n');
  
  // Go to feed
  await page.goto('https://learn-parent-sharing-app.netlify.app/');
  await page.waitForTimeout(5000);
  
  // Check what posts are displayed
  const postTitles = await page.locator('h2.text-title-lg').allTextContents();
  console.log('Current posts in feed:');
  postTitles.forEach((title, i) => {
    console.log(`  ${i + 1}. ${title}`);
  });
  
  // Check for any YouTube embeds
  const iframes = await page.locator('iframe').count();
  console.log(`\nTotal iframes on page: ${iframes}`);
  
  // Look for the specific post we created earlier
  const greatTvPost = await page.locator('text="Great TV Series to Watch With Young Kids"').count();
  console.log(`\nFound "Great TV Series" post: ${greatTvPost > 0 ? 'Yes' : 'No'}`);
  
  if (greatTvPost > 0) {
    // Check if it has a YouTube embed
    const postContainer = await page.locator('div:has(h2:has-text("Great TV Series to Watch With Young Kids"))').first();
    const hasYouTube = await postContainer.locator('iframe[src*="youtube"]').count();
    console.log(`Has YouTube embed: ${hasYouTube > 0 ? 'Yes' : 'No'}`);
    
    // Check for link instead
    const hasLink = await postContainer.locator('a[href*="youtube"]').count();
    console.log(`Has YouTube link: ${hasLink > 0 ? 'Yes' : 'No'}`);
  }
  
  await page.screenshot({ path: 'debug-posts-current.png', fullPage: true });
  
  await browser.close();
})();