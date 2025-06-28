const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Verifying YouTube embedding is working...\n');
  
  // Go to feed
  await page.goto('https://learn-parent-sharing-app.netlify.app/');
  await page.waitForTimeout(5000);
  
  // Look for the Great TV Series post
  const postTitle = await page.locator('h2:has-text("Great TV Series to Watch With Young Kids")').count();
  console.log(`Found "Great TV Series" post: ${postTitle > 0 ? 'Yes' : 'No'}`);
  
  if (postTitle > 0) {
    // Check for YouTube embeds
    const youtubeIframes = await page.locator('iframe[src*="youtube.com/embed"]').count();
    console.log(`YouTube embeds on page: ${youtubeIframes}`);
    
    if (youtubeIframes > 0) {
      // Get all iframe sources
      const iframes = await page.locator('iframe[src*="youtube.com/embed"]').all();
      for (let i = 0; i < iframes.length; i++) {
        const src = await iframes[i].getAttribute('src');
        console.log(`  Embed ${i + 1}: ${src}`);
        if (src?.includes('2ZtG5Ba6iT0')) {
          console.log('  ✅ This is the Bluey video!');
        }
      }
    }
    
    // Also check for regular links
    const youtubeLinks = await page.locator('a[href*="youtube.com"]').count();
    console.log(`\nYouTube links (not embedded): ${youtubeLinks}`);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'youtube-embed-verification.png', fullPage: true });
  console.log('\nScreenshot saved as youtube-embed-verification.png');
  
  // Check console for any errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  await page.waitForTimeout(2000);
  
  await browser.close();
})();