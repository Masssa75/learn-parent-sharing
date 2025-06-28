const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Verifying video post was created...\n');
  
  // Go directly to feed
  await page.goto('https://learn-parent-sharing-app.netlify.app/');
  await page.waitForTimeout(5000);
  
  // Look for the post we just created
  const postTitle = await page.locator('h2:has-text("Great TV Series to Watch With Young Kids")').count();
  console.log(`Posts with our title: ${postTitle}`);
  
  if (postTitle > 0) {
    console.log('✅ Video post found in feed!');
    
    // Check if YouTube player is visible
    const youtubeFrame = await page.locator('iframe[src*="youtube.com/embed"]').count();
    console.log(`YouTube embeds found: ${youtubeFrame}`);
    
    if (youtubeFrame > 0) {
      console.log('✅ YouTube video is embedded!');
    }
  } else {
    console.log('❌ Post not found - checking all post titles...');
    const allTitles = await page.locator('h2.text-title-lg').allTextContents();
    console.log('Found posts:', allTitles);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'feed-with-video-post.png', fullPage: true });
  console.log('\nScreenshot saved as feed-with-video-post.png');
  
  await browser.close();
})();